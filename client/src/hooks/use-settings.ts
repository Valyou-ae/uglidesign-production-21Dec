import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useAuth } from "./use-auth";

export type ProfileData = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  socialLinks?: { label: string; url: string }[];
};

export function useSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], { user: data.user });
    },
  });

  return {
    profile: {
      displayName: user?.displayName || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      socialLinks: user?.socialLinks || [],
    },
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error?.message,
  };
}
