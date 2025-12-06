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
};

// Images API
export const imagesApi = {
  create: (data: {
    imageUrl: string;
    prompt: string;
    style: string;
    aspectRatio: string;
    generationType: string;
  }) =>
    fetchApi<{ image: any }>("/images", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => fetchApi<{ images: any[] }>("/images"),

  toggleFavorite: (id: string) =>
    fetchApi<{ image: any }>(`/images/${id}/favorite`, { method: "PATCH" }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/images/${id}`, { method: "DELETE" }),
};

// Affiliate API
export const affiliateApi = {
  getStats: () =>
    fetchApi<{
      totalEarnings: number;
      activeReferrals: number;
      commissions: any[];
    }>("/affiliate/stats"),

  withdraw: (data: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    routingNumber?: string;
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
    options: { stylePreset?: string; aspectRatio?: string } = {},
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
