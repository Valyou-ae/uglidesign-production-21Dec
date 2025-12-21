import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Square, 
  RectangleHorizontal, 
  RectangleVertical,
  Zap,
  ChevronDown,
  Settings2,
  Loader2,
  Palette,
  Check,
  Camera,
  Clapperboard,
  Tv,
  Droplets,
  Monitor,
  Circle,
  Sunset,
  Sword,
  Shapes,
  Box,
  Pencil,
  Minus,
  Plus,
  Smartphone,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useLoginPopup } from "@/components/login-popup";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STYLE_PRESETS = [
  { id: "auto", name: "Auto", icon: Sparkles },
  { id: "photo", name: "Photorealistic", icon: Camera },
  { id: "cinematic", name: "Cinematic", icon: Clapperboard },
  { id: "anime", name: "Anime/Manga", icon: Tv },
  { id: "oil", name: "Oil Painting", icon: Palette },
  { id: "watercolor", name: "Watercolor", icon: Droplets },
  { id: "digital", name: "Digital Art", icon: Monitor },
  { id: "minimal", name: "Minimalist", icon: Circle },
  { id: "retro", name: "Retrowave", icon: Sunset },
  { id: "fantasy", name: "Dark Fantasy", icon: Sword },
  { id: "pop", name: "Pop Art", icon: Shapes },
  { id: "iso", name: "Isometric 3D", icon: Box },
  { id: "sketch", name: "Pencil Sketch", icon: Pencil },
];

const QUALITY_PRESETS = [
  { id: "draft", name: "Draft", icon: Zap },
  { id: "premium", name: "Premium", icon: Sparkles },
];

const SPEED_OPTIONS = [
  { id: "fast", name: "Fast", icon: Zap },
  { id: "quality", name: "Quality", icon: Sparkles },
];

const ASPECT_RATIOS = [
  { id: "1:1", name: "Square", icon: Square },
  { id: "16:9", name: "Landscape", icon: RectangleHorizontal },
  { id: "9:16", name: "Portrait", icon: RectangleVertical },
  { id: "4:3", name: "Classic", icon: Monitor },
  { id: "3:4", name: "Tall", icon: Smartphone },
];

const DETAIL_LEVELS = [
  { id: "low", name: "Low", icon: Minus },
  { id: "medium", name: "Medium", icon: Circle },
  { id: "high", name: "High", icon: Plus },
];

const countOptions = [
  { id: "1", label: "1", disabled: false },
  { id: "2", label: "2", disabled: true },
  { id: "4", label: "4", disabled: true },
];

type DropdownType = "style" | "count" | "quality" | "speed" | "ratio" | "detail" | "styleExpanded" | "countExpanded" | null;

interface FloatingPromptBarProps {
  onImageGenerated?: (imageData: { imageData: string; mimeType: string; aspectRatio: string }) => void;
}

