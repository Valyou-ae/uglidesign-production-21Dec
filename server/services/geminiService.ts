import { GoogleGenAI, Type, Modality } from "@google/genai";
import {
  DetectedTextInfo,
  PromptAnalysis,
  QualityLevel,
  GeneratedImageData,
  TextStyleIntent,
  ASPECT_RATIO_DIMENSIONS,
  ModelTier,
  TierReasonCode,
  TierEvaluation
} from "../../shared/imageGenTypes";
import {
  buildCinematicDNA,
  selectLightingForSubject,
  selectColorGradeForMood,
  selectCameraForSubject,
  detectArtisticStyleFromPrompt,
  getStylePromptEnhancement,
  ARTISTIC_STYLES,
  CINEMATIC_DNA_COMPONENTS,
  LIGHTING_SETUPS,
  COLOR_GRADES
} from "./cinematicDNA";
import {
  isImagenAvailable,
  generateWithImagen,
  type ImagenModel
} from "./imagen3Service";

const API_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || '';
const BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

// Dedicated API key for Imagen 4 and Gemini 3 Pro (user's own Google AI key)
const IMAGEN_API_KEY = process.env.IMAGEN_API_KEY || '';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

function validateApiKey(): void {
  if (!API_KEY) {
    throw new Error("AI service not configured. Please ensure the Gemini integration is properly set up.");
  }
}

function validateImagenApiKey(): void {
  if (!IMAGEN_API_KEY) {
    throw new Error("Imagen API key not configured. Please add IMAGEN_API_KEY to your secrets.");
  }
}

// Replit integration client (for gemini-2.5-flash, gemini-2.5-flash-image)
function getAIClient() {
  validateApiKey();
  return new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: BASE_URL ? { baseUrl: BASE_URL, apiVersion: "" } : undefined
  });
}

// Dedicated client for Imagen 4 and Gemini 3 Pro (user's own API key)
function getImagenClient() {
  validateImagenApiKey();
  return new GoogleGenAI({
    apiKey: IMAGEN_API_KEY
    // No httpOptions - uses default Google AI endpoint
  });
}

