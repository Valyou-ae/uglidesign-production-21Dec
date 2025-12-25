// API client for backend communication

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "An error occurred");
  }

  return data;
}

// Auth API
export const authApi = {
  signup: (username: string, email: string, password: string) =>
    fetchApi<{ user: any }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: (username: string, password: string) =>
    fetchApi<{ user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    fetchApi<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => fetchApi<{ user: any }>("/auth/me"),
};

// User/Profile API
export const userApi = {
  updateProfile: (data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    socialLinks?: { label: string; url: string }[];
  }) =>
    fetchApi<{ user: any }>("/user/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  uploadProfilePhoto: async (file: File): Promise<{ profileImageUrl: string; user: any }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const response = await fetch("/api/user/profile/photo", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              photo: base64, 
              fileName: file.name,
              mimeType: file.type 
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            reject(new Error(data.message || "Failed to upload photo"));
            return;
          }
          
          resolve(data);
        } catch (error: any) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  removeProfilePhoto: () =>
    fetchApi<{ user: any }>("/user/profile/photo", {
      method: "DELETE",
    }),

  getStats: () =>
    fetchApi<{ images: number; mockups: number; bgRemoved: number; total: number; credits: number }>("/user/stats"),
};

// Images API
export const imagesApi = {
  create: (data: {
    imageUrl: string;
    prompt: string;
    style?: string;
    aspectRatio?: string;
    generationType?: string;
    isPublic?: boolean;
  }) =>
    fetchApi<{ image: any }>("/images", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: (limit?: number, offset?: number) => 
    fetchApi<{ images: any[]; total: number; hasMore: boolean }>(
      `/images${limit || offset ? `?limit=${limit || 20}&offset=${offset || 0}` : ''}`
    ),

  toggleFavorite: (id: string) =>
    fetchApi<{ image: any }>(`/images/${id}/favorite`, { method: "PATCH" }),

  setVisibility: (id: string, isPublic: boolean) =>
    fetchApi<{ image: any }>(`/images/${id}/visibility`, { 
      method: "PATCH", 
      body: JSON.stringify({ isPublic }) 
    }),

  getPublic: (limit?: number) =>
    fetchApi<{ images: any[] }>(`/images/public${limit ? `?limit=${limit}` : ''}`),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/images/${id}`, { method: "DELETE" }),
};

// Affiliate API
export const affiliateApi = {
  getStats: () =>
    fetchApi<{
      totalEarnings: number;
      pendingPayout: number;
      activeReferrals: number;
      commissions: any[];
      referredUsers: any[];
    }>("/affiliate/stats"),

  withdraw: (data: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    routingNumber: string;
  }) =>
    fetchApi<{ withdrawal: any }>("/affiliate/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getWithdrawals: () => fetchApi<{ withdrawals: any[] }>("/affiliate/withdrawals"),
};

// Generation API Types
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

export interface GenerationEventData {
  agent?: string;
  status?: string;
  message?: string;
  analysis?: PromptAnalysis;
  enhancedPrompt?: string;
  negativePrompts?: string[];
  index?: number;
  imageData?: string;
  mimeType?: string;
  progress?: string;
  completed?: number;
  total?: number;
  score?: { composition: number; detail: number; lighting: number; overall: number };
  error?: string;
  totalImages?: number;
  savedImageId?: string;
  totalCandidates?: number;
  selectedCount?: number;
}

export type GenerationEventType = 
  | "status" 
  | "analysis" 
  | "enhancement" 
  | "image" 
  | "image_error" 
  | "progress" 
  | "candidate" 
  | "score" 
  | "final_image" 
  | "complete" 
  | "error";

export interface GenerationEvent {
  type: GenerationEventType;
  data: GenerationEventData;
}

export type GenerationEventCallback = (event: GenerationEvent) => void;

function parseSSEStream(
  response: Response,
  onEvent: GenerationEventCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      reject(new Error("No response body"));
      return;
    }

    let buffer = "";
    let currentEventType: GenerationEventType = "status";

    const processBuffer = () => {
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === "") {
          continue;
        }

        if (line.startsWith("event: ")) {
          currentEventType = line.slice(7).trim() as GenerationEventType;
        } else if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6);
            const data = JSON.parse(jsonStr);
            onEvent({ type: currentEventType, data });
          } catch (e) {
            console.error("Failed to parse SSE data:", line, e);
          }
        }
      }
    };

    const read = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processBuffer();
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          processBuffer();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    read();
  });
}

// Generation API
export const generateApi = {
  analyze: (prompt: string) =>
    fetchApi<{ analysis: PromptAnalysis }>("/generate/analyze", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  draft: async (
    prompt: string,
    options: { stylePreset?: string; aspectRatio?: string; detail?: string; speed?: "fast" | "quality"; imageCount?: number; isPublic?: boolean } = {},
    onEvent: GenerationEventCallback
  ): Promise<void> => {
    try {
      const response = await fetch("/api/generate/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Generation failed");
      }

      await parseSSEStream(response, onEvent);
    } catch (error) {
      console.error("Draft generation error:", error);
      throw error;
    }
  },

  final: async (
    prompt: string,
    options: {
      stylePreset?: string;
      qualityLevel?: string;
      aspectRatio?: string;
      enableCuration?: boolean;
      detail?: string;
      speed?: "fast" | "quality";
      imageCount?: number;
      isPublic?: boolean;
    } = {},
    onEvent: GenerationEventCallback
  ): Promise<void> => {
    try {
      const response = await fetch("/api/generate/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Generation failed");
      }

      await parseSSEStream(response, onEvent);
    } catch (error) {
      console.error("Final generation error:", error);
      throw error;
    }
  },

  single: (prompt: string, stylePreset?: string) =>
    fetchApi<{
      success: boolean;
      image: { data: string; mimeType: string };
      analysis: PromptAnalysis;
      enhancedPrompt: string;
    }>("/generate/single", {
      method: "POST",
      body: JSON.stringify({ prompt, stylePreset }),
    }),
};

// Mockup API Types
export interface DesignAnalysis {
  dominantColors: string[];
  style: string;
  complexity: string;
  suggestedPlacement: string;
  hasTransparency: boolean;
  designType: string;
}

export interface MockupEventData {
  stage?: string;
  message?: string;
  progress?: number;
  analysis?: DesignAnalysis;
  prompt?: string;
  negativePrompts?: string[];
  imageData?: string;
  mimeType?: string;
  angle?: string;
  color?: string;
  size?: string;
  jobId?: string;
  id?: string;
  error?: string;
  success?: boolean;
  totalGenerated?: number;
  headshotImage?: string;
  suggestion?: string;
  details?: string;
  timestamp?: number;
  type?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount?: number;
}

export type MockupEventType = 
  | "status" 
  | "analysis" 
  | "prompt" 
  | "image" 
  | "image_error" 
  | "job_update"
  | "persona_lock"
  | "persona_lock_failed"
  | "batch_complete"
  | "batch_error"
  | "stream_end"
  | "complete" 
  | "error";

export interface MockupEvent {
  type: MockupEventType;
  data: MockupEventData;
}

export type MockupEventCallback = (event: MockupEvent) => void;

function parseMockupSSEStream(
  response: Response,
  onEvent: MockupEventCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      reject(new Error("No response body"));
      return;
    }

    let buffer = "";
    let eventsReceived = 0;
    let imageEventReceived = false;

    const processCompleteEvents = () => {
      // SSE events are terminated by double newline (\n\n)
      // Only process complete events to handle large data spanning multiple chunks
      const eventDelimiter = "\n\n";
      let delimiterIndex: number;
      
      while ((delimiterIndex = buffer.indexOf(eventDelimiter)) !== -1) {
        const eventBlock = buffer.slice(0, delimiterIndex);
        buffer = buffer.slice(delimiterIndex + eventDelimiter.length);
        
        // Parse the complete event block
        const lines = eventBlock.split("\n");
        let eventType: MockupEventType = "status";
        let dataStr = "";
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("event: ")) {
            eventType = trimmedLine.slice(7).trim() as MockupEventType;
          } else if (trimmedLine.startsWith("data: ")) {
            dataStr = trimmedLine.slice(6);
          }
        }
        
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            eventsReceived++;
            if (eventType === "image") {
              imageEventReceived = true;
              console.log("SSE Image Event received:", { imageDataLength: data.imageData?.length, mimeType: data.mimeType, angle: data.angle, color: data.color });
            } else {
              console.log("SSE Event received:", eventType, data);
            }
            onEvent({ type: eventType, data });
          } catch (e) {
            console.error("Failed to parse mockup SSE data:", dataStr.substring(0, 100) + "...", e);
          }
        }
      }
    };

    const read = async () => {
      try {
        let chunkCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`SSE Stream ended. Chunks: ${chunkCount}, Events: ${eventsReceived}, ImageReceived: ${imageEventReceived}, BufferRemaining: ${buffer.length}`);
            // Process any remaining complete events in buffer
            if (buffer.trim()) {
              processCompleteEvents();
            }
            // Log if there's still unprocessed data (incomplete event)
            if (buffer.length > 0) {
              console.warn("SSE Stream ended with incomplete data in buffer:", buffer.substring(0, 200) + (buffer.length > 200 ? "..." : ""));
            }
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Log large chunks (image data)
          if (chunk.length > 10000) {
            console.log(`SSE Received large chunk #${chunkCount}: ${chunk.length} bytes, buffer now: ${buffer.length} bytes`);
          }
          
          processCompleteEvents();
        }
        resolve();
      } catch (error: any) {
        console.error("SSE Stream read error:", error?.message || error?.name || error, "Type:", typeof error);
        reject(error instanceof Error ? error : new Error(String(error) || "Stream read failed"));
      }
    };

    read();
  });
}

