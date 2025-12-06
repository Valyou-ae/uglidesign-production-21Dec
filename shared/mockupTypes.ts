/**
 * MOCKUP GENERATOR TYPE DEFINITIONS
 * Central type definitions for the Elite Mockup Generator
 */

// ============================================================================
// AGE & DEMOGRAPHICS
// ============================================================================

export type AgeGroup = 'Baby' | 'Toddler' | 'Kids' | 'Teen' | 'Young Adult' | 'Adult' | 'Senior';

export type Sex = 'Male' | 'Female';

export type Ethnicity = 
  | 'White' 
  | 'Black' 
  | 'Hispanic' 
  | 'Asian' 
  | 'Indian' 
  | 'Southeast Asian' 
  | 'Middle Eastern'
  | 'Indigenous' 
  | 'Diverse';

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

// ============================================================================
// MODEL DETAILS
// ============================================================================

export interface ModelDetails {
  age: AgeGroup;
  sex: Sex;
  ethnicity: Ethnicity;
  modelSize: Size;
}

export interface UnifiedPersona {
  id: string;
  name: string;
  age: string;
  sex: Sex;
  ethnicity: Ethnicity;
  size: string;
  height: string;
  weight: string;
  build: string;
  facialFeatures: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  fullDescription: string;
  version: string;
  createdDate: string;
}

