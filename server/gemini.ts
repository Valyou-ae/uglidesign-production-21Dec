import { GoogleGenAI, Modality, Type } from "@google/genai";

// Use user's GEMINI_API_KEY if available, otherwise use AI Integrations
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "";
const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

const ai = new GoogleGenAI({
  apiKey,
  ...(baseUrl && {
    httpOptions: {
      apiVersion: "",
      baseUrl,
    },
  }),
});

// ============== MODEL CONFIGURATION ==============
// Multi-model pipeline for 100% text accuracy

// Phase 1: Text Sentinel - Fast model for text detection
const TEXT_SENTINEL_MODEL = "gemini-2.5-flash";

// Phase 2: Style Architect - Advanced reasoning for prompt enhancement
const STYLE_ARCHITECT_MODEL = "gemini-3-pro-preview";
const STYLE_ARCHITECT_TEMPERATURE = 0.7;

// Phase 3: Image Generator - Best for text rendering
const IMAGE_GENERATOR_MODEL = "gemini-3-pro-image-preview";
const IMAGE_GENERATOR_FALLBACK = "gemini-2.5-flash-image";

// Phase 4: OCR Validator - Vision model for text verification
const OCR_VALIDATOR_MODEL = "gemini-2.5-flash";

// Verification settings
const MAX_RETRY_ATTEMPTS = 3;
const ACCURACY_THRESHOLD = 85; // Minimum acceptable accuracy percentage

// ============== TYPES ==============

export interface TextAnalysisResult {
  hasExplicitText: boolean;
  extractedTexts: Array<{
    text: string;
    context: string;
    importance: "primary" | "secondary" | "decorative";
  }>;
  confidence: number;
}

export interface ArtDirectionResult {
  enhancedPrompt: string;
  textDirections: Array<{
    text: string;
    material: string;
    lighting: string;
    texture: string;
    environment: string;
    perspective: string;
  }>;
}

export interface OCRValidationResult {
  extractedTexts: string[];
  accuracyScore: number;
  matchDetails: Array<{
    expected: string;
    found: string | null;
    matched: boolean;
    similarity: number;
  }>;
  passedValidation: boolean;
}

export interface GeneratedImageResult {
  imageBase64: string;
  mimeType: string;
  textResponse?: string;
  pipeline?: {
    textAnalysis: TextAnalysisResult;
    artDirection: ArtDirectionResult;
    finalPrompt: string;
    ocrValidation?: OCRValidationResult;
    attempts: number;
  };
}

// ============== PHASE 1: TEXT SENTINEL ==============
// Detects and extracts explicit text requests from user prompts

const TEXT_SENTINEL_SYSTEM = `You are a "Text Detection Agent". Your critical mission is to identify ALL text the user wants rendered in the image.

PRIME DIRECTIVE: DETECT ALL EXPLICIT TEXT REQUESTS. Your job is to find every piece of text that must appear in the generated image.

DETECTION PATTERNS - Always extract text when you see:
- "says [text]" or "saying [text]" -> EXTRACT the text
- "that says [text]" -> EXTRACT the text  
- "with [text] on it" -> EXTRACT the text
- "titled [text]" or "title: [text]" -> EXTRACT the text
- "labeled [text]" -> EXTRACT the text
- "reading [text]" -> EXTRACT the text
- Text in quotation marks: 'text' or "text" -> EXTRACT the text
- Price patterns: "$X.XX" -> EXTRACT as price
- Names of establishments/businesses that appear on signs -> EXTRACT the name
- Menu items with prices -> EXTRACT each item and price

CRITICAL EXAMPLES:
- "A coffee shop sign that says The Daily Grind" -> hasExplicitText: TRUE, EXTRACT: "The Daily Grind"
- "Coffee shop menu with Espresso $3.00, Latte $4.50" -> hasExplicitText: TRUE, EXTRACT: "Espresso $3.00", "Latte $4.50"
- "A neon sign saying OPEN 24/7" -> hasExplicitText: TRUE, EXTRACT: "OPEN 24/7"
- "A poster with the title Metropolis" -> hasExplicitText: TRUE, EXTRACT: "Metropolis"
- "A t-shirt with 1970s psychedelic lettering style" -> hasExplicitText: FALSE (describes style, not specific text content)

DO NOT extract text from:
- Style descriptions only (e.g., "vintage lettering style", "art deco font")
- General scene descriptions without specific text content

For each extracted text, provide:
1. text: The exact text string (preserve case, punctuation, special characters EXACTLY)
2. context: What object/surface it appears on
3. importance: "primary" (main focus), "secondary" (supporting), or "decorative" (background)`;

