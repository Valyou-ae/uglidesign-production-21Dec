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
const STYLE_ARCHITECT_MODEL = "gemini-2.5-pro";
const STYLE_ARCHITECT_TEMPERATURE = 0.7;

// Phase 3: Image Generator - Best for text rendering
const IMAGE_GENERATOR_MODEL = "gemini-2.0-flash-exp";
const IMAGE_GENERATOR_FALLBACK = "gemini-2.0-flash-preview-image-generation";
// Escalation model for attempts 4-5 (when primary model keeps failing)
const IMAGE_GENERATOR_ESCALATION = "imagen-3.0-generate-001";

// Phase 4: OCR Validator - Vision model for text verification
const OCR_VALIDATOR_MODEL = "gemini-2.5-flash";

// Verification settings
const MAX_RETRY_ATTEMPTS = 5;
const ACCURACY_THRESHOLD = 100; // ZERO TOLERANCE - exact match required

// ============== NEGATIVE PROMPTS - GUARDRAILS AGAINST TEXT ERRORS ==============
// These explicitly tell the model what to AVOID

function generateNegativePrompts(hasText: boolean): string {
  const baseNegatives = [
    "low quality",
    "blurry",
    "distorted",
    "poorly composed"
  ];
  
  // Critical text error prevention
  const textNegatives = hasText ? [
    "garbled text",
    "misspelled words", 
    "spelling errors",
    "extra letters",
    "missing letters",
    "reversed characters",
    "backwards text",
    "illegible text",
    "unreadable text",
    "jumbled letters",
    "text artifacts",
    "corrupted text",
    "wrong spelling",
    "typos in text",
    "distorted letters",
    "overlapping characters",
    "incomplete words",
    "cut-off text",
    "2D text overlay",
    "flat pasted text",
    "text stamp",
    "photoshopped text"
  ] : [];
  
  return [...baseNegatives, ...textNegatives].join(", ");
}

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

