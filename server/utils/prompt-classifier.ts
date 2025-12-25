/**
 * Classifies prompts as simple or complex based on heuristics.
 * Simple prompts can skip analysis and enhancement for faster generation.
 */

export interface PromptClassification {
  isSimple: boolean;
  reason: string;
  confidence: number;
}

/**
 * Determines if a prompt is simple enough to skip analysis/enhancement.
 * 
 * A prompt is considered simple if:
 * - It's short (< 50 characters)
 * - Doesn't request text/words in the image
 * - Doesn't have complex instructions
 * 
 * @param prompt The user's prompt
 * @returns True if the prompt is simple
 */
export function isSimplePrompt(prompt: string): boolean {
  const classification = classifyPrompt(prompt);
  return classification.isSimple;
}

/**
 * Provides detailed classification with reasoning.
 * Useful for logging and debugging.
 */
export function classifyPrompt(prompt: string): PromptClassification {
  const trimmed = prompt.trim();
  const lowerCase = trimmed.toLowerCase();
  const length = trimmed.length;

  // Check for text-related keywords
  const textKeywords = ['text', 'words', 'writing', 'sign', 'label', 'letters', 'font', 'typography'];
  const hasTextRequest = textKeywords.some(keyword => lowerCase.includes(keyword));

  if (hasTextRequest) {
    return {
      isSimple: false,
      reason: 'Contains text-related keywords',
      confidence: 0.9,
    };
  }

  // Check for complex instructions
  const complexKeywords = ['detailed', 'intricate', 'complex', 'elaborate', 'sophisticated'];
  const hasComplexInstructions = complexKeywords.some(keyword => lowerCase.includes(keyword));

  if (hasComplexInstructions) {
    return {
      isSimple: false,
      reason: 'Contains complex instruction keywords',
      confidence: 0.8,
    };
  }

  // Check length
  if (length > 50) {
    return {
      isSimple: false,
      reason: `Prompt is long (${length} characters)`,
      confidence: 0.7,
    };
  }

  // Simple prompt
  return {
    isSimple: true,
    reason: `Short (${length} chars) and straightforward`,
    confidence: 0.8,
  };
}