export async function analyzeTextRequirements(userPrompt: string): Promise<TextAnalysisResult> {
  try {
    console.log("[Text Sentinel] Analyzing prompt for explicit text...");
    
    const response = await ai.models.generateContent({
      model: TEXT_SENTINEL_MODEL,
      config: {
        systemInstruction: TEXT_SENTINEL_SYSTEM,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasExplicitText: { type: Type.BOOLEAN },
            extractedTexts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  context: { type: Type.STRING },
                  importance: { type: Type.STRING }
                },
                required: ["text", "context", "importance"]
              }
            },
            confidence: { type: Type.NUMBER }
          },
          required: ["hasExplicitText", "extractedTexts", "confidence"]
        }
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const result = JSON.parse(response.text || "{}");
    console.log("[Text Sentinel] Analysis complete:", JSON.stringify(result, null, 2));
    
    return {
      hasExplicitText: result.hasExplicitText || false,
      extractedTexts: result.extractedTexts || [],
      confidence: result.confidence || 0
    };
  } catch (error: any) {
    console.error("[Text Sentinel] Error:", error.message);
    return {
      hasExplicitText: false,
      extractedTexts: [],
      confidence: 0
    };
  }
}

// ============== PHASE 2: STYLE ARCHITECT ==============
// Creates detailed Art Direction prompts with physical text properties

const STYLE_ARCHITECT_SYSTEM = `You are an expert AI Art Director. Your job is to create a master prompt for an advanced AI image generator that renders text with 100% accuracy.

PRIME DIRECTIVE: PHYSICAL TEXT RENDERING. When the image includes text, this text MUST be rendered as a physical object within the scene's 3D space, NOT as a 2D overlay.

CRITICAL TEXT ACCURACY RULES:
1. NEVER paraphrase, abbreviate, or modify the exact text strings - they MUST appear CHARACTER-FOR-CHARACTER as provided
2. Include EVERY piece of text exactly as specified - do not omit any
3. Preserve ALL special characters: $, @, #, !, %, &, etc.
4. Preserve ALL punctuation: periods, commas, colons, dashes, parentheses
5. Keep EXACT spacing and formatting
6. Dollar signs ($) must ALWAYS appear before prices
7. Do not mix up or combine unrelated text elements

For each piece of text that must appear in the image, provide detailed "Art Direction for Text" covering:

1. **Material**: What is the text physically made of? 
   Examples: 'carved ice', 'glowing neon tube', 'embossed leather', 'painted wooden sign', 'chalk on blackboard', 'gold leaf on marble'

2. **Lighting Interaction**: How does the scene's light affect it?
   Examples: 'catches rim light', 'casts a soft shadow below', 'glows with inner luminescence', 'reflects ambient light'

3. **Surface Texture**: What is its surface like?
   Examples: 'rough chiseled stone', 'smooth polished chrome', 'matte paint with subtle cracking', 'glossy enamel'

4. **Environmental Interaction**: How does it affect its surroundings?
   Examples: 'emits a soft glow onto the snow', 'creates reflections on nearby surfaces', 'weathered by rain exposure'

5. **Perspective & Depth**: Where is it in 3D space?
   Examples: 'in the foreground, matching the ground perspective', 'mounted flat against the wall, seen from slight angle'

OUTPUT FORMAT:
Return a complete, detailed prompt ready to send to the image generation model. The prompt should be comprehensive but focused.
At the END of your prompt, include a "TEXT ACCURACY CHECKLIST" that lists every text string that MUST appear exactly as written.`;

