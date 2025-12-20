import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Upload,
  Image as ImageIcon,
  Wand2,
  Download,
  RefreshCw,
  X,
  Sparkles,
  SlidersHorizontal,
  Check,
  Loader2,
  ArrowRight,
  Paintbrush,
  ChevronDown,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { styleTransferApi, type StylePreset } from "@/lib/api";
import { getTransferredImage, clearTransferredImage, fetchImageAsDataUrl } from "@/lib/image-transfer";

type TransferMode = "preset" | "custom";

interface UploadedImage {
  file: File | null;
  previewUrl: string;
  base64: string;
}

const categoryLabels: Record<string, string> = {
  classical: "Classical Masters",
  modern: "Modern & Pop",
  traditional: "Traditional Media",
  digital: "Digital Art",
  decorative: "Decorative",
};

const categoryIcons: Record<string, string> = {
  classical: "🎨",
  modern: "🌈",
  traditional: "✏️",
  digital: "💻",
  decorative: "🪟",
};

export default function StyleTransferPage() {
  const { toast } = useToast();
  const contentInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<TransferMode>("preset");
  const [contentImage, setContentImage] = useState<UploadedImage | null>(null);
  const [styleImage, setStyleImage] = useState<UploadedImage | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [styleStrength, setStyleStrength] = useState(70);
  const [preserveContent, setPreserveContent] = useState(60);

  const { data: presetsData, isLoading: loadingPresets } = useQuery({
    queryKey: ["/api/style-transfer/presets"],
    queryFn: styleTransferApi.getPresets,
    staleTime: 10 * 60 * 1000,
  });

  const presets = presetsData?.presets || [];
  const presetsByCategory = presetsData?.byCategory || {};

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
          // Extract base64 from data URL
          const base64 = imageSrc.split(",")[1] || "";
          setContentImage({
            file: null,
            previewUrl: imageSrc,
            base64,
          });
          clearTransferredImage();
          toast({
            title: "Image loaded",
            description: "Your image is ready for style transfer.",
          });
        } catch (error) {
          console.error("Failed to load transferred image:", error);
          clearTransferredImage();
        }
      };
      loadTransferredImage();
    }
  }, []);

  const handleImageUpload = async (
    file: File,
    setter: (img: UploadedImage) => void
  ) => {
    const previewUrl = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setter({ file, previewUrl, base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleContentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, setContentImage);
      setResultImage(null);
    }
    e.target.value = "";
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, setStyleImage);
      setResultImage(null);
    }
    e.target.value = "";
  };

  const clearContentImage = () => {
    if (contentImage?.previewUrl) {
      URL.revokeObjectURL(contentImage.previewUrl);
    }
    setContentImage(null);
    setResultImage(null);
  };

  const clearStyleImage = () => {
    if (styleImage?.previewUrl) {
      URL.revokeObjectURL(styleImage.previewUrl);
    }
    setStyleImage(null);
    setResultImage(null);
  };

  const selectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setResultImage(null);
  };

  const canTransfer = contentImage && (mode === "preset" ? selectedPreset : styleImage);

  const handleTransfer = async () => {
    if (!contentImage) return;

    setIsProcessing(true);
    setResultImage(null);

    try {
      const options = {
        styleStrength: styleStrength / 100,
        preserveContent: preserveContent / 100,
        outputQuality: "high" as const,
      };

      let result;
      if (mode === "preset" && selectedPreset) {
        result = await styleTransferApi.transferWithPreset(
          contentImage.base64,
          selectedPreset,
          options
        );
      } else if (mode === "custom" && styleImage) {
        result = await styleTransferApi.transferWithCustomStyle(
          contentImage.base64,
          styleImage.base64,
          options
        );
      }

      if (result?.success && result.image) {
        setResultImage(result.image);
        toast({
          title: "Style transferred!",
          description: "Your artistic transformation is complete.",
        });
      } else {
        throw new Error(result?.message || "Style transfer failed");
      }
    } catch (error) {
      console.error("Style transfer error:", error);
      toast({
        title: "Transfer failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;

    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `style-transfer-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedPresetData = presets.find((p) => p.id === selectedPreset);

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Style Transfer</h1>
                <p className="text-sm text-muted-foreground">
                  Apply artistic styles from one image to another
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px]">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <Tabs value={mode} onValueChange={(v) => setMode(v as TransferMode)}>
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="preset" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Preset Styles
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Custom Style
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      Content Image
                      <span className="text-muted-foreground">(Your photo)</span>
                    </Label>
                    <div
                      className={cn(
                        "relative aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                        contentImage
                          ? "border-[#ed5387]/50 bg-[#ed5387]/5"
                          : "border-border hover:border-[#ed5387]/50 hover:bg-muted/30"
                      )}
                      onClick={() => contentInputRef.current?.click()}
                      data-testid="content-image-upload"
                    >
                      <input
                        ref={contentInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleContentUpload}
                      />
                      {contentImage ? (
                        <>
                          <img
                            src={contentImage.previewUrl}
                            alt="Content"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearContentImage();
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                            data-testid="clear-content-image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                          <Upload className="h-10 w-10" />
                          <span className="text-sm font-medium">Upload content image</span>
                          <span className="text-xs">Click or drag to upload</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {mode === "custom" ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Paintbrush className="h-4 w-4 text-muted-foreground" />
                        Style Reference
                        <span className="text-muted-foreground">(Art to mimic)</span>
                      </Label>
                      <div
                        className={cn(
                          "relative aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                          styleImage
                            ? "border-purple-500/50 bg-purple-500/5"
                            : "border-border hover:border-purple-500/50 hover:bg-muted/30"
                        )}
                        onClick={() => styleInputRef.current?.click()}
                        data-testid="style-image-upload"
                      >
                        <input
                          ref={styleInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleStyleUpload}
                        />
                        {styleImage ? (
                          <>
                            <img
                              src={styleImage.previewUrl}
                              alt="Style"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearStyleImage();
                              }}
                              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                              data-testid="clear-style-image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Paintbrush className="h-10 w-10" />
                            <span className="text-sm font-medium">Upload style image</span>
                            <span className="text-xs">Artwork whose style to apply</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        Result Preview
                      </Label>
                      <div className="relative aspect-square rounded-xl border border-border bg-muted/20 overflow-hidden">
                        {isProcessing ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-[#ed5387]" />
                            <span className="text-sm text-muted-foreground">Applying style...</span>
                          </div>
                        ) : resultImage ? (
                          <>
                            <img
                              src={resultImage}
                              alt="Result"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-3 right-3 flex gap-2">
                              <Button
                                size="sm"
                                onClick={downloadResult}
                                className="bg-[#ed5387] hover:bg-[#C2185B] text-white"
                                data-testid="download-result"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Wand2 className="h-10 w-10" />
                            <span className="text-sm font-medium">Result will appear here</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {mode === "preset" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Choose an Artistic Style</Label>
                      {selectedPresetData && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          {selectedPresetData.name}
                        </Badge>
                      )}
                    </div>

                    {loadingPresets ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
                          <div key={category} className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <span>{categoryIcons[category] || "🎨"}</span>
                              {categoryLabels[category] || category}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {categoryPresets.map((preset) => (
                                <motion.button
                                  key={preset.id}
                                  onClick={() => selectPreset(preset.id)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={cn(
                                    "relative p-3 rounded-xl border-2 transition-all text-left",
                                    selectedPreset === preset.id
                                      ? "border-purple-500 bg-purple-500/10"
                                      : "border-border hover:border-purple-500/50 hover:bg-muted/30"
                                  )}
                                  data-testid={`preset-${preset.id}`}
                                >
                                  {selectedPreset === preset.id && (
                                    <div className="absolute top-2 right-2">
                                      <Check className="h-4 w-4 text-purple-500" />
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    <p className="font-medium text-sm truncate">{preset.name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {preset.description}
                                    </p>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {mode === "custom" && resultImage && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      Result
                    </Label>
                    <div className="relative aspect-video max-w-2xl rounded-xl border border-border bg-muted/20 overflow-hidden">
                      <img
                        src={resultImage}
                        alt="Result"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={downloadResult}
                          className="bg-[#ed5387] hover:bg-[#C2185B] text-white"
                          data-testid="download-result-custom"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="hidden lg:block border-l border-border/50 bg-muted/10">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Transfer Settings
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Style Strength</Label>
                          <span className="text-sm text-muted-foreground">{styleStrength}%</span>
                        </div>
                        <Slider
                          value={[styleStrength]}
                          onValueChange={([v]) => setStyleStrength(v)}
                          min={10}
                          max={100}
                          step={5}
                          className="w-full"
                          data-testid="style-strength-slider"
                        />
                        <p className="text-xs text-muted-foreground">
                          How strongly to apply the artistic style
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Content Preservation</Label>
                          <span className="text-sm text-muted-foreground">{preserveContent}%</span>
                        </div>
                        <Slider
                          value={[preserveContent]}
                          onValueChange={([v]) => setPreserveContent(v)}
                          min={10}
                          max={100}
                          step={5}
                          className="w-full"
                          data-testid="content-preservation-slider"
                        />
                        <p className="text-xs text-muted-foreground">
                          How much to keep the original details
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleTransfer}
                    disabled={!canTransfer || isProcessing}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    data-testid="transfer-button"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transferring Style...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Apply Style Transfer
                      </>
                    )}
                  </Button>

                  {selectedPresetData && mode === "preset" && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                      <h4 className="font-medium text-sm">{selectedPresetData.name}</h4>
                      <p className="text-xs text-muted-foreground">{selectedPresetData.description}</p>
                    </div>
                  )}

                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                      <span className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        How It Works
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      <div className="text-xs text-muted-foreground space-y-2">
                        <p>
                          <strong>Preset Styles:</strong> Choose from famous art styles like Van Gogh, Monet, or modern aesthetics.
                        </p>
                        <p>
                          <strong>Custom Style:</strong> Upload any artwork and transfer its unique style to your photo.
                        </p>
                        <p>
                          <strong>Tips:</strong> Higher style strength creates more dramatic effects. Higher content preservation keeps more original details.
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border">
          <Button
            onClick={handleTransfer}
            disabled={!canTransfer || isProcessing}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            data-testid="transfer-button-mobile"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Apply Style
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
