import { GoogleGenAI, Modality } from "@google/genai";

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || ""
});

export const MODELS = {
  FAST_ANALYSIS: "gemini-2.0-flash",
  DEEP_ANALYSIS: "gemini-2.0-flash",
  IMAGE_GENERATION: "gemini-2.0-flash-exp",
  IMAGE_GENERATION_FAST: "gemini-2.0-flash-exp",
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
  const systemInstruction = `You are an expert Art Director's Assistant. Analyze the user's image generation prompt and extract key creative elements.

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
    const response = await genAI.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        topP: 1,
        topK: 1,
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as PromptAnalysis;
    }

    return getDefaultAnalysis();
  } catch (error) {
    console.error("Prompt analysis failed:", error);
    return getDefaultAnalysis();
  }
}

function getDefaultAnalysis(): PromptAnalysis {
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

export async function enhancePrompt(
  originalPrompt: string,
  analysis: PromptAnalysis,
  mode: "draft" | "final",
  stylePreset: string,
  qualityLevel: string,
  detailLevel: string = "medium"
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

  const detailInstructions = {
    low: "Keep details minimal and clean. Focus on broad shapes and simple compositions. Avoid intricate textures or complex patterns.",
    medium: "Include moderate detail. Balance between visual clarity and interesting textures. Standard level of complexity.",
    high: "Maximize detail and texture. Include intricate patterns, micro-details, surface imperfections, and rich textures throughout the image."
  };

  const systemInstruction = `You are the Style Architect, a master prompt engineer for AI image generation.

${modeInstructions}

Style Preset: ${stylePreset}
Quality Level: ${qualityLevel}
Detail Level: ${detailLevel} - ${detailInstructions[detailLevel as keyof typeof detailInstructions] || detailInstructions.medium}

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
    const response = await genAI.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      contents: [{ role: "user", parts: [{ text: originalPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        topP: 1,
        topK: 1,
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      // Clean the response text - remove markdown code blocks and trim
      let cleanedJson = rawJson.trim();
      // Remove markdown code block markers if present
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.slice(7);
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.slice(3);
      }
      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.slice(0, -3);
      }
      cleanedJson = cleanedJson.trim();
      
      // Try to extract JSON object if wrapped in other text
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedJson = jsonMatch[0];
      }
      
      let result;
      try {
        result = JSON.parse(cleanedJson);
      } catch (parseError) {
        // If JSON parsing fails, return fallback with original prompt
        console.warn("JSON parse failed for enhancePrompt, using original prompt");
        return {
          enhancedPrompt: originalPrompt,
          negativePrompts: ["blurry", "low quality", "distorted", "deformed", "watermark"],
        };
      }
      
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
        enhancedPrompt: result.enhancedPrompt || originalPrompt,
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
  negativePrompts: string[],
  speed: "fast" | "quality" = "quality",
  aspectRatio: string = "1:1"
): Promise<GeneratedImageResult | null> {
  try {
    const aspectRatioMap: Record<string, string> = {
      "1:1": "1:1",
      "16:9": "16:9",
      "9:16": "9:16",
      "4:3": "4:3",
      "3:4": "3:4"
    };
    const validAspectRatio = aspectRatioMap[aspectRatio] || "1:1";
    
    const fullPrompt = negativePrompts.length > 0
      ? `${prompt}\n\nAvoid: ${negativePrompts.join(", ")}`
      : prompt;

    const model = speed === "fast" ? MODELS.IMAGE_GENERATION_FAST : MODELS.IMAGE_GENERATION;

    const response = await genAI.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        aspectRatio: validAspectRatio,
      } as any,
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("No candidates in response");
      return null;
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      console.error("No content parts in response");
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

    console.error("No image data in response parts");
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
    const systemInstruction = `You are an expert image quality analyst. Score this generated image on a scale of 1-10 for:
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

    const response = await genAI.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/png",
              },
            },
            {
              text: `Original prompt: "${originalPrompt}"\n\nScore this image's quality.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        topP: 1,
        topK: 1,
      },
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
  const results: (GeneratedImageResult | null)[] = new Array(count).fill(null);
  
  const promises = Array.from({ length: count }, async (_, index) => {
    try {
      const result = await generateImage(prompt, negativePrompts);
      results[index] = result;
      if (onProgress) {
        onProgress(index, result);
      }
      return result;
    } catch (error) {
      console.error(`Generation ${index} failed:`, error);
      results[index] = null;
      if (onProgress) {
        onProgress(index, null);
      }
      return null;
    }
  });

  await Promise.all(promises);
  return results;
}

