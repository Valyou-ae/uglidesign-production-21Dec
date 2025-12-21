/**
 * HYBRID BACKGROUND REMOVAL SERVICE
 * Uses Replicate's bria/remove-background for transparent backgrounds
 * Uses Gemini for creative background replacements (white, color, blur)
 */

import { GoogleGenAI, Modality } from "@google/genai";
import Replicate from "replicate";
import sharp from "sharp";
import type {
  BackgroundRemovalOptions,
  BackgroundRemovalResult,
  BackgroundRemovalJob,
  BackgroundOutputType,
  BackgroundRemovalQuality,
  BackgroundRemovalJobStatus
} from "@shared/mockupTypes";
import { logger } from "../logger";

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || ""
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || ""
});

const MODELS = {
  IMAGE_GENERATION: "gemini-3-pro-image-preview",
  BACKGROUND_REMOVAL: "bria/remove-background",
} as const;

const GENERATION_CONFIG = {
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 10000,
  JOB_TIMEOUT_MS: 120000,
};

const QUALITY_SETTINGS: Record<BackgroundRemovalQuality, { detail: string; precision: string }> = {
  standard: {
    detail: "good",
    precision: "balanced speed and quality"
  },
  high: {
    detail: "excellent",
    precision: "high precision edge detection with careful attention to fine details"
  },
  ultra: {
    detail: "exceptional",
    precision: "ultra-precise sub-pixel edge detection with perfect preservation of semi-transparent edges, individual hair strands, and micro-details"
  }
};

async function applyChromaKey(
  imageBase64: string,
  chromaColor: { r: number; g: number; b: number } = { r: 255, g: 0, b: 255 },
  tolerance: number = 60
): Promise<string> {
  logger.info(`applyChromaKey: Removing color RGB(${chromaColor.r},${chromaColor.g},${chromaColor.b}) with tolerance ${tolerance}`, { source: "backgroundRemover" });
  
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  
  const width = meta.width!;
  const height = meta.height!;
  
  const rawData = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer();
  
  const resultPixels = new Uint8Array(rawData.length);
  let transparentCount = 0;
  let semiTransparentCount = 0;
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = rawData[idx];
    const g = rawData[idx + 1];
    const b = rawData[idx + 2];
    
    const dr = Math.abs(r - chromaColor.r);
    const dg = Math.abs(g - chromaColor.g);
    const db = Math.abs(b - chromaColor.b);
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    
    resultPixels[idx] = r;
    resultPixels[idx + 1] = g;
    resultPixels[idx + 2] = b;
    
    if (distance < tolerance * 0.5) {
      resultPixels[idx + 3] = 0;
      transparentCount++;
    } else if (distance < tolerance) {
      const alpha = Math.round(255 * (distance - tolerance * 0.5) / (tolerance * 0.5));
      resultPixels[idx + 3] = alpha;
      semiTransparentCount++;
    } else {
      resultPixels[idx + 3] = 255;
    }
  }
  
  logger.info(`applyChromaKey: ${transparentCount} fully transparent, ${semiTransparentCount} semi-transparent, out of ${width * height} pixels`, { source: "backgroundRemover" });
  
  if (transparentCount < (width * height) * 0.05) {
    logger.warn('applyChromaKey: Warning - less than 5% pixels made transparent, chroma key may have failed', { source: "backgroundRemover" });
  }
  
  const result = await sharp(resultPixels, {
    raw: { width, height, channels: 4 }
  })
    .png()
    .toBuffer();
  
  return result.toString('base64');
}

