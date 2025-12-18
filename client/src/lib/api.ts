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
    let currentEventType: MockupEventType = "status";

    const processBuffer = () => {
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === "") {
          continue;
        }

        if (line.startsWith("event: ")) {
          currentEventType = line.slice(7).trim() as MockupEventType;
        } else if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6);
            const data = JSON.parse(jsonStr);
            onEvent({ type: currentEventType, data });
          } catch (e) {
            console.error("Failed to parse mockup SSE data:", line, e);
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

// Mockup API
export const mockupApi = {
  analyze: (designImage: string) =>
    fetchApi<{ analysis: DesignAnalysis }>("/mockup/analyze", {
      method: "POST",
      body: JSON.stringify({ designImage }),
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
};

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

// Style Transfer API
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  stylePrompt: string;
  category: string;
}

export interface StyleTransferOptions {
  styleStrength: number;
  preserveContent: number;
  outputQuality: "standard" | "high" | "ultra";
}

export const styleTransferApi = {
  getPresets: () =>
    fetchApi<{ presets: StylePreset[]; byCategory: Record<string, StylePreset[]> }>("/style-transfer/presets"),

  transferWithPreset: async (
    contentImage: string,
    presetId: string,
    options?: Partial<StyleTransferOptions>
  ): Promise<{ success: boolean; image?: string; message?: string }> => {
    const response = await fetch("/api/style-transfer/preset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ contentImage, presetId, options }),
    });
    return response.json();
  },

  transferWithCustomStyle: async (
    contentImage: string,
    styleImage: string,
    options?: Partial<StyleTransferOptions>
  ): Promise<{ success: boolean; image?: string; message?: string }> => {
    const response = await fetch("/api/style-transfer/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ contentImage, styleImage, options }),
    });
    return response.json();
  },
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