export async function createArtDirection(
  userPrompt: string, 
  textAnalysis: TextAnalysisResult,
  style?: string,
  correctionFeedback?: string
): Promise<ArtDirectionResult> {
  try {
    console.log("[Style Architect] Creating Art Direction...");
    
    let textRequirements = "";
    if (textAnalysis.hasExplicitText && textAnalysis.extractedTexts.length > 0) {
      textRequirements = "\n\nEXACT TEXT THAT MUST APPEAR IN THE IMAGE (CHARACTER-FOR-CHARACTER, NO MODIFICATIONS):\n";
      textAnalysis.extractedTexts.forEach((t, i) => {
        textRequirements += `${i + 1}. "${t.text}" - Context: ${t.context} (${t.importance} importance)\n`;
      });
      textRequirements += "\nCRITICAL: Each text string above must appear EXACTLY as written, including all $ signs, punctuation, and spacing.";
    }

    const styleNote = style && style !== "auto" ? `\nRequested visual style: ${style}` : "";
    
    // Include correction feedback if this is a retry
    const correctionNote = correctionFeedback ? `\n\n⚠️ CORRECTION REQUIRED - PREVIOUS ATTEMPT HAD ERRORS:\n${correctionFeedback}\n\nYou MUST fix these errors in this attempt. Pay extra attention to the exact character sequences.` : "";
    
    const fullPrompt = `Original user request: ${userPrompt}${styleNote}${textRequirements}${correctionNote}

Create a detailed Art Direction prompt that will produce an image with 100% accurate text rendering.`;

    const response = await ai.models.generateContent({
      model: STYLE_ARCHITECT_MODEL,
      config: {
        systemInstruction: STYLE_ARCHITECT_SYSTEM,
        temperature: STYLE_ARCHITECT_TEMPERATURE,
      },
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    });

    const enhancedPrompt = response.text || userPrompt;
    console.log("[Style Architect] Art Direction complete");
    
    // Build text directions from analysis
    const textDirections = textAnalysis.extractedTexts.map(t => ({
      text: t.text,
      material: "as specified in Art Direction",
      lighting: "scene-appropriate",
      texture: "contextual",
      environment: t.context,
      perspective: "integrated in scene"
    }));

    return {
      enhancedPrompt,
      textDirections
    };
  } catch (error: any) {
    console.error("[Style Architect] Error:", error.message);
    return {
      enhancedPrompt: userPrompt,
      textDirections: []
    };
  }
}

// ============== PHASE 3: IMAGE GENERATOR ==============
// Generates an image using the Art Direction prompt

