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
  generateIterativeEditPrompt
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
import type { GenerateImageRequest, GenerateImageResponse, QualityLevel } from "../shared/imageGenTypes";

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
        } : undefined
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

      const { prompt, style, quality, aspectRatio, variations, useMultiAgent } = req.body as GenerateImageRequest & { useMultiAgent?: boolean };

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const { textInfo, analysis } = await performInitialAnalysis(prompt.trim(), true);

      let enhancedPrompt: string;
      let agentInfo: any = null;

      const qualityLevel = (quality || 'standard') as QualityLevel;
      const shouldUseMultiAgent = useMultiAgent || qualityLevel === 'premium' || qualityLevel === 'ultra';

      if (shouldUseMultiAgent) {
        const multiAgentResult = await runMultiAgentPipeline(
          prompt.trim(),
          analysis,
          style || 'auto',
          qualityLevel
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
          qualityLevel
        );
      }

      const images = await generateImage(
        enhancedPrompt,
        aspectRatio || '1:1',
        Math.min(Math.max(variations || 1, 1), 4)
      );

      const response: GenerateImageResponse = {
        success: true,
        images,
        enhancedPrompt,
        analysis,
        ...(agentInfo && { agentInfo })
      };

      res.json(response);
    } catch (error: any) {
      console.error("Advanced image generation error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to generate image" 
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

  app.post("/api/deep-analysis", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const analysis = await performDeepAnalysis(prompt.trim());
      res.json({ success: true, analysis });
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
      console.log(`[Imagen Route] Generating with model ${selectedModel}:`, prompt.substring(0, 100));

      const images = await generateWithImagen(prompt.trim(), {
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
        enhancedPrompt: prompt.trim(),
        generationMode: modeMap[selectedModel] || 'imagen3',
        model: selectedModel
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