// Check if dedicated Imagen client is available
export function isImagenClientAvailable(): boolean {
  return !!IMAGEN_API_KEY;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 5, initialDelay = 3000): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMessage = error.toString();
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');

      if (isRateLimitError) {
        if (i === retries - 1) {
          console.error(`API rate limit exceeded. Max retries (${retries}) reached.`);
          throw new Error("The service is temporarily busy due to high demand. Please try again in a few moments.");
        }
        console.warn(`API rate limit exceeded. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(delay);
        delay = delay * 2 + Math.floor(Math.random() * 1000);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Exceeded max retries for an unknown reason.");
}

// ============================================================================
// AUTO-SCALING TIER SYSTEM
// Intelligently selects the optimal model tier based on prompt complexity
// ============================================================================

const TIER_CONFIG: Record<ModelTier, { thinkingBudget: number; maxWords: number }> = {
  standard: { thinkingBudget: 1024, maxWords: 150 },
  premium: { thinkingBudget: 4096, maxWords: 200 },
  ultra: { thinkingBudget: 8192, maxWords: 250 }
};

// Tier-specific generation settings for model selection, retries, and fallbacks
// Note: Using gemini-2.5-flash-image for native image generation (Replit AI Integrations)
const TIER_GENERATION_CONFIG: Record<ModelTier, {
  imagenRetries: number;
  imagenRetryDelay: number;
  imagenMaxDelay: number;
  fallbackModel: string;
  textFallbackModel: string;
}> = {
  standard: {
    imagenRetries: 3,
    imagenRetryDelay: 1000,
    imagenMaxDelay: 16000,
    fallbackModel: 'gemini-2.5-flash-image',
    textFallbackModel: 'gemini-2.5-flash-image'
  },
  premium: {
    imagenRetries: 5,
    imagenRetryDelay: 1000,
    imagenMaxDelay: 32000,
    fallbackModel: 'gemini-2.5-flash-image',
    textFallbackModel: 'gemini-2.5-flash-image'
  },
  ultra: {
    imagenRetries: 7,
    imagenRetryDelay: 1500,
    imagenMaxDelay: 45000,
    fallbackModel: 'gemini-2.5-flash-image',
    textFallbackModel: 'gemini-2.5-flash-image'
  }
};

const TIER_MESSAGES: Record<string, string> = {
  upgrade_text: "Upgraded to {tier} for better text accuracy",
  upgrade_multilingual: "Upgraded to {tier} for multilingual support", 
  upgrade_complexity: "Upgraded to {tier} for complex style rendering",
  upgrade_fidelity: "Upgraded to {tier} for high-fidelity output",
  downgrade_simple: "Using {tier} - optimized for your prompt",
  no_change: "Using {tier} as selected",
  override: "Using {tier} as you requested"
};

// Tier system uses these script patterns for complexity scoring
const TIER_SCRIPT_PATTERNS: Record<string, RegExp> = {
  japanese: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
  chinese: /[\u4E00-\u9FFF]/,
  korean: /[\uAC00-\uD7AF\u1100-\u11FF]/,
  arabic: /[\u0600-\u06FF]/,
  hebrew: /[\u0590-\u05FF]/,
  thai: /[\u0E00-\u0E7F]/,
  hindi: /[\u0900-\u097F]/,
  russian: /[\u0400-\u04FF]/,
  greek: /[\u0370-\u03FF]/
};

function detectScriptsForTier(text: string): string[] {
  const detected: string[] = [];
  for (const [lang, pattern] of Object.entries(TIER_SCRIPT_PATTERNS)) {
    if (pattern.test(text)) {
      detected.push(lang);
    }
  }
  return detected;
}

function extractTextsForTier(prompt: string): string[] {
  const patterns = [
    /"([^"]+)"/g,
    /'([^']+)'/g,
    /「([^」]+)」/g,
    /『([^』]+)』/g
  ];
  
  const texts: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      texts.push(match[1]);
    }
  }
  return texts;
}

function hasTextKeywordsForTier(prompt: string): boolean {
  const textKeywords = [
    'text', 'saying', 'says', 'written', 'write', 'word', 'words',
    'letter', 'letters', 'title', 'headline', 'caption', 'label',
    'sign', 'banner', 'poster', 'typography', 'font', 'neon sign',
    'spell', 'spelled', 'spelling', 'logo', 'logotype', 'wordmark'
  ];
  const lowerPrompt = prompt.toLowerCase();
  return textKeywords.some(keyword => lowerPrompt.includes(keyword));
}

function detectComplexStyleDemands(prompt: string): number {
  const complexStyles = [
    'hyperrealistic', 'photorealistic', 'ultra detailed', 'intricate',
    'masterpiece', '8k', '4k uhd', 'cinematic', 'professional',
    'award-winning', 'studio quality', 'high fidelity', 'museum quality',
    'gallery quality', 'fine art', 'renaissance', 'baroque', 'art nouveau'
  ];
  const lowerPrompt = prompt.toLowerCase();
  let score = 0;
  for (const style of complexStyles) {
    if (lowerPrompt.includes(style)) score += 10;
  }
  return Math.min(score, 40); // Cap at 40 points
}

export function evaluatePromptTier(
  prompt: string,
  userSelectedQuality: QualityLevel,
  userOverrideTier?: ModelTier
): TierEvaluation {
  const reasons: TierReasonCode[] = [];
  let complexityScore = 0;

  // If user explicitly overrides, respect their choice
  if (userOverrideTier) {
    const config = TIER_CONFIG[userOverrideTier];
    return {
      recommendedTier: userOverrideTier,
      originalTier: userOverrideTier,
      wasAutoAdjusted: false,
      adjustmentDirection: 'none',
      reasons: [{ code: 'user_override', weight: 100, description: 'User selected this tier' }],
      complexityScore: 50,
      thinkingBudget: config.thinkingBudget,
      maxWords: config.maxWords,
      userMessage: TIER_MESSAGES.override.replace('{tier}', userOverrideTier.charAt(0).toUpperCase() + userOverrideTier.slice(1))
    };
  }

  // Map quality level to base tier
  const qualityToTier: Record<QualityLevel, ModelTier> = {
    draft: 'standard',
    standard: 'standard',
    premium: 'premium',
    ultra: 'ultra'
  };
  const baseTier = qualityToTier[userSelectedQuality];
  let recommendedTier = baseTier;

  // 1. Analyze text content (highest priority for upgrades)
  const quotedTexts = extractTextsForTier(prompt);
  const totalTextLength = quotedTexts.reduce((sum, t) => sum + t.length, 0);
  const hasTextKeywords = hasTextKeywordsForTier(prompt);
  
  if (quotedTexts.length > 0 || hasTextKeywords) {
    const textScore = Math.min(30 + totalTextLength * 2, 50);
    complexityScore += textScore;
    reasons.push({
      code: 'text_detected',
      weight: textScore,
      description: `Found ${quotedTexts.length} text element(s) requiring accurate rendering`
    });
  }

  // 2. Check for multilingual scripts
  const detectedLanguages = detectScriptsForTier(prompt);
  if (detectedLanguages.length > 0) {
    const multilingualScore = 25 + detectedLanguages.length * 5;
    complexityScore += multilingualScore;
    reasons.push({
      code: 'multilingual',
      weight: multilingualScore,
      description: `Detected ${detectedLanguages.join(', ')} script(s)`
    });
  }

  // 3. Analyze style complexity
  const styleScore = detectComplexStyleDemands(prompt);
  if (styleScore > 0) {
    complexityScore += styleScore;
    reasons.push({
      code: 'complex_style',
      weight: styleScore,
      description: 'Complex artistic style requirements detected'
    });
  }

  // 4. Check prompt length (longer prompts may need more processing)
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount > 50) {
    const lengthScore = Math.min((wordCount - 50) / 2, 15);
    complexityScore += lengthScore;
    reasons.push({
      code: 'high_fidelity',
      weight: lengthScore,
      description: 'Detailed prompt requiring thorough processing'
    });
  }

  // Determine tier based on complexity score
  // Score thresholds: 0-30 = standard, 31-60 = premium, 61+ = ultra
  if (complexityScore >= 61) {
    recommendedTier = 'ultra';
  } else if (complexityScore >= 31) {
    recommendedTier = 'premium';
  } else {
    recommendedTier = 'standard';
  }

  // If no complexity detected, mark as simple
  if (reasons.length === 0) {
    reasons.push({
      code: 'simple_prompt',
      weight: 0,
      description: 'Simple prompt - standard tier is optimal'
    });
  }

  // Determine adjustment direction and message
  const tierOrder: ModelTier[] = ['standard', 'premium', 'ultra'];
  const baseIndex = tierOrder.indexOf(baseTier);
  const recommendedIndex = tierOrder.indexOf(recommendedTier);
  
  let adjustmentDirection: 'upgraded' | 'downgraded' | 'none';
  let userMessage: string;
  
  if (recommendedIndex > baseIndex) {
    adjustmentDirection = 'upgraded';
    const primaryReason = reasons[0]?.code || 'complexity';
    const messageKey = `upgrade_${primaryReason === 'text_detected' ? 'text' : 
                        primaryReason === 'multilingual' ? 'multilingual' :
                        primaryReason === 'complex_style' ? 'complexity' : 'fidelity'}`;
    userMessage = (TIER_MESSAGES[messageKey] || TIER_MESSAGES.upgrade_fidelity)
      .replace('{tier}', recommendedTier.charAt(0).toUpperCase() + recommendedTier.slice(1));
  } else if (recommendedIndex < baseIndex) {
    adjustmentDirection = 'downgraded';
    userMessage = TIER_MESSAGES.downgrade_simple
      .replace('{tier}', recommendedTier.charAt(0).toUpperCase() + recommendedTier.slice(1));
  } else {
    adjustmentDirection = 'none';
    userMessage = TIER_MESSAGES.no_change
      .replace('{tier}', recommendedTier.charAt(0).toUpperCase() + recommendedTier.slice(1));
  }

  const config = TIER_CONFIG[recommendedTier];
  
  return {
    recommendedTier,
    originalTier: baseTier,
    wasAutoAdjusted: adjustmentDirection !== 'none',
    adjustmentDirection,
    reasons,
    complexityScore: Math.min(complexityScore, 100),
    thinkingBudget: config.thinkingBudget,
    maxWords: config.maxWords,
    userMessage
  };
}

const TEXT_PHYSICAL_PROPERTIES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    material: { type: Type.STRING, description: "What is the text physically made of? (e.g., 'carved ice', 'glowing neon tube', 'displaced snow')." },
    lightingInteraction: { type: Type.STRING, description: "How does the scene's light affect it? (e.g., 'catches rim light on top edges', 'casts a soft shadow below')." },
    surfaceTexture: { type: Type.STRING, description: "What is its surface texture? (e.g., 'rough chiseled stone', 'smooth polished chrome')." },
    environmentalInteraction: { type: Type.STRING, description: "How does it affect its surroundings? (e.g., 'emits a soft glow onto the snow', 'disturbs the grass it rests on')." },
    perspectiveAndDepth: { type: Type.STRING, description: "Where is it in 3D space? (e.g., 'in the foreground, matching ground perspective')." },
  },
  required: ["material", "lightingInteraction", "surfaceTexture", "environmentalInteraction", "perspectiveAndDepth"],
};

const DETECTED_TEXT_INFO_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "The corrected text content." },
      placement: { type: Type.STRING, description: "Suggested placement of the text in the image (e.g., center, bottom-right, integrated)." },
      fontStyle: { type: Type.STRING, description: "A font style that matches the mood of the text and image (e.g., 'playful', 'elegant', 'modern')." },
      fontSize: { type: Type.STRING, description: "The relative size of the font (e.g., small, medium, dominant)." },
      physicalProperties: TEXT_PHYSICAL_PROPERTIES_SCHEMA,
    },
    required: ["text", "placement", "fontStyle", "fontSize", "physicalProperties"],
  },
};

const PROMPT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: "The main subject (e.g., 'portrait', 'landscape')." },
        secondary: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["primary", "secondary"],
    },
    mood: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: "The dominant mood (e.g., 'dramatic', 'peaceful')." },
        secondary: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["primary", "secondary"],
    },
    lighting: {
      type: Type.OBJECT,
      properties: {
        scenario: { type: Type.STRING, description: "The lighting condition (e.g., 'golden hour', 'studio')." },
      },
      required: ["scenario"],
    },
    environment: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "The setting (e.g., 'indoor', 'outdoor')." },
        details: { type: Type.STRING },
      },
      required: ["type", "details"],
    },
    style_intent: { type: Type.STRING, description: "The primary artistic style intent (e.g., 'cinematic', 'photorealistic')." },
  },
  required: ["subject", "mood", "lighting", "environment", "style_intent"],
};

const COMBINED_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    textInfo: DETECTED_TEXT_INFO_SCHEMA,
    analysis: PROMPT_ANALYSIS_SCHEMA,
  },
  required: ['textInfo', 'analysis'],
};

export const STYLE_PRESETS: Record<string, { name: string; keywords: string; guidance: string; isPhotorealistic?: boolean }> = {
  auto: { name: "Auto", keywords: "", guidance: "The AI will automatically determine the best style." },
  photo: { name: "Photorealistic", keywords: "DSLR, 8K, sharp focus, natural lighting", guidance: "Focus on photorealism with accurate lighting and detail.", isPhotorealistic: true },
  cinematic: { name: "Cinematic", keywords: "cinematic, film grain, dramatic lighting, movie still, anamorphic", guidance: "Apply Hollywood cinematography principles with dramatic lighting." },
  anime: { name: "Anime/Manga", keywords: "anime, manga, cel shaded, vibrant colors, Studio Ghibli", guidance: "Use anime art style with clean lines and vibrant colors." },
  oil: { name: "Oil Painting", keywords: "oil painting, visible brushstrokes, Renaissance, classical art", guidance: "Emulate classical oil painting techniques." },
  watercolor: { name: "Watercolor", keywords: "watercolor, soft edges, paper texture, flowing pigments", guidance: "Create soft, flowing watercolor effects." },
  digital: { name: "Digital Art", keywords: "digital art, ArtStation, concept art, trending", guidance: "Modern digital art style trending on art platforms." },
  minimal: { name: "Minimalist", keywords: "minimalist, clean lines, negative space, simple", guidance: "Focus on simplicity and negative space." },
  retro: { name: "Retrowave", keywords: "synthwave, neon, 80s aesthetic, vaporwave, grid", guidance: "Apply 80s retro-futuristic aesthetics." },
  fantasy: { name: "Dark Fantasy", keywords: "dark fantasy, gothic, dramatic lighting, epic", guidance: "Create atmospheric dark fantasy imagery." },
  pop: { name: "Pop Art", keywords: "pop art, bold colors, Ben-Day dots, Warhol", guidance: "Apply bold pop art aesthetics." },
  iso: { name: "Isometric 3D", keywords: "isometric, 3D render, clean geometry, soft shadows", guidance: "Create clean isometric 3D renders." },
  sketch: { name: "Pencil Sketch", keywords: "pencil sketch, graphite, crosshatching, detailed drawing", guidance: "Emulate detailed pencil drawings." },
};

export const QUALITY_PRESETS: Record<QualityLevel, { iterations: number; detailLevel: string; thinkingBudget: number; maxWords: number }> = {
  draft: { iterations: 1, detailLevel: "quick preview", thinkingBudget: 512, maxWords: 70 },
  standard: { iterations: 2, detailLevel: "balanced quality", thinkingBudget: 1024, maxWords: 150 },
  premium: { iterations: 3, detailLevel: "high detail", thinkingBudget: 4096, maxWords: 200 },
  ultra: { iterations: 4, detailLevel: "maximum detail and refinement", thinkingBudget: 8192, maxWords: 250 },
};

const NEGATIVE_LIBRARIES: Record<string, string> = {
  universal: "worst quality, low quality, normal quality, lowres, low resolution, blurry, jpeg artifacts, compression artifacts, noise, grainy, pixelated, bad composition, amateur, unprofessional, ugly, deformed, disfigured, watermark, signature, text unwanted, logo",
  portrait: "extra fingers, fewer fingers, extra limbs, missing limbs, deformed hands, malformed hands, fused fingers, long neck, disproportionate body, asymmetrical eyes, deformed face, disfigured face, bad anatomy, poorly drawn face, poorly drawn hands",
  landscape: "cluttered, chaotic, messy composition, unnatural colors, fake looking, cartoon, illustration",
  product: "bad lighting, harsh shadows, background clutter, unrealistic, toy-like, cheap looking",
  architecture: "distorted perspective, warped lines, crooked lines, unrealistic proportions, impossible geometry",
  animal: "extra legs, missing legs, wrong anatomy, mutated, malformed features, cartoon-like when realistic wanted",
  action: "frozen unnaturally, stiff, awkward pose, motion blur excessive, duplicate limbs, broken limbs, poorly framed",
  text: "gibberish text, unreadable text, distorted text, incorrect spelling, garbled text, misspelled words, wrong letters, missing letters, extra letters, swapped letters, invented words, nonsense text, scrambled text",
  photorealistic: "cartoon, anime, illustration, drawing, painting, sketch, 3D render, CG, artificial, fake, stylized",
  cinematic: "amateur, home video, phone camera, flat lighting, bad color grading, digital video look",
};

const COMMON_MISSPELLINGS: Record<string, string> = {
  'heroes tio born': 'heroes are born',
  'tio born': 'are born',
  'are borned': 'are born',
  'is borned': 'is born',
  'was borned': 'was born',
  'were borned': 'were born',
  'eachother': 'each other',
  'everytime': 'every time',
  'infront': 'in front',
  'infact': 'in fact',
  'atleast': 'at least',
  'aswell': 'as well',
  'alot': 'a lot',
  'noone': 'no one',
  'definately': 'definitely',
  'enviroment': 'environment',
  'goverment': 'government',
  'occassion': 'occasion',
  'tommorow': 'tomorrow',
  'begining': 'beginning',
  'comming': 'coming',
  'differant': 'different',
  'intresting': 'interesting',
  'successfull': 'successful',
  'beautifull': 'beautiful',
  'wonderfull': 'wonderful',
  'powerfull': 'powerful',
  'carefull': 'careful',
  'peacefull': 'peaceful',
  'gratefull': 'grateful',
  'faithfull': 'faithful',
  'playfull': 'playful',
  'naturaly': 'naturally',
  'probaly': 'probably',
  'basicly': 'basically',
  'becuase': 'because',
  'beleive': 'believe',
  'recieve': 'receive',
  'seperate': 'separate',
  'occured': 'occurred',
  'untill': 'until',
  'accross': 'across',
  'mosquitos': 'mosquitoes',
  'volcanos': 'volcanoes',
  'tornados': 'tornadoes',
  'potatos': 'potatoes',
  'tomatos': 'tomatoes',
  'heros': 'heroes',
  'echos': 'echoes',
  'shouldnt': "shouldn't",
  'couldnt': "couldn't",
  'wouldnt': "wouldn't",
  'doesnt': "doesn't",
  'havent': "haven't",
  'wasnt': "wasn't",
  'werent': "weren't",
  'hasnt': "hasn't",
  'didnt': "didn't",
  'theyre': "they're",
  'youre': "you're",
  'thats': "that's",
  'whats': "what's",
  'thier': 'their',
  'dont': "don't",
  'wont': "won't",
  'cant': "can't",
  'isnt': "isn't",
  'arent': "aren't",
  'whos': "who's",
  'lets': "let's",
  'were': "we're",
  'wich': 'which',
  'borned': 'born',
  'taht': 'that',
  'wiht': 'with',
  'teh': 'the',
  'hte': 'the',
  'adn': 'and',
  'ehr': 'her',
  'hsi': 'his',
  'tis': 'is',
  'ot': 'to',
  'fo': 'of'
};

const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on',
  'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we',
  'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
  'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being',
  'stars', 'collide', 'heroes', 'born', 'when', 'where', 'why', 'dawn', 'dusk', 'night',
  'light', 'dark', 'world', 'dream', 'love', 'life', 'death', 'hope', 'fear', 'power',
  'magic', 'legend', 'story', 'tale', 'epic', 'adventure', 'journey', 'rise', 'fall',
  'begin', 'end', 'never', 'always', 'forever', 'beyond', 'above', 'below', 'within'
]);

export const extractQuotedTexts = (prompt: string): string[] => {
  const textPatterns = [
    /"([^"]+)"/g,
    /'([^']+)'/g,
    /with the text[:\s]+["']?([^"'\n,]+)["']?/gi,
    /saying[:\s]+["']?([^"'\n,]+)["']?/gi,
    /that says[:\s]+["']?([^"'\n,]+)["']?/gi,
    /text[:\s]+["']?([^"'\n,]+)["']?/gi,
    /words[:\s]+["']?([^"'\n,]+)["']?/gi,
    /title[:\s]+["']?([^"'\n,]+)["']?/gi,
    /subtitle[:\s]+["']?([^"'\n,]+)["']?/gi,
    /slogan[:\s]+["']?([^"'\n,]+)["']?/gi,
    /tagline[:\s]+["']?([^"'\n,]+)["']?/gi
  ];

  const extractedTexts: string[] = [];

  for (const pattern of textPatterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        extractedTexts.push(match[1].trim());
      }
    }
  }

  return Array.from(new Set(extractedTexts));
};

export interface TextPriorityAnalysis {
  isTextPriority: boolean;
  hasMultilingualText: boolean;
  hasQuotedText: boolean;
  hasTextInstructions: boolean;
  detectedLanguages: string[];
  extractedTexts: string[];
  confidence: number;
}

const MULTILINGUAL_PATTERNS = {
  japanese: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
  chinese: /[\u4E00-\u9FFF\u3400-\u4DBF]/,
  korean: /[\uAC00-\uD7AF\u1100-\u11FF]/,
  arabic: /[\u0600-\u06FF\u0750-\u077F]/,
  hebrew: /[\u0590-\u05FF]/,
  thai: /[\u0E00-\u0E7F]/,
  hindi: /[\u0900-\u097F]/,
  russian: /[\u0400-\u04FF]/,
  greek: /[\u0370-\u03FF]/,
};

const TEXT_INSTRUCTION_KEYWORDS = [
  'with the text', 'that says', 'saying', 'written', 'spelled',
  'letters', 'words', 'sign', 'banner', 'title', 'subtitle',
  'headline', 'slogan', 'tagline', 'label', 'caption',
  'in large letters', 'in bold', 'at top', 'at bottom',
  'languages', 'script', 'native script', 'multilingual'
];

export const analyzeTextPriority = (prompt: string): TextPriorityAnalysis => {
  const extractedTexts = extractQuotedTexts(prompt);
  const detectedLanguages: string[] = [];

  for (const [lang, pattern] of Object.entries(MULTILINGUAL_PATTERNS)) {
    if (pattern.test(prompt)) {
      detectedLanguages.push(lang);
    }
  }

  const hasMultilingualText = detectedLanguages.length > 0;
  const hasQuotedText = /"[^"]+"/.test(prompt) || /'[^']+'/.test(prompt);
  const promptLower = prompt.toLowerCase();
  const hasTextInstructions = TEXT_INSTRUCTION_KEYWORDS.some(kw => promptLower.includes(kw));

  let confidence = 0;
  if (hasQuotedText) confidence += 0.3;
  if (hasMultilingualText) confidence += 0.4;
  if (hasTextInstructions) confidence += 0.3;
  if (extractedTexts.length > 0) confidence += 0.2;
  if (extractedTexts.length > 3) confidence += 0.2;

  confidence = Math.min(confidence, 1.0);

  const isTextPriority = confidence >= 0.4 || hasMultilingualText || (hasQuotedText && hasTextInstructions);

  return {
    isTextPriority,
    hasMultilingualText,
    hasQuotedText,
    hasTextInstructions,
    detectedLanguages,
    extractedTexts,
    confidence
  };
};

const TRICKY_WORDS_PHONETIC: Record<string, string> = {
  'elusive': 'ee-LOO-siv (like "illusion" without the "il")',
  'epistemological': 'eh-pis-teh-muh-LOJ-ih-kuhl',
  'philosophical': 'fil-uh-SOF-ih-kuhl',
  'dilemma': 'dih-LEM-uh (two Ms)',
  'uncertainty': 'un-SUR-tin-tee',
  'knowledge': 'NOL-ij (the K is silent)',
  'inquiry': 'in-KWAI-ree',
  'university': 'yoo-nih-VUR-sih-tee',
  'philosopher': 'fih-LOS-uh-fur',
  'worthington': 'WUR-thing-ton',
  'reginald': 'REJ-ih-nald',
  'oxford': 'OKS-ford',
  'established': 'eh-STAB-lisht',
  'remains': 'rih-MAINS',
  'forever': 'for-EV-ur',
  'beautiful': 'BYOO-tih-ful',
  'mysterious': 'mis-TEER-ee-us',
  'extraordinary': 'ek-stror-din-AIR-ee',
  'phenomenon': 'feh-NOM-eh-non',
  'consciousness': 'KON-shus-nis',
  'aesthetics': 'es-THET-iks',
  'renaissance': 'REN-uh-sahns',
  'mediterranean': 'med-ih-tuh-RAY-nee-un',
  'entrepreneurial': 'on-truh-pruh-NUR-ee-ul',
  'silhouette': 'sil-oo-ET',
  'acquaintance': 'uh-KWAYN-tans',
  'conscience': 'KON-shuns',
  'surveillance': 'sur-VAY-luns',
  'maintenance': 'MAYN-tuh-nuns',
  'questionnaire': 'kwes-chun-AIR',
  'restaurant': 'RES-tuh-rahnt',
  'guarantee': 'gair-un-TEE',
  'necessary': 'NES-uh-ser-ee',
  'occasion': 'uh-KAY-zhun',
  'definitely': 'DEF-uh-nit-lee',
  'separate': 'SEP-uh-rayt',
  'privilege': 'PRIV-uh-lij',
  'existence': 'eg-ZIS-tuns',
  'experience': 'ek-SPEER-ee-uns',
};

const COMMON_AI_HALLUCINATIONS: Record<string, string[]> = {
  'elusive': ['elspeile', 'elsuive', 'elusve', 'elsuie', 'elussive', 'elusiv', 'elusivee'],
  'knowledge': ['knowlege', 'knowladge', 'knowlede', 'knowlegde', 'konwledge'],
  'philosophical': ['philosophcal', 'philsophical', 'philosophial', 'philosphical'],
  'uncertainty': ['uncertainity', 'uncertianty', 'uncertainy', 'uncertanty'],
  'epistemological': ['epistimological', 'epistemologcal', 'epistmological'],
  'dilemma': ['dilema', 'dillema', 'dilemna', 'dillemma'],
  'inquiry': ['enquiry', 'inqury', 'inquery', 'inquirey'],
  'remains': ['remians', 'remanins', 'remiains', 'remins'],
  'forever': ['forver', 'forevr', 'forewer', 'forevver'],
  'university': ['univeristy', 'universtiy', 'universty', 'unversity'],
  'established': ['establised', 'etablished', 'estabilished', 'establishd'],
};

const spellOutWord = (word: string): string => {
  const chars = Array.from(word);
  return chars.join('-');
};

const spellOutWordUppercase = (word: string): string => {
  const chars = Array.from(word);
  return chars.map(c => c.toUpperCase()).join(' · ');
};

const getEnhancedWordVerification = (word: string): string => {
  const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
  const chars = Array.from(word);
  let verification = `${spellOutWord(word)} = ${spellOutWordUppercase(word)} (${chars.length} letters)`;
  
  if (TRICKY_WORDS_PHONETIC[cleanWord]) {
    verification += `\n      PRONUNCIATION: ${TRICKY_WORDS_PHONETIC[cleanWord]}`;
  }
  
  if (COMMON_AI_HALLUCINATIONS[cleanWord]) {
    verification += `\n      ⚠️ DO NOT WRITE: ${COMMON_AI_HALLUCINATIONS[cleanWord].slice(0, 3).join(', ')}`;
  }
  
  return verification;
};

const spellOutPhrase = (phrase: string): string => {
  const words = phrase.split(/\s+/).filter(w => w.length > 0);
  return words.map(word => {
    if (word.length >= 3) {
      return `"${word}" (${spellOutWord(word)})`;
    }
    return `"${word}"`;
  }).join(' ');
};

const getWordVerification = (word: string): string => {
  const chars = Array.from(word);
  return `${spellOutWord(word)} (${chars.length} characters)`;
};

export const buildTypographicPrompt = (
  userPrompt: string,
  textPriorityAnalysis: TextPriorityAnalysis
): string => {
  const { extractedTexts, detectedLanguages, hasMultilingualText } = textPriorityAnalysis;

  // AI Studio approach: Simple, direct commands work better than letter-by-letter spelling
  // Letter-by-letter can actually CONFUSE advanced models like Imagen 4
  // Use clear "MUST include...spelled EXACTLY as shown" directive instead
  
  let typographicPrompt = '';
  
  // Detect if this is graphic design (book cover, poster, etc.) vs photo of text
  const isGraphicDesign = /book\s*cover|poster|flyer|banner|logo|graphic|illustration|design|typography/i.test(userPrompt);
  
  if (isGraphicDesign) {
    // GRAPHIC DESIGN MODE: Focus on typography and design hierarchy, NOT camera specs
    typographicPrompt += `**A professional graphic design/illustration.**\n\n`;
    typographicPrompt += `**VISUAL STYLE:** Sophisticated, professional design with attention to typographic detail. `;
    typographicPrompt += `The composition is balanced with a cohesive, atmospheric aesthetic. `;
    typographicPrompt += `Use dramatic, conceptual lighting within the design - soft spotlight effects creating depth. `;
    typographicPrompt += `Apply a moody, professional color palette with rich tones.\n\n`;
  }
  
  // TEXT BLOCK SECTION - Clear hierarchy without letter-by-letter spelling
  if (extractedTexts.length > 0) {
    typographicPrompt += `**TEXT BLOCK (CRITICAL INSTRUCTION):** The image MUST include the following text blocks, spelled EXACTLY as shown, arranged in a professional typographic hierarchy:\n\n`;
    
    extractedTexts.forEach((text, i) => {
      // Determine text role based on position and content
      const isTitle = i === 0 || /title|heading/i.test(text);
      const isSubtitle = /subtitle|inquiry|into/i.test(text.toLowerCase());
      const isAuthor = /dr\.|by\s|author/i.test(text.toLowerCase());
      const isQuote = text.includes('"') || text.includes("'") || text.includes('—');
      const isPublisher = /press|publisher|est\./i.test(text.toLowerCase());
      
      let fontHint = 'clean, legible font';
      let sizeHint = 'appropriately sized';
      
      if (isTitle) {
        fontHint = 'strong, elegant Serif font';
        sizeHint = 'most prominent, large';
      } else if (isSubtitle) {
        fontHint = 'clean Sans-Serif font';
        sizeHint = 'smaller than title';
      } else if (isAuthor) {
        fontHint = 'elegant Serif font';
        sizeHint = 'medium, clearly legible';
      } else if (isQuote) {
        fontHint = 'italicized Serif font';
        sizeHint = 'smaller, stylized';
      } else if (isPublisher) {
        fontHint = 'small, clean Sans-Serif font';
        sizeHint = 'smallest, at bottom';
      }
      
      typographicPrompt += `* **Text ${i + 1}:** The text "${text}" MUST appear exactly as written, rendered in a ${fontHint}, ${sizeHint}.\n`;
    });
    
    typographicPrompt += `\nAll text MUST be perfectly legible with professional kerning and spacing.\n\n`;
  }
  
  // Multilingual handling
  if (hasMultilingualText) {
    typographicPrompt += `**MULTILINGUAL:** Render text in native scripts (${detectedLanguages.join(', ')}). Preserve all diacritics and special characters exactly.\n\n`;
  }
  
  // Original scene description - but filter out conflicting camera specs for graphic design
  let sceneDescription = userPrompt;
  if (isGraphicDesign) {
    // Remove camera/lens specs that don't apply to graphic design
    sceneDescription = sceneDescription
      .replace(/shot\s+on\s+\w+\s+\w+/gi, '')
      .replace(/\w+\s+lens/gi, '')
      .replace(/f[\/-]?\d+\.?\d*/gi, '')
      .replace(/\d+mm/gi, '')
      .replace(/bokeh/gi, '')
      .replace(/depth\s+of\s+field/gi, 'visual depth')
      .trim();
  }
  
  typographicPrompt += `**SCENE:** ${sceneDescription}\n\n`;
  
  // Design-appropriate enhancements (translate cinematic to design language)
  if (isGraphicDesign) {
    typographicPrompt += `**DESIGN QUALITY:** Professional composition with visual hierarchy. `;
    typographicPrompt += `Atmospheric depth through subtle gradients and shadows. `;
    typographicPrompt += `Rich, cohesive color treatment. Clean, polished finish.`;
  } else {
    // For photos of text (signs, storefronts, etc.) - keep some camera language
    typographicPrompt += `**IMAGE QUALITY:** Sharp focus on all text elements. Professional photography with clear legibility.`;
  }

  return typographicPrompt;
};

export const buildTextBlockDirectives = (textPriorityAnalysis: TextPriorityAnalysis): string => {
  const { extractedTexts, detectedLanguages, hasMultilingualText } = textPriorityAnalysis;
  
  if (extractedTexts.length === 0) {
    return '';
  }
  
  let textBlock = `\n**TEXT BLOCK (CRITICAL INSTRUCTION):** The image MUST include the following text, spelled EXACTLY as shown:\n\n`;
  
  extractedTexts.forEach((text, i) => {
    const isTitle = i === 0 || /title|heading/i.test(text);
    const isSubtitle = /subtitle|inquiry|into/i.test(text.toLowerCase());
    const isAuthor = /dr\.|by\s|author/i.test(text.toLowerCase());
    const isQuote = text.includes('"') || text.includes("'") || text.includes('—');
    const isPublisher = /press|publisher|est\./i.test(text.toLowerCase());
    
    let fontHint = 'clean, legible font';
    let sizeHint = 'appropriately sized';
    
    if (isTitle) {
      fontHint = 'strong, elegant Serif font';
      sizeHint = 'most prominent, large';
    } else if (isSubtitle) {
      fontHint = 'clean Sans-Serif font';
      sizeHint = 'smaller than title';
    } else if (isAuthor) {
      fontHint = 'elegant Serif font';
      sizeHint = 'medium, clearly legible';
    } else if (isQuote) {
      fontHint = 'italicized Serif font';
      sizeHint = 'smaller, stylized';
    } else if (isPublisher) {
      fontHint = 'small, clean Sans-Serif font';
      sizeHint = 'smallest, at bottom';
    }
    
    textBlock += `* The text "${text}" MUST appear exactly as written, rendered in a ${fontHint}, ${sizeHint}.\n`;
  });
  
  textBlock += `\nAll text MUST be perfectly legible with professional kerning and spacing.`;
  
  if (hasMultilingualText) {
    textBlock += `\n**MULTILINGUAL:** Render text in native scripts (${detectedLanguages.join(', ')}). Preserve all diacritics and special characters exactly.`;
  }
  
  return textBlock;
};

export const spellCheckText = (text: string): { corrected: string; corrections: string[] } => {
  let corrected = text;
  const corrections: string[] = [];

  const sortedEntries = Object.entries(COMMON_MISSPELLINGS).sort((a, b) => b[0].length - a[0].length);

  for (const [wrong, right] of sortedEntries) {
    const escapedWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWrong}\\b`, 'gi');
    if (regex.test(corrected)) {
      corrections.push(`"${wrong}" -> "${right}"`);
      corrected = corrected.replace(new RegExp(`\\b${escapedWrong}\\b`, 'gi'), right);
    }
  }

  return { corrected, corrections };
};