const STYLE_ARCHITECT_SYSTEM = `You are an expert AI Art Director specializing in 100% ACCURATE text rendering in images.

## PRIME DIRECTIVE: TEXT AS PHYSICAL 3D OBJECT

The text in the image MUST be rendered as a PHYSICAL OBJECT that exists within the scene's 3D space.
It is NOT a 2D overlay, NOT a flat label pasted on top, NOT a text stamp.
The text must have VOLUME, MATERIAL, TEXTURE, and interact with the scene's LIGHTING.

## ABSOLUTE REQUIREMENTS - ZERO TOLERANCE FOR ERRORS

Your generated prompt MUST result in an image where every text element is rendered EXACTLY as specified. Any deviation = failure.

## MANDATORY TEXT BLUEPRINT FORMAT

For EACH text element that must appear, you MUST specify:

### TEXT ELEMENT [N]: "[EXACT_STRING]"

**PHYSICAL EXISTENCE (Required - Text is a 3D object, NOT a flat overlay):**
- **MATERIAL**: What is the text physically made of? (e.g., 'glowing neon tube', 'carved ice', 'embossed leather', 'painted wooden sign', 'chalk on blackboard', 'gold leaf on marble', 'brushed metal', 'frosted glass')
- **LIGHTING INTERACTION**: How does the scene's light affect it? (e.g., 'catches rim light', 'casts a soft shadow below', 'glows with inner luminescence', 'reflects ambient light', 'has specular highlights')
- **SURFACE TEXTURE**: What is its surface like? (e.g., 'rough chiseled stone', 'smooth polished chrome', 'matte paint with subtle cracking', 'glossy enamel', 'weathered wood grain')
- **ENVIRONMENTAL INTERACTION**: How does it affect/interact with surroundings? (e.g., 'emits a soft glow onto nearby surfaces', 'creates reflections', 'weathered by rain exposure', 'snow accumulated on top')
- **PERSPECTIVE & DEPTH**: Where is it in the 3D space? (e.g., 'in the foreground at eye level', 'mounted flat against the wall, seen from slight angle', 'receding into the background')

**ACCURACY REQUIREMENTS (Required):**
- **EXACT_CHARACTERS**: List every character including spaces, punctuation, special symbols
- **FORBIDDEN MODIFICATIONS**: NO line breaks, NO hyphenation, NO substitutions, NO omissions, NO case changes
- **SYMBOL PRESERVATION**: Dollar signs ($), ampersands (&), at symbols (@), etc. MUST appear exactly where shown
- **LAYOUT RULE**: Single-line unless explicitly multi-line

## CRITICAL DIRECTIVES

1. **PHYSICAL OBJECT, NOT OVERLAY**: The text MUST be rendered as a physical object within the scene, NOT as a 2D text overlay or stamp
2. **VERBATIM TEXT**: The image generator MUST render "[exact text]" character-for-character
3. **NO INTERPRETATION**: Do not rephrase, summarize, or "improve" any text
4. **COMPLETE INCLUSION**: Every specified text MUST appear - no omissions allowed
5. **MATERIAL SPECIFICATION**: Every text MUST have a specific material (neon, wood, metal, etc.)
6. **LIGHTING INTEGRATION**: Text must interact with scene lighting realistically
7. **PRICE FORMAT**: Prices like "$4.50" MUST show the dollar sign - "4.50" alone is WRONG

## OUTPUT FORMAT

Your complete Art Direction prompt must:
1. Describe the scene/composition
2. State explicitly: "The text must be rendered as a PHYSICAL OBJECT within the scene, NOT as a 2D overlay"
3. For each text element, include the full TEXT BLUEPRINT with all physical properties
4. End with a VERIFICATION CHECKLIST

## EXAMPLE OUTPUT:

"A cozy coffee shop interior with warm lighting. The text must be rendered as a PHYSICAL OBJECT within the scene, NOT as a 2D overlay.

### TEXT ELEMENT 1: "Latte $4.50"
**PHYSICAL EXISTENCE:**
- MATERIAL: Hand-painted white chalk on a dark wooden blackboard
- LIGHTING: Catches warm ambient light from pendant lamps, slight shine on chalk dust
- TEXTURE: Slightly rough chalk texture with visible brush strokes
- ENVIRONMENT: Blackboard mounted on exposed brick wall
- PERSPECTIVE: Viewed straight-on, slightly above eye level

**ACCURACY:**
- EXACT_CHARACTERS: L-a-t-t-e-[space]-$-4-.-5-0
- FORBIDDEN: No line breaks, no removing $, no "Latte 4.50"
- LAYOUT: Single horizontal line

VERIFICATION CHECKLIST:
[ ] "Latte $4.50" - includes dollar sign, single line, exact spelling, rendered as chalk on blackboard"`;

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
      textRequirements = "\n\n## MANDATORY TEXT ELEMENTS - ZERO TOLERANCE FOR ERRORS\n\n";
      textAnalysis.extractedTexts.forEach((t, i) => {
        const chars = t.text.split('').map(c => {
          if (c === ' ') return '[SPACE]';
          if (c === '$') return '[DOLLAR]';
          return c;
        }).join('-');
        
        textRequirements += `### TEXT ELEMENT ${i + 1}: "${t.text}"\n`;
        textRequirements += `- **CHARACTER SEQUENCE**: ${chars}\n`;
        textRequirements += `- **CONTEXT**: ${t.context}\n`;
        textRequirements += `- **IMPORTANCE**: ${t.importance}\n`;
        textRequirements += `- **FORBIDDEN**: NO line breaks, NO omissions, NO substitutions\n`;
        if (t.text.includes('$')) {
          textRequirements += `- **CRITICAL**: Dollar sign ($) MUST be rendered - "${t.text}" not "${t.text.replace(/\$/g, '')}"\n`;
        }
        textRequirements += `\n`;
      });
      textRequirements += "## ABSOLUTE REQUIREMENT\nEvery text element above MUST appear in the final image EXACTLY as specified. Missing even ONE character = FAILURE.";
    }

    const styleNote = style && style !== "auto" ? `\nRequested visual style: ${style}` : "";
    
    // Include correction feedback if this is a retry - with verbatim error details
    const correctionNote = correctionFeedback ? `\n\n## ⚠️ CRITICAL ERRORS FROM PREVIOUS ATTEMPT - MUST FIX\n\n${correctionFeedback}\n\n## CORRECTION INSTRUCTIONS\nThe above errors are UNACCEPTABLE. You MUST ensure the EXACT text appears. Study each character carefully.` : "";
    
    const fullPrompt = `## USER REQUEST\n${userPrompt}${styleNote}${textRequirements}${correctionNote}

Create a detailed Art Direction prompt using the TEXT BLUEPRINT format. Every text element MUST be rendered with 100% character accuracy.`;

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
// Generates an image using the Art Direction prompt with negative prompts

