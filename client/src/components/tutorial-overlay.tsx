import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Wand2, 
  Image as ImageIcon,
  Palette,
  Layers,
  Check,
  BookOpen
} from "lucide-react";

const TUTORIAL_STORAGE_KEY = "ugli_tutorial_completed";
const TUTORIAL_FIRST_VISIT_KEY = "ugli_first_visit";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string | null;
  icon: React.ReactNode;
  position: "center" | "top" | "bottom" | "left" | "right";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to UGLI Studio!",
    description: "Let us show you how to create stunning AI-generated images in just a few clicks. This quick tour will guide you through the main features.",
    targetSelector: null,
    icon: <Sparkles className="h-6 w-6 text-[#9C27B0]" />,
    position: "center"
  },
  {
    id: "prompt",
    title: "Enter Your Prompt",
    description: "Start by describing the image you want to create. Be as detailed as you like - mention subjects, styles, lighting, mood, and any specific elements you want.",
    targetSelector: "[data-tutorial='prompt-input']",
    icon: <Wand2 className="h-6 w-6 text-[#ed5387]" />,
    position: "bottom"
  },
  {
    id: "style",
    title: "Choose Your Style",
    description: "Select an artistic style for your image. From photorealistic to anime, oil painting to digital art - pick the style that matches your vision.",
    targetSelector: "[data-tutorial='style-selector']",
    icon: <Palette className="h-6 w-6 text-[#9C27B0]" />,
    position: "top"
  },
  {
    id: "ratio",
    title: "Select Aspect Ratio",
    description: "Choose the perfect dimensions for your image. Square for social profiles, landscape for wallpapers, or portrait for mobile screens.",
    targetSelector: "[data-tutorial='ratio-selector']",
    icon: <Layers className="h-6 w-6 text-[#ed5387]" />,
    position: "top"
  },
  {
    id: "generate",
    title: "Generate Your Image",
    description: "Click the generate button to bring your imagination to life! Our AI agents will work together to create your masterpiece.",
    targetSelector: "[data-tutorial='generate-button']",
    icon: <Sparkles className="h-6 w-6 text-[#9C27B0]" />,
    position: "top"
  },
  {
    id: "creations",
    title: "View Your Creations",
    description: "All your generated images are saved in My Creations. Access, download, or remix your artwork anytime from the sidebar.",
    targetSelector: "[data-tutorial='my-creations-link']",
    icon: <ImageIcon className="h-6 w-6 text-[#ed5387]" />,
    position: "right"
  }
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function TutorialOverlay({ isOpen, onClose, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const updateTargetRect = useCallback(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [step.targetSelector]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect);
      
      const resizeObserver = new ResizeObserver(updateTargetRect);
      document.body && resizeObserver.observe(document.body);

      return () => {
        window.removeEventListener("resize", updateTargetRect);
        window.removeEventListener("scroll", updateTargetRect);
        resizeObserver.disconnect();
      };
    }
  }, [isOpen, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (isAnimating || isFirstStep) return;
    setIsAnimating(true);
    setCurrentStep(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSkip = () => {
    onClose();
  };

  const getTooltipPosition = () => {
    if (!targetRect || step.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      };
    }

    const padding = 20;
    const tooltipWidth = 340;
    const tooltipHeight = 200;

    switch (step.position) {
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2))}px`,
          transform: "none"
        };
      case "top":
        return {
          top: `${Math.max(padding, targetRect.top - tooltipHeight - padding)}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2))}px`,
          transform: "none"
        };
      case "left":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${Math.max(padding, targetRect.left - tooltipWidth - padding)}px`,
          transform: "none"
        };
      case "right":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: "none"
        };
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 100 }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <motion.rect
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    x={targetRect.left - 8}
                    y={targetRect.top - 8}
                    width={targetRect.width + 16}
                    height={targetRect.height + 16}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#spotlight-mask)"
            />
          </svg>

          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute z-[101] rounded-xl ring-4 ring-[#ed5387]/50 ring-offset-2 ring-offset-transparent pointer-events-none tutorial-pulse"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
              }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "absolute z-[102] w-[340px] max-w-[calc(100vw-32px)] bg-card border border-border rounded-2xl shadow-2xl",
              "dark:bg-zinc-900 dark:border-zinc-800"
            )}
            style={getTooltipPosition()}
            data-testid="tutorial-tooltip"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="absolute top-3 right-3 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              data-testid="tutorial-close"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="p-6 pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#ed5387]/10 to-[#9C27B0]/10 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground leading-tight">
                    {step.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {step.description}
              </p>

              <div className="flex items-center justify-center gap-1.5 mb-5">
                {TUTORIAL_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => !isAnimating && setCurrentStep(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentStep 
                        ? "w-6 bg-gradient-to-r from-[#ed5387] to-[#9C27B0]" 
                        : index < currentStep
                        ? "w-2 bg-[#ed5387]/50"
                        : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/30"
                    )}
                    data-testid={`tutorial-step-indicator-${index}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={isAnimating}
                    className="flex-1 h-10 rounded-xl"
                    data-testid="tutorial-prev"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                
                {isFirstStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="flex-1 h-10 rounded-xl text-muted-foreground hover:text-foreground"
                    data-testid="tutorial-skip"
                  >
                    Skip Tour
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={isAnimating}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:brightness-110 text-white"
                  data-testid="tutorial-next"
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Finish
                    </>
                  ) : isFirstStep ? (
                    <>
                      Start Tour
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    }
    return false;
  });

  const checkFirstVisit = useCallback(() => {
    if (typeof window !== "undefined") {
      const firstVisit = localStorage.getItem(TUTORIAL_FIRST_VISIT_KEY);
      if (!firstVisit && !hasCompleted) {
        localStorage.setItem(TUTORIAL_FIRST_VISIT_KEY, "true");
        return true;
      }
    }
    return false;
  }, [hasCompleted]);

  const startTutorial = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
  }, []);

  const completeTutorial = useCallback(() => {
    setIsOpen(false);
    setHasCompleted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    }
  }, []);

  const resetTutorial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
      localStorage.removeItem(TUTORIAL_FIRST_VISIT_KEY);
    }
    setHasCompleted(false);
  }, []);

  return {
    isOpen,
    hasCompleted,
    startTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial,
    checkFirstVisit
  };
}