export const validateAndCorrectTextForImage = async (
  userPrompt: string,
  extractedTexts: string[]
): Promise<{ correctedPrompt: string; correctedTexts: string[]; allCorrections: string[] }> => {
  let correctedPrompt = userPrompt;
  const correctedTexts: string[] = [];
  const allCorrections: string[] = [];

  for (const text of extractedTexts) {
    const { corrected, corrections } = spellCheckText(text);

    if (corrections.length > 0) {
      allCorrections.push(...corrections);
      correctedPrompt = correctedPrompt.replace(text, corrected);
    }

    correctedTexts.push(corrected);
  }

  const { corrected: promptCorrected, corrections: promptCorrections } = spellCheckText(correctedPrompt);
  if (promptCorrections.length > 0) {
    allCorrections.push(...promptCorrections);
    correctedPrompt = promptCorrected;
  }

  return { correctedPrompt, correctedTexts, allCorrections };
};

const buildTextRenderingInstructions = (texts: string[]): string => {
  if (texts.length === 0) return '';

  return `
**CRITICAL TEXT RENDERING INSTRUCTIONS:**
The following text MUST appear EXACTLY as written in the image - letter by letter, word by word:
${texts.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

MANDATORY TEXT REQUIREMENTS:
- Spell each word EXACTLY as shown above
- Do NOT substitute, abbreviate, or modify any words
- Ensure every letter is clearly legible
- Use clean, readable typography
- Double-check spelling before rendering

COMMON MISTAKES TO AVOID:
- "to" should NOT become "tio" or "ot"
- "are" should NOT become "tio" or other variations
- "the" should NOT become "teh" or "hte"
- Maintain proper word spacing
`;
};