export interface DesignAnalysis {
  dominantColors: string[];
  style: string;
  complexity: string;
  suggestedPlacement: string;
  hasTransparency: boolean;
  designType: string;
}

export async function analyzeDesign(imageBase64: string): Promise<DesignAnalysis> {
  const systemInstruction = `You are an expert product design analyst. Analyze this uploaded design image for use on product mockups.

Analyze the following aspects:
1. Dominant colors (list 3-5 main colors as hex codes or color names)
2. Style (minimalist, bold, vintage, modern, artistic, photographic, etc.)
3. Complexity (simple, moderate, complex, highly detailed)
4. Suggested placement (center chest, full front, small logo, all-over print, etc.)
5. Has transparency (true/false - does the image have transparent background)
6. Design type (logo, illustration, photograph, text-based, pattern, graphic)

Respond with JSON:
{
  "dominantColors": ["#color1", "#color2", "#color3"],
  "style": "style description",
  "complexity": "simple|moderate|complex|highly detailed",
  "suggestedPlacement": "placement suggestion",
  "hasTransparency": true or false,
  "designType": "type of design"
}`;

  try {
    const response = await genAI.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/png",
              },
            },
            {
              text: "Analyze this design for product mockup placement.",
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        topP: 1,
        topK: 1,
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as DesignAnalysis;
    }

    return getDefaultDesignAnalysis();
  } catch (error) {
    console.error("Design analysis failed:", error);
    return getDefaultDesignAnalysis();
  }
}

function getDefaultDesignAnalysis(): DesignAnalysis {
  return {
    dominantColors: ["#000000", "#FFFFFF"],
    style: "modern",
    complexity: "moderate",
    suggestedPlacement: "center chest",
    hasTransparency: false,
    designType: "graphic",
  };
}

export interface MockupGenerationParams {
  designBase64: string;
  productType: string;
  productColor: string;
  scene: string;
  angle: string;
  style: string;
}

export async function generateMockupPrompt(
  designAnalysis: DesignAnalysis,
  params: MockupGenerationParams
): Promise<{ prompt: string; negativePrompts: string[] }> {
  const systemInstruction = `You are a professional product photography art director. Create a detailed prompt for generating a photorealistic product mockup.

Design Analysis:
- Colors: ${designAnalysis.dominantColors.join(", ")}
- Style: ${designAnalysis.style}
- Complexity: ${designAnalysis.complexity}
- Design Type: ${designAnalysis.designType}

Product Details:
- Product: ${params.productType}
- Product Color: ${params.productColor}
- Scene/Background: ${params.scene}
- Camera Angle: ${params.angle}
- Mood/Style: ${params.style}

Create a prompt that will generate a professional product photo with the design printed/applied on the product. The prompt should describe:
1. The product with accurate proportions and fabric/material texture
2. The design placement and how it looks on the product
3. Professional studio lighting or scene-appropriate lighting
4. The background/environment matching the scene
5. The camera angle and perspective

Respond with JSON:
{
  "prompt": "detailed prompt for image generation",
  "negativePrompts": ["things to avoid"]
}`;

  try {
    const response = await genAI.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      contents: [{ role: "user", parts: [{ text: `Generate a mockup prompt for a ${params.productType} with a ${designAnalysis.designType} design.` }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        topP: 1,
        topK: 1,
      },
    });

    const rawJson = response.text;
    if (rawJson) {
      // Clean the response text - remove markdown code blocks and trim
      let cleanedJson = rawJson.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.slice(7);
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.slice(3);
      }
      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.slice(0, -3);
      }
      cleanedJson = cleanedJson.trim();
      
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedJson = jsonMatch[0];
      }
      
      try {
        const result = JSON.parse(cleanedJson);
        return {
          prompt: result.prompt || `Professional product photo of a ${params.productColor} ${params.productType} with a ${designAnalysis.designType} design, ${params.scene} background, ${params.angle} view, photorealistic, 8K quality`,
          negativePrompts: result.negativePrompts || ["blurry", "low quality", "distorted", "watermark"],
        };
      } catch (parseError) {
        console.warn("JSON parse failed for mockup prompt, using fallback");
      }
    }

    return {
      prompt: `Professional product photo of a ${params.productColor} ${params.productType} with a custom printed design, ${params.scene} background, ${params.angle} view, photorealistic studio lighting, 8K quality, commercial product photography`,
      negativePrompts: ["blurry", "low quality", "distorted", "watermark", "text", "logo"],
    };
  } catch (error) {
    console.error("Mockup prompt generation failed:", error);
    return {
      prompt: `Professional product photo of a ${params.productColor} ${params.productType} with a custom printed design, ${params.scene} background, ${params.angle} view, photorealistic studio lighting, 8K quality`,
      negativePrompts: ["blurry", "low quality", "distorted", "watermark"],
    };
  }
}

