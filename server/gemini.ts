import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GeneratedImageResult {
  imageBase64: string;
  mimeType: string;
  textResponse?: string;
}

export async function generateImage(prompt: string): Promise<GeneratedImageResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Gemini");
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("Empty response content");
    }

    let imageBase64 = "";
    let mimeType = "image/png";
    let textResponse = "";

    for (const part of content.parts) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData && part.inlineData.data) {
        imageBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
      }
    }

    if (!imageBase64) {
      throw new Error("No image generated");
    }

    return {
      imageBase64,
      mimeType,
      textResponse,
    };
  } catch (error: any) {
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

export async function enhancePrompt(userPrompt: string, style: string): Promise<string> {
  try {
    const systemPrompt = `You are an expert at crafting prompts for AI image generation. 
Take the user's simple prompt and enhance it with more descriptive details, artistic direction, and style elements.
The style requested is: ${style}
Keep the enhanced prompt under 200 words. Return only the enhanced prompt, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: userPrompt,
    });

    return response.text || userPrompt;
  } catch (error) {
    return userPrompt;
  }
}