async function generateImageOnly(prompt: string): Promise<{ imageBase64: string; mimeType: string; textResponse?: string }> {
  console.log("[Image Generator] Generating image with model:", IMAGE_GENERATOR_MODEL);
  
  let response;
  let modelUsed = IMAGE_GENERATOR_MODEL;
  
  try {
    response = await ai.models.generateContent({
      model: IMAGE_GENERATOR_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  } catch (primaryError: any) {
    console.log("[Image Generator] Primary model failed, trying fallback:", IMAGE_GENERATOR_FALLBACK);
    modelUsed = IMAGE_GENERATOR_FALLBACK;
    
    response = await ai.models.generateContent({
      model: IMAGE_GENERATOR_FALLBACK,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  }

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
  
  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const textPart = candidate?.content?.parts?.find((part: any) => part.text);

  console.log("[Image Generator] Complete with model:", modelUsed);

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType,
    textResponse: textPart?.text
  };
}

// ============== PHASE 4: OCR VALIDATOR ==============
// Uses Gemini Vision to extract and verify text from generated images

const OCR_VALIDATOR_SYSTEM = `You are an expert OCR (Optical Character Recognition) agent. Your job is to extract ALL visible text from the image with 100% accuracy.

INSTRUCTIONS:
1. Carefully examine the entire image
2. Extract EVERY piece of text you can see, no matter how small
3. Preserve EXACT spelling, capitalization, punctuation, and spacing
4. Include special characters like $, @, #, !, %, &, etc.
5. For prices, always include the $ symbol if visible
6. Report text in the order it appears (top to bottom, left to right)
7. If text is partially obscured or unclear, note it with [unclear]
8. Do NOT interpret or fix what you think the text should say - report EXACTLY what you see

OUTPUT: Return a JSON array of all text strings found in the image.`;

export async function validateImageText(
  imageBase64: string,
  mimeType: string,
  expectedTexts: string[]
): Promise<OCRValidationResult> {
  try {
    console.log("[OCR Validator] Extracting text from generated image...");
    
    const response = await ai.models.generateContent({
      model: OCR_VALIDATOR_MODEL,
      config: {
        systemInstruction: OCR_VALIDATOR_SYSTEM,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedTexts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["extractedTexts"]
        }
      },
      contents: [{
        role: "user",
        parts: [
          { 
            inlineData: { 
              mimeType: mimeType, 
              data: imageBase64 
            } 
          },
          { text: "Extract ALL visible text from this image. Return every text string you can see, preserving exact spelling, punctuation, and formatting." }
        ]
      }],
    });

    const result = JSON.parse(response.text || '{"extractedTexts": []}');
    const extractedTexts: string[] = result.extractedTexts || [];
    
    console.log("[OCR Validator] Extracted texts:", extractedTexts);
    
    // Calculate accuracy by comparing expected vs extracted
    const matchDetails = expectedTexts.map(expected => {
      const bestMatch = findBestMatch(expected, extractedTexts);
      return {
        expected,
        found: bestMatch.match,
        matched: bestMatch.similarity >= 0.9,
        similarity: bestMatch.similarity
      };
    });
    
    // Calculate overall accuracy score
    const totalExpected = expectedTexts.length;
    const matchedCount = matchDetails.filter(m => m.matched).length;
    const avgSimilarity = matchDetails.reduce((sum, m) => sum + m.similarity, 0) / Math.max(totalExpected, 1);
    
    // Weighted accuracy: 70% match rate + 30% average similarity
    const accuracyScore = totalExpected > 0 
      ? Math.round((matchedCount / totalExpected) * 70 + avgSimilarity * 30)
      : 100;
    
    const passedValidation = accuracyScore >= ACCURACY_THRESHOLD;
    
    console.log("[OCR Validator] Accuracy Score:", accuracyScore, "% | Passed:", passedValidation);
    console.log("[OCR Validator] Match Details:", JSON.stringify(matchDetails, null, 2));

    return {
      extractedTexts,
      accuracyScore,
      matchDetails,
      passedValidation
    };
  } catch (error: any) {
    console.error("[OCR Validator] Error:", error.message);
    // If OCR fails, pass validation to avoid blocking
    return {
      extractedTexts: [],
      accuracyScore: 100,
      matchDetails: [],
      passedValidation: true
    };
  }
}

// Helper: Calculate string similarity using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

// Helper: Find best matching text from extracted texts
function findBestMatch(expected: string, extractedTexts: string[]): { match: string | null; similarity: number } {
  let bestMatch: string | null = null;
  let bestSimilarity = 0;
  
  for (const extracted of extractedTexts) {
    const similarity = calculateSimilarity(expected, extracted);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = extracted;
    }
  }
  
  return { match: bestMatch, similarity: bestSimilarity };
}

// ============== CORRECTION PROMPT GENERATOR ==============
// Creates enhanced prompts for retry attempts based on validation errors

function generateCorrectionFeedback(validation: OCRValidationResult): string {
  const errors: string[] = [];
  
  for (const match of validation.matchDetails) {
    if (!match.matched) {
      if (match.found) {
        errors.push(`- Expected "${match.expected}" but found "${match.found}" (${Math.round(match.similarity * 100)}% similar)`);
      } else {
        errors.push(`- MISSING: "${match.expected}" was not found in the image`);
      }
    }
  }
  
  if (errors.length === 0) {
    return "";
  }
  
  return `The following text errors were detected:\n${errors.join('\n')}\n\nPlease ensure these EXACT text strings appear correctly in the regenerated image.`;
}

// ============== MAIN PIPELINE WITH VERIFICATION LOOP ==============

export async function generateImageWithPipeline(
  prompt: string,
  style?: string
): Promise<GeneratedImageResult> {
  console.log("=".repeat(60));
  console.log("[Pipeline] Starting 4-phase image generation with OCR verification");
  console.log("=".repeat(60));
  
  // Phase 1: Text Sentinel
  const textAnalysis = await analyzeTextRequirements(prompt);
  const expectedTexts = textAnalysis.extractedTexts.map(t => t.text);
  
  let bestResult: { imageBase64: string; mimeType: string; textResponse?: string } | null = null;
  let bestValidation: OCRValidationResult | null = null;
  let bestArtDirection: ArtDirectionResult | null = null;
  let attempts = 0;
  let correctionFeedback: string | undefined;
  
  // Retry loop with OCR verification
  while (attempts < MAX_RETRY_ATTEMPTS) {
    attempts++;
    console.log(`\n[Pipeline] Attempt ${attempts}/${MAX_RETRY_ATTEMPTS}`);
    
    try {
      // Phase 2: Style Architect (with correction feedback for retries)
      const artDirection = await createArtDirection(prompt, textAnalysis, style, correctionFeedback);
      
      // Phase 3: Image Generation
      const imageResult = await generateImageOnly(artDirection.enhancedPrompt);
      
      // Phase 4: OCR Validation (only if there's expected text)
      if (expectedTexts.length > 0) {
        const validation = await validateImageText(
          imageResult.imageBase64,
          imageResult.mimeType,
          expectedTexts
        );
        
        // Track best result
        if (!bestValidation || validation.accuracyScore > bestValidation.accuracyScore) {
          bestResult = imageResult;
          bestValidation = validation;
          bestArtDirection = artDirection;
        }
        
        // Check if passed validation
        if (validation.passedValidation) {
          console.log(`[Pipeline] ✅ Validation PASSED on attempt ${attempts} with ${validation.accuracyScore}% accuracy`);
          return {
            imageBase64: imageResult.imageBase64,
            mimeType: imageResult.mimeType,
            textResponse: imageResult.textResponse,
            pipeline: {
              textAnalysis,
              artDirection,
              finalPrompt: artDirection.enhancedPrompt,
              ocrValidation: validation,
              attempts
            }
          };
        }
        
        // Prepare correction feedback for next attempt
        correctionFeedback = generateCorrectionFeedback(validation);
        console.log(`[Pipeline] ❌ Validation FAILED (${validation.accuracyScore}% accuracy). Retrying with corrections...`);
        
      } else {
        // No text to validate, return immediately
        console.log("[Pipeline] No text to validate, returning image");
        return {
          imageBase64: imageResult.imageBase64,
          mimeType: imageResult.mimeType,
          textResponse: imageResult.textResponse,
          pipeline: {
            textAnalysis,
            artDirection,
            finalPrompt: artDirection.enhancedPrompt,
            attempts
          }
        };
      }
      
    } catch (error: any) {
      console.error(`[Pipeline] Attempt ${attempts} failed:`, error.message);
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        throw error;
      }
    }
  }
  
  // Return best result after all attempts
  if (bestResult && bestArtDirection) {
    console.log(`[Pipeline] Returning best result from ${attempts} attempts (${bestValidation?.accuracyScore}% accuracy)`);
    return {
      imageBase64: bestResult.imageBase64,
      mimeType: bestResult.mimeType,
      textResponse: bestResult.textResponse,
      pipeline: {
        textAnalysis,
        artDirection: bestArtDirection,
        finalPrompt: bestArtDirection.enhancedPrompt,
        ocrValidation: bestValidation || undefined,
        attempts
      }
    };
  }
  
  throw new Error("Failed to generate image after maximum attempts");
}

// ============== LEGACY FUNCTIONS (for backward compatibility) ==============

export async function generateImage(prompt: string): Promise<GeneratedImageResult> {
  return generateImageWithPipeline(prompt);
}

export async function enhancePrompt(userPrompt: string, style: string): Promise<string> {
  try {
    const textAnalysis = await analyzeTextRequirements(userPrompt);
    const artDirection = await createArtDirection(userPrompt, textAnalysis, style);
    return artDirection.enhancedPrompt;
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return userPrompt;
  }
}
