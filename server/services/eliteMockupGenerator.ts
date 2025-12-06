/**
 * ELITE MOCKUP GENERATOR SERVICE
 * Implements the "Lock-In" consistency system for high-quality product mockups
 */

import { GoogleGenAI, Modality } from "@google/genai";
import type {
  MockupAngle,
  ModelDetails,
  BrandStyleKey,
  MaterialPresetKey,
  ProductColor,
  Product,
  GenerationJob,
  GeneratedMockup,
  MockupBatch,
  JourneyType,
  MockupGenerationRequest,
  UnifiedPersona,
  DesignAnalysis
} from "@shared/mockupTypes";
import {
  BRAND_STYLES,
  CAMERA_SPECS,
  getCameraSpecsForAngle,
  getNegativePrompts,
  getContourDistortionPrompt,
  getLightingSetup,
  getFabricPhysics,
  getPrintMethod,
  getMaterialPreset,
  getSomaticProfile,
  getSomaticProfilePrompt,
  getProduct,
  getFullHumanRealismPrompt,
  getRandomPersona,
  getEthnicFeatures,
  getRandomName,
  getGarmentBlueprintPrompt
} from "./knowledge";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const MODELS = {
  FAST_ANALYSIS: "gemini-2.5-flash",
  IMAGE_GENERATION: "gemini-3-pro-image-preview",
} as const;

const GENERATION_CONFIG = {
  MAX_CONCURRENT_JOBS: 3,
  RATE_LIMIT_PER_MINUTE: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  JOB_TIMEOUT_MS: 60000,
};

let currentJobCount = 0;
let lastMinuteRequests: number[] = [];

interface LockData {
  type: string;
  locked: boolean;
  summary: string;
  details: Record<string, string | string[] | number | boolean | undefined>;
}

interface RenderSpecification {
  locks: {
    persona?: LockData;
    product: LockData;
    color: LockData;
    sizeFit?: LockData;
    design: LockData;
    camera: LockData;
    lighting: LockData;
    aopPhysics?: LockData;
    contour?: LockData;
  };
  personaDescription: string;
  productDescription: string;
  designDescription: string;
  cameraDescription: string;
  lightingDescription: string;
  environmentDescription: string;
  materialDescription: string;
  contourDescription: string;
  humanRealismDescription: string;
  negativePrompts: string;
  fullPrompt: string;
}

interface PersonaLock {
  persona: UnifiedPersona;
  headshot?: string;
  somaticDescription: string;
}

export async function analyzeDesignForMockup(imageBase64: string): Promise<DesignAnalysis> {
  const systemInstruction = `You are an expert product design analyst. Analyze this uploaded design for product mockup placement.

Determine:
1. Dominant colors (3-5 hex codes)
2. Style (minimalist, bold, vintage, modern, artistic, etc.)
3. Complexity (simple, moderate, complex, highly detailed)
4. Suggested placement (center chest, full front, small logo, all-over print)
5. Has transparency (true/false)
6. Design type (logo, illustration, photograph, text-based, pattern, graphic)
7. For AOP patterns: suggest an accent color that would work well on collar/cuffs

Respond with JSON:
{
  "dominantColors": ["#hex1", "#hex2"],
  "style": "style description",
  "complexity": "simple|moderate|complex|highly detailed",
  "suggestedPlacement": "placement",
  "hasTransparency": true or false,
  "designType": "type",
  "aopAccentColor": "#hex or null"
}`;

  try {
    const response = await genAI.models.generateContent({
      model: MODELS.FAST_ANALYSIS,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType: "image/png" } },
            { text: "Analyze this design for product mockup placement." }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        topP: 1,
        topK: 1
      }
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson) as DesignAnalysis;
    }
  } catch (error) {
    console.error("Design analysis failed:", error);
  }

  return {
    dominantColors: ["#000000", "#FFFFFF"],
    style: "modern",
    complexity: "moderate",
    suggestedPlacement: "center chest",
    hasTransparency: false,
    designType: "graphic"
  };
}

