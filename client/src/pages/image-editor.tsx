import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { 
  Upload, 
  Sparkles, 
  Download, 
  Rocket,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  Check,
  AlertCircle,
  Wand2,
  Image as ImageIcon,
  Palette,
  Sun,
  Eraser,
  Zap,
  Brush,
  Focus,
  Contrast,
  Droplets,
  Layers,
  Scissors,
  Maximize,
  Minimize
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";

type EditVersion = {
  id: string;
  imageUrl: string;
  prompt: string;
  versionNumber: number;
  createdAt: string;
};

type RecentImage = {
  id: string;
  imageUrl: string;
  prompt: string;
  generationType: string;
  createdAt: string;
};

type EditStatus = "idle" | "uploading" | "editing" | "complete" | "error";

export default function ImageEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { credits, invalidate: refreshCredits } = useCredits();
  const queryClient = useQueryClient();
  const searchString = useSearch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionScrollRef = useRef<HTMLDivElement>(null);
  
  const [status, setStatus] = useState<EditStatus>("idle");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [rootImageId, setRootImageId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [versions, setVersions] = useState<EditVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const loadedImageIdRef = useRef<string | null>(null);
  const recentScrollRef = useRef<HTMLDivElement>(null);

  const { data: recentImages, isLoading: isLoadingRecent } = useQuery<RecentImage[]>({
    queryKey: ["recent-images-for-editor"],
    queryFn: async () => {
      const response = await fetch("/api/images/recent?sources=image,mockup,background_removal&limit=12", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch recent images");
      const data = await response.json();
      return data.images;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const fetchVersions = useCallback(async (imageId: string, selectLatest = true) => {
    setIsLoadingVersions(true);
    try {
      const response = await fetch(`/api/images/${imageId}/versions`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedVersions: EditVersion[] = data.versions.map((v: any) => ({
          id: v.id,
          imageUrl: `/api/images/${v.id}/image`,
          prompt: v.editPrompt || "Original",
          versionNumber: v.versionNumber ?? 0,
          createdAt: v.createdAt,
        }));
        setVersions(fetchedVersions);
        if (fetchedVersions.length > 0 && selectLatest) {
          setSelectedVersionIndex(fetchedVersions.length - 1);
          const latestVersion = fetchedVersions[fetchedVersions.length - 1];
          setCurrentImage(latestVersion.imageUrl);
          setCurrentImageId(latestVersion.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setIsLoadingVersions(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const imageIdFromUrl = params.get("imageId");
    
    if (!imageIdFromUrl || !user) return;
    if (loadedImageIdRef.current === imageIdFromUrl) return;
    
    loadedImageIdRef.current = imageIdFromUrl;
    setRootImageId(imageIdFromUrl);
    fetchVersions(imageIdFromUrl);
  }, [searchString, user, fetchVersions]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setCurrentImage(imageUrl);
        
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/image-editor/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Upload failed");
        }

        const data = await response.json();
        const imageApiUrl = `/api/images/${data.imageId}/image`;
        setCurrentImageId(data.imageId);
        setCurrentImage(imageApiUrl);
        setRootImageId(data.imageId);
        
        await fetchVersions(data.imageId);
        
        setStatus("idle");
        
        toast({
          title: "Image uploaded",
          description: "You can now edit your image with prompts",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  }, [toast, fetchVersions]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleEdit = async () => {
    if (!currentImageId || !editPrompt.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload an image and enter an edit prompt",
        variant: "destructive",
      });
      return;
    }

    if (credits !== null && credits < 1) {
      toast({
        title: "Insufficient credits",
        description: "You need at least 1 credit to edit an image",
        variant: "destructive",
      });
      return;
    }

    setStatus("editing");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/image-editor/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imageId: currentImageId,
          prompt: editPrompt.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Edit failed");
      }

      const data = await response.json();
      
      setCurrentImage(data.imageUrl);
      setCurrentImageId(data.imageId);
      setEditPrompt("");
      setStatus("complete");
      refreshCredits();
      
      if (rootImageId) {
        await fetchVersions(rootImageId);
      }
      
      toast({
        title: "Edit complete",
        description: "Your image has been edited successfully",
      });

      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Edit failed");
      toast({
        title: "Edit failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const selectVersion = (index: number) => {
    if (index >= 0 && index < versions.length) {
      setSelectedVersionIndex(index);
      setCurrentImage(versions[index].imageUrl);
      setCurrentImageId(versions[index].id);
    }
  };

  const scrollVersions = (direction: "left" | "right") => {
    if (versionScrollRef.current) {
      const scrollAmount = 80;
      versionScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleDownload = async () => {
    if (!currentImageId) return;
    
    try {
      const response = await fetch(`/api/images/${currentImageId}/image`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-image-v${selectedVersionIndex}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Image saved to your device",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const resetEditor = () => {
    setCurrentImage(null);
    setCurrentImageId(null);
    setRootImageId(null);
    setVersions([]);
    setSelectedVersionIndex(0);
    setEditPrompt("");
    setStatus("idle");
    setErrorMessage(null);
    loadedImageIdRef.current = null;
  };

  const selectRecentImage = async (image: RecentImage) => {
    setRootImageId(image.id);
    setCurrentImageId(image.id);
    setCurrentImage(image.imageUrl);
    loadedImageIdRef.current = image.id;
    await fetchVersions(image.id);
  };

  const scrollRecent = (direction: "left" | "right") => {
    if (recentScrollRef.current) {
      const scrollAmount = 200;
      recentScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Compact Header */}
        <div className="flex-shrink-0 h-14 px-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Image Editor</h1>
          </div>
          <div className="flex items-center gap-3">
            {credits !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{credits}</span>
              </div>
            )}
            {currentImage && (
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDownload}
                        className="h-8 w-8"
                        data-testid="button-download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetEditor}
                        className="h-8 w-8"
                        data-testid="button-reset"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start over</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Fixed Height */}
        <div className="flex-1 flex min-h-0">
          {!currentImage ? (
            /* Upload State with Recent Images */
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
              {/* Upload Zone */}
              <div
                className={cn(
                  "flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-0",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  data-testid="input-file"
                />
                
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#ed5387]/20 to-[#9C27B0]/20 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-medium text-foreground">
                      Drop your image here
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      or click to browse (PNG, JPG, WEBP up to 10MB)
                    </p>
                  </div>
                </motion.div>
                
                {status === "uploading" && (
                  <div className="mt-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                )}
              </div>

              {/* Recent Creations Strip */}
              {recentImages && recentImages.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Recent Creations</span>
                      <span className="text-xs text-muted-foreground">({recentImages.length})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => scrollRecent("left")}
                        data-testid="button-recent-scroll-left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => scrollRecent("right")}
                        data-testid="button-recent-scroll-right"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    ref={recentScrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {recentImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => selectRecentImage(img)}
                        className="flex-shrink-0 group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                        data-testid={`recent-image-${img.id}`}
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.prompt || "Recent image"}
                          className="h-20 w-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <Wand2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5">
                          <span className="text-[10px] text-white/90 capitalize truncate block">
                            {img.generationType === "background_removal" ? "BG Remove" : img.generationType}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state for recent images */}
              {isLoadingRecent && (
                <div className="flex-shrink-0 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading recent creations...</span>
                </div>
              )}

              {/* Empty state for recent images */}
              {!isLoadingRecent && recentImages && recentImages.length === 0 && (
                <div className="flex-shrink-0 flex items-center gap-2 text-muted-foreground" data-testid="empty-recent-images">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">No recent creations yet. Generate some images first!</span>
                </div>
              )}
            </div>
          ) : (
            /* Editor State - Two Column Layout */
            <div className="flex-1 flex min-h-0">
              {/* Left: Image Preview */}
              <div className="flex-1 p-4 flex flex-col min-h-0">
                <div className="flex-1 relative bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImage}
                      src={currentImage}
                      alt="Current edit"
                      className="max-w-full max-h-full object-contain"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      data-testid="img-current"
                    />
                  </AnimatePresence>
                  
                  {status === "editing" && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#ed5387] to-[#9C27B0] animate-pulse" />
                          <Sparkles className="h-6 w-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <span className="text-sm font-medium">Editing...</span>
                      </div>
                    </div>
                  )}
                  
                  {status === "complete" && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right: Controls Panel */}
              <div className="w-80 border-l border-border flex flex-col min-h-0">
                {/* Version History */}
                {versions.length > 0 && (
                  <div className="flex-shrink-0 p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Versions ({versions.length})
                      </span>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => scrollVersions("left")}
                          data-testid="button-scroll-left"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => scrollVersions("right")}
                          data-testid="button-scroll-right"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div
                      ref={versionScrollRef}
                      className="flex gap-3 overflow-x-auto py-2 px-1"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {isLoadingVersions ? (
                        <div className="flex items-center justify-center w-full py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        versions.map((version, index) => {
                          const promptPreview = version.versionNumber === 0 
                            ? "Original" 
                            : version.prompt.length > 18 
                              ? version.prompt.slice(0, 18) + "..." 
                              : version.prompt;
                          return (
                            <motion.div
                              key={version.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className={cn(
                                "flex-shrink-0 w-16 cursor-pointer transition-all",
                                selectedVersionIndex === index 
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg" 
                                  : "opacity-60 hover:opacity-100"
                              )}
                              onClick={() => selectVersion(index)}
                              data-testid={`version-${index}`}
                            >
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={version.imageUrl}
                                  alt={`V${version.versionNumber}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-[9px] text-center mt-1 text-muted-foreground truncate" title={version.prompt}>
                                {promptPreview}
                              </p>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Selected Version Details */}
                    {selectedVersionIndex !== null && versions[selectedVersionIndex] && (
                      <div className="mt-3 p-2 bg-muted/50 rounded-lg" data-testid="selected-version-details">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-foreground">
                            V{versions[selectedVersionIndex].versionNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {versions[selectedVersionIndex].versionNumber === 0 ? "Original upload" : "Edit"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground break-words leading-relaxed">
                          {versions[selectedVersionIndex].versionNumber === 0 
                            ? "This is the original uploaded image" 
                            : versions[selectedVersionIndex].prompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Prompt Section */}
                <div className="flex-1 p-3 flex flex-col min-h-0">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Edit Prompt
                  </span>
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="relative">
                      <Input
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="Describe your edit..."
                        className="pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEdit();
                          }
                        }}
                        disabled={status === "editing"}
                        data-testid="input-edit-prompt"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleEdit}
                              disabled={!editPrompt.trim() || status === "editing"}
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-gradient-to-r from-[#ed5387] to-[#9C27B0] hover:from-[#ed5387]/90 hover:to-[#9C27B0]/90 text-white"
                              data-testid="button-edit"
                            >
                              {status === "editing" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Rocket className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Apply edit (1 credit)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {/* Fix & Enhance Quick Actions */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Eraser className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Fix & Enhance</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Remove background", icon: Eraser },
                          { label: "Upscale quality", icon: Maximize },
                          { label: "Fix colors", icon: Palette },
                          { label: "Remove objects", icon: Scissors },
                        ].map(({ label, icon: Icon }) => (
                          <motion.button
                            key={label}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setEditPrompt(label)}
                            className="group flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-foreground transition-all"
                            disabled={status === "editing"}
                            data-testid={`quick-action-${label.toLowerCase().replace(' ', '-')}`}
                          >
                            <Icon className="h-3 w-3 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                            {label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {errorMessage && (
                      <div className="flex items-center gap-1.5 text-destructive text-xs">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips Footer */}
                <div className="flex-shrink-0 p-3 border-t border-border bg-muted/30">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tip: Be specific with your edits. For example, "Make the sky more vibrant" works better than "Change the sky".
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
