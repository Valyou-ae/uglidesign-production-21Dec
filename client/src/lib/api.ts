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
