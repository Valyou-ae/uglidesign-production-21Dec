import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imagesApi } from "@/lib/api";

export function useImages() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["images"],
    queryFn: imagesApi.getAll,
  });

  const generateImageMutation = useMutation({
    mutationFn: imagesApi.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });

  const createImageMutation = useMutation({
    mutationFn: imagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => imagesApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: string) => imagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });

  return {
    images: data?.images || [],
    isLoading,
    error,
    refetch,
    generateImage: generateImageMutation.mutateAsync,
    createImage: createImageMutation.mutateAsync,
    toggleFavorite: toggleFavoriteMutation.mutateAsync,
    deleteImage: deleteImageMutation.mutateAsync,
    isGenerating: generateImageMutation.isPending,
    isCreating: createImageMutation.isPending,
  };
}