function buildMagentaBackgroundPrompt(
  options: BackgroundRemovalOptions
): { prompt: string; negativePrompts: string[] } {
  const qualitySetting = QUALITY_SETTINGS[options.quality];
  
  const masterPrompt = `PROFESSIONAL BACKGROUND REPLACEMENT TASK

Replace the entire background with pure MAGENTA color (#FF00FF / RGB 255,0,255).

REQUIREMENTS:
1. KEEP the main subject (person, object, product) exactly as it appears - preserve ALL details, colors, textures
2. REMOVE the entire background completely
3. REPLACE background with solid, uniform MAGENTA (#FF00FF)

SUBJECT PRESERVATION (${qualitySetting.detail} quality):
- Preserve every detail of the subject with ${qualitySetting.precision}
- Keep original colors, lighting, and textures of the subject
- Maintain fine details: hair strands, fur, eyelashes, jewelry, fabric texture
- Preserve semi-transparent elements: glass, sheer fabric, shadows on subject

BACKGROUND REPLACEMENT:
- Fill ALL background areas with solid magenta #FF00FF
- No gradients - pure flat magenta color
- Extend magenta into fine gaps (between hair strands, fingers, etc.)
- Ensure magenta reaches right up to the subject edges

EDGE QUALITY:
- Clean, precise edges around the subject
- Natural anti-aliasing at boundaries
- Preserve the natural edge appearance of hair/fur

OUTPUT: The original subject on a solid magenta (#FF00FF) background.`;

  const negativePrompts = [
    "changing subject colors",
    "altering subject appearance",
    "gradient backgrounds",
    "keeping original background",
    "magenta tint on subject",
    "blurry edges",
    "artifacts"
  ];

  return { prompt: masterPrompt, negativePrompts };
}

function buildBackgroundReplacementPrompt(
  options: BackgroundRemovalOptions
): { prompt: string; negativePrompts: string[] } {
  const qualitySetting = QUALITY_SETTINGS[options.quality];
  const featheringDesc = options.edgeFeathering === 0 
    ? "sharp, crisp edges with no feathering"
    : options.edgeFeathering <= 3
    ? `subtle ${options.edgeFeathering}px edge feathering for natural transitions`
    : options.edgeFeathering <= 6
    ? `moderate ${options.edgeFeathering}px edge feathering for smooth, professional blending`
    : `pronounced ${options.edgeFeathering}px edge feathering for soft, dreamy transitions`;

  let outputSpecificPrompt = "";
  let technicalRequirements = "";

  switch (options.outputType) {
    case 'white':
      outputSpecificPrompt = `Remove the background completely and replace with pure white (#FFFFFF).
      
OUTPUT REQUIREMENTS:
- Output format: High-quality image
- Background: Pure white (#FFFFFF, RGB 255,255,255)
- Subject: Fully preserved with original colors and details
- Edge handling: ${featheringDesc}
- Professional e-commerce quality with clean, uniform white background`;
      technicalRequirements = `
WHITE BACKGROUND TECHNICAL SPECS:
- Background color: Exact #FFFFFF with no color variation
- No shadows on background (unless specifically requested)
- Subject edges blend naturally with white
- Suitable for product photography and e-commerce listings
- Color-accurate subject preservation`;
      break;

    case 'color':
      const customColor = options.customColor || '#FFFFFF';
      outputSpecificPrompt = `Remove the background completely and replace with solid color ${customColor}.
      
OUTPUT REQUIREMENTS:
- Output format: High-quality image
- Background: Solid ${customColor} color, uniform throughout
- Subject: Fully preserved with original colors and details
- Edge handling: ${featheringDesc}
- Clean, professional result suitable for branding and marketing`;
      technicalRequirements = `
CUSTOM COLOR BACKGROUND TECHNICAL SPECS:
- Background color: Exact ${customColor} with no gradients or variations
- Uniform color coverage across entire background
- Subject edges blend naturally with the new background color
- Maintain subject color accuracy (no color contamination from background)
- Consider complementary color harmony`;
      break;

    case 'blur':
      outputSpecificPrompt = `Keep the main subject in sharp focus while applying a professional gaussian blur to the background.
      
OUTPUT REQUIREMENTS:
- Output format: High-quality image
- Background: Strong gaussian blur (bokeh-like depth of field effect)
- Subject: Crystal clear, sharp focus with original details preserved
- Edge handling: ${featheringDesc} - critical for natural blur transition
- Creates professional depth-of-field photography effect`;
      technicalRequirements = `
BLUR BACKGROUND TECHNICAL SPECS:
- Subject focus: 100% sharp with no blur contamination
- Background blur: Strong gaussian blur simulating f/1.4-f/2.8 depth of field
- Blur intensity: Professional portrait-quality bokeh
- Edge transition: Gradual blur transition at subject edges for realism
- Preserve any highlights in background as soft bokeh circles
- Maintain original background colors (just blurred)`;
      break;

    default:
      outputSpecificPrompt = `Remove the background completely and replace with pure white (#FFFFFF).`;
      technicalRequirements = `Background color: Exact #FFFFFF`;
  }

  const masterPrompt = `You are a professional image editor specializing in background removal and replacement. Process this image with ${qualitySetting.detail} detail and ${qualitySetting.precision}.

===== TASK: BACKGROUND REMOVAL/REPLACEMENT =====

${outputSpecificPrompt}

===== EDGE DETECTION & PRESERVATION =====

CRITICAL - Preserve these fine details with pixel-perfect accuracy:
1. HAIR & FUR: Individual strands, wisps, flyaways, and fine textures
2. FABRIC EDGES: Thread details, frayed edges, and textile boundaries  
3. SEMI-TRANSPARENT ELEMENTS: Glass, smoke, water spray, sheer fabrics
4. COMPLEX BOUNDARIES: Fingers, leaves, intricate patterns, jewelry
5. MICRO-DETAILS: Eyelashes, whiskers, delicate accessories

EDGE QUALITY REQUIREMENTS:
- No harsh cutout artifacts or jaggy edges
- Natural anti-aliasing on all subject boundaries
- Preserve color fringing at edges (natural light diffraction)
- ${featheringDesc}

${technicalRequirements}

===== SUBJECT PRESERVATION =====

MUST PRESERVE EXACTLY:
- Original subject colors, brightness, and contrast
- All textures and surface details
- Lighting and shadows ON the subject
- Reflections and highlights on the subject
- Natural skin tones (if applicable)
- Product details (if applicable)

===== QUALITY ASSURANCE =====

VERIFICATION CHECKLIST:
✓ Subject completely intact with no missing parts
✓ No background remnants or "halo" artifacts around edges
✓ Smooth, natural-looking edge transitions
✓ Consistent quality across all edges of the subject
✓ Professional-grade output suitable for commercial use`;

  const negativePrompts = [
    "halo artifacts",
    "jagged edges",
    "color bleeding",
    "incomplete removal",
    "missing subject parts",
    "blurry subject",
    "loss of detail",
    "harsh cutout edges",
    "background remnants",
    "color fringing artifacts",
    "pixelated edges",
    "unnatural transitions"
  ];

  return { prompt: masterPrompt, negativePrompts };
}

