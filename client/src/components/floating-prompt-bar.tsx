import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Square, 
  RectangleHorizontal, 
  RectangleVertical,
  Zap,
  ChevronDown,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

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
      className="fixed bottom-[54px] left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
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
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1.5 min-w-fit">
                    <Settings2 className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-[10px] font-medium text-white/40 uppercase">Options</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {qualityOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedQuality(option.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
                          selectedQuality === option.id
                            ? "bg-[#B94E30] text-white"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                        data-testid={`quality-${option.id}`}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-1">
                    {speedOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedSpeed(option.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
                          selectedSpeed === option.id
                            ? "bg-[#B94E30] text-white"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                        data-testid={`speed-${option.id}`}
                      >
                        <Zap className="h-2.5 w-2.5" />
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-0.5">
                    {ratioOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSelectedRatio(option.id)}
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded transition-all",
                            selectedRatio === option.id
                              ? "bg-[#B94E30] text-white"
                              : "text-white/50 hover:text-white hover:bg-white/5"
                          )}
                          data-testid={`ratio-${option.id}`}
                        >
                          <Icon className="h-3 w-3" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-1">
                    {detailOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedDetail(option.id)}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-medium transition-all",
                          selectedDetail === option.id
                            ? "text-white bg-white/10"
                            : "text-white/50 hover:text-white"
                        )}
                        data-testid={`detail-${option.id}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="w-px h-4 bg-white/10" />

                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white/60 hover:text-white hover:bg-white/5"
                    data-testid="style-dropdown"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-[#B94E30]" />
                    {styleOptions.find(s => s.id === selectedStyle)?.label}
                    <ChevronDown className="h-2.5 w-2.5" />
                  </button>

                  <div className="w-px h-4 bg-white/10" />

                  <div className="flex items-center gap-0.5">
                    {countOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedCount(option.id)}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded text-[10px] font-medium transition-all",
                          selectedCount === option.id
                            ? "bg-[#B94E30] text-white"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                        data-testid={`count-${option.id}`}
                      >
                        {option.label}
                      </button>
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
