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
  
  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = () => {
    queryClient.clear();
    window.location.href = "/api/logout";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
  };
}