const buildCinematicDNADescription = (qualityLevel: 'fast' | 'balanced' | 'professional' = 'balanced'): string => {
  const components = Object.values(CINEMATIC_DNA_COMPONENTS);
  const lines = components.map((c, i) =>
    `${i + 1}. ${c.name.toUpperCase()} (${c.qualityBoost} boost): ${c.keywords.slice(0, 3).join(', ')}`
  );
  return `CINEMATIC DNA SYSTEM - Apply these 7 components for Hollywood-quality output:\n${lines.join('\n')}`;
};

const CINEMATIC_DNA = buildCinematicDNADescription();

const detectSubjectType = (analysis: PromptAnalysis): string => {
  const subject = analysis.subject.primary.toLowerCase();
  const keywords = ['portrait', 'person', 'people', 'man', 'woman', 'face'];
  if (keywords.some(kw => subject.includes(kw))) return 'portrait';
  return subject;
};

export const getNegativePrompts = (analysis: PromptAnalysis, textInfo: DetectedTextInfo[], style: string): string => {
  const negatives = new Set<string>(NEGATIVE_LIBRARIES.universal.split(', '));
  const subjectType = detectSubjectType(analysis);

  if (NEGATIVE_LIBRARIES[subjectType]) {
    NEGATIVE_LIBRARIES[subjectType].split(', ').forEach(n => negatives.add(n));
  }

  if (style.toLowerCase().includes('photo')) NEGATIVE_LIBRARIES.photorealistic.split(', ').forEach(n => negatives.add(n));
  if (style.toLowerCase().includes('cinematic')) NEGATIVE_LIBRARIES.cinematic.split(', ').forEach(n => negatives.add(n));

  if (textInfo.length === 0) {
    negatives.add('text'); negatives.add('words'); negatives.add('letters');
  } else {
    NEGATIVE_LIBRARIES.text.split(', ').forEach(n => negatives.add(n));
  }

  return Array.from(negatives).join(', ');
};

export const performInitialAnalysis = async (userPrompt: string, processText: boolean = true): Promise<{ textInfo: DetectedTextInfo[]; analysis: PromptAnalysis }> => {
  const ai = getAIClient();
  const fallbackAnalysis: PromptAnalysis = {
    subject: { primary: 'general', secondary: [] },
    mood: { primary: 'neutral', secondary: [] },
    lighting: { scenario: 'natural' },
    environment: { type: 'outdoor', details: '' },
    style_intent: 'general',
  };
  const fallback = { textInfo: [], analysis: fallbackAnalysis };

  if (!userPrompt.trim()) return fallback;

  const textInstruction = processText ? `
      **2. TEXT ANALYSIS:**
      - Identify text the user explicitly wants written in the image.
      - **ONLY identify text** if the user clearly requests it with phrases like "with the words...", "text that says...", or text in quotation marks.
      - **DO NOT** extract text from general scene descriptions.
      - If no explicit text is requested, return an empty array for textInfo.
  ` : `
      **2. TEXT ANALYSIS:**
      - Text processing is disabled. Return an empty array for textInfo.
  `;

  const metaPrompt = `
    You are an AI Art Director's assistant analyzing a prompt for an image generator.

    **TASKS:**
    1. **PROMPT ANALYSIS:** Analyze for main subject, mood, lighting, setting, and style intent.
    ${textInstruction}

    **USER PROMPT:** "${userPrompt}"

    Return a JSON object with the complete analysis.
  `.trim();

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
      config: { responseMimeType: "application/json", responseSchema: COMBINED_ANALYSIS_SCHEMA },
    }));

    const parsed = JSON.parse(response.text?.trim() || '{}');

    const textInfo: DetectedTextInfo[] = (Array.isArray(parsed.textInfo) ? parsed.textInfo : []).map((item: any) => ({
      text: item.text || '',
      placement: item.placement || 'center',
      fontStyle: item.fontStyle || 'modern',
      fontSize: item.fontSize || 'medium',
      physicalProperties: item.physicalProperties || {
        material: 'a clean modern overlay',
        lightingInteraction: 'no specific lighting',
        surfaceTexture: 'smooth',
        environmentalInteraction: 'floats on top',
        perspectiveAndDepth: 'flat on the screen'
      }
    }));

    const analysis: PromptAnalysis = parsed.analysis && typeof parsed.analysis === 'object' ? parsed.analysis : fallbackAnalysis;

    return { textInfo, analysis };
  } catch (error) {
    console.error("Initial Analysis Agent Error:", error);
    return fallback;
  }
};