export async function generateMockup(
  designBase64: string,
  prompt: string,
  negativePrompts: string[]
): Promise<GeneratedImageResult | null> {
  try {
    const fullPrompt = negativePrompts.length > 0
      ? `${prompt}\n\nApply the provided design image onto the product accurately. Maintain the design's colors and details.\n\nAvoid: ${negativePrompts.join(", ")}`
      : `${prompt}\n\nApply the provided design image onto the product accurately. Maintain the design's colors and details.`;

    const response = await genAI.models.generateContent({
      model: MODELS.IMAGE_GENERATION,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: designBase64,
                mimeType: "image/png",
              },
            },
            {
              text: fullPrompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("No candidates in mockup response");
      return null;
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      console.error("No content parts in mockup response");
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

    console.error("No image data in mockup response");
    return null;
  } catch (error) {
    console.error("Mockup generation failed:", error);
    return null;
  }
}

/**
 * Generate an AI-enhanced seamless pattern from an input image
 * Uses Gemini's image generation capabilities to create creative seamless patterns
 */
export async function generateAISeamlessPattern(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<GeneratedImageResult | null> {
  const prompt = `Transform this design into a SEAMLESS TILEABLE PATTERN.

CRITICAL REQUIREMENTS:
1. The output MUST tile perfectly - when placed side by side or stacked, edges must match exactly with no visible seams
2. Maintain the artistic style and color palette of the original design
3. Create a visually balanced, repeating pattern that works as an all-over print
4. Ensure elements flow naturally across the tile boundaries
5. The pattern should be suitable for fabric printing (clothing, accessories)

TECHNICAL SPECIFICATIONS:
- Output a square 1024x1024 pixel seamless tile
- Edges must wrap perfectly (left matches right, top matches bottom)
- Maintain consistent color depth and contrast
- Preserve fine details from the original design

Generate a beautiful, creative seamless pattern based on this design:`;

  try {
    const response = await genAI.models.generateContent({
      model: MODELS.IMAGE_GENERATION,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("No candidates in seamless pattern response");
      return null;
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      console.error("No content parts in seamless pattern response");
      return null;
    }

    let imageData = "";
    let resultMimeType = "image/png";
    let textResponse = "";

    for (const part of content.parts) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData && part.inlineData.data) {
        imageData = part.inlineData.data;
        resultMimeType = part.inlineData.mimeType || "image/png";
      }
    }

    if (imageData) {
      return {
        imageData,
        mimeType: resultMimeType,
        text: textResponse || undefined,
      };
    }

    console.error("No image data in seamless pattern response");
    return null;
  } catch (error) {
    console.error("AI seamless pattern generation failed:", error);
    return null;
  }
}
