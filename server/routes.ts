import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  performInitialAnalysis, 
  enhanceStyle, 
  generateImage,
  generateImageSmart,
  analyzeTextPriority,
  buildTypographicPrompt,
  analyzeImage,
  getNegativePrompts,
  STYLE_PRESETS,
  QUALITY_PRESETS,
  performDeepAnalysis,
  draftToFinalWorkflow,
  generateIterativeEditPrompt,
  evaluatePromptTier,
  generateWithTextIntegrity,
  checkTextComplexitySoftLimits,
  testAllModelConnections,
  isImagenClientAvailable
} from "./services/geminiService";
import { 
  runMultiAgentPipeline, 
  runQuickEnhancement, 
  getAgentSystemInfo 
} from "./services/multiAgentSystem";
import { ARTISTIC_STYLES } from "./services/cinematicDNA";
import { 
  isImagenAvailable, 
  generateWithImagen,
  checkImagenStatus,
  type ImagenModel
} from "./services/imagen3Service";
import type { GenerateImageRequest, GenerateImageResponse, QualityLevel, ModelTier } from "../shared/imageGenTypes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/generate-image", async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, error: "Invalid request body" });
      }

      const { prompt, style, quality, aspectRatio, variations } = req.body as GenerateImageRequest;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const smartResult = await generateImageSmart(
        prompt.trim(),
        aspectRatio || '1:1',
        style || 'auto',
        (quality || 'standard') as QualityLevel,
        Math.min(Math.max(variations || 1, 1), 4)
      );

      const response: GenerateImageResponse = {
        success: true,
        images: smartResult.images,
        enhancedPrompt: smartResult.enhancedPrompt,
        analysis: smartResult.analysis || {
          subject: { primary: 'text-priority', secondary: [] },
          mood: { primary: 'auto-detected', secondary: [] },
          lighting: { scenario: 'auto' },
          environment: { type: 'auto', details: '' },
          style_intent: smartResult.mode
        },
        generationMode: smartResult.mode,
        modelUsed: smartResult.modelUsed,
        textPriorityInfo: smartResult.textPriorityAnalysis.isTextPriority ? {
          confidence: smartResult.textPriorityAnalysis.confidence,
          detectedLanguages: smartResult.textPriorityAnalysis.detectedLanguages,
          extractedTexts: smartResult.textPriorityAnalysis.extractedTexts
        } : undefined,
        tierEvaluation: smartResult.tierEvaluation
      };

      res.json(response);
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate image" 
      });
    }
  });

  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;

      if (!base64Data || !mimeType) {
        return res.status(400).json({ success: false, error: "Image data is required" });
      }

      const promptDescription = await analyzeImage(base64Data, mimeType);

      res.json({ success: true, prompt: promptDescription });
    } catch (error: any) {
      console.error("Image analysis error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to analyze image" 
      });
    }
  });

  app.get("/api/style-presets", (req, res) => {
    res.json(STYLE_PRESETS);
  });

  app.get("/api/quality-presets", (req, res) => {
    res.json(QUALITY_PRESETS);
  });

  app.post("/api/generate-image-advanced", async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, error: "Invalid request body" });
      }

      const { prompt, style, quality, aspectRatio, variations, useMultiAgent, tierOverride, enhanceOnly } = req.body as GenerateImageRequest & { useMultiAgent?: boolean; tierOverride?: ModelTier; enhanceOnly?: boolean };

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const qualityLevel = (quality || 'standard') as QualityLevel;
      
      // Auto-scaling tier evaluation
      const tierEvaluation = evaluatePromptTier(prompt.trim(), qualityLevel, tierOverride);
      console.log(`[Tier System] ${tierEvaluation.userMessage} (complexity: ${tierEvaluation.complexityScore}/100)`);

      const { textInfo, analysis } = await performInitialAnalysis(prompt.trim(), true);

      let enhancedPrompt: string;
      let agentInfo: any = null;

      // Use tier-based decision for multi-agent pipeline
      const effectiveTier = tierEvaluation.recommendedTier;
      const shouldUseMultiAgent = useMultiAgent || effectiveTier === 'premium' || effectiveTier === 'ultra';

      if (shouldUseMultiAgent) {
        // Map tier to quality level for multi-agent pipeline
        const tierToQuality: Record<ModelTier, QualityLevel> = {
          standard: 'standard',
          premium: 'premium',
          ultra: 'ultra'
        };
        const effectiveQuality = tierToQuality[effectiveTier];
        
        const multiAgentResult = await runMultiAgentPipeline(
          prompt.trim(),
          analysis,
          style || 'auto',
          effectiveQuality
        );
        enhancedPrompt = multiAgentResult.finalPrompt;
        agentInfo = {
          qualityBoost: multiAgentResult.qualityBoost,
          processingTime: multiAgentResult.processingTime,
          agentContributions: multiAgentResult.agentResults.map(r => ({
            agent: r.agent,
            confidence: r.confidence
          }))
        };
      } else {
        enhancedPrompt = await enhanceStyle(
          prompt.trim(),
          analysis,
          textInfo,
          style || 'auto',
          qualityLevel,
          { thinkingBudget: tierEvaluation.thinkingBudget, maxWords: tierEvaluation.maxWords }
        );
      }

      // If enhanceOnly is true, return just the enhanced prompt without generating image
      if (enhanceOnly) {
        return res.json({
          success: true,
          enhancedPrompt,
          analysis,
          tierEvaluation,
          ...(agentInfo && { agentInfo })
        });
      }

      // Detect if prompt has text for fallback model selection
      const hasTextContent = textInfo.length > 0 || tierEvaluation.reasons.some(r => r.code === 'text_detected');
      
      const images = await generateImage(
        enhancedPrompt,
        aspectRatio || '1:1',
        Math.min(Math.max(variations || 1, 1), 4),
        {
          hasText: hasTextContent,
          quality: qualityLevel,
          tier: tierEvaluation.recommendedTier
        }
      );

      const response: GenerateImageResponse = {
        success: true,
        images,
        image: images.length > 0 ? images[0] : undefined,
        enhancedPrompt,
        analysis,
        tierEvaluation,
        ...(agentInfo && { agentInfo })
      };

      res.json(response);
    } catch (error: any) {
      console.error("Advanced image generation error:", error);
      
      // Extract and normalize detailed error information for debugging
      // Use smart defaults based on what pathway was actually attempted
      const imagenTriedAtLeastOnce = error.imagenTriedAtLeastOnce ?? false;
      const fallbackAttempted = error.fallbackAttempted ?? false;
      
      // Determine default model based on pathway
      let defaultModel = 'unknown';
      if (error.model) {
        defaultModel = error.model;
      } else if (imagenTriedAtLeastOnce) {
        defaultModel = fallbackAttempted ? error.model || 'gemini-2.5-flash-image' : 'imagen-4.0-generate-001';
      } else {
        defaultModel = 'gemini-2.5-flash-image'; // Draft mode or early failure
      }
      
      const errorDetails: any = {
        message: error.message || "Failed to generate image",
        model: defaultModel,
        tier: error.tier || 'standard',
        attempt: error.attempt ?? 0,
        totalAttempts: error.totalAttempts ?? 0,
        fallbackAttempted,
        isRetryable: error.isRetryable ?? false,
        imagenTriedAtLeastOnce,
        attemptHistory: Array.isArray(error.attemptHistory) ? error.attemptHistory : [],
      };
      
      console.error("[API] Returning error details:", JSON.stringify(errorDetails, null, 2));
      
      res.status(500).json({ 
        success: false, 
        error: errorDetails.message,
        errorDetails
      });
    }
  });

  app.get("/api/artistic-styles", (req, res) => {
    const styles = Object.entries(ARTISTIC_STYLES).map(([key, style]) => ({
      id: style.id,
      name: style.name,
      keywords: style.keywords.slice(0, 3),
      bestUse: style.bestUse.slice(0, 2)
    }));
    res.json({ 
      success: true, 
      count: styles.length,
      styles 
    });
  });

  app.get("/api/agent-system-info", (req, res) => {
    const info = getAgentSystemInfo();
    res.json({ success: true, ...info });
  });

  // Test all model connections
  app.get("/api/test-models", async (req, res) => {
    try {
      console.log("[API] Testing all model connections...");
      const results = await testAllModelConnections();
      
      const summary = {
        total: results.length,
        connected: results.filter(r => r.status === 'connected').length,
        errors: results.filter(r => r.status === 'error').length,
        notConfigured: results.filter(r => r.status === 'not_configured').length
      };
      
      res.json({ 
        success: true, 
        summary,
        results,
        imagenApiKeyConfigured: isImagenClientAvailable()
      });
    } catch (error: any) {
      console.error("[API] Model test error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to test models" 
      });
    }
  });

  app.post("/api/deep-analysis", async (req, res) => {
    try {
      const { prompt, processText } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const analysis = await performDeepAnalysis(prompt.trim());
      
      let textInfo: any[] = [];
      if (processText !== false) {
        const textPriority = analyzeTextPriority(prompt.trim());
        if (textPriority.isTextPriority || textPriority.hasQuotedText) {
          textInfo = textPriority.extractedTexts.map(text => ({ 
            text, 
            placement: 'integrated',
            fontStyle: 'modern',
            fontSize: 'medium',
            physicalProperties: {
              material: '',
              lightingInteraction: '',
              surfaceTexture: '',
              environmentalInteraction: '',
              perspectiveAndDepth: ''
            }
          }));
        }
      }
      
      // Return both formats for compatibility
      res.json({ success: true, analysis, textInfo, detectedText: textInfo });
    } catch (error: any) {
      console.error("Deep analysis error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to perform deep analysis" 
      });
    }
  });

  app.post("/api/draft-to-final", async (req, res) => {
    try {
      const { prompt, style, aspectRatio } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const { textInfo, analysis } = await performInitialAnalysis(prompt.trim(), true);
      
      const result = await draftToFinalWorkflow(
        prompt.trim(),
        analysis,
        textInfo,
        style || 'auto',
        aspectRatio || '1:1'
      );

      res.json({ 
        success: true, 
        ...result 
      });
    } catch (error: any) {
      console.error("Draft to final workflow error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to run draft-to-final workflow" 
      });
    }
  });

  app.post("/api/iterative-edit", async (req, res) => {
    try {
      const { currentPrompt, editInstruction, textStyleIntent } = req.body;

      if (!currentPrompt || !editInstruction) {
        return res.status(400).json({ success: false, error: "Current prompt and edit instruction are required" });
      }

      const newPrompt = await generateIterativeEditPrompt(
        currentPrompt,
        editInstruction,
        textStyleIntent
      );

      res.json({ success: true, newPrompt });
    } catch (error: any) {
      console.error("Iterative edit error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate iterative edit" 
      });
    }
  });

  app.get("/api/imagen3-status", async (req, res) => {
    try {
      const status = await checkImagenStatus();
      res.json({ 
        success: true, 
        available: status.available,
        hasPrimaryKey: status.hasPrimaryKey,
        hasFallbackKey: status.hasFallbackKey,
        models: status.models,
        recommendedModel: status.recommendedModel,
        description: 'Google Imagen - Superior text rendering quality'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/brainstorm", async (req, res) => {
    try {
      const { voiceInput, currentPrompt } = req.body;

      if (!voiceInput) {
        return res.status(400).json({ success: false, error: "Voice input is required" });
      }

      const { performInitialAnalysis: analyzePrompt, enhanceStyle } = await import("./services/geminiService");
      
      const combinedInput = currentPrompt 
        ? `${currentPrompt}. ${voiceInput}`
        : voiceInput;
      
      const { analysis } = await analyzePrompt(combinedInput, false);
      
      const enhancedIdea = await enhanceStyle(
        combinedInput,
        analysis,
        [],
        'auto',
        'draft',
        { thinkingBudget: 256, maxWords: 50 }
      );

      res.json({ 
        success: true, 
        idea: enhancedIdea,
        originalInput: voiceInput
      });
    } catch (error: any) {
      console.error("Brainstorm error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to process brainstorm" 
      });
    }
  });

  const KNOWLEDGE_BASE_ARTICLES: Record<string, string> = {
    'master_overview': `# Cinematic DNA: Overview

## The Complete AI Image Generation System

This system implements a sophisticated multi-agent pipeline designed to transform simple prompts into Hollywood-quality visual outputs.

### Core Components

**1. Deep Analysis System**
- Semantic parsing of user intent
- Mood and emotion detection
- Subject and environment classification
- Style intent recognition

**2. 5-Agent Pipeline**
- **Text Sentinel**: Handles text detection and rendering
- **Style Architect**: Crafts cinematic master prompts
- **Visual Synthesizer**: Generates images using optimal models
- **Master Refiner**: Applies post-processing enhancements
- **Quality Analyst**: Scores and curates results

**3. Cinematic DNA Components**
- Volumetric Atmospheric Effects (8-12% quality boost)
- Professional Lighting Systems (10-15% boost)
- Depth Layering (8-10% boost)
- Color Grading (10-12% boost)
- Material Rendering (8-10% boost)
- Cinematic Composition (8-12% boost)
- Cinema Camera Systems (5-8% boost)

### Quality Improvement

The complete system provides 50-60% quality improvement over basic prompts through intelligent synthesis of all components.`,

    'deep_analysis_system': `# Stage 1: Deep Analysis

## Purpose

The Deep Analysis system performs semantic parsing to understand the true intent behind user prompts.

### Analysis Components

**Subject Detection**
- Primary subject identification
- Secondary elements
- Subject relationships

**Mood Classification**
- Primary emotional tone
- Secondary mood layers
- Emotional intensity

**Environment Analysis**
- Setting type (indoor/outdoor/abstract)
- Environmental details
- Atmospheric conditions

**Style Intent**
- Artistic style preferences
- Technical requirements
- Quality expectations`,

    'gemini_optimization': `# Stage 7: Gemini Optimization

## AI Model Configuration

### Model Selection

**Text-to-Image Models**
- \`imagen-4.0-generate-001\`: Primary for final generation
- \`gemini-3-pro-image-preview\`: Text-heavy prompts, fallback
- \`gemini-2.5-flash-image\`: Draft mode, fast previews

**Text Analysis Models**
- \`gemini-2.5-flash\`: Prompt analysis and enhancement
- \`gemini-3-pro-preview\`: Deep style synthesis

### Thinking Budgets

Quality levels configure thinking time:
- Draft: 512 tokens
- Standard: 1024 tokens
- Premium: 4096 tokens
- Ultra: 8192 tokens`,

    'agent_4_master_refiner': `# Agent 4: Master Refiner

## Post-Processing Excellence

The Master Refiner applies professional-grade image enhancement after generation.

### Refiner Presets

**Cinematic Polish**
- Hollywood-grade color grading
- Teal-orange color grade
- Shadow lifting, highlight recovery

**Photorealistic Polish**
- High-end camera simulation
- Micro contrast enhancement
- Lens characteristics

**Artistic Boost**
- Bold color enhancement
- Dramatic contrast
- Vibrant saturation

**Clean & Sharp**
- Professional clarity
- No stylization
- Pure sharpening`,

    'volumetric_atmospheric_effects': `# Volumetric Atmospheric Effects

## Quality Boost: 8-12%

### Key Elements

**Fog and Haze**
- Distance-based visibility
- Layered atmospheric depth
- Volumetric light scattering

**Light Rays**
- God rays through openings
- Dust particle illumination
- Beam definition

**Smoke and Particles**
- Environmental particles
- Motion blur in atmosphere
- Density gradients`,

    'professional_lighting_systems': `# Professional Lighting Systems

## Quality Boost: 10-15%

### Lighting Setups

**Three-Point Lighting**
- Key light: Main illumination
- Fill light: Shadow softening
- Back light: Subject separation

**Natural Lighting**
- Golden hour warmth
- Blue hour coolness
- Overcast diffusion

**Dramatic Lighting**
- Single source dramatic
- Rim lighting
- Chiaroscuro contrast`,

    'depth_layering_system': `# Depth Layering System

## Quality Boost: 8-10%

### Depth Components

**Foreground Elements**
- Framing devices
- Leading lines
- Bokeh elements

**Middle Ground**
- Subject placement
- Supporting elements
- Interaction zones

**Background**
- Environmental context
- Atmospheric depth
- Horizon elements`,

    'professional_color_grading': `# Professional Color Grading

## Quality Boost: 10-12%

### Color Grade Styles

**Teal & Orange**
- Hollywood blockbuster look
- Warm skin tones
- Cool shadows

**Bleach Bypass**
- Desaturated contrast
- Film noir aesthetic
- Gritty realism

**Warm Vintage**
- Golden highlights
- Nostalgic feel
- Soft contrast`,

    'material_and_surface_rendering': `# Material and Surface Rendering

## Quality Boost: 8-10%

### Material Properties

**Subsurface Scattering**
- Skin translucency
- Organic materials
- Light penetration

**Specular Highlights**
- Surface reflection
- Wetness effects
- Metallic sheen

**Texture Detail**
- Micro-texture
- Surface imperfections
- Material authenticity`,

    'cinematic_composition_rules': `# Cinematic Composition Rules

## Quality Boost: 8-12%

### Composition Principles

**Rule of Thirds**
- Subject placement
- Visual balance
- Natural eye flow

**Golden Ratio**
- Spiral composition
- Harmonic proportions
- Aesthetic balance

**Leading Lines**
- Direction guidance
- Depth enhancement
- Visual narrative`,

    'cinema_camera_systems': `# Cinema Camera Systems

## Quality Boost: 5-8%

### Camera Specifications

**Full Frame Cameras**
- Sony A7R IV
- Canon EOS R5
- Shallow depth of field

**Lens Selection**
- 85mm f/1.4 (portraits)
- 35mm f/1.4 (environmental)
- 135mm f/2 (compression)

**Lens Characteristics**
- Bokeh quality
- Chromatic aberration
- Lens distortion`,

    'artistic_styles_library_part1': `# Artistic Styles Library Part 1

## Classical to Contemporary

### Historical Styles

**Renaissance**
- Classical proportions
- Chiaroscuro lighting
- Religious themes

**Baroque**
- Dramatic lighting
- Rich ornmentation
- Dynamic composition

**Impressionism**
- Light and color focus
- Visible brushstrokes
- Outdoor scenes

### Modern Art

**Art Nouveau**
- Organic curves
- Natural forms
- Decorative elements

**Art Deco**
- Geometric patterns
- Bold colors
- Luxurious materials`,

    'artistic_styles_library_part2': `# Artistic Styles Library Part 2

## Digital & Design

### Digital Era

**Cyberpunk**
- Neon lights
- Urban decay
- High-tech low-life

**Vaporwave**
- 80s/90s aesthetics
- Pastel colors
- Retro technology

**Synthwave**
- Sunset gradients
- Chrome reflections
- Grid patterns

### Contemporary

**Dark Academia**
- Classical architecture
- Muted tones
- Scholarly atmosphere

**Cottagecore**
- Rural aesthetics
- Natural materials
- Cozy atmosphere`
  };

  app.get("/api/knowledge-base/:slug", (req, res) => {
    const { slug } = req.params;
    const content = KNOWLEDGE_BASE_ARTICLES[slug];
    
    if (content) {
      res.json({ success: true, content });
    } else {
      res.status(404).json({ success: false, error: "Article not found" });
    }
  });

  app.post("/api/generate-with-text-integrity", async (req, res) => {
    try {
      const { 
        prompt, 
        expectedTexts, 
        aspectRatio, 
        style, 
        quality, 
        candidateCount 
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      if (!expectedTexts || !Array.isArray(expectedTexts) || expectedTexts.length === 0) {
        return res.status(400).json({ success: false, error: "expectedTexts array is required" });
      }

      const complexityCheck = checkTextComplexitySoftLimits(expectedTexts);
      
      console.log(`[Text Integrity API] Generating with ${expectedTexts.length} text blocks, ${candidateCount || 8} candidates`);
      
      const result = await generateWithTextIntegrity(
        prompt.trim(),
        expectedTexts,
        aspectRatio || '3:4',
        style || 'auto',
        (quality || 'standard') as QualityLevel,
        candidateCount || 8
      );

      res.json({
        success: true,
        image: result.bestImage,
        accuracy: result.bestAccuracy,
        accuracyPercent: Math.round(result.bestAccuracy * 100),
        aesthetics: result.bestAesthetics,
        aestheticsPercent: Math.round(result.bestAesthetics * 100),
        combinedScore: result.bestCombinedScore,
        combinedScorePercent: Math.round(result.bestCombinedScore * 100),
        allCandidates: result.allResults.map(r => ({
          accuracy: r.overallAccuracy,
          accuracyPercent: Math.round(r.overallAccuracy * 100),
          aesthetics: r.aestheticsScore,
          aestheticsPercent: Math.round(r.aestheticsScore * 100),
          combinedScore: r.combinedScore,
          combinedScorePercent: Math.round(r.combinedScore * 100),
          rank: r.rank,
          ocrText: r.ocrText,
          scores: r.accuracyScores
        })),
        attemptsNeeded: result.attemptsNeeded,
        modelUsed: result.modelUsed,
        fallbacksUsed: result.fallbacksUsed,
        complexityWarnings: result.complexityWarnings,
        zoneLayout: result.zoneLayout
      });
    } catch (error: any) {
      console.error("Text Integrity generation error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate image with text integrity" 
      });
    }
  });

  app.post("/api/generate-imagen3", async (req, res) => {
    try {
      if (!isImagenAvailable()) {
        return res.status(400).json({ 
          success: false, 
          error: "Imagen is not available. Please add your Google AI API key." 
        });
      }

      const { prompt, aspectRatio, variations, negativePrompt, model } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const selectedModel: ImagenModel = model || 'imagen-4.0-generate-001';
      
      const textPriorityAnalysis = analyzeTextPriority(prompt.trim());
      let enhancedPrompt = prompt.trim();
      let usedTypographicEnhancement = false;
      
      if (textPriorityAnalysis.isTextPriority || textPriorityAnalysis.hasQuotedText) {
        console.log(`[Imagen Route] Text-heavy prompt detected - applying typographic enhancement`);
        console.log(`[Imagen Route] Text priority confidence: ${textPriorityAnalysis.confidence}, extracted texts: ${textPriorityAnalysis.extractedTexts.length}`);
        enhancedPrompt = buildTypographicPrompt(prompt.trim(), textPriorityAnalysis);
        usedTypographicEnhancement = true;
        console.log(`[Imagen Route] Enhanced prompt preview:`, enhancedPrompt.substring(0, 300) + '...');
      } else {
        console.log(`[Imagen Route] Non-text prompt - using original`);
      }
      
      console.log(`[Imagen Route] Generating with model ${selectedModel}:`, prompt.substring(0, 100));

      const images = await generateWithImagen(enhancedPrompt, {
        model: selectedModel,
        aspectRatio: aspectRatio || '1:1',
        numberOfImages: Math.min(Math.max(variations || 1, 1), 4),
        negativePrompt
      });

      const modeMap: Record<string, string> = {
        'imagen-4.0-generate-001': 'imagen4',
        'imagen-4.0-fast-generate-001': 'imagen4fast',
        'imagen-3.0-generate-002': 'imagen3'
      };

      res.json({
        success: true,
        images: images,
        enhancedPrompt: enhancedPrompt,
        originalPrompt: prompt.trim(),
        generationMode: modeMap[selectedModel] || 'imagen3',
        model: selectedModel,
        typographicEnhancement: usedTypographicEnhancement,
        textPriorityInfo: textPriorityAnalysis.isTextPriority ? {
          confidence: textPriorityAnalysis.confidence,
          extractedTexts: textPriorityAnalysis.extractedTexts
        } : undefined
      });
    } catch (error: any) {
      console.error("Imagen generation error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate image with Imagen" 
      });
    }
  });

  return httpServer;
}
