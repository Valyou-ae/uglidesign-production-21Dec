import { useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchUser() {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error("Failed to fetch user");
  }
  
  const data = await response.json();
  return data.user;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include" 
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    // Redirect first - the page reload will naturally clear the cache
    window.location.href = "/";
  };

  const refreshAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    return refetch();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role ?? null,
    error,
    login,
    logout,
    refreshAuth,
  };
}