export async function generatePersonaLock(modelDetails: ModelDetails): Promise<PersonaLock> {
  const persona = getRandomPersona({
    sex: modelDetails.sex,
    ethnicity: modelDetails.ethnicity,
    size: modelDetails.modelSize
  });

  if (!persona) {
    throw new Error("No matching persona found");
  }

  const somaticProfile = getSomaticProfile(
    modelDetails.age,
    modelDetails.sex,
    modelDetails.ethnicity,
    modelDetails.modelSize
  );

  const somaticPrompt = getSomaticProfilePrompt(
    modelDetails.age,
    modelDetails.sex,
    modelDetails.ethnicity,
    modelDetails.modelSize
  );

  const somaticDescription = `${persona.fullDescription} ${somaticProfile.description} Height: ${somaticProfile.height}, weight: ${somaticProfile.weight}, ${somaticProfile.build} build. ${somaticPrompt}`;

  return {
    persona,
    somaticDescription
  };
}

export async function generatePersonaHeadshot(
  personaLock: PersonaLock,
  maxRetries: number = GENERATION_CONFIG.MAX_RETRIES
): Promise<string> {
  const ethnicFeatures = getEthnicFeatures(personaLock.persona.ethnicity);
  
  const headshotPrompt = `Professional passport-style headshot photograph of a ${personaLock.persona.age}-year-old ${personaLock.persona.sex.toLowerCase()} ${personaLock.persona.ethnicity} person.

===== CRITICAL IDENTITY DETAILS (PERSONA ANCHOR) =====
[MANDATORY - This headshot establishes the visual anchor for all subsequent mockup images]

PERSONA IDENTITY:
- Name: ${personaLock.persona.name}
- ${personaLock.somaticDescription}

ETHNIC FEATURE GUIDANCE (${personaLock.persona.ethnicity}):
- Typical hair colors for ethnicity: ${ethnicFeatures.hairColors.join(", ")}
- Typical eye colors for ethnicity: ${ethnicFeatures.eyeColors.join(", ")}
- Common hair styles: ${ethnicFeatures.hairStyles.join(", ")}

SPECIFIC APPEARANCE:
- Hair style: ${personaLock.persona.hairStyle}
- Hair color: ${personaLock.persona.hairColor}
- Eye color: ${personaLock.persona.eyeColor}
- Skin tone: ${personaLock.persona.skinTone}
- Facial features: ${personaLock.persona.facialFeatures}
===== END IDENTITY =====

CAMERA SPECIFICATIONS:
- Lens: 85mm portrait lens, f/2.8
- Framing: Head and shoulders, centered
- Background: Neutral gray studio backdrop
- Expression: Neutral, pleasant, natural

LIGHTING:
- Three-point studio lighting
- Soft key light at 45 degrees
- Fill light at 1:3 ratio
- Subtle rim light for separation

STYLE:
- Clean, professional, ID-photo quality
- Sharp focus on eyes
- Natural skin texture with authentic pores and subtle imperfections
- No retouching artifacts
- Culturally authentic appearance`;

  const negatives = getNegativePrompts('apparel', true);
  const fullPrompt = `${headshotPrompt}\n\nMUST AVOID: ${negatives}`;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: MODELS.IMAGE_GENERATION,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData && part.inlineData.data) {
              return part.inlineData.data;
            }
          }
        }
      }
      
      lastError = new Error("No image data in response");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Headshot attempt ${attempt + 1}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, GENERATION_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt))
        );
      }
    }
  }

  throw new Error(`Persona headshot generation failed after ${maxRetries} attempts: ${lastError?.message}`);
}