export const enhanceStyle = async (
  userPrompt: string,
  analysis: PromptAnalysis,
  textInfo: DetectedTextInfo[],
  selectedStyle: string = 'auto',
  quality: QualityLevel = 'standard',
  tierOverrides?: { thinkingBudget?: number; maxWords?: number }
): Promise<string> => {
  const ai = getAIClient();

  try {
    const hasText = textInfo.length > 0;
    const styleInfo = STYLE_PRESETS[selectedStyle] || STYLE_PRESETS.auto;
    const qualityConfig = QUALITY_PRESETS[quality];
    
    // Use tier overrides if provided, otherwise fall back to quality presets
    const effectiveThinkingBudget = tierOverrides?.thinkingBudget || qualityConfig.thinkingBudget;
    const effectiveMaxWords = tierOverrides?.maxWords || qualityConfig.maxWords;

    const qualityLevel = quality === 'draft' ? 'fast' : quality === 'ultra' ? 'professional' : 'balanced';
    const cinematicDNA = buildCinematicDNA(qualityLevel as 'fast' | 'balanced' | 'professional');

    const lightingRecommendation = selectLightingForSubject(analysis.subject.primary, analysis.mood.primary);
    const colorGrade = selectColorGradeForMood(analysis.mood.primary);
    const { camera, lens } = selectCameraForSubject(analysis.subject.primary);

    const detectedArtStyle = detectArtisticStyleFromPrompt(userPrompt);
    const artStyleEnhancement = detectedArtStyle ? getStylePromptEnhancement(detectedArtStyle) : '';

    let correctedTextInfo = textInfo;
    if (hasText) {
      const textsToCheck = textInfo.map(t => t.text);
      const { correctedTexts } = await validateAndCorrectTextForImage(userPrompt, textsToCheck);
      correctedTextInfo = textInfo.map((t, i) => ({
        ...t,
        text: correctedTexts[i] || t.text
      }));
    }

    // AI Studio insight: Simple, direct text instruction - NO letter-by-letter spelling (confuses Imagen 4)
    // Iterate over ALL texts, not just the first one
    const textInstruction = hasText
      ? `The image MUST include the following text blocks, each spelled EXACTLY as written:
${correctedTextInfo.map((t, i) => `${i + 1}. "${t.text}" - ${t.physicalProperties.material}`).join('\n')}

CRITICAL: Do NOT attempt to spell letter-by-letter - just render the exact text as shown.
All text must be perfectly legible with professional typographic styling.`
      : 'The image must not contain any text, words, letters, or characters.';

    const stylePromptInstruction = selectedStyle !== 'auto'
      ? `Apply the style: ${styleInfo.name}. Keywords: ${styleInfo.keywords}. Guidance: ${styleInfo.guidance}.`
      : detectedArtStyle && ARTISTIC_STYLES[detectedArtStyle]
        ? `Apply detected artistic style: ${ARTISTIC_STYLES[detectedArtStyle].name}. ${artStyleEnhancement}`
        : `Automatically select the most fitting artistic style based on the subject and mood.`;

    // Style Architect: Different behavior for drafts vs final
    // AI Studio insight: Detect graphic design and translate cinematic concepts to design language
    const isDraft = quality === 'draft';
    const maxWords = effectiveMaxWords;
    const thinkingBudget = effectiveThinkingBudget;
    
    // Detect if this is graphic design (book covers, posters, etc.) vs photography
    const isGraphicDesign = /book\s*cover|poster|flyer|banner|logo|graphic|illustration|design|typography|cover\s*art/i.test(userPrompt);
    
    // AI Studio: Translation rules for graphic design vs photography
    const translationDirective = isGraphicDesign 
      ? `
      ### GRAPHIC DESIGN MODE (ACTIVE) ###
      This is a GRAPHIC DESIGN request, NOT a photograph. You must TRANSLATE cinematic concepts:
      - "Cinematic lighting" → "dramatic conceptual spotlight within the design"
      - "Professional color grading" → "moody, restricted color palette"
      - "Depth of field" → "layered visual depth through design elements"
      - "Camera/lens specs" → OMIT ENTIRELY (no "shot on ARRI Alexa" for book covers!)
      - "Film grain" → "subtle texture in the design"
      
      Create the ARTWORK ITSELF, not a photograph of it. Make the graphic design feel
      as atmospheric and professionally composed as a film frame, using design language.
      `
      : '';
    
    const metaPrompt = isDraft 
      ? `
      You are a Style Architect creating a CONCISE prompt for fast draft iteration.
      Thinking budget: ${thinkingBudget} tokens. Word limit: EXACTLY ${maxWords} words or less.

      ### PRIME DIRECTIVES (Always Apply) ###
      1. COMPOSITIONAL LOCK: Preserve the user's exact subject and scene
      2. SPELLING INTEGRITY: Any text must be spelled EXACTLY as specified

      ${translationDirective}

      ### FOCUS ON THREE KEY COMPONENTS ###
      ${isGraphicDesign 
        ? `1. Conceptual Lighting: Dramatic spotlight effects within the design
      2. Color Palette: ${colorGrade.name} treatment
      3. Visual Hierarchy: Professional design composition`
        : `1. Lighting: ${lightingRecommendation}
      2. Camera: ${camera.name} with ${lens.name}  
      3. Color: ${colorGrade.name}`}

      ${hasText ? `### TEXT REQUIREMENT ###\nInclude exact text: "${correctedTextInfo[0]?.text || ''}"` : ''}

      ### USER'S IDEA ###
      "${userPrompt}"

      ### CONSTRAINTS ###
      - MUST be under ${maxWords} words (count carefully!)
      ${isGraphicDesign 
        ? '- NO camera/lens specifications (this is graphic design, not photography)\n      - Focus on design aesthetics and visual atmosphere'
        : '- Focus on Lighting, Camera, Color only'}
      - Keep it fast and efficient
      ${hasText ? '- Spell text exactly as specified' : ''}

      Return ONLY the prompt text (${maxWords} words max).
    `.trim()
      : `
      You are an expert AI Art Director (Style Architect) creating a master prompt.
      Thinking budget: ${thinkingBudget} tokens. Word limit: EXACTLY ${maxWords} words or less.

      ### PRIME DIRECTIVES (Non-Negotiable) ###
      1. COMPOSITIONAL LOCK: Preserve the user's exact subject and scene structure
      2. EMOTIONAL DIRECTIVE: Maintain the intended mood and atmosphere
      3. UNIVERSAL PHYSICALITY: All elements must obey realistic physics and lighting
      4. SPELLING INTEGRITY: Any text must be spelled EXACTLY as specified

      ${translationDirective}

      ${isGraphicDesign 
        ? `### DESIGN DNA (Translated from Cinematic DNA) ###
      Apply these design principles to create professional graphic design:
      - Atmospheric Depth: Subtle gradients, layered shadows, visual depth
      - Conceptual Lighting: Dramatic spotlights, ambient glow, mood lighting
      - Color Palette: Rich, cohesive, professionally graded colors
      - Visual Hierarchy: Strategic placement, typographic balance, clear focal points
      - Texture & Finish: Subtle grain, professional polish, refined details`
        : `${CINEMATIC_DNA}

      ### CINEMATIC DNA ENHANCEMENT ###
      ${cinematicDNA}`}

      ### TECHNICAL RECOMMENDATIONS ###
      ${isGraphicDesign 
        ? `- Conceptual Lighting: Translate to dramatic spotlight/atmospheric effects WITHIN the design
      - Color Palette: ${colorGrade.name} (${colorGrade.keywords.join(', ')})
      - Composition: Professional graphic design visual hierarchy
      - NOTE: Do NOT include camera/lens specs - this is graphic design, not photography`
        : `- Lighting: ${lightingRecommendation}
      - Color Grade: ${colorGrade.name} (${colorGrade.keywords.join(', ')})
      - Camera: ${camera.name} with ${lens.name}`}

      ### TEXT CONTROL ###
      ${textInstruction}

      ### STYLE ###
      ${stylePromptInstruction}

      ### USER'S CORE IDEA ###
      "${userPrompt}"

      ### ANALYSIS ###
      Subject: ${analysis.subject.primary}, Mood: ${analysis.mood.primary}
      Lighting: ${analysis.lighting.scenario}, Style Intent: ${analysis.style_intent}

      ### YOUR TASK ###
      Synthesize a MASTER PROMPT that:
      1. MUST be under ${maxWords} words (count carefully!)
      2. Preserves the user's core idea with absolute fidelity
      ${isGraphicDesign 
        ? `3. Translates Cinematic DNA into DESIGN LANGUAGE (no camera specs!)
      4. Creates the artwork itself, not a photo of it
      5. Uses sophisticated graphic design terminology`
        : `3. Applies ALL Cinematic DNA components for Hollywood-quality output
      4. Uses the recommended lighting, color grade, and camera specs
      5. Uses specific, technical cinematography terminology`}
      6. Follows Prime Directives strictly
      ${hasText ? '7. Text MUST appear spelled EXACTLY as specified (do NOT spell letter-by-letter, just include the exact text)' : ''}

      Return ONLY the enhanced prompt text (${maxWords} words max).
    `.trim();

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
    }));

    return response.text?.trim() || userPrompt;
  } catch (error) {
    console.error("Style Enhancement Error:", error);
    return userPrompt;
  }
};

export interface GenerateImageOptions {
  aspectRatio?: string;
  numberOfVariations?: number;
  textPriorityMode?: boolean;
  temperature?: number;
}

async function generateWithGeminiImageModel(
  ai: any,
  prompt: string,
  aspectRatio: string,
  negativePrompt: string,
  count: number,
  modelName: string,
  referenceImage?: { base64Data: string, mimeType: string }
): Promise<GeneratedImageData[]> {
  const results: GeneratedImageData[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      let finalPrompt = prompt;
      let contents: any;

      if (referenceImage) {
        finalPrompt = `**PRIME DIRECTIVE: COMPOSITIONAL LOCK.** A reference image is provided. You MUST adhere to its core visual structure. The camera angle, subject, pose, and layout are LOCKED. Your task is to apply the changes from the prompt below to THIS EXACT composition, not to re-imagine the scene.\n\n**PROMPT:**\n${prompt}`;
        const fullPromptWithNegatives = negativePrompt 
          ? `${finalPrompt} --- AVOID --- ${negativePrompt}`
          : finalPrompt;
        contents = [
          { inlineData: { data: referenceImage.base64Data, mimeType: referenceImage.mimeType } },
          fullPromptWithNegatives
        ];
      } else {
        const fullPromptWithNegatives = negativePrompt 
          ? `${finalPrompt} --- AVOID --- ${negativePrompt}`
          : finalPrompt;
        contents = fullPromptWithNegatives;
      }

      console.log(`[Gemini Image] Generating with model: ${modelName}, iteration ${i + 1}/${count}`);
      
      const response: any = await withRetry(() => ai.models.generateContent({
        model: modelName,
        contents: contents
      }));

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          results.push({
            url: `data:${mimeType};base64,${base64}`,
            prompt: prompt,
            base64Data: base64,
            mimeType
          });
          console.log(`[Gemini Image] Successfully generated image ${results.length}`);
        }
      }
    } catch (e) {
      console.error(`Gemini Image generation failed for iteration ${i}:`, e);
    }
  }
  
  return results;
}

export interface ImageGenerationError extends Error {
  model?: string;
  attempt?: number;
  totalAttempts?: number;
  isRetryable?: boolean;
  originalError?: any;
  fallbackAttempted?: boolean;
  tier?: ModelTier;
  attemptHistory?: string[];
  imagenTriedAtLeastOnce?: boolean;
}

export const createDetailedError = (message: string, details: Partial<ImageGenerationError>): ImageGenerationError => {
  const error = new Error(message) as ImageGenerationError;
  Object.assign(error, details);
  return error;
};

export const generateImage = async (
  prompt: string,
  aspectRatio: string = '1:1',
  numberOfVariations: number = 1,
  options?: { 
    textPriorityMode?: boolean; 
    hasText?: boolean; 
    quality?: QualityLevel; 
    negativePrompt?: string;
    tier?: ModelTier;
  }
): Promise<GeneratedImageData[]> => {
  const ai = getAIClient();
  const hasText = options?.hasText || false;
  const quality = options?.quality || 'standard';
  const negativePrompt = options?.negativePrompt || '';
  const tier = options?.tier || 'standard';
  
  // Get tier-specific generation config
  const tierConfig = TIER_GENERATION_CONFIG[tier];
  console.log(`[generateImage] Using tier: ${tier} (retries: ${tierConfig.imagenRetries}, fallback: ${hasText ? tierConfig.textFallbackModel : tierConfig.fallbackModel})`);

  try {
    if (quality === 'draft') {
      const draftModel = 'gemini-2.5-flash-image';
      console.log(`[generateImage] Draft mode - using ${draftModel}`);
      try {
        return await generateWithGeminiImageModel(ai, prompt, aspectRatio, negativePrompt, numberOfVariations, draftModel);
      } catch (draftError: any) {
        console.error(`[generateImage] Draft model ${draftModel} failed:`, draftError.message || draftError);
        throw createDetailedError(
          `Draft generation failed with ${draftModel}: ${draftError.message || 'Unknown error'}`,
          { 
            model: draftModel, 
            originalError: draftError, 
            tier,
            imagenTriedAtLeastOnce: false,
            fallbackAttempted: false,
            attempt: 1,
            totalAttempts: 1,
            attemptHistory: [`Draft attempt: ${draftError.message || 'Unknown error'}`]
          }
        );
      }
    }

    console.log(`[generateImage] Final mode - trying Imagen 4 first (hasText: ${hasText}, tier: ${tier})`);
    
    // Tier-aware retry logic for Imagen 4
    let lastError: any = null;
    let delay = tierConfig.imagenRetryDelay;
    const allAttemptErrors: string[] = [];
    let actualAttemptCount = 0;
    let imagenTriedAtLeastOnce = false;
    
    for (let attempt = 0; attempt < tierConfig.imagenRetries; attempt++) {
      actualAttemptCount = attempt + 1;
      imagenTriedAtLeastOnce = true;
      
      try {
        console.log(`[generateImage] Imagen 4 attempt ${attempt + 1}/${tierConfig.imagenRetries}`);
        const imagenResults = await generateWithImagen(prompt, {
          model: 'imagen-4.0-generate-001',
          aspectRatio,
          numberOfImages: numberOfVariations,
          negativePrompt: negativePrompt || undefined
        });

        const results = imagenResults.map(result => ({
          url: `data:${result.mimeType};base64,${result.base64}`,
          prompt: prompt,
          base64Data: result.base64,
          mimeType: result.mimeType
        }));

        if (results.length > 0) {
          console.log(`[generateImage] Imagen 4 succeeded on attempt ${attempt + 1} - ${results.length} images`);
          return results;
        }
        
        // Imagen returned empty array - treat as error
        const emptyError = `Imagen 4 returned empty response on attempt ${attempt + 1}`;
        allAttemptErrors.push(emptyError);
        console.warn(`[generateImage] ${emptyError}`);
        lastError = new Error(emptyError);
      } catch (imagenError: any) {
        lastError = imagenError;
        const errorMessage = imagenError.message || imagenError.toString();
        allAttemptErrors.push(`Attempt ${attempt + 1}: ${errorMessage}`);
        
        const isRetryable = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') ||
                           errorMessage.includes('rate limit') ||
                           errorMessage.includes('quota');
        
        console.warn(`[generateImage] Imagen 4 error (attempt ${attempt + 1}/${tierConfig.imagenRetries}): ${errorMessage} [retryable: ${isRetryable}]`);
        
        if (!isRetryable || attempt === tierConfig.imagenRetries - 1) {
          console.warn(`[generateImage] Imagen 4 failed permanently after ${attempt + 1} attempts`);
          if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("API key expired")) {
            throw createDetailedError(
              `Imagen 4 access denied: ${errorMessage}`,
              { 
                model: 'imagen-4.0-generate-001', 
                attempt: attempt + 1, 
                totalAttempts: tierConfig.imagenRetries, 
                isRetryable: false, 
                originalError: imagenError, 
                tier,
                imagenTriedAtLeastOnce: true,
                fallbackAttempted: false,
                attemptHistory: allAttemptErrors
              }
            );
          }
          break;
        }
        
        console.warn(`[generateImage] Imagen 4 rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${tierConfig.imagenRetries})`);
        await sleep(delay);
        delay = Math.min(delay * 2, tierConfig.imagenMaxDelay);
      }
    }

    // Tier-aware fallback model selection
    const fallbackModel = hasText ? tierConfig.textFallbackModel : tierConfig.fallbackModel;
    console.log(`[generateImage] Imagen 4 exhausted ${actualAttemptCount} attempts. Using fallback: ${fallbackModel} (tier: ${tier})`);
    console.log(`[generateImage] Imagen 4 attempt history: ${allAttemptErrors.join(' | ')}`);
    
    try {
      const fallbackResults = await generateWithGeminiImageModel(ai, prompt, aspectRatio, negativePrompt, numberOfVariations, fallbackModel);
      if (fallbackResults.length > 0) {
        console.log(`[generateImage] Fallback ${fallbackModel} succeeded - ${fallbackResults.length} images`);
        return fallbackResults;
      }
      throw new Error('Fallback model returned no images');
    } catch (fallbackError: any) {
      console.error(`[generateImage] Fallback ${fallbackModel} also failed:`, fallbackError.message || fallbackError);
      throw createDetailedError(
        `All models failed. Imagen 4 (${actualAttemptCount} attempts): ${lastError?.message || 'unknown error'}. Fallback ${fallbackModel}: ${fallbackError.message || 'Unknown error'}`,
        { 
          model: fallbackModel, 
          originalError: fallbackError, 
          fallbackAttempted: true, 
          imagenTriedAtLeastOnce,
          tier,
          attempt: actualAttemptCount,
          totalAttempts: tierConfig.imagenRetries,
          attemptHistory: allAttemptErrors
        }
      );
    }
  } catch (error: any) {
    console.error("[generateImage] Final error:", error.message || error);
    // Re-throw if it's already a detailed error (check multiple fields)
    if (error.model || error.tier || error.attemptHistory || error.imagenTriedAtLeastOnce !== undefined || error.fallbackAttempted !== undefined) {
      throw error;
    }
    throw createDetailedError(
      `Image generation failed: ${error.message || 'Unknown error'}`,
      { 
        originalError: error, 
        tier,
        imagenTriedAtLeastOnce: false,
        fallbackAttempted: false,
        attempt: 0,
        totalAttempts: 0,
        attemptHistory: []
      }
    );
  }
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAIClient();

  try {
    // Use gemini-2.5-flash for image analysis (Remix feature)
    // This model has vision capabilities for reverse-engineering prompts from images
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Analyze this image and create a detailed, descriptive text prompt that could be used to recreate a similar image.

Focus on:
1. Subject: What is the main subject? Describe in detail.
2. Style: What artistic or photographic style is used?
3. Lighting: Describe the lighting setup and quality.
4. Colors: What is the color palette and mood?
5. Composition: How is the image composed? Camera angle, framing?
6. Atmosphere: What mood or emotion does the image convey?
7. Technical details: Any specific effects, textures, or post-processing?

Return ONLY the descriptive prompt text that could recreate this image, nothing else.` },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }
      ],
    }));

    return response.text?.trim() || 'A creative image';
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return 'A creative image';
  }
};

export interface SmartGenerationResult {
  images: GeneratedImageData[];
  mode: 'cinematic' | 'typographic';
  textPriorityAnalysis: TextPriorityAnalysis;
  enhancedPrompt: string;
  originalPrompt: string;
  analysis?: PromptAnalysis;
  modelUsed?: string;
  negativePrompt?: string;
  tierEvaluation?: TierEvaluation;
}