async function generateImageOnly(
  prompt: string, 
  attempt: number = 1,
  hasText: boolean = false
): Promise<{ imageBase64: string; mimeType: string; textResponse?: string }> {
  // Use escalation model for attempts 4-5 for better text fidelity
  const useEscalation = attempt >= 4;
  const primaryModel = useEscalation ? IMAGE_GENERATOR_ESCALATION : IMAGE_GENERATOR_MODEL;
  
  // Generate negative prompts to guard against text errors
  const negativePrompts = generateNegativePrompts(hasText);
  
  // Append negative prompts as an AVOID section
  const fullPrompt = hasText 
    ? `${prompt}\n\n---\nCRITICAL - AVOID THE FOLLOWING:\n${negativePrompts}`
    : prompt;
  
  console.log(`[Image Generator] Attempt ${attempt} - Using model: ${primaryModel}${useEscalation ? ' (ESCALATION MODE)' : ''}`);
  if (hasText) {
    console.log(`[Image Generator] Negative prompts applied for text accuracy`);
  }
  
  let response;
  let modelUsed = primaryModel;
  
  try {
    if (useEscalation) {
      // Imagen 3 uses a different API format - generate images directly
      console.log("[Image Generator] Using Imagen 3 for enhanced text accuracy");
      response = await ai.models.generateImages({
        model: IMAGE_GENERATOR_ESCALATION,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
        }
      });
      
      // Imagen returns images differently
      const generatedImage = response.generatedImages?.[0];
      if (!generatedImage?.image?.imageBytes) {
        throw new Error("No image from Imagen");
      }
      
      console.log("[Image Generator] Complete with Imagen 3 escalation model");
      return {
        imageBase64: generatedImage.image.imageBytes,
        mimeType: "image/png",
        textResponse: undefined
      };
    } else {
      // Standard Gemini image generation
      response = await ai.models.generateContent({
        model: primaryModel,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });
    }
  } catch (primaryError: any) {
    console.log("[Image Generator] Primary model failed:", primaryError.message);
    console.log("[Image Generator] Trying fallback:", IMAGE_GENERATOR_FALLBACK);
    modelUsed = IMAGE_GENERATOR_FALLBACK;
    
    response = await ai.models.generateContent({
      model: IMAGE_GENERATOR_FALLBACK,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
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
    // ZERO TOLERANCE MODE: Only exact matches (similarity == 1.0) count as success
    const matchDetails = expectedTexts.map(expected => {
      const bestMatch = findBestMatch(expected, extractedTexts);
      // EXACT MATCH REQUIRED - similarity must be 1.0 (100% identical)
      const isExactMatch = bestMatch.similarity === 1.0;
      return {
        expected,
        found: bestMatch.match,
        matched: isExactMatch,
        similarity: bestMatch.similarity
      };
    });
    
    // Calculate overall accuracy score - STRICT MODE
    // Every text must match exactly, or it's a failure
    const totalExpected = expectedTexts.length;
    const matchedCount = matchDetails.filter(m => m.matched).length;
    
    // Score is simple: 100% only if ALL texts match exactly
    // Otherwise, score = (matched / total) * 100
    const accuracyScore = totalExpected > 0 
      ? Math.round((matchedCount / totalExpected) * 100)
      : 100;
    
    // ZERO TOLERANCE: Must be 100% to pass
    const passedValidation = matchedCount === totalExpected;
    
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
    // If OCR fails, FAIL validation to trigger retry
    // Do NOT auto-pass - we need to verify text accuracy
    return {
      extractedTexts: [],
      accuracyScore: 0,
      matchDetails: expectedTexts.map(text => ({
        expected: text,
        found: null,
        matched: false,
        similarity: 0
      })),
      passedValidation: false
    };
  }
}

// Helper: Calculate string similarity using Levenshtein distance
// CASE-SENSITIVE: "LATTE" != "Latte" for exact text accuracy
function calculateSimilarity(str1: string, str2: string): number {
  // Normalize whitespace only, preserve case for exact matching
  const s1 = str1.trim().replace(/\s+/g, ' ');
  const s2 = str2.trim().replace(/\s+/g, ' ');
  
  // EXACT MATCH REQUIRED - case sensitive
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // For containment, require exact case match
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
  }
  
  // Levenshtein distance - case sensitive
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
// Uses strict contiguous matching - only actual substrings score as 1.0
function findBestMatch(expected: string, extractedTexts: string[]): { match: string | null; similarity: number } {
  let bestMatch: string | null = null;
  let bestSimilarity = 0;
  
  const expectedLower = expected.toLowerCase().trim();
  
  // First, check direct matches against individual extracted texts
  for (const extracted of extractedTexts) {
    const similarity = calculateSimilarity(expected, extracted);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = extracted;
    }
  }
  
  // Check adjacent n-gram combinations (2, 3, 4 adjacent elements)
  // This handles cases where text is split across multiple lines/elements
  for (let windowSize = 2; windowSize <= Math.min(4, extractedTexts.length); windowSize++) {
    for (let i = 0; i <= extractedTexts.length - windowSize; i++) {
      const combined = extractedTexts.slice(i, i + windowSize).join(' ');
      const similarity = calculateSimilarity(expected, combined);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = combined;
      }
    }
  }
  
  // Only return 1.0 for exact contiguous matches
  // If best similarity is above 0.85, it's likely a good match
  // Below that, use word-presence as a secondary check (capped at 0.8 max)
  if (bestSimilarity < 0.85) {
    const allText = extractedTexts.join(' ').toLowerCase();
    const expectedWords = expectedLower.split(/\s+/);
    const matchedWords = expectedWords.filter(word => allText.includes(word));
    const wordMatchRatio = matchedWords.length / expectedWords.length;
    
    // Cap word-based matching at 0.8 (below pass threshold) to ensure it triggers retries
    const cappedWordScore = Math.min(wordMatchRatio * 0.8, 0.8);
    
    if (cappedWordScore > bestSimilarity) {
      bestSimilarity = cappedWordScore;
      bestMatch = `[partial: ${matchedWords.join(' ')}]`;
    }
  }
  
  return { match: bestMatch, similarity: bestSimilarity };
}

