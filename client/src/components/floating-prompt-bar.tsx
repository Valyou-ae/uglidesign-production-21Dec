import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Wand2, 
  Square, 
  RectangleHorizontal, 
  RectangleVertical,
  Palette,
  Zap,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const stylePresets = [
  { id: "photorealistic", label: "Photorealistic", icon: "📷" },
  { id: "digital-art", label: "Digital Art", icon: "🎨" },
  { id: "anime", label: "Anime", icon: "✨" },
  { id: "3d-render", label: "3D Render", icon: "🎮" },
  { id: "oil-painting", label: "Oil Painting", icon: "🖼️" },
];

const aspectRatios = [
  { id: "1:1", label: "1:1", icon: Square },
  { id: "16:9", label: "16:9", icon: RectangleHorizontal },
  { id: "9:16", label: "9:16", icon: RectangleVertical },
  { id: "4:3", label: "4:3", icon: RectangleHorizontal },
  { id: "3:4", label: "3:4", icon: RectangleVertical },
];

export function FloatingPromptBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
    >
      <motion.div
        layout
        className={cn(
          "bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden",
          isExpanded ? "rounded-3xl" : "rounded-full"
        )}
        initial={false}
        animate={{
          borderRadius: isExpanded ? 24 : 9999,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <AnimatePresence mode="sync">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="p-4 pb-2 border-b border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-[#E3B436]" />
                    <span className="text-xs font-medium text-white/70">Style</span>
                  </div>
                  <ChevronUp className="h-4 w-4 text-white/30" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {stylePresets.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedStyle === style.id
                          ? "bg-gradient-to-r from-[#B94E30] to-[#E3B436] text-white"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                      data-testid={`style-${style.id}`}
                    >
                      <span>{style.icon}</span>
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 pt-3 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="h-4 w-4 text-[#B94E30]" />
                  <span className="text-xs font-medium text-white/70">Aspect Ratio</span>
                </div>
                <div className="flex gap-2">
                  {aspectRatios.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => setSelectedRatio(ratio.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          selectedRatio === ratio.id
                            ? "bg-white/15 text-white ring-1 ring-[#B94E30]"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        )}
                        data-testid={`ratio-${ratio.id}`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{ratio.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-3 flex items-center gap-3">
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full">
              <Zap className="h-3.5 w-3.5 text-[#E3B436]" />
              <span className="text-xs font-medium text-white/70">10</span>
            </div>

            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#B94E30] to-[#E3B436] text-white rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-[#B94E30]/30 transition-shadow"
                data-testid="button-generate"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate</span>
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