async function removeBackgroundWithReplicate(
  imageBase64: string
): Promise<string> {
  logger.info('removeBackgroundWithReplicate: Starting Replicate background removal...', { source: "backgroundRemover" });
  
  const dataUri = `data:image/png;base64,${imageBase64}`;
  
  const output = await replicate.run(MODELS.BACKGROUND_REMOVAL, {
    input: {
      image: dataUri
    }
  });
  
  if (!output) {
    throw new Error('No output from Replicate background removal');
  }
  
  let resultBuffer: Buffer;
  
  if (output instanceof ReadableStream) {
    const chunks: Uint8Array[] = [];
    const reader = output.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    resultBuffer = Buffer.concat(chunks);
  } else if (typeof output === 'object' && 'url' in output) {
    const response = await fetch((output as { url: () => string }).url());
    const arrayBuffer = await response.arrayBuffer();
    resultBuffer = Buffer.from(arrayBuffer);
  } else if (Buffer.isBuffer(output)) {
    resultBuffer = output;
  } else {
    const response = await fetch(String(output));
    const arrayBuffer = await response.arrayBuffer();
    resultBuffer = Buffer.from(arrayBuffer);
  }
  
  const pngBuffer = await sharp(resultBuffer)
    .png()
    .toBuffer();
  
  logger.info('removeBackgroundWithReplicate: Successfully removed background', { source: "backgroundRemover" });
  return pngBuffer.toString('base64');
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateRetryDelay(attempt: number): number {
  const delay = GENERATION_CONFIG.BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, GENERATION_CONFIG.MAX_RETRY_DELAY_MS);
}