// Mockup API
export interface TextToMockupParsedPrompt {
  designConcept: string;
  designStyle: string;
  productType: string;
  productCategory: string;
  productColor: string;
  sceneType: 'lifestyle' | 'flatlay' | 'model';
  sceneDescription: string;
  modelSex?: 'Male' | 'Female';
  modelAge?: string;
  modelEthnicity?: string;
  seasonalTheme?: string;
  brandStyle?: string;
  additionalDetails?: string;
}

export interface TextToMockupProgressEvent {
  stage: 'parsing' | 'generating_design' | 'preparing_mockup' | 'generating_mockup' | 'complete' | 'error';
  message: string;
  progress: number;
  parsedPrompt?: TextToMockupParsedPrompt;
  designImage?: string;
  mockupImage?: string;
  error?: string;
}

export type TextToMockupEventCallback = (event: TextToMockupProgressEvent) => void;

async function parseTextToMockupSSEStream(
  response: Response,
  onEvent: TextToMockupEventCallback
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  return new Promise((resolve, reject) => {
    const read = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.trim()) {
              processEvents();
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          processEvents();
        }
        resolve();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const processEvents = () => {
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEventType = "progress";
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith(":")) continue;

        if (trimmedLine.startsWith("event:")) {
          currentEventType = trimmedLine.slice(6).trim();
        } else if (trimmedLine.startsWith("data:")) {
          try {
            const data = JSON.parse(trimmedLine.slice(5).trim());
            if (currentEventType === "complete") {
              onEvent({
                stage: "complete",
                message: "Mockup generation complete!",
                progress: 100,
                parsedPrompt: data.parsedPrompt,
                designImage: data.designImage,
                mockupImage: data.mockupImage,
              });
            } else if (currentEventType === "error") {
              onEvent({
                stage: "error",
                message: data.error || "Generation failed",
                progress: 0,
                error: data.error,
              });
            } else {
              onEvent(data as TextToMockupProgressEvent);
            }
          } catch (e) {
            console.warn("Failed to parse SSE data:", trimmedLine);
          }
        }
      }
    };

    read();
  });
}

