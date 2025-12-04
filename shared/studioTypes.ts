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

export interface GeneratedImage {
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

export interface StudioStylePreset {
  name: string;
  keywords: string;
  guidance: string;
  isPhotorealistic: boolean;
}

export interface StudioQualityPreset {
  name: string;
  icon: string;
  description: string;
  thinkingBudget: number;
  qualityBooster: string;
  modelNote: string;
}

export interface AspectRatioPreset {
  value: string;
  label: string;
}