async function generateMagentaBackground(
  imageBase64: string,
  options: BackgroundRemovalOptions
): Promise<string> {
  const { prompt, negativePrompts } = buildMagentaBackgroundPrompt(options);
  const fullPrompt = `${prompt}\n\nAVOID: ${negativePrompts.join(", ")}`;

  logger.info('generateMagentaBackground: Requesting magenta background replacement...', { source: "backgroundRemover" });

  const response = await genAI.models.generateContent({
    model: MODELS.IMAGE_GENERATION,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/png"
            }
          },
          { text: fullPrompt }
        ]
      }
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE]
    }
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No response candidates from AI model');
  }

  const content = candidates[0].content;
  if (!content || !content.parts) {
    throw new Error('No content in AI response');
  }

  for (const part of content.parts) {
    if (part.inlineData && part.inlineData.data) {
      logger.info('generateMagentaBackground: Received magenta background image from AI', { source: "backgroundRemover" });
      return part.inlineData.data;
    }
  }

  throw new Error('No image data in AI response');
}

async function generateBackgroundReplacement(
  imageBase64: string,
  options: BackgroundRemovalOptions
): Promise<string> {
  const { prompt, negativePrompts } = buildBackgroundReplacementPrompt(options);
  const fullPrompt = `${prompt}\n\nAVOID: ${negativePrompts.join(", ")}`;

  logger.info(`generateBackgroundReplacement: Requesting ${options.outputType} background...`, { source: "backgroundRemover" });

  const response = await genAI.models.generateContent({
    model: MODELS.IMAGE_GENERATION,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/png"
            }
          },
          { text: fullPrompt }
        ]
      }
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE]
    }
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No response candidates from AI model');
  }

  const content = candidates[0].content;
  if (!content || !content.parts) {
    throw new Error('No content in AI response');
  }

  for (const part of content.parts) {
    if (part.inlineData && part.inlineData.data) {
      logger.info('generateBackgroundReplacement: Received result from AI', { source: "backgroundRemover" });
      return part.inlineData.data;
    }
  }

  throw new Error('No image data in AI response');
}

export async function removeBackground(
  imageBase64: string,
  options: BackgroundRemovalOptions
): Promise<BackgroundRemovalResult> {
  const startTime = Date.now();

  if (!imageBase64) {
    return {
      success: false,
      mimeType: 'image/png',
      processingTimeMs: Date.now() - startTime,
      outputType: options.outputType,
      quality: options.quality,
      error: 'No image data provided'
    };
  }

  const normalizedOptions: BackgroundRemovalOptions = {
    outputType: options.outputType || 'transparent',
    customColor: options.customColor,
    edgeFeathering: Math.max(0, Math.min(10, options.edgeFeathering || 0)),
    quality: options.quality || 'high'
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < GENERATION_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Background removal timed out')),
          GENERATION_CONFIG.JOB_TIMEOUT_MS
        );
      });

      let resultImageData: string;

      if (normalizedOptions.outputType === 'transparent') {
        logger.info('Using Replicate bria/remove-background for transparent background...', { source: "backgroundRemover" });
        
        const replicatePromise = removeBackgroundWithReplicate(imageBase64);
        resultImageData = await Promise.race([replicatePromise, timeoutPromise]);
      } else {
        logger.info(`Using direct replacement for ${normalizedOptions.outputType} background...`, { source: "backgroundRemover" });
        
        const replacementPromise = generateBackgroundReplacement(imageBase64, normalizedOptions);
        resultImageData = await Promise.race([replacementPromise, timeoutPromise]);
      }

      return {
        success: true,
        imageData: resultImageData,
        mimeType: 'image/png',
        processingTimeMs: Date.now() - startTime,
        outputType: normalizedOptions.outputType,
        quality: normalizedOptions.quality
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Background removal attempt ${attempt + 1}/${GENERATION_CONFIG.MAX_RETRIES} failed`, lastError, { source: "backgroundRemover" });

      if (attempt < GENERATION_CONFIG.MAX_RETRIES - 1) {
        const delay = calculateRetryDelay(attempt);
        logger.info(`Retrying in ${Math.round(delay)}ms...`, { source: "backgroundRemover" });
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    mimeType: 'image/png',
    processingTimeMs: Date.now() - startTime,
    outputType: normalizedOptions.outputType,
    quality: normalizedOptions.quality,
    error: lastError?.message || 'Background removal failed after all retries'
  };
}

export function createBackgroundRemovalJob(
  inputImage: string,
  options: BackgroundRemovalOptions
): BackgroundRemovalJob {
  return {
    id: `bgr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    inputImage,
    options,
    status: 'pending',
    retryCount: 0,
    maxRetries: GENERATION_CONFIG.MAX_RETRIES,
    createdAt: Date.now()
  };
}

