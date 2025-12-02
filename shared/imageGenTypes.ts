export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum AgentType {
  TEXT_FIXER = 'Text Sentinel',
  STYLE_WIZARD = 'Style Architect',
  IMAGE_CREATOR = 'Visual Synthesizer',
  MASTER_REFINER = 'Master Refiner',
  QUALITY_ANALYST = 'Quality Analyst',
}

export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  message: string;
  output?: string;
}

export interface ImageQualityScores {
  composition: number;
  detail: number;
  lighting: number;
  color: number;
  overall: number;
}

export type TextStyleIntent = 'integrated' | 'subtle' | 'bold' | 'cinematic';

export interface GeneratedImageData {
  url: string;
  prompt: string;
  base64Data?: string;
  mimeType?: string;
  scores?: ImageQualityScores;
  finalText?: string;
  finalBackground?: string;
  textStyleIntent?: TextStyleIntent;
}

export interface TextPhysicalProperties {
  material: string;
  lightingInteraction: string;
  surfaceTexture: string;
  environmentalInteraction: string;
  perspectiveAndDepth: string;
}

export interface DetectedTextInfo {
  text: string;
  placement:
    | 'center'
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'overlay'
    | 'integrated';
  fontStyle:
    | 'bold'
    | 'elegant'
    | 'handwritten'
    | 'modern'
    | 'vintage'
    | 'tech'
    | 'playful'
    | 'minimal';
  fontSize: 'small' | 'medium' | 'large' | 'dominant';
  physicalProperties: TextPhysicalProperties;
}

export type VariationCount = 1 | 2 | 4;

export type QualityLevel = 'draft' | 'standard' | 'premium' | 'ultra';

export interface PromptAnalysis {
  subject: {
    primary: string;
    secondary: string[];
  };
  mood: {
    primary: string;
    secondary: string[];
  };
  lighting: {
    scenario: string;
  };
  environment: {
    type: string;
    details: string;
  };
  style_intent: string;
}

export interface GenerationMetadata {
  analysis: PromptAnalysis;
  selectedStyle: string;
  selectedQuality: string;
  refinerPreset: string;
  enableRefiner: boolean;
  useCuratedSelection: boolean;
}

export interface QualityTracker {
  promptHash: string;
  enhancedPrompt: string;
  userRating: number;
  aiScore: number;
  metadata: GenerationMetadata;
}

export interface GenerateImageRequest {
  prompt: string;
  style: string;
  quality: QualityLevel;
  aspectRatio: string;
  variations: VariationCount;
  enableRefiner: boolean;
  refinerPreset: string;
}

export interface TextPriorityInfo {
  confidence: number;
  detectedLanguages: string[];
  extractedTexts: string[];
}

export interface GenerateImageResponse {
  success: boolean;
  images?: GeneratedImageData[];
  error?: string;
  enhancedPrompt?: string;
  analysis?: PromptAnalysis;
  generationMode?: 'cinematic' | 'typographic';
  modelUsed?: string;
  textPriorityInfo?: TextPriorityInfo;
}

export const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 756 },
  '9:16': { width: 756, height: 1344 },
  '4:3': { width: 1152, height: 864 },
  '3:4': { width: 864, height: 1152 },
};