export const mockupApi = {
  analyze: (designImage: string) =>
    fetchApi<{ analysis: DesignAnalysis }>("/mockup/analyze", {
      method: "POST",
      body: JSON.stringify({ designImage }),
    }),

  textToMockup: async (
    prompt: string,
    options: {
      outputQuality?: 'standard' | 'high' | 'ultra';
      overrides?: Partial<TextToMockupParsedPrompt>;
    } = {},
    onEvent: TextToMockupEventCallback
  ): Promise<void> => {
    try {
      const response = await fetch("/api/mockup/text-to-mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Text-to-mockup generation failed");
      }

      await parseTextToMockupSSEStream(response, onEvent);
    } catch (error) {
      console.error("Text-to-mockup generation error:", error);
      throw error;
    }
  },

  parsePrompt: (prompt: string) =>
    fetchApi<{ parsedPrompt: TextToMockupParsedPrompt }>("/mockup/parse-prompt", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  generate: async (
    designImage: string,
    options: {
      productType?: string;
      productColor?: string;
      scene?: string;
      angle?: string;
      style?: string;
    } = {},
    onEvent: MockupEventCallback
  ): Promise<void> => {
    try {
      const response = await fetch("/api/mockup/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ designImage, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Mockup generation failed");
      }

      await parseMockupSSEStream(response, onEvent);
    } catch (error) {
      console.error("Mockup generation error:", error);
      throw error;
    }
  },

  generateBatch: async (
    designImage: string,
    options: {
      productType?: string;
      productColors?: string[];
      productSizes?: string[];
      angles?: string[];
      scene?: string;
      style?: string;
      modelDetails?: {
        age: string;
        sex: string;
        ethnicity: string;
        modelSize: string;
        customization?: {
          hairStyle?: 'Short' | 'Medium' | 'Long' | 'Bald';
          expression?: 'Neutral' | 'Smiling' | 'Serious' | 'Candid';
          poseSuggestion?: 'Casual' | 'Athletic' | 'Professional' | 'Lifestyle';
        };
      };
      journey?: 'DTG' | 'AOP';
      patternScale?: number;
      isSeamlessPattern?: boolean;
      outputQuality?: 'standard' | 'high' | 'ultra';
    } = {},
    onEvent: MockupEventCallback
  ): Promise<void> => {
    try {
      const response = await fetch("/api/mockup/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ designImage, ...options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Batch mockup generation failed");
      }

      await parseMockupSSEStream(response, onEvent);
    } catch (error) {
      console.error("Batch mockup generation error:", error);
      throw error;
    }
  },

  // Version History
  saveVersion: (data: {
    sessionId: string;
    imageUrl: string;
    thumbnailUrl?: string;
    prompt?: string;
    productName?: string;
    productColor?: string;
    productSize?: string;
    angle?: string;
    metadata?: Record<string, unknown>;
  }) =>
    fetchApi<{ success: boolean; version: MockupVersion }>("/mockup/versions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getVersions: (sessionId: string, filters?: { angle?: string; color?: string; size?: string; productName?: string }) => {
    const params = new URLSearchParams();
    if (filters?.angle) params.set('angle', filters.angle);
    if (filters?.color) params.set('color', filters.color);
    if (filters?.size) params.set('size', filters.size);
    if (filters?.productName) params.set('productName', filters.productName);
    const queryString = params.toString();
    return fetchApi<{ versions: MockupVersion[] }>(
      `/mockup/versions/${sessionId}${queryString ? `?${queryString}` : ''}`
    );
  },

  getVersion: (versionId: string) =>
    fetchApi<{ version: MockupVersion }>(`/mockup/version/${versionId}`),

  getSessions: (limit = 20) =>
    fetchApi<{ sessions: { sessionId: string; latestVersion: MockupVersion; versionCount: number }[] }>(
      `/mockup/sessions?limit=${limit}`
    ),

  deleteVersion: (versionId: string) =>
    fetchApi<{ success: boolean }>(`/mockup/version/${versionId}`, {
      method: "DELETE",
    }),
};

