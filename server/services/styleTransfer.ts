import { GoogleGenAI, Modality } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || ""
});

const MODELS = {
  IMAGE_GENERATION: "gemini-2.0-flash-exp-image-generation",
} as const;

const GENERATION_CONFIG = {
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 10000,
};

export interface StyleTransferOptions {
  styleStrength: number;
  preserveContent: number;
  outputQuality: "standard" | "high" | "ultra";
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  stylePrompt: string;
  category: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "van-gogh",
    name: "Van Gogh",
    description: "Swirling brushstrokes, vibrant colors, post-impressionist style",
    stylePrompt: "in the style of Vincent van Gogh with visible swirling brushstrokes, thick impasto paint texture, vibrant yellows and blues, expressive post-impressionist technique",
    category: "classical"
  },
  {
    id: "monet",
    name: "Claude Monet",
    description: "Soft impressionist style with light and color",
    stylePrompt: "in the style of Claude Monet, soft impressionist brushwork, dappled light effects, pastel colors, atmospheric haze, water lily garden aesthetic",
    category: "classical"
  },
  {
    id: "picasso-cubist",
    name: "Picasso Cubist",
    description: "Geometric shapes, fragmented forms, multiple perspectives",
    stylePrompt: "in the cubist style of Pablo Picasso, geometric fragmentation, multiple simultaneous viewpoints, angular shapes, muted earth tones with blue accents",
    category: "classical"
  },
  {
    id: "hokusai",
    name: "Hokusai",
    description: "Japanese woodblock print style, waves and nature",
    stylePrompt: "in the style of Katsushika Hokusai, Japanese ukiyo-e woodblock print, bold outlines, flat color areas, dynamic wave patterns, traditional indigo and cream colors",
    category: "classical"
  },
  {
    id: "pop-art",
    name: "Pop Art",
    description: "Bold colors, comic book dots, Warhol-inspired",
    stylePrompt: "in Andy Warhol pop art style, bold flat colors, Ben-Day dots pattern, high contrast, celebrity portrait aesthetic, screen print texture",
    category: "modern"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon colors, futuristic, high-tech dystopia",
    stylePrompt: "in cyberpunk aesthetic, neon pink and cyan colors, holographic effects, rain-slicked surfaces, futuristic tech overlays, dystopian atmosphere",
    category: "modern"
  },
  {
    id: "watercolor",
    name: "Watercolor",
    description: "Soft, flowing watercolor painting style",
    stylePrompt: "in traditional watercolor painting style, soft bleeding edges, wet-on-wet technique, transparent color washes, visible paper texture, delicate brushwork",
    category: "traditional"
  },
  {
    id: "oil-painting",
    name: "Oil Painting",
    description: "Rich, classical oil painting with depth",
    stylePrompt: "in classical oil painting style, rich color depth, visible brushstrokes, chiaroscuro lighting, Renaissance master technique, museum quality finish",
    category: "traditional"
  },
  {
    id: "anime",
    name: "Anime",
    description: "Japanese animation style, clean lines, vibrant",
    stylePrompt: "in Japanese anime style, clean cel-shaded coloring, large expressive eyes, dynamic poses, vibrant saturated colors, Studio Ghibli inspired",
    category: "digital"
  },
  {
    id: "3d-render",
    name: "3D Render",
    description: "Photorealistic 3D rendered look",
    stylePrompt: "as a photorealistic 3D render, subsurface scattering, ambient occlusion, ray-traced lighting, smooth plastic/clay material, Pixar-style rendering",
    category: "digital"
  },
  {
    id: "sketch",
    name: "Pencil Sketch",
    description: "Hand-drawn pencil sketch style",
    stylePrompt: "as a detailed pencil sketch, graphite shading, cross-hatching texture, rough paper background, hand-drawn artist quality, fine line work",
    category: "traditional"
  },
  {
    id: "stained-glass",
    name: "Stained Glass",
    description: "Medieval stained glass window style",
    stylePrompt: "in stained glass window style, bold black lead lines, jewel-toned transparent colors, gothic cathedral aesthetic, backlit radiant glow",
    category: "decorative"
  }
];

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = GENERATION_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Style transfer attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        const delayMs = Math.min(
          GENERATION_CONFIG.BASE_RETRY_DELAY_MS * Math.pow(2, attempt),
          GENERATION_CONFIG.MAX_RETRY_DELAY_MS
        );
        console.log(`Retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error("Style transfer failed after retries");
}

function buildStyleTransferPrompt(
  styleDescription: string,
  options: StyleTransferOptions,
  isFromPreset: boolean
): string {
  const strengthDescriptor = options.styleStrength >= 0.8 ? "strongly" : options.styleStrength >= 0.5 ? "moderately" : "subtly";
  const preserveDescriptor = options.preserveContent >= 0.8 ? "maintaining exact original composition and details" : 
                             options.preserveContent >= 0.5 ? "preserving the main subject and composition" : 
                             "allowing creative interpretation of the subject";

  if (isFromPreset) {
    return `Transform this image ${styleDescription}. Apply the artistic style ${strengthDescriptor} while ${preserveDescriptor}. Ensure the output is a high-quality artistic rendering.`;
  }

  return `Analyze the artistic style in the provided reference image and apply that exact style to transform the content image. 
The style characteristics to transfer include: color palette, brushwork/texture, composition approach, lighting treatment, and overall aesthetic.
Apply the style ${strengthDescriptor} while ${preserveDescriptor}.
Create a seamless artistic fusion that honors both the content and the style reference.`;
}

export async function transferStyleFromPreset(
  contentImageBase64: string,
  presetId: string,
  options: StyleTransferOptions
): Promise<{ success: boolean; imageBase64?: string; error?: string }> {
  const preset = STYLE_PRESETS.find(p => p.id === presetId);
  if (!preset) {
    return { success: false, error: `Unknown style preset: ${presetId}` };
  }

  console.log(`Style transfer: Applying preset "${preset.name}" with strength ${options.styleStrength}`);

  try {
    const result = await retryWithBackoff(async () => {
      const prompt = buildStyleTransferPrompt(preset.stylePrompt, options, true);

      const response = await genAI.models.generateContent({
        model: MODELS.IMAGE_GENERATION,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: contentImageBase64
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No response from image generation model");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }

      throw new Error("No image generated in response");
    });

    console.log(`Style transfer: Successfully applied "${preset.name}" style`);
    return { success: true, imageBase64: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Style transfer failed:`, message);
    return { success: false, error: message };
  }
}

