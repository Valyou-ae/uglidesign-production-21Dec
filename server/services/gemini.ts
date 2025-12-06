import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const MODELS = {
  FAST_ANALYSIS: "gemini-2.5-flash",
  DEEP_ANALYSIS: "gemini-2.5-pro",
  IMAGE_GENERATION: "gemini-2.0-flash-preview-image-generation",
} as const;

export interface PromptAnalysis {
  subject: string;
  mood: string;
  lighting: string;
  environment: string;
  styleIntent: string;
  hasTextRequest: boolean;
  textInfo: {
    text: string;
    material: string;
    placement: string;
    lighting: string;
  } | null;
}

export interface GeneratedImageResult {
  imageData: string;
  mimeType: string;
  text?: string;
}

export async function analyzePrompt(prompt: string): Promise<PromptAnalysis> {
  const systemPrompt = `You are an expert Art Director's Assistant. Analyze the user's image generation prompt and extract key creative elements.

Tasks:
1. Detect if the user explicitly wants text rendered in the image (look for quotes, "add text", "write", etc.)
2. If text is requested, create a detailed art direction brief for how it should appear
3. Perform deep analysis of the creative intent

Respond with JSON in this exact format:
{
  "subject": "main subject category (person, animal, landscape, object, abstract)",
  "mood": "emotional tone (playful, dramatic, serene, mysterious, etc.)",
  "lighting": "lighting style (natural daylight, studio, neon, golden hour, etc.)",
  "environment": "setting (indoor, outdoor, urban, nature, studio, etc.)",
  "styleIntent": "visual style (photorealistic, illustrated, painterly, etc.)",
  "hasTextRequest": true or false,
  "textInfo": null or {
    "text": "the exact text to render",
    "material": "physical material appearance (metallic, neon, carved, etc.)",
    "placement": "where in the image",
    "lighting": "how light interacts with the text"
  }
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as PromptAnalysis;
    }

    return {
      subject: "general",
      mood: "neutral",
      lighting: "natural",
      environment: "unspecified",
      styleIntent: "photorealistic",
      hasTextRequest: false,
      textInfo: null,
    };
  } catch (error) {
    console.error("Prompt analysis failed:", error);
    return {
      subject: "general",
      mood: "neutral",
      lighting: "natural",
      environment: "unspecified",
      styleIntent: "photorealistic",
      hasTextRequest: false,
      textInfo: null,
    };
  }
}

export async function enhancePrompt(
  originalPrompt: string,
  analysis: PromptAnalysis,
  mode: "draft" | "final",
  stylePreset: string,
  qualityLevel: string
): Promise<{ enhancedPrompt: string; negativePrompts: string[] }> {
  const modeInstructions = mode === "draft"
    ? `Create a concise but effective prompt focusing on three key Cinematic DNA components:
       - Lighting: Key light direction, fill ratio, color temperature
       - Camera: Lens choice, depth of field, perspective
       - Color: Palette mood, contrast level`
    : `Create a comprehensive master prompt using full Cinematic DNA:
       - Lighting: Complete lighting setup with key, fill, rim, practical lights
       - Camera: Specific lens (24mm, 50mm, 85mm, etc.), aperture, shot type
       - Color: Full color grading approach, LUT reference, palette
       - Texture: Surface details, material rendering, atmospheric elements
       - Composition: Rule of thirds, leading lines, framing elements`;

  const systemPrompt = `You are the Style Architect, a master prompt engineer for AI image generation.

${modeInstructions}

Style Preset: ${stylePreset}
Quality Level: ${qualityLevel}

Analysis Context:
- Subject: ${analysis.subject}
- Mood: ${analysis.mood}
- Lighting: ${analysis.lighting}
- Environment: ${analysis.environment}
- Style Intent: ${analysis.styleIntent}

${analysis.hasTextRequest && analysis.textInfo
  ? `TEXT REQUIREMENT (CRITICAL): The image MUST include the text "${analysis.textInfo.text}" with ${analysis.textInfo.material} appearance, placed ${analysis.textInfo.placement}, with ${analysis.textInfo.lighting} lighting.`
  : `TEXT PROHIBITION: The image must NOT contain any text, words, letters, or typography.`}

Respond with JSON:
{
  "enhancedPrompt": "your enhanced prompt here",
  "negativePrompts": ["list", "of", "things", "to", "avoid"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: originalPrompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson);
      
      const baseNegatives = [
        "blurry",
        "low quality",
        "distorted",
        "deformed",
        "watermark",
        "signature",
      ];

      if (!analysis.hasTextRequest) {
        baseNegatives.push("text", "words", "letters", "typography", "writing");
      }

      if (analysis.subject === "animal" || analysis.subject === "person") {
        baseNegatives.push(
          "extra limbs",
          "missing limbs",
          "bad anatomy",
          "mutated"
        );
      }

      return {
        enhancedPrompt: result.enhancedPrompt,
        negativePrompts: [...baseNegatives, ...(result.negativePrompts || [])],
      };
    }

    return {
      enhancedPrompt: originalPrompt,
      negativePrompts: ["blurry", "low quality", "distorted"],
    };
  } catch (error) {
    console.error("Prompt enhancement failed:", error);
    return {
      enhancedPrompt: originalPrompt,
      negativePrompts: ["blurry", "low quality", "distorted"],
    };
  }
}

export async function generateImage(
  prompt: string,
  negativePrompts: string[]
): Promise<GeneratedImageResult | null> {
  try {
    const fullPrompt = negativePrompts.length > 0
      ? `${prompt}\n\nAvoid: ${negativePrompts.join(", ")}`
      : prompt;

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE_GENERATION,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return null;
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return null;
    }

    let imageData = "";
    let mimeType = "image/png";
    let textResponse = "";

    for (const part of content.parts) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData && part.inlineData.data) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
      }
    }

    if (imageData) {
      return {
        imageData,
        mimeType,
        text: textResponse || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

export async function scoreImage(
  imageBase64: string,
  originalPrompt: string
): Promise<{ composition: number; detail: number; lighting: number; overall: number }> {
  try {
    const systemPrompt = `You are an expert image quality analyst. Score this generated image on a scale of 1-10 for:
- Composition: Balance, framing, visual flow
- Detail: Sharpness, texture quality, fine details
- Lighting: Light quality, shadows, highlights, mood

Respond with JSON:
{
  "composition": number,
  "detail": number,
  "lighting": number,
  "overall": number
}`;

    const response = await ai.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/png",
          },
        },
        `Original prompt: "${originalPrompt}"\n\nScore this image's quality.`,
      ],
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    }

    return { composition: 7, detail: 7, lighting: 7, overall: 7 };
  } catch (error) {
    console.error("Image scoring failed:", error);
    return { composition: 7, detail: 7, lighting: 7, overall: 7 };
  }
}

export async function generateMultipleImages(
  prompt: string,
  negativePrompts: string[],
  count: number,
  onProgress?: (index: number, result: GeneratedImageResult | null) => void
): Promise<(GeneratedImageResult | null)[]> {
  const results: (GeneratedImageResult | null)[] = [];
  
  const promises = Array.from({ length: count }, async (_, index) => {
    const result = await generateImage(prompt, negativePrompts);
    results[index] = result;
    if (onProgress) {
      onProgress(index, result);
    }
    return result;
  });

  await Promise.all(promises);
  return results;
}
