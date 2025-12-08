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
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const qualityOptions = [
  { id: "draft", label: "Draft" },
  { id: "premium", label: "Premium" },
];

const speedOptions = [
  { id: "fast", label: "Fast" },
  { id: "quality", label: "Quality" },
];

const ratioOptions = [
  { id: "1:1", icon: Square },
  { id: "16:9", icon: RectangleHorizontal },
  { id: "9:16", icon: RectangleVertical },
  { id: "4:3", icon: RectangleHorizontal },
  { id: "3:4", icon: RectangleVertical },
];

const detailOptions = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const styleOptions = [
  { id: "auto", label: "Auto" },
  { id: "photo", label: "Photo" },
  { id: "art", label: "Art" },
  { id: "anime", label: "Anime" },
];

const countOptions = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "4", label: "4" },
];

export function FloatingPromptBar() {
  const [isExpanded, setIsExpanded] = useState(false);
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
              const authResponse = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ credential: response.credential }),
              });

              if (authResponse.ok) {
                window.location.reload();
              }
            } catch (error) {
              console.error("Google auth error:", error);
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

    if (!isAuthenticated) {
      localStorage.setItem("pending_prompt", textToUse);
      pendingGenerationRef.current = true;
      const success = await initGoogleSignIn();
      if (!success) {
        localStorage.removeItem("pending_prompt");
        pendingGenerationRef.current = false;
      }
      return;
    }

    setIsGenerating(true);
    try {
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
        }),
      });

      if (saveResponse.ok) {
        setPrompt("");
        setLocation("/my-creations");
      } else {
        alert("Failed to save image. Please try again.");
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
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 400);
  };

  const handleFocus = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsExpanded(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 400);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-[124px] left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
    >
      <motion.div
        layout
        className={cn(
          "bg-black backdrop-blur-xl border border-[#B94E30]/40 shadow-2xl shadow-black/50 overflow-hidden",
          isExpanded ? "rounded-2xl" : "rounded-full"
        )}
        initial={false}
        animate={{
          borderRadius: isExpanded ? 16 : 9999,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="p-3 flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/80 hover:text-white"
                data-testid="main-style-dropdown"
              >
                <Palette className="h-4 w-4 text-[#B94E30]" />
                <span className="text-xs font-medium">{styleOptions.find(s => s.id === selectedStyle)?.label}</span>
                <ChevronDown className="h-3 w-3 text-white/50" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-36 p-1 bg-black/95 border-white/10 backdrop-blur-xl"
              align="start"
              sideOffset={8}
            >
              {styleOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedStyle(option.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                    selectedStyle === option.id
                      ? "bg-[#B94E30] text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {option.label}
                  {selectedStyle === option.id && <Check className="h-3 w-3" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="flex-1 relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={handleFocus}
              placeholder="Describe the image you want to create..."
              className="w-full bg-transparent text-white placeholder-white/40 text-sm px-4 py-2.5 focus:outline-none"
              data-testid="input-prompt"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-lg">
              {countOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedCount(option.id)}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-all",
                    selectedCount === option.id
                      ? "bg-[#B94E30] text-white"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  )}
                  data-testid={`main-count-${option.id}`}
                  title={`Generate ${option.label} image${option.id !== "1" ? "s" : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full">
              <Zap className="h-3.5 w-3.5 text-[#E3B436]" />
              <span className="text-xs font-medium text-white/70">10</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#B94E30] to-[#E3B436] text-white rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-[#B94E30]/30 transition-shadow",
                (isGenerating || !prompt.trim()) && "opacity-60 cursor-not-allowed"
              )}
              data-testid="button-generate"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{isGenerating ? "Creating..." : "Generate"}</span>
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
                  <div className="flex items-center gap-1.5 min-w-fit">
                    <Settings2 className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-[10px] font-medium text-white/40 uppercase">Options</span>
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="quality-dropdown"
                      >
                        <Sparkles className="h-3 w-3 text-[#E3B436]" />
                        {qualityOptions.find(q => q.id === selectedQuality)?.label}
                        <ChevronDown className="h-3 w-3 text-white/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-32 p-1 bg-black/95 border-white/10 backdrop-blur-xl"
                      align="center"
                      sideOffset={8}
                    >
                      {qualityOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedQuality(option.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                            selectedQuality === option.id
                              ? "bg-[#B94E30] text-white"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          )}
                          data-testid={`quality-${option.id}`}
                        >
                          {option.label}
                          {selectedQuality === option.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="speed-dropdown"
                      >
                        <Zap className="h-3 w-3 text-[#E3B436]" />
                        {speedOptions.find(s => s.id === selectedSpeed)?.label}
                        <ChevronDown className="h-3 w-3 text-white/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-32 p-1 bg-black/95 border-white/10 backdrop-blur-xl"
                      align="center"
                      sideOffset={8}
                    >
                      {speedOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedSpeed(option.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                            selectedSpeed === option.id
                              ? "bg-[#B94E30] text-white"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          )}
                          data-testid={`speed-${option.id}`}
                        >
                          {option.label}
                          {selectedSpeed === option.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="ratio-dropdown"
                      >
                        {(() => {
                          const RatioIcon = ratioOptions.find(r => r.id === selectedRatio)?.icon || Square;
                          return <RatioIcon className="h-3 w-3 text-[#B94E30]" />;
                        })()}
                        {selectedRatio}
                        <ChevronDown className="h-3 w-3 text-white/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-32 p-1 bg-black/95 border-white/10 backdrop-blur-xl"
                      align="center"
                      sideOffset={8}
                    >
                      {ratioOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => setSelectedRatio(option.id)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                              selectedRatio === option.id
                                ? "bg-[#B94E30] text-white"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                            )}
                            data-testid={`ratio-${option.id}`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3 w-3" />
                              {option.id}
                            </span>
                            {selectedRatio === option.id && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="detail-dropdown"
                      >
                        <span className="text-[#B94E30]">◉</span>
                        {detailOptions.find(d => d.id === selectedDetail)?.label}
                        <ChevronDown className="h-3 w-3 text-white/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-32 p-1 bg-black/95 border-white/10 backdrop-blur-xl"
                      align="center"
                      sideOffset={8}
                    >
                      {detailOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedDetail(option.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                            selectedDetail === option.id
                              ? "bg-[#B94E30] text-white"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          )}
                          data-testid={`detail-${option.id}`}
                        >
                          {option.label}
                          {selectedDetail === option.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="style-dropdown-expanded"
                      >
                        <Palette className="h-3 w-3 text-[#B94E30]" />
                        {styleOptions.find(s => s.id === selectedStyle)?.label}
                        <ChevronDown className="h-3 w-3 text-white/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-32 p-1 bg-black/95 border-white/10 backdrop-blur-xl"
                      align="center"
                      sideOffset={8}
                    >
                      {styleOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedStyle(option.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                            selectedStyle === option.id
                              ? "bg-[#B94E30] text-white"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {option.label}
                          {selectedStyle === option.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        data-testid="count-dropdown"
                      >
                        <span className="text-[#E3B436] font-bold">#</span>
                        {selectedCount} {parseInt(selectedCount) > 1 ? "Images" : "Image"}
                        <ChevronDown className="h-3 w-3 text-white/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-32 p-1 bg-black/95 border-white/10 backdrop-blur-xl"
                      align="center"
                      sideOffset={8}
                    >
                      {countOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedCount(option.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all",
                            selectedCount === option.id
                              ? "bg-[#B94E30] text-white"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          )}
                          data-testid={`count-${option.id}`}
                        >
                          {option.label} {parseInt(option.id) > 1 ? "Images" : "Image"}
                          {selectedCount === option.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