// ============== CORRECTION PROMPT GENERATOR ==============
// Creates verbatim error feedback for retry attempts

function generateCorrectionFeedback(validation: OCRValidationResult, expectedTexts: string[]): string {
  const errors: string[] = [];
  
  for (const match of validation.matchDetails) {
    if (!match.matched) {
      const expectedChars = match.expected.split('').map(c => {
        if (c === ' ') return '[SPACE]';
        if (c === '$') return '[DOLLAR]';
        return c;
      }).join('');
      
      if (match.found && !match.found.startsWith('[partial')) {
        const foundChars = match.found.split('').map(c => {
          if (c === ' ') return '[SPACE]';
          if (c === '$') return '[DOLLAR]';
          return c;
        }).join('');
        
        // Character-by-character comparison
        let diff = "CHARACTER COMPARISON:\n";
        const maxLen = Math.max(match.expected.length, match.found.length);
        for (let i = 0; i < maxLen; i++) {
          const expChar = match.expected[i] || '[MISSING]';
          const foundChar = match.found[i] || '[MISSING]';
          if (expChar !== foundChar) {
            diff += `  Position ${i + 1}: Expected '${expChar}' but got '${foundChar}'\n`;
          }
        }
        
        errors.push(`### ERROR: Text Mismatch
**EXPECTED**: "${match.expected}"
**RENDERED**: "${match.found}"
**SIMILARITY**: ${Math.round(match.similarity * 100)}%
${diff}
**FIX REQUIRED**: Render EXACTLY "${match.expected}" - every character matters`);
      } else {
        errors.push(`### ERROR: Missing Text
**EXPECTED**: "${match.expected}"
**RENDERED**: NOT FOUND
**CHARACTER SEQUENCE**: ${expectedChars}
**FIX REQUIRED**: This text MUST appear in the image. It was completely missing.`);
      }
    }
  }
  
  if (errors.length === 0) {
    return "";
  }
  
  // Add overall summary
  const summary = `## OCR VERIFICATION FAILED - ${errors.length} ERROR(S) DETECTED

Accuracy Score: ${validation.accuracyScore}% (Required: 100%)
Texts Found: ${validation.extractedTexts.join(', ') || 'NONE'}
Texts Expected: ${expectedTexts.join(', ')}

${errors.join('\n\n')}

## CRITICAL INSTRUCTION
The above errors are NOT ACCEPTABLE. You MUST render every text element EXACTLY as specified.
- If a dollar sign ($) is in the expected text, it MUST appear in the image
- If text should be on one line, it MUST be on one line (no line breaks)
- Every single character must match exactly`;

  return summary;
}