export interface MockupVersion {
  id: string;
  userId: string;
  mockupSessionId: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  prompt?: string | null;
  productName?: string | null;
  productColor?: string | null;
  productSize?: string | null;
  angle?: string | null;
  versionNumber: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// Background Removal API Types
export type BackgroundOutputType = 'transparent' | 'white' | 'color' | 'blur';
export type BackgroundRemovalQuality = 'standard' | 'high' | 'ultra';

export interface BackgroundRemovalOptions {
  outputType: BackgroundOutputType;
  customColor?: string;
  edgeFeathering: number;
  quality: BackgroundRemovalQuality;
}

export interface BackgroundRemovalResult {
  success: boolean;
  imageData?: string;
  mimeType: string;
  processingTimeMs: number;
  outputType: BackgroundOutputType;
  quality: BackgroundRemovalQuality;
  error?: string;
}

export interface BackgroundRemovalPresets {
  outputTypes: Array<{
    id: BackgroundOutputType;
    name: string;
    description: string;
  }>;
  qualityLevels: Array<{
    id: BackgroundRemovalQuality;
    name: string;
    description: string;
    credits: number;
  }>;
  edgeFeathering: {
    min: number;
    max: number;
    default: number;
  };
  defaults: BackgroundRemovalOptions;
}

// Background Removal API Types for Batch Processing
export type BatchImageStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface BatchImageItem {
  id: string;
  originalImage: string;
  status: BatchImageStatus;
  processedImage?: string;
  error?: string;
}

export interface BatchEventData {
  total?: number;
  options?: BackgroundRemovalOptions;
  timestamp?: number;
  current?: number;
  percentage?: number;
  id?: string;
  index?: number;
  success?: boolean;
  result?: BackgroundRemovalResult;
  message?: string;
  successful?: number;
  failed?: number;
  results?: Array<{ id: string; index: number; success: boolean }>;
}

export type BatchEventType = 
  | 'job_start'
  | 'job_progress'
  | 'job_complete'
  | 'batch_complete'
  | 'error';

export interface BatchEvent {
  type: BatchEventType;
  data: BatchEventData;
}

export type BatchEventCallback = (event: BatchEvent) => void;

function parseBackgroundRemovalSSEStream(
  response: Response,
  onEvent: BatchEventCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      reject(new Error("No response body"));
      return;
    }