export function buildRenderSpecification(
  designAnalysis: DesignAnalysis,
  product: Product,
  color: ProductColor,
  angle: MockupAngle,
  modelDetails: ModelDetails | undefined,
  personaLock: PersonaLock | undefined,
  brandStyle: BrandStyleKey,
  journey: JourneyType,
  materialCondition: MaterialPresetKey = 'BRAND_NEW',
  lightingPreset?: string,
  environmentPrompt?: string
): RenderSpecification {
  const style = BRAND_STYLES[brandStyle];
  const cameraSpec = getCameraSpecsForAngle(angle);
  const lightingSetup = lightingPreset ? getLightingSetup(lightingPreset) : getLightingSetup('three-point-classic');
  const materialPreset = getMaterialPreset(materialCondition);
  const printMethod = getPrintMethod(journey);
  const fabricPhysics = getFabricPhysics(product.subcategory || product.category);
  const garmentBlueprint = product.isWearable ? getGarmentBlueprintPrompt(product) : "";

  const personaLockBlock = product.isWearable && personaLock ? `
===== PERSONA LOCK (CONSISTENCY ANCHOR) =====
[LOCKED - DO NOT DEVIATE FROM THESE IDENTITY DETAILS]
- Persona ID: ${personaLock.persona.id}
- Name: ${personaLock.persona.name}
- Age: ${personaLock.persona.age}
- Sex: ${personaLock.persona.sex} (MUST be ${personaLock.persona.sex.toLowerCase()} - do not show opposite sex)
- Ethnicity: ${personaLock.persona.ethnicity}
- Height: ${personaLock.persona.height}
- Weight: ${personaLock.persona.weight}
- Build: ${personaLock.persona.build}
- Hair: ${personaLock.persona.hairStyle}, ${personaLock.persona.hairColor}
- Eyes: ${personaLock.persona.eyeColor}
- Skin tone: ${personaLock.persona.skinTone}
- Facial features: ${personaLock.persona.facialFeatures}
- Full description: ${personaLock.somaticDescription}

CRITICAL IDENTITY ENFORCEMENT:
- Sex: The model MUST be ${personaLock.persona.sex.toLowerCase()}. Do not show a ${personaLock.persona.sex === 'Male' ? 'female' : 'male'}.
- Ethnicity: The model MUST have ${personaLock.persona.ethnicity} ethnic appearance with appropriate skin tone, facial features, and hair characteristics.
- Body Size: The model body MUST match the specified build (${personaLock.persona.build}) and weight (${personaLock.persona.weight}).
- If a reference headshot image is provided, this person MUST appear EXACTLY as shown in that headshot. Match all facial features, hair, skin tone, and identity markers precisely.

${getFullHumanRealismPrompt()}
===== END PERSONA LOCK =====` : product.isWearable ? `
===== DISPLAY MODE =====
Product displayed on invisible mannequin or flat lay (no human model).
===== END DISPLAY MODE =====` : "";

  const colorLockBlock = `
===== COLOR LOCK =====
[LOCKED - EXACT COLORS REQUIRED]
- Product base color: ${color.name} (${color.hex})
- This EXACT color must be visible on all non-printed areas of the product
- Design colors: ${designAnalysis.dominantColors.join(", ")}
- Design colors must be reproduced accurately without color shift
${journey === 'AOP' && designAnalysis.aopAccentColor ? `- AOP accent color (collar/cuffs): ${designAnalysis.aopAccentColor}` : ''}
===== END COLOR LOCK =====`;

  const sizeFitLockBlock = product.isWearable && personaLock ? `
===== SIZE/FIT LOCK =====
[LOCKED - GARMENT MUST FIT AS SPECIFIED]
- Model size: ${personaLock.persona.size}
- Build type: ${personaLock.persona.build}
- Garment must appear properly fitted for this body type
- No baggy or overly tight appearance unless specified by product type
${materialPreset.promptAddition}
===== END SIZE/FIT LOCK =====` : "";

  const designLockBlock = `
===== DESIGN LOCK =====
[LOCKED - DESIGN APPLICATION RULES]
- Design style: ${designAnalysis.style}
- Design complexity: ${designAnalysis.complexity}
- Design type: ${designAnalysis.designType}
- Placement: ${designAnalysis.suggestedPlacement}
${journey === 'DTG' ? `
DTG PRINT METHOD:
- Design printed directly onto fabric surface
- Maintains original colors and proportions
- Slight texture integration with fabric
- Design follows natural fabric contours and folds

CRITICAL PLACEMENT RULES FOR DTG:
- The design/graphic MUST be placed CENTERED on the chest area
- Design should be horizontally centered between left and right edges of shirt front
- Design should be vertically positioned in the upper-center chest area (below collar, above stomach)
- DO NOT place the design on the side, shoulder, sleeve, or off-center
- The design must appear as if professionally screen-printed in the traditional chest logo position
${fabricPhysics ? `
FABRIC BEHAVIOR:
- Weight: ${fabricPhysics.weight}
- Drape factor: ${fabricPhysics.drapeFactor}%
- Surface texture: ${fabricPhysics.textureDensity}
- Fold characteristics: ${fabricPhysics.foldCharacteristics}` : ''}` : `
AOP PRINT METHOD:
- Seamless edge-to-edge sublimation print
- Pattern tiles continuously across entire garment
- Dye infused into fabric fibers (not on top)
- Zero texture difference between print and fabric
- Pattern maintains scale consistency across seams`}
${printMethod.technicalDescription}
===== END DESIGN LOCK =====`;

  const cameraLockBlock = `
===== CAMERA/POSE LOCK =====
[LOCKED - EXACT CAMERA SETTINGS]
- View: ${angle.toUpperCase()}
- Lens type: ${cameraSpec?.lensType || '50-85mm portrait lens'}
- Focal length: ${cameraSpec?.focalLength || 'standard'}
- Aperture: ${cameraSpec?.aperture || 'f/5.6-f/8'}
- Depth of field: ${cameraSpec?.depthOfField || 'moderate, subject sharp'}
- Perspective: ${cameraSpec?.perspective || 'eye level'}
${cameraSpec?.promptAddition || 'Standard product photography angle'}
${cameraSpec?.technicalDescription || 'Professional product shot'}
===== END CAMERA/POSE LOCK =====`;

  const lightingLockBlock = `
===== LIGHTING LOCK =====
[LOCKED - CONSISTENT LIGHTING ACROSS ALL SHOTS]
- Setup: ${lightingSetup?.name || 'Three-point studio lighting'}
- Color temperature: ${lightingSetup?.technicalSpecs?.colorTemperature || '5500K-6000K'}
- Key to fill ratio: ${lightingSetup?.technicalSpecs?.lightRatio || '3:1'}
- Shadow type: ${lightingSetup?.technicalSpecs?.shadowType || 'soft, graduated'}
- Highlights: ${lightingSetup?.technicalSpecs?.highlights || 'controlled specular'}
${lightingSetup?.promptPhrase || 'Professional three-point studio lighting'}
${lightingSetup?.promptDetails || ''}
===== END LIGHTING LOCK =====`;

  const aopPhysicsLockBlock = journey === 'AOP' ? `
===== AOP CONSTRUCTION/SCALE/PHYSICS LOCKS =====
[LOCKED - AOP-SPECIFIC REQUIREMENTS]

CONSTRUCTION LOCK:
- Pattern must tile seamlessly across all panels
- No visible seam interruption of pattern
- Pattern aligns at side seams, shoulder seams, and armholes

SCALE LOCK:
- Pattern elements maintain consistent physical size (not percentage-based)
- Same element should be same size on front and back panels
- Scale should not distort at edges or seams

PHYSICS LOCK:
- Fabric weight and drape appropriate for sublimation polyester
- Pattern conforms to body contours naturally
- Folds and creases affect pattern realistically (compression in valleys, stretch on peaks)
${fabricPhysics ? `
FABRIC PHYSICS DETAILS:
- Weight: ${fabricPhysics.weight}
- Drape factor: ${fabricPhysics.drapeFactor}%
- Surface texture: ${fabricPhysics.textureDensity}
- Print absorption: ${fabricPhysics.printAbsorption}
- Fold characteristics: ${fabricPhysics.foldCharacteristics}` : ''}
===== END AOP LOCKS =====` : "";

  const garmentConstructionBlock = product.isWearable && garmentBlueprint ? `
===== GARMENT CONSTRUCTION DETAILS =====
${garmentBlueprint}
===== END GARMENT CONSTRUCTION =====` : "";

  const contourDescription = product.isWearable && personaLock
    ? `
===== CONTOUR DISTORTION RULES =====
${getContourDistortionPrompt()}
===== END CONTOUR RULES =====`
    : "";

  const environmentBlock = `
===== ENVIRONMENT =====
- Brand style: ${style.name}
- Mood: ${style.description}
- Atmosphere: ${style.atmosphere}
- Setting: ${environmentPrompt || style.preferredEnvironment}
- Color palette mood: ${style.colorPalette}
${style.platformNotes}
===== END ENVIRONMENT =====`;

  const negativePrompts = getNegativePrompts(product.productType, product.isWearable && !!personaLock);

  const fullPrompt = `ELITE MOCKUP GENERATION - RENDER SPECIFICATION
================================================================

${personaLockBlock}

${colorLockBlock}

${sizeFitLockBlock}

${designLockBlock}

${cameraLockBlock}

${lightingLockBlock}

${aopPhysicsLockBlock}

${garmentConstructionBlock}

${contourDescription}

${environmentBlock}

===== TECHNICAL REQUIREMENTS =====
- Output: Photorealistic commercial product photography
- Quality: 8K resolution, sharp focus, professional studio standards
- Design: Must follow fabric contours naturally with accurate color reproduction
- Style: ${style.technicalNotes}
===== END REQUIREMENTS =====

===== NEGATIVE PROMPTS (MUST AVOID) =====
${negativePrompts}
===== END NEGATIVES =====`;

  const locks: RenderSpecification['locks'] = {
    product: {
      type: 'PRODUCT_LOCK',
      locked: true,
      summary: `${product.name} - ${product.category}`,
      details: {
        productId: product.id,
        productName: product.name,
        category: product.category,
        subcategory: product.subcategory,
        productType: product.productType,
        isWearable: product.isWearable,
        printMethod: journey,
        materialCondition: materialCondition,
        materialPresetName: materialPreset.name,
        fabricDescription: materialPreset.description
      }
    },
    color: {
      type: 'COLOR_LOCK',
      locked: true,
      summary: `${color.name} (${color.hex})`,
      details: {
        productColor: color.name,
        productHex: color.hex,
        designColors: designAnalysis.dominantColors,
        aopAccentColor: designAnalysis.aopAccentColor
      }
    },
    design: {
      type: 'DESIGN_LOCK',
      locked: true,
      summary: `${designAnalysis.designType} - ${designAnalysis.style}`,
      details: {
        style: designAnalysis.style,
        complexity: designAnalysis.complexity,
        designType: designAnalysis.designType,
        placement: designAnalysis.suggestedPlacement,
        printMethod: journey,
        hasTransparency: designAnalysis.hasTransparency
      }
    },
    camera: {
      type: 'CAMERA_LOCK',
      locked: true,
      summary: `${angle} view`,
      details: {
        angle,
        lensType: cameraSpec?.lensType,
        focalLength: cameraSpec?.focalLength,
        aperture: cameraSpec?.aperture,
        depthOfField: cameraSpec?.depthOfField
      }
    },
    lighting: {
      type: 'LIGHTING_LOCK',
      locked: true,
      summary: lightingSetup?.name || 'Three-point studio',
      details: {
        setupName: lightingSetup?.name,
        colorTemperature: lightingSetup?.technicalSpecs?.colorTemperature,
        lightRatio: lightingSetup?.technicalSpecs?.lightRatio,
        shadowType: lightingSetup?.technicalSpecs?.shadowType
      }
    }
  };

  if (product.isWearable && personaLock) {
    locks.persona = {
      type: 'PERSONA_LOCK',
      locked: true,
      summary: `${personaLock.persona.name} (${personaLock.persona.sex}, ${personaLock.persona.ethnicity}, ${personaLock.persona.age})`,
      details: {
        personaId: personaLock.persona.id,
        name: personaLock.persona.name,
        age: personaLock.persona.age,
        sex: personaLock.persona.sex,
        ethnicity: personaLock.persona.ethnicity,
        height: personaLock.persona.height,
        weight: personaLock.persona.weight,
        build: personaLock.persona.build,
        hairStyle: personaLock.persona.hairStyle,
        hairColor: personaLock.persona.hairColor,
        eyeColor: personaLock.persona.eyeColor,
        skinTone: personaLock.persona.skinTone,
        hasHeadshot: !!personaLock.headshot
      }
    };

    locks.sizeFit = {
      type: 'SIZE_FIT_LOCK',
      locked: true,
      summary: `${personaLock.persona.size} - ${personaLock.persona.build}`,
      details: {
        size: personaLock.persona.size,
        build: personaLock.persona.build,
        materialCondition: materialCondition
      }
    };

    locks.contour = {
      type: 'CONTOUR_LOCK',
      locked: true,
      summary: 'Body contour distortion applied',
      details: {
        appliedTo: product.name,
        personaBuild: personaLock.persona.build
      }
    };
  }

  if (journey === 'AOP') {
    locks.aopPhysics = {
      type: 'AOP_PHYSICS_LOCK',
      locked: true,
      summary: 'Seamless all-over print physics',
      details: {
        patternType: 'seamless',
        scaleMethod: 'physical_units',
        fabricType: 'sublimation_polyester',
        constructionRules: 'panel_alignment'
      }
    };
  }

  return {
    locks,
    personaDescription: personaLockBlock,
    productDescription: `Product: ${product.name} | Color: ${color.name} (${color.hex}) | Category: ${product.category} | Type: ${product.productType} | Print: ${journey} | Material: ${materialPreset.name}`,
    designDescription: designLockBlock,
    cameraDescription: cameraLockBlock,
    lightingDescription: lightingLockBlock,
    environmentDescription: environmentBlock,
    materialDescription: materialPreset.promptAddition,
    contourDescription,
    humanRealismDescription: product.isWearable && personaLock ? getFullHumanRealismPrompt() : "",
    negativePrompts,
    fullPrompt
  };
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  lastMinuteRequests = lastMinuteRequests.filter(t => t > oneMinuteAgo);

  if (lastMinuteRequests.length >= GENERATION_CONFIG.RATE_LIMIT_PER_MINUTE) {
    const oldestRequest = lastMinuteRequests[0];
    const waitTime = oldestRequest - oneMinuteAgo + 100;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastMinuteRequests.push(now);
}

async function waitForConcurrencySlot(): Promise<void> {
  while (currentJobCount >= GENERATION_CONFIG.MAX_CONCURRENT_JOBS) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  currentJobCount++;
}

function releaseConcurrencySlot(): void {
  currentJobCount = Math.max(0, currentJobCount - 1);
}

export async function generateSingleMockup(
  designBase64: string,
  renderSpec: RenderSpecification,
  personaHeadshot?: string
): Promise<GeneratedMockup | null> {
  await waitForRateLimit();
  await waitForConcurrencySlot();

  try {
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

    if (personaHeadshot) {
      parts.push({
        inlineData: { data: personaHeadshot, mimeType: "image/png" }
      });
      parts.push({
        text: "REFERENCE: This is the model's face. The generated image MUST feature this EXACT same person."
      });
    }

    parts.push({
      inlineData: { data: designBase64, mimeType: "image/png" }
    });

    parts.push({
      text: `Apply this design to the product as specified:\n\n${renderSpec.fullPrompt}`
    });

    const response = await genAI.models.generateContent({
      model: MODELS.IMAGE_GENERATION,
      contents: [{ role: "user", parts }],
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] }
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

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
          jobId: "",
          color: "",
          angle: "front"
        };
      }
    }

    console.error("No image data in mockup response");
    return null;
  } catch (error) {
    console.error("Single mockup generation failed:", error);
    return null;
  } finally {
    releaseConcurrencySlot();
  }
}

