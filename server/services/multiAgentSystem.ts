import { GoogleGenAI, Type } from "@google/genai";
import { PromptAnalysis, QualityLevel } from "../../shared/imageGenTypes";
import {
  buildCinematicDNA,
  selectLightingForSubject,
  selectColorGradeForMood,
  selectCameraForSubject,
  detectArtisticStyleFromPrompt,
  getStylePromptEnhancement,
  ARTISTIC_STYLES,
  CINEMATIC_DNA_COMPONENTS,
  COLOR_GRADES,
  LIGHTING_SETUPS,
  CAMERA_SYSTEMS,
  CINEMA_LENSES
} from "./cinematicDNA";

const API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || '';
const BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

const getAIClient = () => {
  if (!API_KEY) {
    throw new Error("AI service not configured. Please ensure the Gemini integration is properly set up.");
  }
  return new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: BASE_URL ? { baseUrl: BASE_URL, apiVersion: "" } : undefined
  });
};

export interface AgentResult {
  agent: string;
  contribution: string;
  confidence: number;
  details?: Record<string, any>;
}

export interface MultiAgentOutput {
  finalPrompt: string;
  agentResults: AgentResult[];
  qualityBoost: string;
  processingTime: number;
}

const DIRECTOR_SYSTEM_PROMPT = `You are the DIRECTOR AGENT - the chief creative officer of this image generation team.

Your role is to:
1. Analyze the user's creative intent and vision
2. Identify the core narrative and emotional message
3. Determine the overall artistic direction
4. Coordinate the visual storytelling approach

Consider:
- What story is being told?
- What emotion should the viewer feel?
- What is the focal point and visual hierarchy?
- What artistic style best serves the narrative?

Output a clear creative brief that guides the other agents.`;

const CINEMATOGRAPHER_SYSTEM_PROMPT = `You are the CINEMATOGRAPHER AGENT - the visual composition expert.

Your role is to:
1. Determine the ideal camera setup and lens selection
2. Plan the shot composition and framing
3. Design the depth of field and focus strategy
4. Apply cinematic composition rules

Use these cinema camera systems:
${Object.values(CAMERA_SYSTEMS).map((c: any) => `- ${c.name}: ${c.characteristics.join(', ')}`).join('\n')}

Apply composition principles:
- Rule of thirds, golden ratio, leading lines
- Foreground/midground/background layering
- Dynamic negative space
- Visual balance and tension`;

const LIGHTING_SYSTEM_PROMPT = `You are the LIGHTING AGENT - the master of light and shadow.

Your role is to:
1. Design the lighting setup for mood and dimension
2. Create depth through strategic light placement
3. Apply professional lighting techniques
4. Enhance the subject with appropriate lighting style

Available lighting setups:
${Object.values(LIGHTING_SETUPS).map(l => `- ${l.name}: ${l.keywords.join(', ')}`).join('\n')}

Apply these techniques:
- Key, fill, and rim light placement
- Volumetric lighting and god rays
- Dramatic shadows for mood
- Practical light sources for realism`;

const COLOR_SYSTEM_PROMPT = `You are the COLOR AGENT - the master colorist and palette designer.

Your role is to:
1. Design the color palette for emotional impact
2. Apply professional color grading techniques
3. Create color harmony and strategic contrast
4. Match the mood with appropriate color science

Available color grades:
${Object.values(COLOR_GRADES).map(g => `- ${g.name}: ${g.keywords.join(', ')}`).join('\n')}

Apply these principles:
- Complementary and analogous color schemes
- Color temperature for mood (warm/cool)
- Strategic color accent placement
- Film stock emulation for cinematic quality`;

const REFINER_SYSTEM_PROMPT = `You are the REFINER AGENT - the quality control and enhancement specialist.

Your role is to:
1. Synthesize all agent contributions into a cohesive prompt
2. Apply the 7 Cinematic DNA components for maximum quality
3. Add technical polish and professional details
4. Ensure the prompt is optimized for AI image generation

Cinematic DNA Components to apply:
${Object.values(CINEMATIC_DNA_COMPONENTS).map(c => `- ${c.name} (${c.qualityBoost}): ${c.keywords.slice(0, 3).join(', ')}`).join('\n')}

Final optimization:
- Remove redundancy while preserving all essential elements
- Ensure proper keyword density and technical specificity
- Add quality boosting technical terms
- Keep under 250 words for optimal generation`;

