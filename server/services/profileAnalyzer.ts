import { storage } from "../storage";
import type { UserPreferences, GeneratedImage, ChatSession } from "@shared/schema";

interface CreativePatterns {
  frequentPromptPatterns: string[];
  averagePromptLength: number;
  preferredAspectRatios: Record<string, number>;
  styleFrequency: Record<string, number>;
  generationTimePreference: string;
}

interface RecentContext {
  lastProjectId: string | null;
  lastSessionId: string | null;
  recentPrompts: string[];
  recentStyles: string[];
}

interface AnalysisResult {
  preferredStyles: string[];
  preferredSubjects: string[];
  preferredMoods: string[];
  colorPreferences: string[];
  brandKeywords: string[];
  creativePatterns: CreativePatterns;
  recentContext: RecentContext;
  profileCompleteness: number;
}

export async function analyzeUserProfile(userId: string): Promise<AnalysisResult> {
  const { images } = await storage.getImagesByUserId(userId, 100, 0);
  const chatSessions = await storage.getChatSessions(userId);
  
  const styleFrequency: Record<string, number> = {};
  const aspectRatioFrequency: Record<string, number> = {};
  const allPrompts: string[] = [];
  const subjectKeywords: Record<string, number> = {};
  const moodKeywords: Record<string, number> = {};
  
  for (const image of images) {
    if (image.style) {
      styleFrequency[image.style] = (styleFrequency[image.style] || 0) + 1;
    }
    if (image.aspectRatio) {
      aspectRatioFrequency[image.aspectRatio] = (aspectRatioFrequency[image.aspectRatio] || 0) + 1;
    }
    if (image.prompt) {
      allPrompts.push(image.prompt);
      extractKeywords(image.prompt, subjectKeywords, moodKeywords, styleFrequency);
    }
  }
  
  const preferredStyles = Object.entries(styleFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([style]) => style);
  
  const preferredSubjects = Object.entries(subjectKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([subject]) => subject);
  
  const preferredMoods = Object.entries(moodKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mood]) => mood);
  
  const avgPromptLength = allPrompts.length > 0 
    ? allPrompts.reduce((sum, p) => sum + p.length, 0) / allPrompts.length 
    : 0;
  
  const recentImages = images.slice(0, 5);
  const recentPrompts = recentImages.map(img => img.prompt).filter(Boolean) as string[];
  const recentStyles = recentImages.map(img => img.style).filter(Boolean) as string[];
  
  const lastSession = chatSessions[0];
  
  let profileCompleteness = 0;
  if (preferredStyles.length > 0) profileCompleteness += 20;
  if (preferredSubjects.length > 0) profileCompleteness += 20;
  if (preferredMoods.length > 0) profileCompleteness += 20;
  if (images.length >= 5) profileCompleteness += 20;
  if (chatSessions.length >= 3) profileCompleteness += 20;
  
  return {
    preferredStyles,
    preferredSubjects,
    preferredMoods,
    colorPreferences: [],
    brandKeywords: [],
    creativePatterns: {
      frequentPromptPatterns: extractCommonPatterns(allPrompts),
      averagePromptLength: Math.round(avgPromptLength),
      preferredAspectRatios: aspectRatioFrequency,
      styleFrequency,
      generationTimePreference: 'any'
    },
    recentContext: {
      lastProjectId: lastSession?.projectId || null,
      lastSessionId: lastSession?.id || null,
      recentPrompts: recentPrompts.slice(0, 5),
      recentStyles: recentStyles.slice(0, 5)
    },
    profileCompleteness
  };
}

const STYLE_PATTERNS = [
  'photorealistic', 'digital-art', 'anime', 'oil-painting', 'watercolor', 
  'sketch', '3d-render', 'cinematic', 'realistic', 'artistic', 'illustration',
  'cartoon', 'vintage', 'retro', 'modern', 'minimalist', 'fantasy', 'surreal',
  'noir', 'pop-art', 'impressionist', 'cyberpunk', 'steampunk', 'gothic'
];