export function FloatingPromptBar({ onImageGenerated }: FloatingPromptBarProps = {}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("draft");
  const [selectedSpeed, setSelectedSpeed] = useState("fast");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedDetail, setSelectedDetail] = useState("medium");
  const [selectedStyle, setSelectedStyle] = useState("auto");
  const [selectedCount, setSelectedCount] = useState("1");
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const googleInitializedRef = useRef(false);
  const pendingGenerationRef = useRef(false);
  const { openLoginPopup } = useLoginPopup();

  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.getStats,
    staleTime: 1000 * 60 * 5,
    enabled: isAuthenticated,
  });
  const credits = stats?.credits ?? 0;

  useEffect(() => {
    const pendingPrompt = localStorage.getItem("pending_prompt");
    if (pendingPrompt && isAuthenticated && !authLoading) {
      localStorage.removeItem("pending_prompt");
      setPrompt(pendingPrompt);
      handleGenerate(pendingPrompt);
    }
  }, [isAuthenticated, authLoading]);

  const initGoogleSignIn = async (): Promise<boolean> => {
    try {
      const configResponse = await fetch("/api/auth/google-client-id");
      if (!configResponse.ok) return false;
      
      const { clientId } = await configResponse.json();
      if (!clientId) return false;

      if (!window.google?.accounts?.id) {
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (window.google?.accounts?.id) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 3000);
        });
      }

      if (!window.google?.accounts?.id) return false;

      if (!googleInitializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            try {
              // Add timestamp to bypass CDN caching
              const timestamp = Date.now();
              const authResponse = await fetch(`/api/auth/google?_t=${timestamp}`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "Pragma": "no-cache",
                },
                credentials: "include",
                cache: "no-store",
                body: JSON.stringify({ credential: response.credential }),
              });

              if (authResponse.ok) {
                window.location.reload();
              } else {
                console.error("Google auth failed:", authResponse.status);
                alert(`Login failed (${authResponse.status}). Please try again.`);
              }
            } catch (error) {
              console.error("Google auth error:", error);
              alert("Login error. Please try again.");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
        });
        googleInitializedRef.current = true;
      }

      window.google.accounts.id.prompt();
      return true;
    } catch (error) {
      console.error("Failed to initialize Google Sign-In:", error);
      return false;
    }
  };

  const handleGenerate = async (promptText?: string) => {
    const textToUse = promptText || prompt;
    if (!textToUse.trim()) return;

    setIsGenerating(true);
    try {
      if (!isAuthenticated) {
        // Guest generation - use guest endpoint which saves to gallery
        // Generate or retrieve a persistent guest ID
        let guestId = localStorage.getItem("ugli_guest_id");
        if (!guestId) {
          guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem("ugli_guest_id", guestId);
        }

        const response = await fetch("/api/guest/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: textToUse,
            guestId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Guest generation failed:", error);
          if (response.status === 403) {
            openLoginPopup();
          } else {
            alert(error.message || "Image generation failed. Please try again.");
          }
          return;
        }

        const data = await response.json();
        setPrompt("");
        if (onImageGenerated) {
          onImageGenerated({ 
            imageData: data.imageData, 
            mimeType: data.mimeType,
            aspectRatio: "1:1"
          });
        } else {
          // Fallback: redirect to discover page to see the generated image
          setLocation("/discover");
        }
      } else {
        // Authenticated generation
        const generateResponse = await fetch("/api/generate/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            prompt: textToUse,
            stylePreset: selectedStyle,
          }),
        });

        if (!generateResponse.ok) {
          const error = await generateResponse.json();
          console.error("Generation failed:", error);
          alert("Image generation failed. Please try again.");
          return;
        }

        const { image } = await generateResponse.json();

        const saveResponse = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            prompt: textToUse,
            imageUrl: `data:${image.mimeType};base64,${image.data}`,
            style: selectedStyle,
            aspectRatio: selectedRatio,
            generationType: "image",
            isPublic: true, // Images from home page are public by default
          }),
        });

        if (saveResponse.ok) {
          setPrompt("");
          if (onImageGenerated) {
            onImageGenerated({ 
              imageData: image.data, 
              mimeType: image.mimeType,
              aspectRatio: selectedRatio 
            });
          } else {
            setLocation("/my-creations");
          }
        } else {
          alert("Failed to save image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
      pendingGenerationRef.current = false;
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (openDropdown) return;
    timeoutRef.current = setTimeout(() => {
      if (!openDropdown) {
        setIsExpanded(false);
      }
    }, 400);
  };

  const handleFocus = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsExpanded(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (openDropdown) return;
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      timeoutRef.current = setTimeout(() => {
        if (!openDropdown) {
          setIsExpanded(false);
        }
      }, 400);
    }
  };

  const handleDropdownChange = (dropdown: DropdownType, isOpen: boolean) => {
    if (isOpen) {
      setOpenDropdown(dropdown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      setOpenDropdown(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[55rem] px-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
    >
      <motion.div
        layout
        className="relative bg-black/90 backdrop-blur-xl border-2 border-[#ed5387]/70 overflow-hidden animate-pulse-glow"
        style={{ borderRadius: isExpanded ? 16 : 9999 }}
        initial={false}
        animate={{
          borderRadius: isExpanded ? 16 : 9999,
        }}
        transition={{ 
          borderRadius: { duration: 0.25, ease: "easeOut" },
          layout: { duration: 0.25, ease: "easeOut" }
        }}
      >
        <div className="p-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={handleFocus}
              placeholder="Describe the image you want to create..."
              className="w-full bg-transparent text-white placeholder-white/60 text-sm px-4 py-2.5 focus:outline-none"
              data-testid="input-prompt"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full">
              <Zap className="h-3.5 w-3.5 text-[#9C27B0]" />
              <span className="text-xs font-medium text-white/70">{isAuthenticated ? credits.toLocaleString() : '0'}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGenerate()}
              disabled={isGenerating || (isAuthenticated && !prompt.trim())}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ed5387] to-[#9C27B0] text-white rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-[#ed5387]/30 transition-shadow",
                isGenerating && "opacity-60 cursor-not-allowed",
                isAuthenticated && !prompt.trim() && "opacity-60 cursor-not-allowed"
              )}
              data-testid="button-generate"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              <span>{isGenerating ? "Creating..." : (isAuthenticated ? "Generate" : "Try UGLI Free")}</span>
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="sync">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 border-t border-white/10">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                  <Popover open={openDropdown === "quality"} onOpenChange={(open) => handleDropdownChange("quality", open)}>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="quality-dropdown"
                      >
                        {(() => {
                          const QualityIcon = QUALITY_PRESETS.find(q => q.id === selectedQuality)?.icon || Sparkles;
                          return <QualityIcon className="h-3 w-3 text-[#9C27B0]" />;
                        })()}
                        {QUALITY_PRESETS.find(q => q.id === selectedQuality)?.name}
                        <ChevronDown className={cn("h-3 w-3 text-white/50 transition-transform", openDropdown === "quality" && "rotate-180")} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-36 p-1 bg-black/95 border-white/10 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
                      align="center"
                      sideOffset={8}
                    >
                      {QUALITY_PRESETS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => { setSelectedQuality(option.id); setOpenDropdown(null); }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                              selectedQuality === option.id
                                ? "bg-[#ed5387] text-white"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            )}
                            data-testid={`quality-${option.id}`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3 w-3" />
                              {option.name}
                            </span>
                            {selectedQuality === option.id && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>

                  <Popover open={openDropdown === "speed"} onOpenChange={(open) => handleDropdownChange("speed", open)}>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="speed-dropdown"
                      >
                        {(() => {
                          const SpeedIcon = SPEED_OPTIONS.find(s => s.id === selectedSpeed)?.icon || Zap;
                          return <SpeedIcon className="h-3 w-3 text-[#9C27B0]" />;
                        })()}
                        {SPEED_OPTIONS.find(s => s.id === selectedSpeed)?.name}
                        <ChevronDown className={cn("h-3 w-3 text-white/50 transition-transform", openDropdown === "speed" && "rotate-180")} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-36 p-1 bg-black/95 border-white/10 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
                      align="center"
                      sideOffset={8}
                    >
                      {SPEED_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => { setSelectedSpeed(option.id); setOpenDropdown(null); }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                              selectedSpeed === option.id
                                ? "bg-[#ed5387] text-white"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            )}
                            data-testid={`speed-${option.id}`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3 w-3" />
                              {option.name}
                            </span>
                            {selectedSpeed === option.id && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>

                  <Popover open={openDropdown === "ratio"} onOpenChange={(open) => handleDropdownChange("ratio", open)}>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="ratio-dropdown"
                      >
                        {(() => {
                          const RatioIcon = ASPECT_RATIOS.find(r => r.id === selectedRatio)?.icon || Square;
                          return <RatioIcon className="h-3 w-3 text-[#ed5387]" />;
                        })()}
                        {selectedRatio}
                        <ChevronDown className={cn("h-3 w-3 text-white/50 transition-transform", openDropdown === "ratio" && "rotate-180")} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-40 p-1 bg-black/95 border-white/10 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
                      align="center"
                      sideOffset={8}
                    >
                      {ASPECT_RATIOS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => { setSelectedRatio(option.id); setOpenDropdown(null); }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                              selectedRatio === option.id
                                ? "bg-[#ed5387] text-white"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            )}
                            data-testid={`ratio-${option.id}`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3 w-3" />
                              {option.name} ({option.id})
                            </span>
                            {selectedRatio === option.id && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>

                  <Popover open={openDropdown === "detail"} onOpenChange={(open) => handleDropdownChange("detail", open)}>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="detail-dropdown"
                      >
                        {(() => {
                          const DetailIcon = DETAIL_LEVELS.find(d => d.id === selectedDetail)?.icon || Circle;
                          return <DetailIcon className="h-3 w-3 text-[#ed5387]" />;
                        })()}
                        {DETAIL_LEVELS.find(d => d.id === selectedDetail)?.name}
                        <ChevronDown className={cn("h-3 w-3 text-white/50 transition-transform", openDropdown === "detail" && "rotate-180")} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-36 p-1 bg-black/95 border-white/10 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
                      align="center"
                      sideOffset={8}
                    >
                      {DETAIL_LEVELS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => { setSelectedDetail(option.id); setOpenDropdown(null); }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                              selectedDetail === option.id
                                ? "bg-[#ed5387] text-white"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            )}
                            data-testid={`detail-${option.id}`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3 w-3" />
                              {option.name}
                            </span>
                            {selectedDetail === option.id && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>

                  <Popover open={openDropdown === "styleExpanded"} onOpenChange={(open) => handleDropdownChange("styleExpanded", open)}>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="style-dropdown-expanded"
                      >
                        {(() => {
                          const StyleIcon = STYLE_PRESETS.find(s => s.id === selectedStyle)?.icon || Sparkles;
                          return <StyleIcon className="h-3 w-3 text-[#ed5387]" />;
                        })()}
                        {STYLE_PRESETS.find(s => s.id === selectedStyle)?.name}
                        <ChevronDown className={cn("h-3 w-3 text-white/50 transition-transform", openDropdown === "styleExpanded" && "rotate-180")} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-44 p-1 bg-black/95 border-white/10 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 max-h-[280px] overflow-y-auto"
                      align="center"
                      sideOffset={8}
                    >
                      {STYLE_PRESETS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => { setSelectedStyle(option.id); setOpenDropdown(null); }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                              selectedStyle === option.id
                                ? "bg-[#ed5387] text-white"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3 w-3" />
                              {option.name}
                            </span>
                            {selectedStyle === option.id && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-lg">
                    {countOptions.map((option) => (
                      option.disabled ? (
                        <span
                          key={option.id}
                          className="w-7 h-7 flex items-center justify-center rounded text-xs font-semibold text-white/30 cursor-not-allowed"
                          data-testid={`count-${option.id}`}
                        >
                          {option.label}
                        </span>
                      ) : (
                        <button
                          key={option.id}
                          onClick={() => setSelectedCount(option.id)}
                          className={cn(
                            "w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-all",
                            selectedCount === option.id
                              ? "bg-[#ed5387] text-white"
                              : "text-white/50 hover:text-white hover:bg-white/10"
                          )}
                          data-testid={`count-${option.id}`}
                          title={`Generate ${option.label} image${option.id !== "1" ? "s" : ""}`}
                        >
                          {option.label}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
