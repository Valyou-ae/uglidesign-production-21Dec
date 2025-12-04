import { GoogleGenAI } from "@google/genai";

// Primary key is IMAGEN_API_KEY (user's dedicated key for Imagen 4)
// Fallback keys are the old GOOGLE_AI_API_KEY secrets
const PRIMARY_API_KEY = process.env.IMAGEN_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const FALLBACK_API_KEY = process.env.GOOGLE_AI_API_KEY_FALLBACK || '';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 1000
): Promise<T> {
  let delay = initialDelay;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMessage = error.message || error.toString();
      const isRetryable = 
        errorMessage.includes('429') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('quota');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      console.log(`[Imagen] Rate limited, retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
      delay = Math.min(delay * 2, 32000);
    }
  }
  
  throw new Error('Max retries exceeded');
}

export type ImagenModel = 'imagen-4.0-generate-001' | 'imagen-4.0-fast-generate-001' | 'imagen-3.0-generate-002';

export interface ImagenModelInfo {
  id: ImagenModel;
  name: string;
  description: string;
  available: boolean;
  price?: string;
}

const IMAGEN_MODELS: Record<ImagenModel, Omit<ImagenModelInfo, 'available'>> = {
  'imagen-4.0-generate-001': {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4',
    description: 'Best quality & text rendering',
    price: '$0.04/image'
  },
  'imagen-4.0-fast-generate-001': {
    id: 'imagen-4.0-fast-generate-001',
    name: 'Imagen 4 Fast',
    description: '10x faster generation',
    price: '$0.02/image'
  },
  'imagen-3.0-generate-002': {
    id: 'imagen-3.0-generate-002',
    name: 'Imagen 3',
    description: 'Good quality, lower cost',
    price: 'Lower'
  }
};

export const isImagenAvailable = (): boolean => {
  return !!(PRIMARY_API_KEY || FALLBACK_API_KEY);
};

export const getActiveApiKey = (): string => {
  return PRIMARY_API_KEY || FALLBACK_API_KEY;
};

export const hasFallbackKey = (): boolean => {
  return !!FALLBACK_API_KEY;
};

const getImagenClient = (useFallback: boolean = false) => {
  const apiKey = useFallback ? FALLBACK_API_KEY : (PRIMARY_API_KEY || FALLBACK_API_KEY);
  
  if (!apiKey) {
    throw new Error("No Google AI API key configured. Please add GOOGLE_AI_API_KEY to use Imagen.");
  }
  
  return new GoogleGenAI({
    apiKey: apiKey,
  });
};

export interface ImagenOptions {
  model?: ImagenModel;
  aspectRatio?: string;
  numberOfImages?: number;
  negativePrompt?: string;
}

export interface ImagenStatusResult {
  available: boolean;
  hasPrimaryKey: boolean;
  hasFallbackKey: boolean;
  models: ImagenModelInfo[];
  recommendedModel: ImagenModel;
}

export const checkImagenStatus = async (): Promise<ImagenStatusResult> => {
  const hasPrimary = !!PRIMARY_API_KEY;
  const hasFallback = !!FALLBACK_API_KEY;
  const available = hasPrimary || hasFallback;

  const models: ImagenModelInfo[] = Object.values(IMAGEN_MODELS).map(model => ({
    ...model,
    available: available
  }));

  return {
    available,
    hasPrimaryKey: hasPrimary,
    hasFallbackKey: hasFallback,
    models,
    recommendedModel: 'imagen-4.0-generate-001'
  };
};

export const generateWithImagen = async (
  prompt: string,
  options: ImagenOptions = {}
): Promise<{ base64: string; mimeType: string; model: string }[]> => {
  const {
    model = 'imagen-4.0-generate-001',
    aspectRatio = "1:1",
    numberOfImages = 1,
    negativePrompt,
  } = options;

  console.log(`[Imagen] Generating with model: ${model}`);
  console.log("[Imagen] Prompt:", prompt.substring(0, 100) + "...");
  console.log("[Imagen] Options:", { aspectRatio, numberOfImages });

  const tryGenerate = async (useFallback: boolean): Promise<{ base64: string; mimeType: string; model: string }[]> => {
    const ai = getImagenClient(useFallback);
    
    // Use exponential backoff with 5 retries for rate limit errors
    const response = await withExponentialBackoff(async () => {
      return await ai.models.generateImages({
        model: model,
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
          ...(negativePrompt && { negativePrompt }),
        }
      });
    }, 5, 1000);

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error(`${IMAGEN_MODELS[model].name} did not return any images`);
    }

    const results: { base64: string; mimeType: string; model: string }[] = [];
    
    for (const generatedImage of response.generatedImages) {
      if (generatedImage.image?.imageBytes) {
        const base64 = generatedImage.image.imageBytes as string;
        results.push({
          base64,
          mimeType: 'image/png',
          model: model
        });
      }
    }

    if (results.length === 0) {
      throw new Error(`Failed to extract image data from ${IMAGEN_MODELS[model].name} response`);
    }

    console.log(`[Imagen] Successfully generated ${results.length} image(s) with ${model}`);
    return results;
  };

  try {
    return await tryGenerate(false);
  } catch (error: any) {
    console.error("[Imagen] Primary key error:", error.message);
    
    if (FALLBACK_API_KEY && PRIMARY_API_KEY) {
      console.log("[Imagen] Attempting with fallback API key...");
      try {
        return await tryGenerate(true);
      } catch (fallbackError: any) {
        console.error("[Imagen] Fallback key also failed:", fallbackError.message);
        throw formatImagenError(fallbackError, model);
      }
    }
    
    throw formatImagenError(error, model);
  }
};

const formatImagenError = (error: any, model: ImagenModel): Error => {
  const modelName = IMAGEN_MODELS[model]?.name || model;
  
  if (error.message?.includes('API key') || error.message?.includes('401')) {
    return new Error(`Invalid Google AI API key. Please check your API key.`);
  }
  if (error.message?.includes('quota') || error.message?.includes('429')) {
    return new Error(`${modelName} rate limit reached. Please try again in a few moments.`);
  }
  if (error.message?.includes('not found') || error.message?.includes('404')) {
    return new Error(`${modelName} model not available. Your API key may not have access to this model. Try Imagen 3 instead.`);
  }
  if (error.message?.includes('permission') || error.message?.includes('403')) {
    return new Error(`No permission to use ${modelName}. Try a different model or check your API key permissions.`);
  }
  
  return new Error(`${modelName} generation failed: ${error.message || 'Unknown error'}`);
};

export const generateWithImagen3 = async (
  prompt: string,
  options: Omit<ImagenOptions, 'model'> = {}
): Promise<{ base64: string; mimeType: string }[]> => {
  const results = await generateWithImagen(prompt, { ...options, model: 'imagen-3.0-generate-002' });
  return results.map(({ base64, mimeType }) => ({ base64, mimeType }));
};

export const generateWithImagen4 = async (
  prompt: string,
  options: Omit<ImagenOptions, 'model'> = {}
): Promise<{ base64: string; mimeType: string; model: string }[]> => {
  return generateWithImagen(prompt, { ...options, model: 'imagen-4.0-generate-001' });
};

export const isImagen3Available = isImagenAvailable;