function inferStyleFromPrompt(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const style of STYLE_PATTERNS) {
    if (lowerPrompt.includes(style.replace('-', ' ')) || lowerPrompt.includes(style)) {
      return style;
    }
  }
  
  if (/photograph|photo|realistic|real life/i.test(lowerPrompt)) return 'photorealistic';
  if (/anime|manga|japanese animation/i.test(lowerPrompt)) return 'anime';
  if (/oil paint|painted|classical/i.test(lowerPrompt)) return 'oil-painting';
  if (/watercolor|aquarelle/i.test(lowerPrompt)) return 'watercolor';
  if (/sketch|pencil|drawing/i.test(lowerPrompt)) return 'sketch';
  if (/3d|render|cgi/i.test(lowerPrompt)) return '3d-render';
  if (/cinema|film|movie/i.test(lowerPrompt)) return 'cinematic';
  if (/digital|art|artistic/i.test(lowerPrompt)) return 'digital-art';
  
  return null;
}

function extractKeywords(
  prompt: string, 
  subjectMap: Record<string, number>, 
  moodMap: Record<string, number>,
  styleMap: Record<string, number>
): void {
  const subjectPatterns = [
    'portrait', 'landscape', 'product', 'abstract', 'architecture', 'nature',
    'person', 'woman', 'man', 'animal', 'food', 'fashion', 'technology',
    'interior', 'exterior', 'cityscape', 'seascape', 'still life', 'macro'
  ];
  
  const moodPatterns = [
    'dramatic', 'peaceful', 'vibrant', 'moody', 'bright', 'dark', 'warm', 'cool',
    'energetic', 'calm', 'mysterious', 'romantic', 'professional', 'playful',
    'elegant', 'minimalist', 'bold', 'subtle', 'luxurious', 'cozy'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  
  for (const subject of subjectPatterns) {
    if (lowerPrompt.includes(subject)) {
      subjectMap[subject] = (subjectMap[subject] || 0) + 1;
    }
  }
  
  for (const mood of moodPatterns) {
    if (lowerPrompt.includes(mood)) {
      moodMap[mood] = (moodMap[mood] || 0) + 1;
    }
  }
  
  const inferredStyle = inferStyleFromPrompt(prompt);
  if (inferredStyle) {
    styleMap[inferredStyle] = (styleMap[inferredStyle] || 0) + 1;
  }
}

function extractCommonPatterns(prompts: string[]): string[] {
  if (prompts.length < 3) return [];
  
  const patterns: string[] = [];
  
  const hasDetailedDescriptions = prompts.filter(p => p.length > 100).length > prompts.length / 2;
  if (hasDetailedDescriptions) patterns.push("detailed-descriptions");
  
  const hasStyleMentions = prompts.filter(p => 
    /style|aesthetic|vibe|look|feel/i.test(p)
  ).length > prompts.length / 3;
  if (hasStyleMentions) patterns.push("style-focused");
  
  const hasTechnicalTerms = prompts.filter(p => 
    /lighting|composition|bokeh|depth of field|aperture|exposure/i.test(p)
  ).length > prompts.length / 4;
  if (hasTechnicalTerms) patterns.push("technically-oriented");
  
  const hasEmotionalLanguage = prompts.filter(p => 
    /feeling|emotion|mood|atmosphere|evoke|convey/i.test(p)
  ).length > prompts.length / 3;
  if (hasEmotionalLanguage) patterns.push("emotion-driven");
  
  return patterns;
}

export async function updateUserProfileFromActivity(userId: string): Promise<UserPreferences> {
  const analysis = await analyzeUserProfile(userId);
  
  const updatedPreferences = await storage.upsertUserPreferences(userId, {
    preferredStyles: analysis.preferredStyles,
    preferredSubjects: analysis.preferredSubjects,
    preferredMoods: analysis.preferredMoods,
    colorPreferences: analysis.colorPreferences,
    brandKeywords: analysis.brandKeywords,
    creativePatternsJson: analysis.creativePatterns,
    recentContextJson: analysis.recentContext,
    profileCompleteness: analysis.profileCompleteness,
    lastAnalyzedAt: new Date()
  });
  
  return updatedPreferences;
}

export async function getOrCreateUserProfile(userId: string): Promise<UserPreferences> {
  const existing = await storage.getUserPreferences(userId);
  if (existing) {
    const hoursSinceLastAnalysis = existing.lastAnalyzedAt 
      ? (Date.now() - existing.lastAnalyzedAt.getTime()) / (1000 * 60 * 60)
      : Infinity;
    
    if (hoursSinceLastAnalysis < 24) {
      return existing;
    }
  }
  
  return updateUserProfileFromActivity(userId);
}

interface PromptRecommendation {
  id: string;
  prompt: string;
  reason: string;
  category: string;
  tags: string[];
}

const PROMPT_TEMPLATES: Record<string, { template: string; category: string; tags: string[] }[]> = {
  portrait: [
    { template: "Professional headshot of a {subject}, {style} style, {mood} lighting, studio background", category: "Portrait", tags: ["professional", "headshot"] },
    { template: "{mood} portrait photography, {style} aesthetic, natural lighting, bokeh background", category: "Portrait", tags: ["artistic", "bokeh"] },
    { template: "Close-up portrait with {mood} expression, {style} color grading, cinematic depth", category: "Portrait", tags: ["cinematic", "close-up"] },
  ],
  landscape: [
    { template: "{mood} mountain landscape at golden hour, {style} photography, dramatic clouds", category: "Landscape", tags: ["nature", "mountains"] },
    { template: "Serene {subject} scene, {style} style, soft morning light, mist rising", category: "Landscape", tags: ["peaceful", "morning"] },
    { template: "Epic {subject} vista, {style} rendering, {mood} atmosphere, wide angle view", category: "Landscape", tags: ["epic", "wide-angle"] },
  ],
  product: [
    { template: "Professional product shot of a {subject}, {style} lighting, clean white background", category: "Product", tags: ["commercial", "clean"] },
    { template: "Lifestyle product photography, {subject} in natural setting, {mood} mood", category: "Product", tags: ["lifestyle", "natural"] },
    { template: "Minimalist product display, {subject}, {style} aesthetic, soft shadows", category: "Product", tags: ["minimalist", "modern"] },
  ],
  abstract: [
    { template: "{mood} abstract composition, {style} art style, flowing forms and colors", category: "Abstract", tags: ["artistic", "flowing"] },
    { template: "Geometric abstract patterns, {style} design, {mood} color palette", category: "Abstract", tags: ["geometric", "pattern"] },
    { template: "Surreal {mood} dreamscape, {style} rendering, ethereal lighting", category: "Abstract", tags: ["surreal", "dream"] },
  ],
  default: [
    { template: "{mood} scene with beautiful {style} aesthetics, professional quality", category: "General", tags: ["professional", "quality"] },
    { template: "Artistic {style} composition, {mood} atmosphere, stunning visuals", category: "General", tags: ["artistic", "stunning"] },
    { template: "Creative {subject} concept, {style} style, {mood} lighting", category: "General", tags: ["creative", "concept"] },
  ],
};

export function generatePersonalizedPrompts(analysis: AnalysisResult): PromptRecommendation[] {
  const recommendations: PromptRecommendation[] = [];
  
  const topStyle = analysis.preferredStyles[0] || 'artistic';
  const topSubject = analysis.preferredSubjects[0] || 'scene';
  const topMood = analysis.preferredMoods[0] || 'beautiful';
  
  const subjectCategory = analysis.preferredSubjects[0] || 'default';
  const templates = PROMPT_TEMPLATES[subjectCategory] || PROMPT_TEMPLATES.default;
  
  for (let i = 0; i < Math.min(templates.length, 3); i++) {
    const template = templates[i];
    const prompt = template.template
      .replace('{style}', topStyle)
      .replace('{subject}', topSubject)
      .replace('{mood}', topMood);
    
    recommendations.push({
      id: `rec-${i + 1}`,
      prompt,
      reason: `Based on your preference for ${topStyle} style and ${topSubject} subjects`,
      category: template.category,
      tags: [...template.tags, topStyle, topMood],
    });
  }
  
  if (analysis.recentContext.recentPrompts.length > 0) {
    const recentPrompt = analysis.recentContext.recentPrompts[0];
    if (recentPrompt && recentPrompt.length > 10) {
      recommendations.push({
        id: 'rec-continue',
        prompt: `${recentPrompt}, with a new perspective`,
        reason: 'Continue exploring your recent creative direction',
        category: 'Continuation',
        tags: ['recent', 'variation'],
      });
    }
  }
  
  if (analysis.profileCompleteness < 50) {
    recommendations.push({
      id: 'rec-explore',
      prompt: 'Beautiful cinematic landscape at sunset, vibrant colors, professional photography',
      reason: 'Try this popular style to help us learn your preferences',
      category: 'Explore',
      tags: ['popular', 'recommended'],
    });
  }
  
  return recommendations.slice(0, 5);
}