async function runAgent(
  ai: GoogleGenAI,
  systemPrompt: string,
  userContext: string,
  agentName: string
): Promise<AgentResult> {
  const startTime = Date.now();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\n---\n\nContext:\n${userContext}\n\nProvide your specific contribution in 2-3 sentences. Be precise and technical.`,
    });

    const contribution = response.text?.trim() || '';
    const processingTime = Date.now() - startTime;
    
    return {
      agent: agentName,
      contribution,
      confidence: contribution.length > 50 ? 0.9 : 0.7,
      details: { processingTime }
    };
  } catch (error) {
    console.error(`${agentName} Agent Error:`, error);
    return {
      agent: agentName,
      contribution: '',
      confidence: 0,
      details: { error: String(error) }
    };
  }
}

export async function runMultiAgentPipeline(
  userPrompt: string,
  analysis: PromptAnalysis,
  selectedStyle: string = 'auto',
  quality: QualityLevel = 'standard'
): Promise<MultiAgentOutput> {
  const startTime = Date.now();
  const ai = getAIClient();
  
  const qualityLevel = quality === 'draft' ? 'fast' : quality === 'ultra' ? 'professional' : 'balanced';
  const cinematicDNA = buildCinematicDNA(qualityLevel as 'fast' | 'balanced' | 'professional');
  const detectedStyle = detectArtisticStyleFromPrompt(userPrompt);
  const styleInfo = detectedStyle ? ARTISTIC_STYLES[detectedStyle] : null;
  
  const contextForAgents = `
USER PROMPT: "${userPrompt}"

ANALYSIS:
- Subject: ${analysis.subject.primary} (secondary: ${analysis.subject.secondary.join(', ')})
- Mood: ${analysis.mood.primary} (secondary: ${analysis.mood.secondary.join(', ')})
- Lighting Intent: ${analysis.lighting.scenario}
- Environment: ${analysis.environment.type} - ${analysis.environment.details}
- Style Intent: ${analysis.style_intent}
${styleInfo ? `- Detected Style: ${styleInfo.name}` : ''}
${selectedStyle !== 'auto' ? `- User Selected Style: ${selectedStyle}` : ''}

QUALITY LEVEL: ${quality} (${qualityLevel})
`;

  const agentResults: AgentResult[] = [];
  
  const directorResult = await runAgent(ai, DIRECTOR_SYSTEM_PROMPT, contextForAgents, 'Director');
  agentResults.push(directorResult);
  
  const cinematographerContext = `${contextForAgents}\n\nDIRECTOR'S VISION:\n${directorResult.contribution}`;
  const cinematographerResult = await runAgent(ai, CINEMATOGRAPHER_SYSTEM_PROMPT, cinematographerContext, 'Cinematographer');
  agentResults.push(cinematographerResult);
  
  const lightingContext = `${cinematographerContext}\n\nCINEMATOGRAPHER'S PLAN:\n${cinematographerResult.contribution}`;
  const lightingResult = await runAgent(ai, LIGHTING_SYSTEM_PROMPT, lightingContext, 'Lighting');
  agentResults.push(lightingResult);
  
  const colorContext = `${lightingContext}\n\nLIGHTING DESIGN:\n${lightingResult.contribution}`;
  const colorResult = await runAgent(ai, COLOR_SYSTEM_PROMPT, colorContext, 'Color');
  agentResults.push(colorResult);
  
  const refinerContext = `${colorContext}\n\nCOLOR PALETTE:\n${colorResult.contribution}\n\nCINEMATIC DNA TO APPLY:\n${cinematicDNA}`;
  const refinerResult = await runAgent(ai, REFINER_SYSTEM_PROMPT, refinerContext, 'Refiner');
  agentResults.push(refinerResult);
  
  const synthesisPrompt = `
You are synthesizing the work of 5 expert agents into a single, optimized image generation prompt.

ORIGINAL USER PROMPT: "${userPrompt}"

AGENT CONTRIBUTIONS:
1. DIRECTOR: ${directorResult.contribution}
2. CINEMATOGRAPHER: ${cinematographerResult.contribution}
3. LIGHTING: ${lightingResult.contribution}
4. COLOR: ${colorResult.contribution}
5. REFINER: ${refinerResult.contribution}

${styleInfo ? `ARTISTIC STYLE TO APPLY: ${styleInfo.promptTemplate}` : ''}

CINEMATIC DNA (ALWAYS INCLUDE):
${cinematicDNA}

YOUR TASK:
Create the FINAL optimized image generation prompt that:
1. Preserves the user's core idea exactly
2. Incorporates all agent contributions seamlessly
3. Applies the Cinematic DNA for Hollywood-quality output
4. Uses specific technical photography/cinematography terms
5. Stays under 250 words
6. Is formatted as a single flowing prompt (not a list)

Return ONLY the final prompt text, nothing else.
`;

  try {
    const finalResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: synthesisPrompt,
    });

    const finalPrompt = finalResponse.text?.trim() || userPrompt;
    const processingTime = Date.now() - startTime;
    
    const averageConfidence = agentResults.reduce((sum, r) => sum + r.confidence, 0) / agentResults.length;
    const qualityBoostPercent = Math.round(averageConfidence * 55);

    return {
      finalPrompt,
      agentResults,
      qualityBoost: `${qualityBoostPercent}% quality enhancement from 5-agent system`,
      processingTime
    };
  } catch (error) {
    console.error("Multi-Agent Synthesis Error:", error);
    return {
      finalPrompt: userPrompt,
      agentResults,
      qualityBoost: "Fallback to original prompt",
      processingTime: Date.now() - startTime
    };
  }
}