    let buffer = "";
    let currentEventType: BatchEventType = "job_start";

    const processBuffer = () => {
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === "") {
          continue;
        }

        if (line.startsWith("event: ")) {
          currentEventType = line.slice(7).trim() as BatchEventType;
        } else if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6);
            const data = JSON.parse(jsonStr);
            onEvent({ type: currentEventType, data });
          } catch (e) {
            console.error("Failed to parse batch SSE data:", line, e);
          }
        }
      }
    };

    const read = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              processBuffer();
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          processBuffer();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    read();
  });
}

// Prompt Favorites API
export interface PromptFavorite {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  quality: string | null;
  detail: string | null;
  speed: string | null;
  createdAt: string;
}

export const promptFavoritesApi = {
  create: (data: {
    name: string;
    prompt: string;
    style: string;
    aspectRatio: string;
    quality?: string;
    detail?: string;
    speed?: string;
  }) =>
    fetchApi<{ favorite: PromptFavorite }>("/prompts/favorites", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => fetchApi<{ favorites: PromptFavorite[] }>("/prompts/favorites"),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/prompts/favorites/${id}`, { method: "DELETE" }),
};

// Gallery API
export const galleryApi = {
  getAll: () =>
    fetchApi<{ images: any[] }>("/gallery"),

  getImage: (imageId: string) =>
    fetchApi<any>(`/gallery/${imageId}`),

  likeImage: (imageId: string) =>
    fetchApi<{ liked: boolean; likeCount: number }>(`/gallery/${imageId}/like`, {
      method: "POST",
    }),

  viewImage: (imageId: string) =>
    fetchApi<{ viewCount: number }>(`/gallery/${imageId}/view`, {
      method: "POST",
    }),

  useImage: (imageId: string) =>
    fetchApi<{ useCount: number }>(`/gallery/${imageId}/use`, {
      method: "POST",
    }),
};

// Daily Inspiration API
export interface DailyInspiration {
  id: string;
  title: string;
  prompt: string;
  imageUrl: string | null;
  category: string;
  tags: string[] | null;
  difficulty: string | null;
  featured: boolean | null;
  activeDate: string;
  createdAt: string;
}

export const inspirationsApi = {
  getAll: (limit?: number) =>
    fetchApi<{ inspirations: DailyInspiration[] }>(`/inspirations${limit ? `?limit=${limit}` : ""}`),

  getToday: () =>
    fetchApi<DailyInspiration>("/inspirations/today"),

  getFeatured: (limit?: number) =>
    fetchApi<{ inspirations: DailyInspiration[] }>(`/inspirations/featured${limit ? `?limit=${limit}` : ""}`),
};

// Leaderboard API
export interface LeaderboardUser {
  userId: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  imageCount: number;
  likeCount: number;
  viewCount: number;
  rank: number;
}

export const leaderboardApi = {
  get: (period: 'weekly' | 'monthly' | 'all-time' = 'weekly', limit: number = 5) =>
    fetchApi<{ leaderboard: LeaderboardUser[]; period: string }>(`/leaderboard?period=${period}&limit=${limit}`),
};

export interface PromptRecommendation {
  id: string;
  prompt: string;
  reason: string;
  category: string;
  tags: string[];
}

export const promptsApi = {
  getRecommendations: () =>
    fetchApi<{ recommendations: PromptRecommendation[]; analysis: { profileCompleteness: number } }>("/prompts/recommendations"),
};


// Background Removal API
export const backgroundRemovalApi = {
  removeBackground: async (image: string, options: BackgroundRemovalOptions): Promise<{ success: boolean; result: BackgroundRemovalResult; message?: string }> => {
    const response = await fetch('/api/background-removal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, options }),
      credentials: 'include'
    });
    return response.json();
  },

  removeBatchWithProgress: async (
    images: string[],
    options: BackgroundRemovalOptions,
    onEvent: BatchEventCallback
  ): Promise<void> => {
    try {
      const response = await fetch('/api/background-removal/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ images, options }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Batch processing failed");
      }

      await parseBackgroundRemovalSSEStream(response, onEvent);
    } catch (error) {
      console.error("Batch background removal error:", error);
      throw error;
    }
  },

  getPresets: async (): Promise<BackgroundRemovalPresets> => {
    const response = await fetch('/api/background-removal/presets', { credentials: 'include' });
    return response.json();
  }
};

// Image Folders API
export interface ImageFolder {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export const foldersApi = {
  getAll: () =>
    fetchApi<{ folders: ImageFolder[] }>("/folders"),

  create: (data: { name: string; color?: string }) =>
    fetchApi<{ folder: ImageFolder }>("/folders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; color?: string }) =>
    fetchApi<{ folder: ImageFolder }>(`/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/folders/${id}`, { method: "DELETE" }),

  moveImage: (imageId: string, folderId: string | null) =>
    fetchApi<{ image: any }>(`/images/${imageId}/folder`, {
      method: "PATCH",
      body: JSON.stringify({ folderId }),
    }),
};