export async function processBackgroundRemovalJob(
  job: BackgroundRemovalJob
): Promise<BackgroundRemovalJob> {
  const updatedJob = { ...job };
  updatedJob.status = 'processing';
  updatedJob.startedAt = Date.now();

  try {
    const result = await removeBackground(job.inputImage, job.options);
    
    if (result.success && result.imageData) {
      updatedJob.status = 'completed';
      updatedJob.result = result;
      updatedJob.completedAt = Date.now();
    } else {
      throw new Error(result.error || 'Unknown error during processing');
    }
  } catch (error) {
    updatedJob.retryCount++;
    
    if (updatedJob.retryCount >= updatedJob.maxRetries) {
      updatedJob.status = 'failed';
      updatedJob.error = error instanceof Error ? error.message : String(error);
      updatedJob.completedAt = Date.now();
    } else {
      updatedJob.status = 'pending';
    }
  }

  return updatedJob;
}

export function getJobStatus(job: BackgroundRemovalJob): {
  id: string;
  status: BackgroundRemovalJobStatus;
  progress: number;
  result?: BackgroundRemovalResult;
  error?: string;
} {
  let progress = 0;
  
  switch (job.status) {
    case 'pending':
      progress = 0;
      break;
    case 'processing':
      progress = 50;
      break;
    case 'completed':
      progress = 100;
      break;
    case 'failed':
      progress = 100;
      break;
  }

  return {
    id: job.id,
    status: job.status,
    progress,
    result: job.result,
    error: job.error
  };
}

export function getDefaultBackgroundRemovalOptions(): BackgroundRemovalOptions {
  return {
    outputType: 'transparent',
    edgeFeathering: 2,
    quality: 'high'
  };
}

export function validateBackgroundRemovalOptions(
  options: Partial<BackgroundRemovalOptions>
): BackgroundRemovalOptions {
  const validOutputTypes: BackgroundOutputType[] = ['transparent', 'white', 'color', 'blur'];
  const validQualities: BackgroundRemovalQuality[] = ['standard', 'high', 'ultra'];

  return {
    outputType: validOutputTypes.includes(options.outputType as BackgroundOutputType) 
      ? options.outputType as BackgroundOutputType 
      : 'transparent',
    customColor: options.customColor,
    edgeFeathering: typeof options.edgeFeathering === 'number' 
      ? Math.max(0, Math.min(10, options.edgeFeathering)) 
      : 2,
    quality: validQualities.includes(options.quality as BackgroundRemovalQuality) 
      ? options.quality as BackgroundRemovalQuality 
      : 'high'
  };
}

export type BatchProgressCallback = (
  completed: number,
  total: number,
  progressData: { id: string; result: BackgroundRemovalResult }
) => void;

export async function removeBackgroundBatch(
  images: Array<{ id: string; imageBase64?: string; base64?: string }>,
  options: BackgroundRemovalOptions,
  onProgress?: BatchProgressCallback
): Promise<Array<{ id: string; result: BackgroundRemovalResult }>> {
  const results: Array<{ id: string; result: BackgroundRemovalResult }> = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const imageData = image.imageBase64 || image.base64 || '';
    
    try {
      const result = await removeBackground(imageData, options);
      results.push({ id: image.id, result });
      
      if (onProgress) {
        onProgress(i + 1, images.length, { id: image.id, result });
      }
    } catch (error) {
      const errorResult: BackgroundRemovalResult = {
        success: false,
        mimeType: 'image/png',
        processingTimeMs: 0,
        outputType: options.outputType,
        quality: options.quality,
        error: error instanceof Error ? error.message : String(error)
      };
      
      results.push({ id: image.id, result: errorResult });
      
      if (onProgress) {
        onProgress(i + 1, images.length, { id: image.id, result: errorResult });
      }
    }
  }

  return results;
}
