import { useState, useRef, useEffect } from "react";
import { 
  Scissors, 
  Upload, 
  Image as ImageIcon, 
  Layers, 
  Link as LinkIcon, 
  Check, 
  Download, 
  RefreshCw, 
  X, 
  Sparkles,
  AlertCircle,
  Wand2,
  ChevronDown,
  RotateCcw,
  Maximize,
  Zap,
  Palette,
  Eye,
  EyeOff,
  Blend,
  Square,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Coins,
  Grid3X3,
  ImagePlus,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  Clock
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getTransferredImage, clearTransferredImage, fetchImageAsDataUrl } from "@/lib/image-transfer";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  backgroundRemovalApi, 
  type BackgroundOutputType, 
  type BackgroundRemovalQuality,
  type BackgroundRemovalOptions,
  type BatchImageStatus,
  type BatchEvent
} from "@/lib/api";
import JSZip from "jszip";

import samplePortrait from "@assets/generated_images/sample_portrait_photo_for_background_removal.png";
import sampleProduct from "@assets/generated_images/sample_product_photo_for_background_removal.png";
import sampleAnimal from "@assets/generated_images/sample_animal_photo_for_background_removal.png";
import sampleCar from "@assets/generated_images/sample_car_photo_for_background_removal.png";
import sampleLogo from "@assets/generated_images/sample_logo_for_background_removal.png";
import sampleFood from "@assets/generated_images/sample_food_photo_for_background_removal.png";

type ProcessingState = "idle" | "configuring" | "processing" | "complete" | "error";
type ProcessingMode = "single" | "batch";

interface BatchImage {
  id: string;
  originalImage: string;
  status: BatchImageStatus;
  processedImage?: string;
  error?: string;
}

const OUTPUT_TYPES: Array<{
  id: BackgroundOutputType;
  name: string;
  description: string;
  icon: React.ElementType;
  preview: string;
}> = [
  { 
    id: 'transparent', 
    name: 'Transparent', 
    description: 'PNG with alpha channel',
    icon: Layers,
    preview: 'bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbC1vcGFjaXR5PSIwLjEiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PC9zdmc+\')]'
  },
  { 
    id: 'white', 
    name: 'White', 
    description: 'Clean white background',
    icon: Square,
    preview: 'bg-white'
  },
  { 
    id: 'color', 
    name: 'Custom Color', 
    description: 'Any solid color',
    icon: Palette,
    preview: 'bg-gradient-to-br from-[#ed5387] to-[#C2185B]'
  },
  { 
    id: 'blur', 
    name: 'Blur', 
    description: 'Bokeh depth effect',
    icon: Blend,
    preview: 'bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2] blur-sm'
  }
];

const QUALITY_LEVELS: Array<{
  id: BackgroundRemovalQuality;
  name: string;
  description: string;
  credits: number;
  badge?: string;
}> = [
  { 
    id: 'standard', 
    name: 'Standard', 
    description: 'Fast processing, good quality',
    credits: 1
  },
  { 
    id: 'high', 
    name: 'High', 
    description: 'Excellent edge detection',
    credits: 2,
    badge: 'Popular'
  },
  { 
    id: 'ultra', 
    name: 'Ultra', 
    description: 'Perfect for hair & fur',
    credits: 4,
    badge: 'Best'
  }
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#F8F8F8', '#1A1A1A',
  '#EC4899', '#8B5CF6', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
];

const CHECKERBOARD_BG = "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbC1vcGFjaXR5PSIwLjEiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat";

const MAX_BATCH_IMAGES = 20;