export const generateImageSmart = async (
  userPrompt: string,
  aspectRatio: string = '1:1',
  selectedStyle: string = 'auto',
  quality: QualityLevel = 'standard',
  variations: number = 1,
  tierOverride?: ModelTier
): Promise<SmartGenerationResult> => {
  const ai = getAIClient();
  const textPriorityAnalysis = analyzeTextPriority(userPrompt);
  
  // Auto-scaling tier evaluation
  const tierEvaluation = evaluatePromptTier(userPrompt, quality, tierOverride);
  console.log(`[Smart Generation] Tier: ${tierEvaluation.recommendedTier} (auto-adjusted: ${tierEvaluation.wasAutoAdjusted}, complexity: ${tierEvaluation.complexityScore})`);
  
  // Get tier-specific generation config
  const tierConfig = TIER_GENERATION_CONFIG[tierEvaluation.recommendedTier];
  
  // Use DETERMINISTIC text detection from tier evaluation (most reliable)
  // tierEvaluation.reasons contains 'text_detected' when quoted text or text keywords found
  const tierDetectedText = tierEvaluation.reasons.some(r => r.code === 'text_detected');
  
  console.log(`[Smart Generation] Text Priority Analysis:`, {
    isTextPriority: textPriorityAnalysis.isTextPriority,
    tierDetectedText,
    confidence: textPriorityAnalysis.confidence,
    hasMultilingual: textPriorityAnalysis.hasMultilingualText,
    languages: textPriorityAnalysis.detectedLanguages,
    extractedTexts: textPriorityAnalysis.extractedTexts.length
  });

  const result = await performInitialAnalysis(userPrompt, true);
  const analysis = result.analysis;
  const textInfo = result.textInfo;
  
  // FIXED: Use tier evaluation's deterministic text detection as primary source
  // This ensures typographic mode triggers when evaluatePromptTier detects text
  const hasText = tierDetectedText || textInfo.length > 0 || textPriorityAnalysis.isTextPriority;
  
  console.log(`[Smart Generation] hasText = ${hasText} (tierDetectedText: ${tierDetectedText}, textInfo: ${textInfo.length}, isTextPriority: ${textPriorityAnalysis.isTextPriority})`);
  
  let enhancedPrompt: string;
  let mode: 'cinematic' | 'typographic';

  // AI Studio insight: ALWAYS run full 5-agent system - never bypass
  // For typographic mode, agents translate cinematic concepts to design language
  // Then we append TEXT BLOCK directives after enhancement
  
  if (hasText) {
    mode = 'typographic';
    console.log(`[Smart Generation] Using TYPOGRAPHIC mode WITH full agent system`);
    
    // Step 1: Run full agent enhancement (agents will translate for graphic design)
    enhancedPrompt = await enhanceStyle(
      userPrompt, analysis, textInfo, selectedStyle, quality,
      { thinkingBudget: tierEvaluation.thinkingBudget, maxWords: tierEvaluation.maxWords }
    );
    
    // Step 2: Append TEXT BLOCK critical instructions after agent enhancement
    const textBlockDirectives = buildTextBlockDirectives(textPriorityAnalysis);
    if (textBlockDirectives) {
      enhancedPrompt = enhancedPrompt + '\n\n' + textBlockDirectives;
    }
    
    console.log(`[Smart Generation] Appended TEXT BLOCK directives to agent-enhanced prompt`);
  } else {
    mode = 'cinematic';
    console.log(`[Smart Generation] Using CINEMATIC mode - full enhancement pipeline`);
    // Pass tier-specific thinking budget/maxWords
    enhancedPrompt = await enhanceStyle(
      userPrompt, analysis, textInfo, selectedStyle, quality,
      { thinkingBudget: tierEvaluation.thinkingBudget, maxWords: tierEvaluation.maxWords }
    );
  }

  const negativePrompt = getNegativePrompts(analysis, textInfo, selectedStyle);
  
  console.log(`[Smart Generation] Final prompt (${mode} mode):`, enhancedPrompt.substring(0, 200) + '...');
  console.log(`[Smart Generation] Negative prompt:`, negativePrompt.substring(0, 100) + '...');

  const numVariations = Math.min(Math.max(variations, 1), 4);
  let images: GeneratedImageData[] = [];
  let modelUsed = 'gemini';

  // AI Studio Model Routing with tier-aware retry/fallback
  // For TEXT-HEAVY prompts: Always try Imagen 4 first (even in draft) for better text accuracy
  // For non-text prompts in draft mode: Use gemini-2.5-flash-image for speed
  if (quality === 'draft' && !hasText) {
    const draftModel = 'gemini-2.5-flash-image';
    console.log(`[Smart Generation] Draft mode (no text) - using ${draftModel} for speed`);
    images = await generateWithGeminiImageModel(ai, enhancedPrompt, aspectRatio, negativePrompt, numVariations, draftModel);
    modelUsed = draftModel;
  } else {
    // For TEXT-HEAVY prompts (draft or final) AND final non-text: Use Imagen 4 PRIMARY
    const modeDesc = quality === 'draft' ? 'Draft WITH TEXT' : 'Final';
    console.log(`[Smart Generation] ${modeDesc} mode - Imagen 4 PRIMARY for text accuracy (tier: ${tierEvaluation.recommendedTier}, retries: ${tierConfig.imagenRetries})`);
    
    let delay = tierConfig.imagenRetryDelay;
    
    for (let attempt = 0; attempt < tierConfig.imagenRetries; attempt++) {
      try {
        const imagenResults = await generateWithImagen(enhancedPrompt, {
          model: 'imagen-4.0-generate-001',
          aspectRatio,
          numberOfImages: numVariations,
          negativePrompt
        });

        images = imagenResults.map(r => ({
          url: `data:${r.mimeType};base64,${r.base64}`,
          prompt: enhancedPrompt,
          base64Data: r.base64,
          mimeType: r.mimeType
        }));

        if (images.length > 0) {
          modelUsed = 'imagen-4.0-generate-001';
          console.log(`[Smart Generation] Imagen 4 succeeded on attempt ${attempt + 1} - ${images.length} images`);
          break;
        }
      } catch (imagenError: any) {
        const errorMessage = imagenError.message || imagenError.toString();
        const isRetryable = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') ||
                           errorMessage.includes('rate limit') ||
                           errorMessage.includes('quota');
        
        if (!isRetryable || attempt === tierConfig.imagenRetries - 1) {
          console.warn(`[Smart Generation] Imagen 4 failed (attempt ${attempt + 1}/${tierConfig.imagenRetries}):`, errorMessage);
          if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("API key expired")) {
            throw imagenError;
          }
          break;
        }
        
        console.warn(`[Smart Generation] Imagen 4 rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${tierConfig.imagenRetries})`);
        await sleep(delay);
        delay = Math.min(delay * 2, tierConfig.imagenMaxDelay);
      }
    }

    // Tier-aware fallback model selection (only if Imagen 4 failed)
    if (images.length === 0) {
      const fallbackModel = hasText ? tierConfig.textFallbackModel : tierConfig.fallbackModel;
      console.log(`[Smart Generation] Using tier-specific fallback: ${fallbackModel} (tier: ${tierEvaluation.recommendedTier})`);
      images = await generateWithGeminiImageModel(ai, enhancedPrompt, aspectRatio, negativePrompt, numVariations, fallbackModel);
      modelUsed = fallbackModel;
    }
  }

  return {
    images,
    mode,
    textPriorityAnalysis,
    enhancedPrompt,
    originalPrompt: userPrompt,
    analysis,
    modelUsed,
    negativePrompt,
    tierEvaluation
  };
};

export const generateIterativeEditPrompt = async (
  currentPrompt: string,
  editInstruction: string,
  textStyleIntent?: TextStyleIntent
): Promise<string> => {
  const ai = getAIClient();

  try {
    const intentInstruction = textStyleIntent
      ? `Text style intent: ${textStyleIntent} (subtle=small non-distracting, integrated=physically part of scene, bold=dominant central feature, cinematic=clean movie-poster style)`
      : '';

    const metaPrompt = `
      You are helping refine an image generation prompt based on user feedback.

      **CURRENT PROMPT:** "${currentPrompt}"
      **USER'S EDIT REQUEST:** "${editInstruction}"
      ${intentInstruction}

      Create a new prompt that applies the user's edit while preserving what they liked about the original.
      Return ONLY the new prompt text.
    `.trim();

    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
    }));

    return response.text?.trim() || currentPrompt;
  } catch (error) {
    console.error("Iterative Edit Error:", error);
    return currentPrompt;
  }
};

export interface DeepAnalysisResult {
  subject: {
    primary: string;
    secondary: string[];
    semanticCategory: string;
    emotionalResonance: string;
  };
  composition: {
    recommendedFraming: string;
    focalPoint: string;
    visualFlow: string;
    negativeSpace: string;
  };
  atmosphere: {
    mood: string;
    timeOfDay: string;
    weather: string;
    ambiance: string;
  };
  technicalRecommendations: {
    cameraAngle: string;
    lensType: string;
    lightingSetup: string;
    colorGrade: string;
    depthOfField: string;
  };
  artisticInfluences: string[];
  suggestedEnhancements: string[];
}

export const performDeepAnalysis = async (userPrompt: string): Promise<DeepAnalysisResult> => {
  const ai = getAIClient();

  const fallback: DeepAnalysisResult = {
    subject: { primary: 'general', secondary: [], semanticCategory: 'abstract', emotionalResonance: 'neutral' },
    composition: { recommendedFraming: 'centered', focalPoint: 'center', visualFlow: 'balanced', negativeSpace: 'moderate' },
    atmosphere: { mood: 'neutral', timeOfDay: 'day', weather: 'clear', ambiance: 'calm' },
    technicalRecommendations: { cameraAngle: 'eye level', lensType: '50mm', lightingSetup: 'natural', colorGrade: 'neutral', depthOfField: 'moderate' },
    artisticInfluences: [],
    suggestedEnhancements: []
  };

  if (!userPrompt.trim()) return fallback;

  const detectedStyle = detectArtisticStyleFromPrompt(userPrompt);
  const styleInfo = detectedStyle && ARTISTIC_STYLES[detectedStyle] ? ARTISTIC_STYLES[detectedStyle] : null;

  const cinematicDNAContext = Object.values(CINEMATIC_DNA_COMPONENTS)
    .map(c => `${c.name}: ${c.keywords.slice(0, 2).join(', ')}`)
    .join('; ');

  const lightingOptions = Object.values(LIGHTING_SETUPS)
    .map(l => l.name)
    .slice(0, 6)
    .join(', ');

  const colorGradeOptions = Object.values(COLOR_GRADES)
    .map(g => g.name)
    .slice(0, 6)
    .join(', ');

  const metaPrompt = `
    You are an expert Art Director performing DEEP SEMANTIC ANALYSIS of an image generation prompt.
    This is NOT basic analysis - provide detailed, actionable insights for maximizing image quality.

    **USER PROMPT:** "${userPrompt}"

    ${styleInfo ? `**DETECTED STYLE:** ${styleInfo.name}
    - Color Palette: ${styleInfo.colorPalette.join(', ')}
    - Techniques: ${styleInfo.techniques.join(', ')}
    - Best Use: ${styleInfo.bestUse.join(', ')}` : ''}

    **AVAILABLE CINEMATIC DNA COMPONENTS:**
    ${cinematicDNAContext}

    **AVAILABLE LIGHTING SETUPS:**
    ${lightingOptions}

    **AVAILABLE COLOR GRADES:**
    ${colorGradeOptions}

    Perform COMPREHENSIVE analysis covering:

    1. **SUBJECT ANALYSIS** (be specific):
       - Primary subject with detailed description
       - All secondary elements and their relationships
       - Semantic category (portrait/landscape/product/action/abstract/scene)
       - Emotional resonance and psychological impact

    2. **COMPOSITION RECOMMENDATIONS** (professional cinematography):
       - Recommended framing (close-up, medium, wide, extreme wide, Dutch angle, etc.)
       - Focal point placement (rule of thirds position, golden ratio, center power, etc.)
       - Visual flow direction (leading lines, eye path, compositional balance)
       - Negative space strategy (minimal, balanced, dramatic, asymmetric)

    3. **ATMOSPHERE** (environmental storytelling):
       - Dominant mood and secondary emotional tones
       - Specific time of day with lighting implications
       - Weather and atmospheric conditions
       - Overall ambiance and sensory qualities

    4. **TECHNICAL RECOMMENDATIONS** (professional equipment):
       - Camera angle (eye level, low angle, high angle, bird's eye, worm's eye)
       - Specific lens type with focal length (24mm wide, 35mm, 50mm, 85mm portrait, 135mm telephoto)
       - Lighting setup from available options
       - Color grade from available options
       - Depth of field (shallow bokeh, moderate, deep focus, selective focus)

    5. **ARTISTIC INFLUENCES** (up to 3):
       - Specific art movements, photographers, cinematographers, or artists
       - How each influence would enhance the image

    6. **SUGGESTED ENHANCEMENTS** (5 specific, actionable improvements):
       - Technical improvements for quality
       - Atmospheric additions for mood
       - Compositional refinements
       - Detail enhancements
       - Professional finishing touches

    Return a detailed JSON object with all fields populated.
  `.trim();

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
      config: { responseMimeType: "application/json" },
    }));

    const parsed = JSON.parse(response.text?.trim() || '{}');

    return {
      subject: {
        primary: parsed.subject?.primary || fallback.subject.primary,
        secondary: Array.isArray(parsed.subject?.secondary) ? parsed.subject.secondary : fallback.subject.secondary,
        semanticCategory: parsed.subject?.semanticCategory || fallback.subject.semanticCategory,
        emotionalResonance: parsed.subject?.emotionalResonance || fallback.subject.emotionalResonance
      },
      composition: {
        recommendedFraming: parsed.composition?.recommendedFraming || fallback.composition.recommendedFraming,
        focalPoint: parsed.composition?.focalPoint || fallback.composition.focalPoint,
        visualFlow: parsed.composition?.visualFlow || fallback.composition.visualFlow,
        negativeSpace: parsed.composition?.negativeSpace || fallback.composition.negativeSpace
      },
      atmosphere: {
        mood: parsed.atmosphere?.mood || fallback.atmosphere.mood,
        timeOfDay: parsed.atmosphere?.timeOfDay || fallback.atmosphere.timeOfDay,
        weather: parsed.atmosphere?.weather || fallback.atmosphere.weather,
        ambiance: parsed.atmosphere?.ambiance || fallback.atmosphere.ambiance
      },
      technicalRecommendations: {
        cameraAngle: parsed.technicalRecommendations?.cameraAngle || fallback.technicalRecommendations.cameraAngle,
        lensType: parsed.technicalRecommendations?.lensType || fallback.technicalRecommendations.lensType,
        lightingSetup: parsed.technicalRecommendations?.lightingSetup || fallback.technicalRecommendations.lightingSetup,
        colorGrade: parsed.technicalRecommendations?.colorGrade || fallback.technicalRecommendations.colorGrade,
        depthOfField: parsed.technicalRecommendations?.depthOfField || fallback.technicalRecommendations.depthOfField
      },
      artisticInfluences: Array.isArray(parsed.artisticInfluences) ? parsed.artisticInfluences : fallback.artisticInfluences,
      suggestedEnhancements: Array.isArray(parsed.suggestedEnhancements) ? parsed.suggestedEnhancements : fallback.suggestedEnhancements
    };
  } catch (error) {
    console.error("Deep Analysis Error:", error);
    return fallback;
  }
};