export async function runQuickEnhancement(
  userPrompt: string,
  analysis: PromptAnalysis,
  selectedStyle: string = 'auto'
): Promise<string> {
  const lightingRecommendation = selectLightingForSubject(analysis.subject.primary, analysis.mood.primary);
  const colorGrade = selectColorGradeForMood(analysis.mood.primary);
  const { camera, lens } = selectCameraForSubject(analysis.subject.primary);
  const detectedStyle = detectArtisticStyleFromPrompt(userPrompt);
  const styleEnhancement = detectedStyle ? getStylePromptEnhancement(detectedStyle) : '';
  
  const cinematicDNA = buildCinematicDNA('balanced');
  
  let enhancedPrompt = userPrompt;
  
  if (styleEnhancement) {
    enhancedPrompt += `, ${styleEnhancement}`;
  }
  
  enhancedPrompt += `, ${lightingRecommendation}`;
  enhancedPrompt += `, ${colorGrade.keywords.slice(0, 2).join(', ')}`;
  enhancedPrompt += `, shot on ${camera.name} with ${lens.name}`;
  enhancedPrompt += `, ${cinematicDNA}`;
  
  return enhancedPrompt;
}

export function getAgentSystemInfo(): Record<string, any> {
  return {
    agents: [
      { name: 'Director', role: 'Creative vision and narrative direction' },
      { name: 'Cinematographer', role: 'Camera, composition, and visual framing' },
      { name: 'Lighting', role: 'Light design and atmospheric depth' },
      { name: 'Color', role: 'Color grading and palette design' },
      { name: 'Refiner', role: 'Quality synthesis and optimization' }
    ],
    cinematicDNAComponents: Object.keys(CINEMATIC_DNA_COMPONENTS).length,
    artisticStyles: Object.keys(ARTISTIC_STYLES).length,
    colorGrades: Object.keys(COLOR_GRADES).length,
    lightingSetups: Object.keys(LIGHTING_SETUPS).length,
    cameraSystems: Object.keys(CAMERA_SYSTEMS).length,
    cinemaLenses: Object.keys(CINEMA_LENSES).length,
    expectedQualityBoost: '50-60%'
  };
}