export default function BackgroundRemover() {
  const [state, setState] = useState<ProcessingState>("idle");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [outputType, setOutputType] = useState<BackgroundOutputType>('transparent');
  const [customColor, setCustomColor] = useState('#FFFFFF');
  const [edgeFeathering, setEdgeFeathering] = useState(2);
  const [quality, setQuality] = useState<BackgroundRemovalQuality>('high');
  
  const [showOriginal, setShowOriginal] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const [batchImages, setBatchImages] = useState<BatchImage[]>([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [batchResults, setBatchResults] = useState<{ successful: number; failed: number }>({ successful: 0, failed: 0 });
  const [showBatchOriginal, setShowBatchOriginal] = useState<Record<string, boolean>>({});
  
  // Auto-detect mode based on number of images
  const mode: ProcessingMode = batchImages.length > 0 ? "batch" : "single";
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const currentCredits = QUALITY_LEVELS.find(q => q.id === quality)?.credits || 1;
  const totalBatchCredits = batchImages.length * currentCredits;

  // Check for transferred image from My Creations on mount
  useEffect(() => {
    const transferred = getTransferredImage();
    if (transferred && transferred.src) {
      const loadTransferredImage = async () => {
        try {
          let imageSrc = transferred.src;
          // If it's a URL (not data URL), fetch and convert to data URL
          if (!imageSrc.startsWith('data:')) {
            imageSrc = await fetchImageAsDataUrl(imageSrc);
          }
          setSelectedImage(imageSrc);
          setState("configuring");
          clearTransferredImage();
          toast({
            title: "Image loaded",
            description: "Your image is ready for background removal.",
          });
        } catch (error) {
          console.error("Failed to load transferred image:", error);
          clearTransferredImage();
        }
      };
      loadTransferredImage();
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // If already in batch mode (batchImages has items), always add to batch
      // Otherwise: 1 file = single mode, multiple = batch mode
      const shouldAddToBatch = batchImages.length > 0 || files.length > 1;
      
      if (shouldAddToBatch) {
        // Add to batch mode
        const remainingSlots = MAX_BATCH_IMAGES - batchImages.length;
        const filesToProcess = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
          toast({
            title: "Limit reached",
            description: `Only ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} can be added. Maximum is ${MAX_BATCH_IMAGES}.`,
            variant: "destructive",
          });
        }

        filesToProcess.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              const newImage: BatchImage = {
                id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                originalImage: event.target.result as string,
                status: 'pending'
              };
              setBatchImages(prev => [...prev, newImage]);
            }
          };
          reader.readAsDataURL(file);
        });

        if (filesToProcess.length > 0) {
          setState("configuring");
        }
      } else {
        // Single file, no existing batch - single mode
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedImage(event.target.result as string);
            setState("configuring");
            setProcessedImage(null);
            setErrorMessage(null);
          }
        };
        reader.readAsDataURL(files[0]);
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSampleSelect = (img: string) => {
    if (mode === "single") {
      setSelectedImage(img);
      setState("configuring");
      setProcessedImage(null);
      setErrorMessage(null);
    } else {
      if (batchImages.length >= MAX_BATCH_IMAGES) {
        toast({
          title: "Limit reached",
          description: `Maximum ${MAX_BATCH_IMAGES} images allowed per batch.`,
          variant: "destructive",
        });
        return;
      }
      const newImage: BatchImage = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalImage: img,
        status: 'pending'
      };
      setBatchImages(prev => [...prev, newImage]);
      setState("configuring");
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    
    try {
      const response = await fetch(urlInput);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (mode === "single") {
            setSelectedImage(event.target.result as string);
            setState("configuring");
            setProcessedImage(null);
            setErrorMessage(null);
          } else {
            if (batchImages.length >= MAX_BATCH_IMAGES) {
              toast({
                title: "Limit reached",
                description: `Maximum ${MAX_BATCH_IMAGES} images allowed per batch.`,
                variant: "destructive",
              });
              return;
            }
            const newImage: BatchImage = {
              id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              originalImage: event.target.result as string,
              status: 'pending'
            };
            setBatchImages(prev => [...prev, newImage]);
            setState("configuring");
          }
        }
      };
      reader.readAsDataURL(blob);
      setUrlInput("");
      setIsUrlDialogOpen(false);
      toast({
        title: "Image Imported",
        description: "Image successfully loaded from URL.",
      });
    } catch {
      if (mode === "single") {
        setSelectedImage(urlInput);
        setState("configuring");
        setProcessedImage(null);
      }
      setIsUrlDialogOpen(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    
    if (files.length === 0) return;
    
    // If already in batch mode (batchImages has items), always add to batch
    // Otherwise: 1 file = single mode, multiple = batch mode
    const shouldAddToBatch = batchImages.length > 0 || files.length > 1;
    
    if (shouldAddToBatch) {
      // Add to batch mode
      const remainingSlots = MAX_BATCH_IMAGES - batchImages.length;
      const filesToProcess = files.slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        toast({
          title: "Limit reached",
          description: `Only ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''} can be added.`,
          variant: "destructive",
        });
      }

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const newImage: BatchImage = {
              id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              originalImage: event.target.result as string,
              status: 'pending'
            };
            setBatchImages(prev => [...prev, newImage]);
          }
        };
        reader.readAsDataURL(file);
      });

      if (filesToProcess.length > 0) {
        setState("configuring");
      }
    } else {
      // Single file, no existing batch - single mode
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setState("configuring");
          setProcessedImage(null);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFromBatch = (id: string) => {
    setBatchImages(prev => prev.filter(img => img.id !== id));
    if (batchImages.length <= 1) {
      setState("idle");
    }
  };

  const clearBatch = () => {
    setBatchImages([]);
    setState("idle");
    setBatchProgress({ current: 0, total: 0, percentage: 0 });
    setBatchResults({ successful: 0, failed: 0 });
    setShowBatchOriginal({});
  };

  const convertToBase64 = async (imageUrl: string): Promise<string> => {
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processImage = async () => {
    if (!selectedImage || state === "processing") return;
    
    setState("processing");
    setProcessingStage("Analyzing image...");
    setErrorMessage(null);

    const options: BackgroundRemovalOptions = {
      outputType,
      customColor: outputType === 'color' ? customColor : undefined,
      edgeFeathering,
      quality
    };

    try {
      setProcessingStage("Preparing image...");
      const base64Image = await convertToBase64(selectedImage);
      
      setProcessingStage("Detecting subject...");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingStage("Generating mask...");
      
      const response = await backgroundRemovalApi.removeBackground(base64Image, options);
      
      if (response.success && response.result?.imageData) {
        setProcessedImage(`data:${response.result.mimeType};base64,${response.result.imageData}`);
        setState("complete");
        toast({
          title: "Background removed!",
          description: `Processed in ${(response.result.processingTimeMs / 1000).toFixed(1)}s`,
          className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400",
        });
      } else {
        throw new Error(response.message || response.result?.error || "Processing failed");
      }
    } catch (error) {
      console.error("Background removal error:", error);
      setState("error");
      const errorMsg = error instanceof Error ? error.message : "Failed to remove background";
      setErrorMessage(errorMsg);
      toast({
        title: "Processing failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const processBatch = async () => {
    if (batchImages.length === 0 || state === "processing") return;
    
    setState("processing");
    setProcessingStage("Preparing batch...");
    setErrorMessage(null);
    setBatchProgress({ current: 0, total: batchImages.length, percentage: 0 });

    setBatchImages(prev => prev.map(img => ({ ...img, status: 'pending' as BatchImageStatus, processedImage: undefined, error: undefined })));

    const options: BackgroundRemovalOptions = {
      outputType,
      customColor: outputType === 'color' ? customColor : undefined,
      edgeFeathering,
      quality
    };

    try {
      setProcessingStage("Converting images...");
      const images = await Promise.all(
        batchImages.map(img => convertToBase64(img.originalImage))
      );

      await backgroundRemovalApi.removeBatchWithProgress(
        images,
        options,
        (event: BatchEvent) => {
          switch (event.type) {
            case 'job_start':
              setProcessingStage(`Processing ${event.data.total} images...`);
              break;
            
            case 'job_progress':
              setBatchProgress({
                current: event.data.current || 0,
                total: event.data.total || batchImages.length,
                percentage: event.data.percentage || 0
              });
              setProcessingStage(`Processing ${event.data.current} of ${event.data.total}...`);
              
              if (event.data.index !== undefined) {
                setBatchImages(prev => prev.map((img, idx) => 
                  idx === event.data.index 
                    ? { ...img, status: 'processing' as BatchImageStatus }
                    : img
                ));
              }
              break;
            
            case 'job_complete':
              if (event.data.index !== undefined) {
                setBatchImages(prev => prev.map((img, idx) => {
                  if (idx === event.data.index) {
                    if (event.data.success && event.data.result?.imageData) {
                      return {
                        ...img,
                        status: 'complete' as BatchImageStatus,
                        processedImage: `data:${event.data.result.mimeType};base64,${event.data.result.imageData}`
                      };
                    } else {
                      return {
                        ...img,
                        status: 'error' as BatchImageStatus,
                        error: event.data.result?.error || 'Processing failed'
                      };
                    }
                  }
                  return img;
                }));
              }
              break;
            
            case 'batch_complete':
              setBatchResults({
                successful: event.data.successful || 0,
                failed: event.data.failed || 0
              });
              setState("complete");
              toast({
                title: "Batch complete!",
                description: `${event.data.successful} of ${event.data.total} images processed successfully.`,
                className: event.data.failed === 0 
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400"
                  : undefined,
              });
              break;
            
            case 'error':
              throw new Error(event.data.message || "Batch processing failed");
          }
        }
      );
    } catch (error) {
      console.error("Batch processing error:", error);
      setState("error");
      const errorMsg = error instanceof Error ? error.message : "Failed to process batch";
      setErrorMessage(errorMsg);
      toast({
        title: "Batch processing failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const downloadImage = (imageData?: string, fileName?: string) => {
    const image = imageData || processedImage;
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image;
    link.download = fileName || `background-removed.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    const successfulImages = batchImages.filter(img => img.status === 'complete' && img.processedImage);
    if (successfulImages.length === 0) {
      toast({
        title: "No images to download",
        description: "No successfully processed images available.",
        variant: "destructive",
      });
      return;
    }

    try {
      const zip = new JSZip();
      
      successfulImages.forEach((img, index) => {
        if (img.processedImage) {
          const base64Data = img.processedImage.split(',')[1];
          if (base64Data) {
            zip.file(`image_${index + 1}.png`, base64Data, { base64: true });
          }
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'background_removed_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "Download started",
        description: `${successfulImages.length} images packaged as ZIP.`,
      });
    } catch (error) {
      console.error("ZIP creation error:", error);
      toast({
        title: "Download failed",
        description: "Failed to create ZIP file.",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setState("idle");
    setSelectedImage(null);
    setProcessedImage(null);
    setErrorMessage(null);
    setProcessingStage("");
    setShowOriginal(false);
    setComparisonPosition(50);
    setBatchImages([]);
    setBatchProgress({ current: 0, total: 0, percentage: 0 });
    setBatchResults({ successful: 0, failed: 0 });
    setShowBatchOriginal({});
  };

  const toggleBatchOriginal = (id: string) => {
    setShowBatchOriginal(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleComparisonMouseDown = () => {
    setIsDraggingSlider(true);
  };

  const handleComparisonMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSlider || !comparisonRef.current) return;
    const rect = comparisonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparisonPosition(percentage);
  };

  const handleComparisonMouseUp = () => {
    setIsDraggingSlider(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDraggingSlider(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const renderStatusIcon = (status: BatchImageStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const renderUploadArea = () => (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in py-2 md:py-10">
      <div className="w-full max-w-[800px]">
        
        <div 
          className="group relative bg-card border-2 border-dashed border-border rounded-[20px] md:rounded-[24px] p-6 md:p-16 text-center transition-all duration-300 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 hover:scale-[1.01] cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          data-testid="upload-zone"
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/png, image/jpeg, image/webp, image/gif"
            multiple
            onChange={handleFileSelect}
            data-testid="file-input"
          />
          
          <div className="mb-4 md:mb-6 relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-colors" />
            <div className="relative">
              <Upload className="h-12 w-12 md:h-20 md:w-20 text-primary relative z-10 transition-transform duration-500 group-hover:-translate-y-2" />
              <div className="absolute -right-2 -bottom-1 md:-right-4 md:-bottom-2 bg-white dark:bg-black rounded-full p-1 md:p-1.5 shadow-lg border border-border">
                <Layers className="h-4 w-4 md:h-6 md:w-6 text-[#1A1A2E]" />
              </div>
            </div>
          </div>
          
          <h2 className="text-lg md:text-2xl font-bold text-foreground mb-2">
            Drag & drop your image(s)
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground mb-4">or click to browse</p>
          <p className="text-sm text-primary font-medium mb-2">
            Upload 1 image or up to {MAX_BATCH_IMAGES} at once
          </p>
          <p className="text-[10px] md:text-sm text-muted-foreground/60 uppercase tracking-wider font-medium">
            PNG, JPG, JPEG, WEBP, GIF
          </p>
        </div>

        <div className="mt-4 md:mt-8 flex justify-center">
          <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="flex flex-col items-center p-3 md:p-5 rounded-xl md:rounded-2xl bg-muted/30 border border-transparent hover:border-primary/30 hover:bg-card transition-all hover:-translate-y-0.5 w-full max-w-xs"
                data-testid="import-url-button"
              >
                <div className="p-1.5 md:p-2 rounded-lg bg-[#9C27B0]/20 dark:bg-[#9C27B0]/10 text-[#9C27B0] mb-2 md:mb-3">
                  <LinkIcon className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <span className="text-xs md:text-sm font-semibold mb-0.5 md:mb-1">Import URL</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">Paste image link</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Image from URL</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <Input 
                  placeholder="https://example.com/image.jpg" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  data-testid="url-input"
                />
                <Button onClick={handleUrlImport} disabled={!urlInput.trim()} data-testid="import-button">
                  Import Image
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 md:mt-10">
          <p className="text-[13px] text-muted-foreground font-medium mb-3 md:mb-4 text-center">Try with a sample</p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2">
            {[samplePortrait, sampleProduct, sampleAnimal, sampleCar, sampleLogo, sampleFood].map((img, i) => (
              <button 
                key={i}
                onClick={() => handleSampleSelect(img)}
                className="h-10 w-10 md:h-14 md:w-14 rounded-full border-2 border-transparent hover:border-primary hover:scale-110 transition-all overflow-hidden shadow-sm"
                data-testid={`sample-image-${i}`}
              >
                <img src={img} alt="Sample" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  const renderBatchGrid = () => (
    <div className="bg-card border border-border rounded-[20px] overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            Batch Images
          </h3>
          <Badge variant="secondary" className="text-xs">
            {batchImages.length} of {MAX_BATCH_IMAGES}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={batchImages.length >= MAX_BATCH_IMAGES || state === "processing"}
          >
            <ImagePlus className="h-4 w-4 mr-1" />
            Add More
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearBatch}
            disabled={state === "processing"}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
        {batchImages.map((img, index) => (
          <div 
            key={img.id}
            className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted/30"
            data-testid={`batch-image-${index}`}
          >
            <img 
              src={showBatchOriginal[img.id] && img.processedImage ? img.originalImage : (img.processedImage || img.originalImage)} 
              alt={`Batch image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs font-medium flex items-center gap-1">
              {renderStatusIcon(img.status)}
              <span>{index + 1}</span>
            </div>
            
            {state !== "processing" && img.status === 'pending' && (
              <button
                onClick={() => removeFromBatch(img.id)}
                className="absolute top-2 right-2 p-1 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                data-testid={`remove-batch-image-${index}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {img.status === 'complete' && img.processedImage && (
              <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 h-7 text-xs bg-black/60 backdrop-blur-sm hover:bg-black/80"
                  onClick={() => toggleBatchOriginal(img.id)}
                >
                  {showBatchOriginal[img.id] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 h-7 text-xs bg-black/60 backdrop-blur-sm hover:bg-black/80"
                  onClick={() => downloadImage(img.processedImage, `image_${index + 1}.png`)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}

            {img.status === 'error' && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{img.error || 'Processing failed'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {img.status === 'complete' && (
              <div className="absolute top-2 right-2 p-1 bg-green-500 rounded-full">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {batchImages.length < MAX_BATCH_IMAGES && state !== "processing" && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
            data-testid="add-more-batch"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs font-medium">Add Image</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderOutputOptions = () => (
    <div className="bg-card border border-border rounded-[20px] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          Output Options
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <Coins className="h-4 w-4 text-purple-500" />
          <span className="font-medium">
            {mode === "single" ? currentCredits : totalBatchCredits} credit{(mode === "single" ? currentCredits : totalBatchCredits) > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        
        <div>
          <Label className="text-sm font-medium mb-3 block">Background Type</Label>
          <div className="grid grid-cols-2 gap-3">
            {OUTPUT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setOutputType(type.id)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    outputType === type.id
                      ? "border-primary bg-primary/5 dark:bg-primary/20"
                      : "border-border hover:border-primary/50 bg-background"
                  )}
                  data-testid={`output-type-${type.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", type.preview)}>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{type.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{type.description}</p>
                    </div>
                  </div>
                  {outputType === type.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {outputType === 'color' && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Custom Color</Label>
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCustomColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      customColor === color ? "border-primary scale-110" : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0"
                data-testid="color-picker"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Edge Feathering</Label>
            <span className="text-sm text-muted-foreground">{edgeFeathering}px</span>
          </div>
          <Slider
            value={[edgeFeathering]}
            onValueChange={(value) => setEdgeFeathering(value[0])}
            min={0}
            max={10}
            step={1}
            className="w-full"
            data-testid="edge-feathering-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Sharp</span>
            <span>Soft</span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Quality Level</Label>
          <div className="space-y-2">
            {QUALITY_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setQuality(level.id)}
                className={cn(
                  "w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                  quality === level.id
                    ? "border-primary bg-primary/5 dark:bg-primary/20"
                    : "border-border hover:border-primary/50 bg-background"
                )}
                data-testid={`quality-${level.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    quality === level.id ? "border-primary" : "border-muted-foreground/30"
                  )}>
                    {quality === level.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{level.name}</span>
                      {level.badge && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {level.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Coins className="h-3.5 w-3.5 text-purple-500" />
                  {level.credits}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto relative pb-20 md:pb-0">
        <div className="p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto min-h-full flex flex-col">
          
          <div className="mb-6 md:mb-8">
            <div className="flex items-center text-[13px] text-muted-foreground mb-2">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span>Background Remover</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-16 mb-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-[#ed5387] to-[#C2185B] bg-clip-text text-transparent">
                    Background Remover
                  </h1>
                  <Scissors className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <Badge className="bg-primary hover:bg-[#C2185B] text-white rounded-full px-2 py-0.5 text-[11px]">
                  AI-Powered
                </Badge>
              </div>

              <div className="flex items-center gap-4 lg:gap-8 opacity-0 lg:opacity-100 animate-fade-in hidden lg:flex">
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Gemini Vision</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Check className="h-3.5 w-3.5" />
                  <span>99.9% Accuracy</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Maximize className="h-3.5 w-3.5" />
                  <span>Any Size</span>
                </div>
              </div>
            </div>
            <p className="text-sm md:text-[15px] text-muted-foreground mt-2">
              Remove backgrounds instantly with AI precision • Powered by Gemini
            </p>
          </div>

          <div className="flex-1 flex flex-col">
            
            {state === "idle" && renderUploadArea()}

            {mode === "single" && (state === "configuring" || state === "processing" || state === "error") && selectedImage && (
              <div className="flex-1 flex flex-col animate-fade-in gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  <div className="bg-card border border-border rounded-[20px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        Original Image
                      </h3>
                      <Button variant="ghost" size="sm" onClick={reset}>
                        <X className="h-4 w-4 mr-1" />
                        Change
                      </Button>
                    </div>
                    <div className={cn("flex-1 min-h-[300px] p-4 flex items-center justify-center", CHECKERBOARD_BG)}>
                      <img 
                        src={selectedImage} 
                        alt="Original" 
                        className="max-h-[400px] max-w-full object-contain shadow-lg rounded-lg"
                        data-testid="original-image"
                      />
                    </div>
                  </div>

                  {renderOutputOptions()}
                </div>

                {state === "error" && errorMessage && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">Processing failed</p>
                      <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setState("configuring")}>
                      Try again
                    </Button>
                  </div>
                )}

                <div className="bg-card border border-border rounded-[16px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                  </div>

                  <Button 
                    onClick={processImage}
                    disabled={state === "processing"}
                    className="h-12 px-8 rounded-[12px] bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:from-[#C2185B] hover:to-[#6A2D1C] text-white font-bold transition-all hover:-translate-y-[1px] hover:shadow-lg hover:shadow-primary/25"
                    data-testid="process-button"
                  >
                    {state === "processing" ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {processingStage}
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        Remove Background
                        <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                          {currentCredits} credit{currentCredits > 1 ? 's' : ''}
                        </Badge>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {mode === "batch" && (state === "configuring" || state === "processing" || state === "error") && batchImages.length > 0 && (
              <div className="flex-1 flex flex-col animate-fade-in gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {renderBatchGrid()}
                  {renderOutputOptions()}
                </div>

                {state === "processing" && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span className="font-medium">{processingStage}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {batchProgress.percentage}%
                      </span>
                    </div>
                    <Progress value={batchProgress.percentage} className="h-2" />
                  </div>
                )}

                {state === "error" && errorMessage && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">Batch processing failed</p>
                      <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setState("configuring")}>
                      Try again
                    </Button>
                  </div>
                )}

                <div className="bg-card border border-border rounded-[16px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground" disabled={state === "processing"}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                  </div>

                  <Button 
                    onClick={processBatch}
                    disabled={state === "processing" || batchImages.length === 0}
                    className="h-12 px-8 rounded-[12px] bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:from-[#C2185B] hover:to-[#6A2D1C] text-white font-bold transition-all hover:-translate-y-[1px] hover:shadow-lg hover:shadow-primary/25"
                    data-testid="process-batch-button"
                  >
                    {state === "processing" ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {processingStage}
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        Process {batchImages.length} Image{batchImages.length !== 1 ? 's' : ''}
                        <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                          {totalBatchCredits} credit{totalBatchCredits > 1 ? 's' : ''}
                        </Badge>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {mode === "single" && state === "complete" && selectedImage && processedImage && (
              <div className="flex-1 flex flex-col animate-fade-in gap-6">
                
                <div 
                  ref={comparisonRef}
                  className="relative bg-card border border-border rounded-[20px] overflow-hidden min-h-[400px] lg:min-h-[500px] cursor-col-resize select-none"
                  onMouseMove={handleComparisonMouseMove}
                  onMouseUp={handleComparisonMouseUp}
                  data-testid="comparison-container"
                >
                  <div className={cn("absolute inset-0", CHECKERBOARD_BG)}>
                    <img 
                      src={processedImage} 
                      alt="Processed" 
                      className="w-full h-full object-contain p-8"
                      data-testid="processed-image"
                    />
                  </div>
                  
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                  >
                    <div className="absolute inset-0 bg-muted">
                      <img 
                        src={selectedImage} 
                        alt="Original" 
                        className="w-full h-full object-contain p-8"
                      />
                    </div>
                  </div>
                  
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
                    style={{ left: `${comparisonPosition}%`, transform: 'translateX(-50%)' }}
                    onMouseDown={handleComparisonMouseDown}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ChevronLeft className="h-4 w-4 text-muted-foreground absolute -left-0.5" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground absolute -right-0.5" />
                    </div>
                  </div>
                  
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 rounded-full text-white text-xs font-medium">
                    Original
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-primary rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Processed
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Background Removed!
                  </motion.div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant={showOriginal ? "default" : "outline"}
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="gap-2"
                    data-testid="toggle-original-button"
                  >
                    {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showOriginal ? "Hide Original" : "View Original"}
                  </Button>
                </div>

                {showOriginal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="bg-card border border-border rounded-[16px] overflow-hidden">
                      <div className="p-3 border-b border-border bg-muted/30">
                        <span className="text-sm font-medium">Original</span>
                      </div>
                      <div className={cn("p-4 min-h-[300px] flex items-center justify-center", CHECKERBOARD_BG)}>
                        <img src={selectedImage} alt="Original" className="max-h-[300px] max-w-full object-contain rounded-lg shadow" />
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-[16px] overflow-hidden">
                      <div className="p-3 border-b border-border bg-primary/5 dark:bg-primary/20">
                        <span className="text-sm font-medium text-primary flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Processed
                        </span>
                      </div>
                      <div className={cn("p-4 min-h-[300px] flex items-center justify-center", CHECKERBOARD_BG)}>
                        <img src={processedImage} alt="Processed" className="max-h-[300px] max-w-full object-contain rounded-lg shadow" />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="bg-card border border-border rounded-[16px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setState("configuring")} 
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-process
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="h-12 px-6 rounded-[12px] bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:from-[#C2185B] hover:to-[#6A2D1C] text-white font-bold"
                        data-testid="download-button"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download PNG
                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => downloadImage()} data-testid="download-png-option">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">PNG (Transparent)</span>
                          <span className="text-xs text-muted-foreground">Best for web & design</span>
                        </div>
                        <Badge variant="secondary" className="ml-auto text-[10px]">Best</Badge>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {mode === "batch" && state === "complete" && batchImages.length > 0 && (
              <div className="flex-1 flex flex-col animate-fade-in gap-6">
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="p-2 bg-green-500 rounded-full">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">Batch processing complete!</p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {batchResults.successful} successful, {batchResults.failed} failed out of {batchImages.length} images
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {batchResults.successful}
                    </Badge>
                    {batchResults.failed > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        {batchResults.failed}
                      </Badge>
                    )}
                  </div>
                </div>

                {renderBatchGrid()}

                <div className="bg-card border border-border rounded-[16px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setBatchImages(prev => prev.map(img => ({ ...img, status: 'pending' as BatchImageStatus, processedImage: undefined, error: undefined })));
                        setState("configuring");
                      }} 
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-process All
                    </Button>
                  </div>

                  <Button 
                    onClick={downloadAllAsZip}
                    disabled={batchResults.successful === 0}
                    className="h-12 px-6 rounded-[12px] bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:from-[#C2185B] hover:to-[#6A2D1C] text-white font-bold"
                    data-testid="download-all-zip"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Download All as ZIP
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                      {batchResults.successful} files
                    </Badge>
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
      
      <AnimatePresence>
        {mode === "single" && state === "processing" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-[24px] shadow-2xl p-10 max-w-[400px] w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#ed5387] to-[#C2185B]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 30, ease: "linear" }}
                />
              </div>
              
              <div className="mb-8 relative inline-block">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="relative z-10"
                >
                  <Scissors className="h-16 w-16 text-primary" />
                </motion.div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{processingStage}</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Our AI is precisely separating the subject from the background.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span>Powered by Gemini Vision</span>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => {
                  setState("configuring");
                  setProcessingStage("");
                }} 
                className="text-muted-foreground hover:text-destructive"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