export interface ImageQualityScores {
  composition: number;
  detail: number;
  lighting: number;
  color: number;
  overall: number;
}

const IMAGE_SCORE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    composition: { type: Type.NUMBER, description: "Score 1-10 for composition quality." },
    detail: { type: Type.NUMBER, description: "Score 1-10 for detail level." },
    lighting: { type: Type.NUMBER, description: "Score 1-10 for lighting quality." },
    color: { type: Type.NUMBER, description: "Score 1-10 for color depth." },
    overall: { type: Type.NUMBER, description: "Overall score 1-10, considering all aspects." },
  },
  required: ["composition", "detail", "lighting", "color", "overall"],
};

export const scoreImageQuality = async (imageBase64: string): Promise<ImageQualityScores> => {
  const ai = getAIClient();
  const fallback = { composition: 0, detail: 0, lighting: 0, color: 0, overall: 0 };
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/png' } },
          { text: `Rate this AI-generated image on a scale of 1-10 for composition, detail, lighting, and color. Provide an overall score. Return ONLY a valid JSON object.` }
        ]
      },
      config: { responseMimeType: "application/json", responseSchema: IMAGE_SCORE_SCHEMA }
    }));
    
    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      composition: parsed.composition || 0,
      detail: parsed.detail || 0,
      lighting: parsed.lighting || 0,
      color: parsed.color || 0,
      overall: parsed.overall || 0
    };
  } catch (error) {
    console.error("Image Scoring Error:", error);
    return fallback;
  }
};

export const generateWithAICuration = async (
  prompt: string,
  aspectRatio: string = '1:1',
  numberOfSelections: number = 1,
  batchSize: number = 4
): Promise<{ images: GeneratedImageData[]; scores: ImageQualityScores[] }> => {
  console.log(`[AI Curation] Generating ${batchSize} candidates, selecting ${numberOfSelections} best`);
  
  const allImages = await generateImage(prompt, aspectRatio, batchSize);
  
  if (allImages.length === 0) {
    throw new Error("Failed to generate candidate images for curation");
  }
  
  console.log(`[AI Curation] Scoring ${allImages.length} images...`);
  const scoredImages = await Promise.all(
    allImages.map(async (img) => ({
      ...img,
      scores: img.base64Data ? await scoreImageQuality(img.base64Data) : { composition: 0, detail: 0, lighting: 0, color: 0, overall: 0 }
    }))
  );
  
  scoredImages.sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0));
  
  const selected = scoredImages.slice(0, numberOfSelections);
  console.log(`[AI Curation] Selected top ${selected.length} images with scores:`, 
    selected.map(s => s.scores?.overall));
  
  return {
    images: selected,
    scores: selected.map(s => s.scores!)
  };
};

export interface DraftToFinalResult {
  draftPrompt: string;
  draftImages: GeneratedImageData[];
  refinedPrompt: string;
  finalImages: GeneratedImageData[];
  improvementNotes: string[];
  qualityScore: number;
}

export const draftToFinalWorkflow = async (
  userPrompt: string,
  analysis: PromptAnalysis,
  textInfo: DetectedTextInfo[],
  selectedStyle: string = 'auto',
  aspectRatio: string = '1:1'
): Promise<DraftToFinalResult> => {
  const ai = getAIClient();

  const draftPrompt = await enhanceStyle(userPrompt, analysis, textInfo, selectedStyle, 'draft');
  const draftImages = await generateImage(draftPrompt, aspectRatio, 1);

  const lightingRecommendation = selectLightingForSubject(analysis.subject.primary, analysis.mood.primary);
  const colorGrade = selectColorGradeForMood(analysis.mood.primary);
  const { camera, lens } = selectCameraForSubject(analysis.subject.primary);
  const detectedStyle = detectArtisticStyleFromPrompt(userPrompt);
  const styleEnhancement = detectedStyle ? getStylePromptEnhancement(detectedStyle) : '';

  const refinementPrompt = `
    You are refining a draft image prompt into a final, polished version.

    **DRAFT PROMPT:** "${draftPrompt}"
    **ORIGINAL USER INTENT:** "${userPrompt}"

    **CINEMATIC DNA TO APPLY:**
    ${buildCinematicDNA('professional')}

    **TECHNICAL RECOMMENDATIONS:**
    - Lighting: ${lightingRecommendation}
    - Color Grade: ${colorGrade.name} (${colorGrade.keywords.join(', ')})
    - Camera: ${camera.name}
    - Lens: ${lens.name}
    ${styleEnhancement ? `- Style: ${styleEnhancement}` : ''}

    Create a FINAL polished prompt that:
    1. Preserves all the good elements from the draft
    2. Applies ALL Cinematic DNA components for Hollywood-quality output
    3. Adds professional finishing touches (grain, bokeh, atmospheric depth)
    4. Uses the most specific technical photography terms
    5. Stays under 250 words

    Return ONLY the final prompt text.
  `.trim();

  try {
    const refinementResponse = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: refinementPrompt,
    }));

    const refinedPrompt = refinementResponse.text?.trim() || draftPrompt;
    const finalImages = await generateImage(refinedPrompt, aspectRatio, 1);

    const improvementNotes = [
      `Applied ${Object.keys(CINEMATIC_DNA_COMPONENTS).length} Cinematic DNA components`,
      `Used ${camera.name} with ${lens.name} for professional quality`,
      `Applied ${colorGrade.name} color grading`,
      `Optimized lighting with ${lightingRecommendation}`,
      detectedStyle ? `Enhanced with ${ARTISTIC_STYLES[detectedStyle]?.name || detectedStyle} style` : null
    ].filter(Boolean) as string[];

    return {
      draftPrompt,
      draftImages,
      refinedPrompt,
      finalImages,
      improvementNotes,
      qualityScore: 0.85
    };
  } catch (error) {
    console.error("Draft to Final Workflow Error:", error);
    return {
      draftPrompt,
      draftImages,
      refinedPrompt: draftPrompt,
      finalImages: draftImages,
      improvementNotes: ['Fallback: Used draft as final'],
      qualityScore: 0.5
    };
  }
};

// ============================================================================
// TEXT INTEGRITY AGENT - AI Studio's OCR Validation System
// ============================================================================

export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function calculateTextAccuracy(expected: string, actual: string): number {
  if (!expected || !actual) return 0;
  const distance = levenshteinDistance(expected, actual);
  const maxLen = Math.max(expected.length, actual.length);
  return maxLen === 0 ? 1 : Math.max(0, 1 - distance / maxLen);
}

export async function ocrImageWithGemini(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const ai = getAIClient();
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Extract ALL text visible in this image. Return ONLY the text content, preserving the exact spelling and formatting. If there are multiple text blocks, separate them with newlines. Do not add any commentary or explanation.' },
            { inlineData: { mimeType, data: imageBase64 } }
          ]
        }
      ]
    }));
    
    return response.text?.trim() || '';
  } catch (error) {
    console.error('[OCR] Failed to extract text:', error);
    return '';
  }
}