export async function transferStyleFromImage(
  contentImageBase64: string,
  styleImageBase64: string,
  options: StyleTransferOptions
): Promise<{ success: boolean; imageBase64?: string; error?: string }> {
  console.log(`Style transfer: Applying custom style with strength ${options.styleStrength}`);

  try {
    const result = await retryWithBackoff(async () => {
      const prompt = buildStyleTransferPrompt("", options, false);

      const response = await genAI.models.generateContent({
        model: MODELS.IMAGE_GENERATION,
        contents: [
          {
            role: "user",
            parts: [
              { text: "Here is the STYLE REFERENCE image (apply the artistic style from this):" },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: styleImageBase64
                }
              },
              { text: "\n\nHere is the CONTENT image (apply the style to this while preserving its subject):" },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: contentImageBase64
                }
              },
              { text: `\n\n${prompt}` }
            ]
          }
        ],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No response from image generation model");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }

      throw new Error("No image generated in response");
    });

    console.log(`Style transfer: Successfully applied custom style`);
    return { success: true, imageBase64: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Style transfer failed:`, message);
    return { success: false, error: message };
  }
}

export function getStylePresets(): StylePreset[] {
  return STYLE_PRESETS;
}

export function getStylePresetsByCategory(): Record<string, StylePreset[]> {
  return STYLE_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, StylePreset[]>);
}