export interface SomaticProfile {
  height: string;
  weight: string;
  build: string;
  description: string;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type ProductType = 
  | 'dtg-apparel' 
  | 'aop-apparel' 
  | 'hard-good-mug'
  | 'hard-good-drinkware'
  | 'hard-good-phone-case'
  | 'accessory-bag'
  | 'accessory-footwear'
  | 'accessory-tech'
  | 'home-decor-wall-art'
  | 'home-decor-textile'
  | 'home-decor-stationery'
  | 'home-decor-tableware';

export type GenderTarget = 'mens' | 'womens' | 'unisex';

export interface SizeChartEntry {
  size: string;
  chest: number;
  length: number;
  sleeve: number;
}

export interface PrintSpecification {
  printAreaWidth: number;
  printAreaHeight: number;
  printAreaWidthPixels: number;
  printAreaHeightPixels: number;
  dpi: number;
  placement: string;
  placementDescription: string;
  bleed?: number;
  safeZone?: number;
  wrapAround?: boolean;
  surfaceType: 'flat' | 'curved' | 'flexible' | 'rigid';
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  productType: ProductType | string;
  isWearable: boolean;
  availableColors: ProductColor[];
  defaultPlacement?: string;
  genderTarget: GenderTarget;
  sizeChart?: SizeChartEntry[];
  printSpec?: PrintSpecification;
}

export interface ProductColor {
  name: string;
  hex: string;
  category?: 'light' | 'dark' | 'neutral';
}

// ============================================================================
// MOCKUP ANGLES
// ============================================================================

export type MockupAngle = 'front' | 'three-quarter' | 'side' | 'closeup' | 'size-chart';

export interface CameraSpec {
  angle: MockupAngle;
  lensType: string;
  focalLength: string;
  aperture: string;
  sensorDistance: string;
  fieldOfView: string;
  depthOfField: string;
  perspective: string;
  technicalDescription: string;
  promptAddition: string;
  bestFor: string[];
  commonMistakes: string[];
}

// ============================================================================
// BRAND STYLES
// ============================================================================

export type BrandStyleKey = 
  | 'ECOMMERCE_CLEAN'
  | 'EDITORIAL_FASHION'
  | 'VINTAGE_RETRO'
  | 'STREET_URBAN'
  | 'MINIMALIST_MODERN'
  | 'BOLD_PLAYFUL'
  | 'PREMIUM_LUXE'
  | 'NATURAL_ORGANIC';

export interface BrandStyle {
  id: BrandStyleKey;
  name: string;
  description: string;
  moodKeywords: string[];
  photographyStyle: string;
  colorPalette: string;
  lighting: string;
  preferredEnvironment: string;
  atmosphere: string;
  technicalNotes: string;
  compositionStyle: string;
  cameraWork: string;
  postProcessing: string;
  idealFor: string[];
  platformNotes: string;
}

// ============================================================================
// LIGHTING
// ============================================================================

export type LightingCategory = 'studio' | 'natural' | 'lifestyle' | 'dramatic' | 'editorial';

export interface LightingSetup {
  id: string;
  name: string;
  category: LightingCategory;
  description: string;
  technicalSpecs: {
    colorTemperature: string;
    lightRatio: string;
    shadowType: string;
    highlights: string;
  };
  promptPhrase: string;
  promptDetails: string;
  bestFor: string[];
  avoidFor: string[];
  timeOfDay?: string;
  environmentNotes?: string;
}

// ============================================================================
// MATERIALS & FABRIC
// ============================================================================

export type MaterialPresetKey = 'BRAND_NEW' | 'LIVED_IN' | 'VINTAGE_DISTRESSED';

export interface MaterialPreset {
  id: MaterialPresetKey;
  name: string;
  description: string;
  promptAddition: string;
}

export interface FabricPhysics {
  fabricType: string;
  weight: string;
  stretchability: number;
  drapeFactor: number;
  wrinkleTendency: number;
  textureDensity: string;
  printAbsorption: string;
  foldCharacteristics: string;
  promptAddition: string;
}

export interface PrintMethod {
  id: string;
  name: string;
  commonName: string;
  description: string;
  surfaceCharacteristics: {
    texture: string;
    sheen: string;
    thickness: string;
    handFeel: string;
  };
  lightInteraction: {
    reflectivity: string;
    highlights: string;
    shadows: string;
  };
  fabricConformity: {
    stretchBehavior: string;
    foldingBehavior: string;
    drapingBehavior: string;
  };
  visualProperties: {
    colorVibrancy: string;
    edgeDefinition: string;
    detailCapability: string;
  };
  promptPhrase: string;
  technicalDescription: string;
  bestForMaterials: string[];
  limitations: string[];
}

// ============================================================================
// CONTOUR DISTORTION
// ============================================================================

export interface BodyContour {
  area: string;
  curvature: string;
  radius: number;
  distortionType: 'compression' | 'stretch' | 'both';
  distortionAmount: string;
  technicalDescription: string;
  promptInstructions: string;
}

// ============================================================================
// GENERATION JOB
// ============================================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface GenerationJob {
  id: string;
  designImage: string;
  product: Product;
  color: ProductColor;
  angle: MockupAngle;
  modelDetails?: ModelDetails;
  brandStyle: BrandStyleKey;
  lightingPreset?: string;
  materialCondition?: MaterialPresetKey;
  environmentPrompt?: string;
  personaLockImage?: string;
  status: JobStatus;
  retryCount: number;
  result?: GeneratedMockup;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface GeneratedMockup {
  imageData: string;
  mimeType: string;
  jobId: string;
  color: string;
  angle: MockupAngle;
  prompt?: string;
}

// ============================================================================
// GENERATION BATCH
// ============================================================================

export interface MockupBatch {
  id: string;
  designImage: string;
  designAnalysis?: DesignAnalysis;
  product: Product;
  colors: ProductColor[];
  angles: MockupAngle[];
  modelDetails?: ModelDetails;
  brandStyle: BrandStyleKey;
  lightingPreset?: string;
  materialCondition?: MaterialPresetKey;
  environmentPrompt?: string;
  personaLockImage?: string;
  jobs: GenerationJob[];
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface DesignAnalysis {
  dominantColors: string[];
  style: string;
  complexity: string;
  suggestedPlacement: string;
  hasTransparency: boolean;
  designType: string;
  aopAccentColor?: string;
}

// ============================================================================
// PLATFORM
// ============================================================================

export type PlatformKey = 'AMAZON' | 'ETSY' | 'SHOPIFY' | 'EBAY' | 'GENERAL';

// ============================================================================
// NEGATIVE PROMPTS
// ============================================================================

export interface NegativePromptCategory {
  id: string;
  name: string;
  description: string;
  prompts: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  applicableFor: string[];
}

// ============================================================================
// JOURNEY TYPES
// ============================================================================

export type JourneyType = 'DTG' | 'AOP';

export interface MockupGenerationRequest {
  journey: JourneyType;
  designImage: string;
  isSeamlessPattern?: boolean;
  product: Product;
  colors: ProductColor[];
  angles: MockupAngle[];
  modelDetails?: ModelDetails;
  brandStyle: BrandStyleKey;
  platform?: PlatformKey;
  lightingPreset?: string;
  materialCondition?: MaterialPresetKey;
  environmentPrompt?: string;
  patternScale?: number;
}

export interface MockupRefinementRequest {
  jobId: string;
  originalJob: GenerationJob;
  refinementPrompt: string;
}
