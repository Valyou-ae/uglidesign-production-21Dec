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

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

function validateApiKey(): void {
  if (!API_KEY) {
    throw new Error("AI service not configured. Please ensure the Gemini integration is properly set up.");
  }
}

function getAIClient() {
  validateApiKey();
  return new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: BASE_URL ? { baseUrl: BASE_URL, apiVersion: "" } : undefined
  });
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

  let typographicPrompt = '';

  typographicPrompt += `### ⚠️ MANDATORY TEXT RENDERING - HIGHEST PRIORITY ⚠️ ###\n\n`;
  typographicPrompt += `🔴 CRITICAL: The text below MUST be spelled EXACTLY as shown. Each letter matters.\n`;
  typographicPrompt += `🔴 DO NOT substitute, skip, rearrange, or modify ANY letters.\n`;
  typographicPrompt += `🔴 DO NOT invent new words or spellings - use ONLY the exact letters provided.\n`;
  typographicPrompt += `🔴 Verify each word character-by-character before rendering.\n\n`;

  if (extractedTexts.length > 0) {
    extractedTexts.forEach((text, i) => {
      typographicPrompt += `══════════════════════════════════════\n`;
      typographicPrompt += `=== TEXT BLOCK ${i + 1} ===\n`;
      typographicPrompt += `══════════════════════════════════════\n`;
      typographicPrompt += `📝 EXACT TEXT: "${text}"\n`;
      typographicPrompt += `📝 LETTER-BY-LETTER: ${spellOutPhrase(text)}\n\n`;
      
      const words = text.split(/\s+/).filter(w => w.replace(/[^\w]/g, '').length >= 3);
      if (words.length > 0) {
        typographicPrompt += `🔍 VERIFY EACH WORD (with pronunciation guides):\n`;
        words.forEach(word => {
          const cleanWord = word.replace(/[^\w]/g, '');
          if (cleanWord.length >= 3) {
            typographicPrompt += `  ► "${word}" = ${getEnhancedWordVerification(word)}\n`;
          }
        });
      }
      typographicPrompt += `\n`;
    });
    
    const allHallucinations: string[] = [];
    extractedTexts.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (COMMON_AI_HALLUCINATIONS[cleanWord]) {
          allHallucinations.push(...COMMON_AI_HALLUCINATIONS[cleanWord]);
        }
      });
    });
    
    if (allHallucinations.length > 0) {
      typographicPrompt += `\n🚫 BANNED MISSPELLINGS - DO NOT GENERATE THESE:\n`;
      typographicPrompt += allHallucinations.slice(0, 10).map(h => `  ✗ "${h}"`).join('\n');
      typographicPrompt += `\n\n`;
    }
  }

  if (hasMultilingualText) {
    typographicPrompt += `🌍 MULTILINGUAL TEXT REQUIREMENTS:\n`;
    typographicPrompt += `- Detected scripts: ${detectedLanguages.join(', ')}\n`;
    typographicPrompt += `- Render each language in its NATIVE SCRIPT exactly as provided\n`;
    typographicPrompt += `- Do NOT transliterate or substitute characters\n`;
    typographicPrompt += `- Preserve all diacritics, special characters, and script-specific features\n\n`;
  }

  typographicPrompt += `### SCENE DESCRIPTION ###\n`;
  typographicPrompt += userPrompt;

  typographicPrompt += `\n\n### 🔒 FINAL VERIFICATION CHECKLIST ###\n`;
  typographicPrompt += `Before generating, complete this checklist:\n`;
  typographicPrompt += `□ Spell out each word letter-by-letter mentally\n`;
  typographicPrompt += `□ Count the letters in each word - do they match?\n`;
  typographicPrompt += `□ Check for any words from the BANNED MISSPELLINGS list\n`;
  typographicPrompt += `□ Verify no letters are swapped, missing, or added\n`;
  typographicPrompt += `□ Text accuracy is MORE IMPORTANT than visual style\n`;
  typographicPrompt += `\n⚠️ If ANY word looks unfamiliar, refer to the letter-by-letter spelling above.`;

  return typographicPrompt;
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

    const textRenderingInstructions = hasText
      ? buildTextRenderingInstructions(correctedTextInfo.map(t => t.text))
      : '';

    const textInstruction = hasText
      ? `${textRenderingInstructions}

The image MUST include this EXACT text with PERFECT spelling: "${correctedTextInfo[0].text}"
Style: ${correctedTextInfo[0].physicalProperties.material}

SPELLING VERIFICATION:
- Word by word: ${correctedTextInfo[0].text.split(' ').map((w, i) => `${i+1}."${w}"`).join(' ')}
- Render each word EXACTLY as shown above`
      : 'The image must not contain any text, words, letters, or characters.';

    const stylePromptInstruction = selectedStyle !== 'auto'
      ? `Apply the style: ${styleInfo.name}. Keywords: ${styleInfo.keywords}. Guidance: ${styleInfo.guidance}.`
      : detectedArtStyle && ARTISTIC_STYLES[detectedArtStyle]
        ? `Apply detected artistic style: ${ARTISTIC_STYLES[detectedArtStyle].name}. ${artStyleEnhancement}`
        : `Automatically select the most fitting artistic style based on the subject and mood.`;

    // Style Architect: Different behavior for drafts vs final
    // Drafts still get Cinematic DNA but with focus on 3 key components
    // Uses tier-specific settings when provided
    const isDraft = quality === 'draft';
    const maxWords = effectiveMaxWords;
    const thinkingBudget = effectiveThinkingBudget;
    
    const metaPrompt = isDraft 
      ? `
      You are a Style Architect creating a CONCISE prompt for fast draft iteration.
      Thinking budget: ${thinkingBudget} tokens. Word limit: EXACTLY ${maxWords} words or less.

      ### PRIME DIRECTIVES (Always Apply) ###
      1. COMPOSITIONAL LOCK: Preserve the user's exact subject and scene
      2. SPELLING INTEGRITY: Any text must be spelled EXACTLY as specified

      ### FOCUS ON THREE KEY COMPONENTS ###
      1. Lighting: ${lightingRecommendation}
      2. Camera: ${camera.name} with ${lens.name}  
      3. Color: ${colorGrade.name}

      ${hasText ? `### TEXT REQUIREMENT ###\nInclude exact text: "${correctedTextInfo[0]?.text || ''}"` : ''}

      ### USER'S IDEA ###
      "${userPrompt}"

      ### CONSTRAINTS ###
      - MUST be under ${maxWords} words (count carefully!)
      - Focus on Lighting, Camera, Color only
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

      ${CINEMATIC_DNA}

      ### CINEMATIC DNA ENHANCEMENT ###
      ${cinematicDNA}

      ### TECHNICAL RECOMMENDATIONS ###
      - Lighting: ${lightingRecommendation}
      - Color Grade: ${colorGrade.name} (${colorGrade.keywords.join(', ')})
      - Camera: ${camera.name} with ${lens.name}

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
      3. Applies ALL Cinematic DNA components for Hollywood-quality output
      4. Uses the recommended lighting, color grade, and camera specs
      5. Uses specific, technical cinematography terminology
      6. Follows Prime Directives strictly
      7. If text required, spell out each word letter-by-letter

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
      return generateWithGeminiImageModel(ai, prompt, aspectRatio, negativePrompt, numberOfVariations, draftModel);
    }

    console.log(`[generateImage] Final mode - trying Imagen 4 first (hasText: ${hasText}, tier: ${tier})`);
    
    // Tier-aware retry logic for Imagen 4
    let lastError: any = null;
    let delay = tierConfig.imagenRetryDelay;
    
    for (let attempt = 0; attempt < tierConfig.imagenRetries; attempt++) {
      try {
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
      } catch (imagenError: any) {
        lastError = imagenError;
        const errorMessage = imagenError.message || imagenError.toString();
        const isRetryable = errorMessage.includes('429') || 
                           errorMessage.includes('RESOURCE_EXHAUSTED') ||
                           errorMessage.includes('rate limit') ||
                           errorMessage.includes('quota');
        
        if (!isRetryable || attempt === tierConfig.imagenRetries - 1) {
          console.warn(`[generateImage] Imagen 4 failed (attempt ${attempt + 1}/${tierConfig.imagenRetries}): ${errorMessage}`);
          if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("API key expired")) {
            throw imagenError;
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
    console.log(`[generateImage] Using tier-specific fallback: ${fallbackModel} (tier: ${tier})`);
    return generateWithGeminiImageModel(ai, prompt, aspectRatio, negativePrompt, numberOfVariations, fallbackModel);
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
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
  
  console.log(`[Smart Generation] Text Priority Analysis:`, {
    isTextPriority: textPriorityAnalysis.isTextPriority,
    confidence: textPriorityAnalysis.confidence,
    hasMultilingual: textPriorityAnalysis.hasMultilingualText,
    languages: textPriorityAnalysis.detectedLanguages,
    extractedTexts: textPriorityAnalysis.extractedTexts.length
  });

  const result = await performInitialAnalysis(userPrompt, true);
  const analysis = result.analysis;
  const textInfo = result.textInfo;
  const hasText = textInfo.length > 0 || textPriorityAnalysis.isTextPriority;
  
  let enhancedPrompt: string;
  let mode: 'cinematic' | 'typographic';

  if (hasText) {
    mode = 'typographic';
    console.log(`[Smart Generation] Using TYPOGRAPHIC mode - text-focused prompt optimization`);
    enhancedPrompt = buildTypographicPrompt(userPrompt, textPriorityAnalysis);
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
  if (quality === 'draft') {
    if (hasText) {
      const draftTextModel = 'gemini-2.5-flash-image';
      console.log(`[Smart Generation] Draft mode WITH TEXT - using ${draftTextModel}`);
      images = await generateWithGeminiImageModel(ai, enhancedPrompt, aspectRatio, negativePrompt, numVariations, draftTextModel);
      modelUsed = draftTextModel;
    } else {
      const draftModel = 'gemini-2.5-flash-image';
      console.log(`[Smart Generation] Draft mode (no text) - using ${draftModel} for speed`);
      images = await generateWithGeminiImageModel(ai, enhancedPrompt, aspectRatio, negativePrompt, numVariations, draftModel);
      modelUsed = draftModel;
    }
  } else {
    // Final mode with tier-aware retry logic
    console.log(`[Smart Generation] Final mode - Imagen 4 PRIMARY (tier: ${tierEvaluation.recommendedTier}, retries: ${tierConfig.imagenRetries})`);
    
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

    // Tier-aware fallback model selection
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