export async function generateMockupWithRetry(
  designBase64: string,
  renderSpec: RenderSpecification,
  personaHeadshot?: string,
  maxRetries: number = GENERATION_CONFIG.MAX_RETRIES
): Promise<GeneratedMockup | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await generateSingleMockup(designBase64, renderSpec, personaHeadshot);
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, GENERATION_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt))
        );
      }
    }
  }

  console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
  return null;
}

export interface BatchGenerationError {
  type: 'persona_lock_failed' | 'design_analysis_failed' | 'batch_failed';
  message: string;
  details?: string;
}

export async function generateMockupBatch(
  request: MockupGenerationRequest,
  onProgress?: (completed: number, total: number, job: GenerationJob) => void,
  onError?: (error: BatchGenerationError) => void
): Promise<MockupBatch> {
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const designAnalysis = await analyzeDesignForMockup(request.designImage);

  let personaLock: PersonaLock | undefined;
  let personaHeadshot: string | undefined;

  if (request.product.isWearable && request.modelDetails) {
    try {
      personaLock = await generatePersonaLock(request.modelDetails);
      
      try {
        personaHeadshot = await generatePersonaHeadshot(personaLock);
        personaLock.headshot = personaHeadshot;
        console.log("Persona headshot generated successfully");
      } catch (headshotError) {
        console.warn("Persona headshot generation failed, proceeding without it:", headshotError);
        if (onError) {
          onError({
            type: 'persona_lock_failed',
            message: 'Headshot generation skipped - proceeding with text-based persona description',
            details: headshotError instanceof Error ? headshotError.message : String(headshotError)
          });
        }
      }
    } catch (error) {
      console.warn("Persona lock generation failed, proceeding without model:", error);
    }
  }

  const jobs: GenerationJob[] = [];
  for (const color of request.colors) {
    for (const angle of request.angles) {
      jobs.push({
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        designImage: request.designImage,
        product: request.product,
        color,
        angle,
        modelDetails: request.modelDetails,
        brandStyle: request.brandStyle,
        lightingPreset: request.lightingPreset,
        materialCondition: request.materialCondition,
        environmentPrompt: request.environmentPrompt,
        personaLockImage: personaHeadshot,
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now()
      });
    }
  }

  const batch: MockupBatch = {
    id: batchId,
    designImage: request.designImage,
    designAnalysis,
    product: request.product,
    colors: request.colors,
    angles: request.angles,
    modelDetails: request.modelDetails,
    brandStyle: request.brandStyle,
    lightingPreset: request.lightingPreset,
    materialCondition: request.materialCondition,
    environmentPrompt: request.environmentPrompt,
    personaLockImage: personaHeadshot,
    jobs,
    status: 'processing',
    createdAt: Date.now()
  };

  let completedCount = 0;
  const totalJobs = jobs.length;

  const processJob = async (job: GenerationJob): Promise<void> => {
    job.status = 'processing';
    job.startedAt = Date.now();

    const renderSpec = buildRenderSpecification(
      designAnalysis,
      request.product,
      job.color,
      job.angle,
      job.modelDetails,
      personaLock,
      request.brandStyle,
      request.journey,
      request.materialCondition,
      request.lightingPreset,
      request.environmentPrompt
    );

    const result = await generateMockupWithRetry(
      request.designImage,
      renderSpec,
      personaHeadshot
    );

    if (result) {
      job.status = 'completed';
      job.result = {
        ...result,
        jobId: job.id,
        color: job.color.name,
        angle: job.angle
      };
    } else {
      job.status = 'failed';
      job.error = 'Generation failed after max retries';
    }

    job.completedAt = Date.now();
    completedCount++;

    if (onProgress) {
      onProgress(completedCount, totalJobs, job);
    }
  };

  const batchSize = GENERATION_CONFIG.MAX_CONCURRENT_JOBS;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batchJobs = jobs.slice(i, i + batchSize);
    await Promise.all(batchJobs.map(processJob));
  }

  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  if (failedJobs === 0) {
    batch.status = 'completed';
  } else if (completedJobs > 0) {
    batch.status = 'partial';
  } else {
    batch.status = 'failed';
  }

  batch.completedAt = Date.now();

  return batch;
}