// ============== PROGRESS CALLBACK TYPE ==============

export type ProgressCallback = (phase: string, message: string, attempt?: number, maxAttempts?: number) => void;

// ============== MAIN PIPELINE WITH VERIFICATION LOOP ==============

export async function generateImageWithPipeline(
  prompt: string,
  style?: string,
  onProgress?: ProgressCallback
): Promise<GeneratedImageResult> {
  console.log("=".repeat(60));
  console.log("[Pipeline] Starting 4-phase image generation with OCR verification");
  console.log("=".repeat(60));
  
  // Helper to send progress updates
  const sendProgress = (phase: string, message: string, attempt?: number, maxAttempts?: number) => {
    if (onProgress) {
      onProgress(phase, message, attempt, maxAttempts);
    }
  };
  
  sendProgress("text_sentinel", "Analyzing your prompt for text...");
  
  // Phase 1: Text Sentinel
  const textAnalysis = await analyzeTextRequirements(prompt);
  const expectedTexts = textAnalysis.extractedTexts.map(t => t.text);
  
  if (textAnalysis.hasExplicitText) {
    sendProgress("text_sentinel", `Found ${expectedTexts.length} text elements to render`);
  } else {
    sendProgress("text_sentinel", "No explicit text detected - standard generation");
  }
  
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
      if (attempts === 1) {
        sendProgress("style_architect", "Creating detailed art direction...", attempts, MAX_RETRY_ATTEMPTS);
      } else {
        sendProgress("style_architect", `Refining art direction (attempt ${attempts}/${MAX_RETRY_ATTEMPTS})...`, attempts, MAX_RETRY_ATTEMPTS);
      }
      const artDirection = await createArtDirection(prompt, textAnalysis, style, correctionFeedback);
      
      // Phase 3: Image Generation (escalates to Imagen on attempts 4-5, includes negative prompts for text)
      const isEscalation = attempts >= 4;
      const phaseMsg = isEscalation 
        ? `Generating with enhanced model (attempt ${attempts}/${MAX_RETRY_ATTEMPTS})...`
        : "Generating your image...";
      sendProgress("image_generator", phaseMsg, attempts, MAX_RETRY_ATTEMPTS);
      const imageResult = await generateImageOnly(artDirection.enhancedPrompt, attempts, textAnalysis.hasExplicitText);
      
      // Phase 4: OCR Validation (only if there's expected text)
      if (expectedTexts.length > 0) {
        sendProgress("ocr_validator", "Verifying text accuracy...", attempts, MAX_RETRY_ATTEMPTS);
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
          sendProgress("complete", `Text accuracy: ${validation.accuracyScore}% ✓`, attempts, MAX_RETRY_ATTEMPTS);
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
        
        // Prepare correction feedback for next attempt with verbatim error details
        correctionFeedback = generateCorrectionFeedback(validation, expectedTexts);
        console.log(`[Pipeline] ❌ Validation FAILED (${validation.accuracyScore}% accuracy). Retrying with corrections...`);
        
        if (attempts < MAX_RETRY_ATTEMPTS) {
          sendProgress("retry", `Accuracy ${validation.accuracyScore}% - improving... (attempt ${attempts + 1}/${MAX_RETRY_ATTEMPTS})`, attempts + 1, MAX_RETRY_ATTEMPTS);
        }
        
      } else {
        // No text to validate, return immediately
        console.log("[Pipeline] No text to validate, returning image");
        sendProgress("complete", "Image generated successfully!");
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
      sendProgress("error", `Attempt ${attempts} failed, retrying...`, attempts, MAX_RETRY_ATTEMPTS);
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        throw error;
      }
    }
  }
  
  // Return best result after all attempts
  if (bestResult && bestArtDirection) {
    console.log(`[Pipeline] Returning best result from ${attempts} attempts (${bestValidation?.accuracyScore}% accuracy)`);
    sendProgress("complete", `Best result: ${bestValidation?.accuracyScore}% accuracy (${attempts} attempts)`);
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
