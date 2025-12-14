import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { imagesApi } from "@/lib/api";

const PAGE_SIZE = 20;

export function useImages() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["images"],
    queryFn: ({ pageParam = 0 }) => imagesApi.getAll(PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
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

  // Optimized: Memoize flatMap to prevent recalculation on every render
  const allImages = useMemo(
    () => data?.pages.flatMap(page => page.images) || [],
    [data?.pages]
  );
  const total = data?.pages[0]?.total || 0;

  return {
    images: allImages,
    total,
    isLoading,
    error,
    createImage: createImageMutation.mutateAsync,
    toggleFavorite: toggleFavoriteMutation.mutateAsync,
    deleteImage: deleteImageMutation.mutateAsync,
    isCreating: createImageMutation.isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