export async function refineMockup(
  originalJob: GenerationJob,
  refinementPrompt: string,
  originalDesignBase64: string
): Promise<GeneratedMockup | null> {
  if (!originalJob.result) {
    throw new Error("Cannot refine a job without a result");
  }

  const refinedPrompt = `${originalJob.result.prompt || ''}

REFINEMENT REQUEST:
${refinementPrompt}

Maintain all other aspects of the original image but apply the refinement above.`;

  const renderSpec: RenderSpecification = {
    locks: {
      product: {
        type: 'PRODUCT_LOCK',
        locked: true,
        summary: `${originalJob.product.name} - ${originalJob.product.category}`,
        details: {
          productId: originalJob.product.id,
          productName: originalJob.product.name,
          category: originalJob.product.category,
          productType: originalJob.product.productType,
          isWearable: originalJob.product.isWearable,
          refinementMode: true
        }
      },
      color: {
        type: 'COLOR_LOCK',
        locked: true,
        summary: originalJob.color.name,
        details: { productColor: originalJob.color.name, productHex: originalJob.color.hex }
      },
      design: {
        type: 'DESIGN_LOCK',
        locked: true,
        summary: 'Refinement of existing design',
        details: { refinementMode: true }
      },
      camera: {
        type: 'CAMERA_LOCK',
        locked: true,
        summary: originalJob.angle,
        details: { angle: originalJob.angle }
      },
      lighting: {
        type: 'LIGHTING_LOCK',
        locked: true,
        summary: 'Inherited from original',
        details: {}
      }
    },
    personaDescription: "",
    productDescription: `Product: ${originalJob.product.name}`,
    designDescription: "Refinement mode - modifying existing mockup",
    cameraDescription: `${originalJob.angle} view`,
    lightingDescription: "Inherited from original generation",
    environmentDescription: "",
    materialDescription: "",
    contourDescription: "",
    humanRealismDescription: "",
    negativePrompts: getNegativePrompts(originalJob.product.productType, originalJob.product.isWearable),
    fullPrompt: refinedPrompt
  };

  return generateMockupWithRetry(
    originalDesignBase64,
    renderSpec,
    originalJob.personaLockImage
  );
}