export async function scoreImageAesthetics(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<number> {
  const ai = getAIClient();
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Rate this image on a scale of 0-100 for visual quality, considering:
- Composition and balance
- Lighting and atmosphere
- Color harmony
- Professional polish
- Overall aesthetic appeal

Return ONLY a single number (0-100), nothing else.` },
            { inlineData: { mimeType, data: imageBase64 } }
          ]
        }
      ]
    }));
    
    const scoreText = response.text?.trim() || '50';
    const score = parseInt(scoreText, 10);
    return isNaN(score) ? 50 : Math.min(100, Math.max(0, score)) / 100;
  } catch (error) {
    console.error('[Aesthetics] Failed to score image:', error);
    return 0.5;
  }
}

export interface TextIntegrityResult {
  image: GeneratedImageData;
  ocrText: string;
  accuracyScores: { text: string; expected: string; accuracy: number }[];
  overallAccuracy: number;
  aestheticsScore: number;
  combinedScore: number;
  rank: number;
}

export interface TextIntegrityBatchResult {
  bestImage: GeneratedImageData;
  bestAccuracy: number;
  allResults: TextIntegrityResult[];
  attemptsNeeded: number;
  modelUsed: string;
}

export async function runTextIntegrityValidation(
  candidates: GeneratedImageData[],
  expectedTexts: string[],
  includeAesthetics: boolean = true
): Promise<TextIntegrityResult[]> {
  const results: TextIntegrityResult[] = [];
  
  console.log(`[Text Integrity] Validating ${candidates.length} candidates against ${expectedTexts.length} expected texts`);
  
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    
    const dataUrlMatch = candidate.url.match(/^data:([^;]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      console.warn(`[Text Integrity] Candidate ${i} has invalid URL format`);
      results.push({
        image: candidate,
        ocrText: '',
        accuracyScores: [],
        overallAccuracy: 0,
        aestheticsScore: 0,
        combinedScore: 0,
        rank: 999
      });
      continue;
    }
    
    const [, mimeType, base64Data] = dataUrlMatch;
    
    const ocrText = await ocrImageWithGemini(base64Data, mimeType);
    console.log(`[Text Integrity] Candidate ${i} OCR result:`, ocrText.substring(0, 100) + '...');
    
    const ocrTextLower = ocrText.toLowerCase();
    const accuracyScores = expectedTexts.map(expected => {
      const expectedLower = expected.toLowerCase();
      
      let bestAccuracy = 0;
      const ocrLines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);
      
      for (const line of ocrLines) {
        const lineAccuracy = calculateTextAccuracy(expectedLower, line.toLowerCase());
        if (lineAccuracy > bestAccuracy) {
          bestAccuracy = lineAccuracy;
        }
      }
      
      if (bestAccuracy < 0.5 && ocrTextLower.includes(expectedLower.substring(0, Math.min(10, expectedLower.length)))) {
        bestAccuracy = Math.max(bestAccuracy, 0.6);
      }
      
      return { text: expected, expected, accuracy: bestAccuracy };
    });
    
    const overallAccuracy = accuracyScores.length > 0 
      ? accuracyScores.reduce((sum, s) => sum + s.accuracy, 0) / accuracyScores.length
      : 0;
    
    let aestheticsScore = 0.5;
    if (includeAesthetics) {
      aestheticsScore = await scoreImageAesthetics(base64Data, mimeType);
      console.log(`[Text Integrity] Candidate ${i} aesthetics score: ${(aestheticsScore * 100).toFixed(0)}%`);
    }
    
    const combinedScore = (overallAccuracy * 0.7) + (aestheticsScore * 0.3);
    
    results.push({
      image: candidate,
      ocrText,
      accuracyScores,
      overallAccuracy,
      aestheticsScore,
      combinedScore,
      rank: 0
    });
  }
  
  results.sort((a, b) => b.combinedScore - a.combinedScore);
  results.forEach((r, i) => r.rank = i + 1);
  
  console.log(`[Text Integrity] Rankings:`, results.map(r => ({ 
    rank: r.rank, 
    accuracy: r.overallAccuracy.toFixed(2),
    aesthetics: r.aestheticsScore.toFixed(2),
    combined: r.combinedScore.toFixed(2)
  })));
  
  return results;
}

export function buildZoneLayoutPlan(textBlocks: string[]): string {
  if (textBlocks.length === 0) return '';
  
  const zones: string[] = [];
  
  if (textBlocks.length === 1) {
    zones.push(`ZONE (Center): "${textBlocks[0]}" - prominently displayed as the main text element`);
  } else if (textBlocks.length === 2) {
    zones.push(`ZONE 1 (Top Half): "${textBlocks[0]}" - main title, largest and most prominent`);
    zones.push(`ZONE 2 (Bottom Half): "${textBlocks[1]}" - secondary text, supporting the title`);
  } else if (textBlocks.length === 3) {
    zones.push(`ZONE 1 (Top Third): "${textBlocks[0]}" - main title, largest and most prominent`);
    zones.push(`ZONE 2 (Middle Third): "${textBlocks[1]}" - subtitle or secondary information`);
    zones.push(`ZONE 3 (Bottom Third): "${textBlocks[2]}" - author, credits, or tertiary text`);
  } else {
    zones.push(`ZONE 1 (Top): "${textBlocks[0]}" - main title, most prominent`);
    zones.push(`ZONE 2 (Upper Middle): "${textBlocks[1]}" - subtitle`);
    
    const middleBlocks = textBlocks.slice(2, -1);
    middleBlocks.forEach((block, i) => {
      zones.push(`ZONE ${i + 3} (Middle): "${block}" - supporting text`);
    });
    
    zones.push(`ZONE ${textBlocks.length} (Bottom): "${textBlocks[textBlocks.length - 1]}" - footer/credits`);
  }
  
  return `
**TEXT LAYOUT ZONES (Spatial Hierarchy):**
${zones.join('\n')}

Each zone should maintain clear visual separation. Text should not overlap between zones.
`.trim();
}

export function buildCriticalSpellingEmphasis(textBlocks: string[]): string {
  const complexWords: string[] = [];
  
  for (const block of textBlocks) {
    const words = block.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length >= 8 || /[A-Z].*[A-Z]/.test(word) || /-/.test(word)) {
        complexWords.push(word);
      }
    }
  }
  
  if (complexWords.length === 0) return '';
  
  return `
**CRITICAL SPELLING (Pay Extra Attention):**
The following words are complex and require exact spelling:
${complexWords.map(w => `- "${w}" - render this word EXACTLY as shown, letter by letter`).join('\n')}

These words must be spelled with 100% accuracy. Double-check each character.
`.trim();
}

export function checkTextComplexitySoftLimits(textBlocks: string[]): { warnings: string[]; isWithinLimits: boolean } {
  const warnings: string[] = [];
  let isWithinLimits = true;
  
  if (textBlocks.length > 5) {
    warnings.push(`High text block count (${textBlocks.length}/5 recommended). Consider reducing for better accuracy.`);
    isWithinLimits = false;
  } else if (textBlocks.length > 4) {
    warnings.push(`Text block count at upper limit (${textBlocks.length}/5 recommended).`);
  }
  
  for (let i = 0; i < textBlocks.length; i++) {
    const wordCount = textBlocks[i].split(/\s+/).length;
    if (wordCount > 12) {
      warnings.push(`Text block ${i + 1} has ${wordCount} words (12 max recommended). Consider shortening.`);
      isWithinLimits = false;
    } else if (wordCount > 10) {
      warnings.push(`Text block ${i + 1} approaching word limit (${wordCount}/12 recommended).`);
    }
  }
  
  return { warnings, isWithinLimits };
}

export interface CuratedGenerationResult {
  bestImage: GeneratedImageData;
  bestAccuracy: number;
  bestAesthetics: number;
  bestCombinedScore: number;
  allResults: TextIntegrityResult[];
  attemptsNeeded: number;
  modelUsed: string;
  fallbacksUsed: string[];
  complexityWarnings: string[];
  zoneLayout: string;
}

export async function generateWithTextIntegrity(
  userPrompt: string,
  expectedTexts: string[],
  aspectRatio: string = '1:1',
  selectedStyle: string = 'auto',
  quality: QualityLevel = 'standard',
  candidateCount: number = 8
): Promise<CuratedGenerationResult> {
  console.log(`[Text Integrity Generation] Starting with ${expectedTexts.length} text blocks, ${candidateCount} candidates`);
  
  const complexityCheck = checkTextComplexitySoftLimits(expectedTexts);
  if (complexityCheck.warnings.length > 0) {
    console.log(`[Text Integrity] Complexity warnings:`, complexityCheck.warnings);
  }
  
  const zoneLayout = buildZoneLayoutPlan(expectedTexts);
  const criticalSpelling = buildCriticalSpellingEmphasis(expectedTexts);
  
  const enhancedPrompt = `${userPrompt}

${zoneLayout}

${criticalSpelling}

**TEXT RENDERING REQUIREMENTS:**
All text must be rendered with PERFECT spelling accuracy. Each word must be exactly as specified.
`.trim();
  
  console.log(`[Text Integrity] Enhanced prompt with zones and critical spelling`);
  
  const textPriorityAnalysis = analyzeTextPriority(enhancedPrompt);
  const tierEvaluation = evaluatePromptTier(enhancedPrompt, quality);
  const result = await performInitialAnalysis(enhancedPrompt, true);
  
  let enhancedStylePrompt = await enhanceStyle(
    enhancedPrompt, 
    result.analysis, 
    result.textInfo, 
    selectedStyle, 
    quality,
    { thinkingBudget: tierEvaluation.thinkingBudget, maxWords: tierEvaluation.maxWords }
  );
  
  const textBlockDirectives = buildTextBlockDirectives(textPriorityAnalysis);
  if (textBlockDirectives) {
    enhancedStylePrompt = enhancedStylePrompt + '\n\n' + textBlockDirectives;
  }
  
  const negativePrompt = getNegativePrompts(result.analysis, result.textInfo, selectedStyle);
  
  const fallbacksUsed: string[] = [];
  let allResults: TextIntegrityResult[] = [];
  let modelUsed = 'imagen-4.0-generate-001';
  
  console.log(`[Text Integrity] PRIMARY: Generating ${candidateCount} candidates with Imagen 4`);
  
  try {
    const imagenCandidates = await generateWithImagen(enhancedStylePrompt, {
      model: 'imagen-4.0-generate-001',
      aspectRatio,
      numberOfImages: Math.min(candidateCount, 4),
      negativePrompt
    });
    
    let candidates: GeneratedImageData[] = imagenCandidates.map(r => ({
      url: `data:${r.mimeType};base64,${r.base64}`,
      prompt: enhancedStylePrompt
    }));
    
    if (candidateCount > 4) {
      const secondBatch = await generateWithImagen(enhancedStylePrompt, {
        model: 'imagen-4.0-generate-001',
        aspectRatio,
        numberOfImages: Math.min(candidateCount - 4, 4),
        negativePrompt
      });
      
      candidates = candidates.concat(secondBatch.map(r => ({
        url: `data:${r.mimeType};base64,${r.base64}`,
        prompt: enhancedStylePrompt
      })));
    }
    
    console.log(`[Text Integrity] Generated ${candidates.length} candidates, running OCR validation`);
    
    allResults = await runTextIntegrityValidation(candidates, expectedTexts);
    
    const bestResult = allResults[0];
    if (bestResult && bestResult.combinedScore >= 0.80) {
      console.log(`[Text Integrity] SUCCESS: Found candidate with ${(bestResult.combinedScore * 100).toFixed(1)}% combined score (accuracy: ${(bestResult.overallAccuracy * 100).toFixed(1)}%, aesthetics: ${(bestResult.aestheticsScore * 100).toFixed(1)}%)`);
      return {
        bestImage: bestResult.image,
        bestAccuracy: bestResult.overallAccuracy,
        bestAesthetics: bestResult.aestheticsScore,
        bestCombinedScore: bestResult.combinedScore,
        allResults,
        attemptsNeeded: 1,
        modelUsed,
        fallbacksUsed,
        complexityWarnings: complexityCheck.warnings,
        zoneLayout
      };
    }
    
    console.log(`[Text Integrity] Best Imagen 4 accuracy: ${(bestResult?.overallAccuracy || 0) * 100}%. Trying fallback...`);
    fallbacksUsed.push('imagen-4-low-accuracy');
    
  } catch (error) {
    console.error(`[Text Integrity] Imagen 4 failed:`, error);
    fallbacksUsed.push('imagen-4-error');
  }
  
  console.log(`[Text Integrity] SECONDARY FALLBACK: Trying gemini-3-pro-image-preview`);
  modelUsed = 'gemini-3-pro-image-preview';
  
  try {
    // Use dedicated Imagen client for gemini-3-pro-image-preview
    const ai = isImagenClientAvailable() ? getImagenClient() : getAIClient();
    const fallbackCandidates: GeneratedImageData[] = [];
    
    for (let i = 0; i < Math.min(candidateCount, 4); i++) {
      try {
        const response = await withRetry(() => ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: enhancedStylePrompt,
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          }
        }));
        
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            fallbackCandidates.push({
              url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              prompt: enhancedStylePrompt
            });
          }
        }
      } catch (e) {
        console.error(`[Text Integrity] Fallback generation ${i} failed:`, e);
      }
    }
    
    if (fallbackCandidates.length > 0) {
      console.log(`[Text Integrity] Running OCR validation on ${fallbackCandidates.length} fallback candidates`);
      const fallbackResults = await runTextIntegrityValidation(fallbackCandidates, expectedTexts);
      allResults = allResults.concat(fallbackResults);
      
      allResults.sort((a, b) => b.combinedScore - a.combinedScore);
      allResults.forEach((r, i) => r.rank = i + 1);
    }
  } catch (error) {
    console.error(`[Text Integrity] Gemini 3 Pro fallback failed:`, error);
    fallbacksUsed.push('gemini-3-pro-error');
  }
  
  const finalBest = allResults[0];
  
  if (!finalBest) {
    throw new Error('Text Integrity Agent: All generation attempts failed. Please try again.');
  }
  
  console.log(`[Text Integrity] FINAL: Best combined score ${(finalBest.combinedScore * 100).toFixed(1)}% (accuracy: ${(finalBest.overallAccuracy * 100).toFixed(1)}%, aesthetics: ${(finalBest.aestheticsScore * 100).toFixed(1)}%) from ${modelUsed}`);
  
  return {
    bestImage: finalBest.image,
    bestAccuracy: finalBest.overallAccuracy,
    bestAesthetics: finalBest.aestheticsScore,
    bestCombinedScore: finalBest.combinedScore,
    allResults,
    attemptsNeeded: allResults.length,
    modelUsed,
    fallbacksUsed,
    complexityWarnings: complexityCheck.warnings,
    zoneLayout
  };
}

// ============================================================================
// MODEL CONNECTION TEST
// Tests all configured models to verify API connectivity
// ============================================================================

export interface ModelTestResult {
  model: string;
  status: 'connected' | 'error' | 'not_configured';
  message: string;
  responseTime?: number;
  apiSource: 'replit_integration' | 'imagen_api_key';
}

export async function testAllModelConnections(): Promise<ModelTestResult[]> {
  const results: ModelTestResult[] = [];
  
  // Test 1: gemini-2.5-flash (Replit integration - text analysis)
  console.log('[Model Test] Testing gemini-2.5-flash...');
  try {
    const startTime = Date.now();
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say "test" in one word'
    });
    const responseTime = Date.now() - startTime;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    results.push({
      model: 'gemini-2.5-flash',
      status: 'connected',
      message: `Response: "${text.substring(0, 50)}..."`,
      responseTime,
      apiSource: 'replit_integration'
    });
  } catch (error: any) {
    results.push({
      model: 'gemini-2.5-flash',
      status: 'error',
      message: error.message || 'Unknown error',
      apiSource: 'replit_integration'
    });
  }
  
  // Test 2: gemini-2.5-flash-image (Replit integration - draft generation)
  console.log('[Model Test] Testing gemini-2.5-flash-image...');
  try {
    const startTime = Date.now();
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A simple red circle on white background',
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      }
    });
    const responseTime = Date.now() - startTime;
    const parts = response.candidates?.[0]?.content?.parts || [];
    const hasImage = parts.some((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    results.push({
      model: 'gemini-2.5-flash-image',
      status: hasImage ? 'connected' : 'error',
      message: hasImage ? 'Image generated successfully' : 'No image in response',
      responseTime,
      apiSource: 'replit_integration'
    });
  } catch (error: any) {
    results.push({
      model: 'gemini-2.5-flash-image',
      status: 'error',
      message: error.message || 'Unknown error',
      apiSource: 'replit_integration'
    });
  }
  
  // Test 3: imagen-4.0-generate-001 (User's IMAGEN_API_KEY)
  console.log('[Model Test] Testing imagen-4.0-generate-001...');
  if (!isImagenClientAvailable()) {
    results.push({
      model: 'imagen-4.0-generate-001',
      status: 'not_configured',
      message: 'IMAGEN_API_KEY not set',
      apiSource: 'imagen_api_key'
    });
  } else {
    try {
      const startTime = Date.now();
      const ai = getImagenClient();
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: 'A simple blue square on white background',
        config: {
          numberOfImages: 1,
        }
      });
      const responseTime = Date.now() - startTime;
      const hasImage = response.generatedImages && response.generatedImages.length > 0;
      results.push({
        model: 'imagen-4.0-generate-001',
        status: hasImage ? 'connected' : 'error',
        message: hasImage ? 'Image generated successfully' : 'No image in response',
        responseTime,
        apiSource: 'imagen_api_key'
      });
    } catch (error: any) {
      results.push({
        model: 'imagen-4.0-generate-001',
        status: 'error',
        message: error.message || 'Unknown error',
        apiSource: 'imagen_api_key'
      });
    }
  }
  
  // Test 4: gemini-3-pro-image-preview (User's IMAGEN_API_KEY - text fallback)
  console.log('[Model Test] Testing gemini-3-pro-image-preview...');
  if (!isImagenClientAvailable()) {
    results.push({
      model: 'gemini-3-pro-image-preview',
      status: 'not_configured',
      message: 'IMAGEN_API_KEY not set',
      apiSource: 'imagen_api_key'
    });
  } else {
    try {
      const startTime = Date.now();
      const ai = getImagenClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: 'A simple green triangle on white background',
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        }
      });
      const responseTime = Date.now() - startTime;
      const parts = response.candidates?.[0]?.content?.parts || [];
      const hasImage = parts.some((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      results.push({
        model: 'gemini-3-pro-image-preview',
        status: hasImage ? 'connected' : 'error',
        message: hasImage ? 'Image generated successfully' : 'No image in response',
        responseTime,
        apiSource: 'imagen_api_key'
      });
    } catch (error: any) {
      results.push({
        model: 'gemini-3-pro-image-preview',
        status: 'error',
        message: error.message || 'Unknown error',
        apiSource: 'imagen_api_key'
      });
    }
  }
  
  console.log('[Model Test] All tests complete:', results);
  return results;
}