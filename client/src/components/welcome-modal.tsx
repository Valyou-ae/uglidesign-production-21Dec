import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shirt, Scissors, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WelcomeStep {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    title: "Create Stunning Images",
    description: "Use our AI-powered image generator to bring your ideas to life. Just describe what you want, and watch the magic happen.",
    icon: Sparkles,
    gradient: "from-[#B94E30] to-[#8B3A24]",
  },
  {
    title: "Professional Mockups",
    description: "Turn your designs into product-ready mockups. Perfect for e-commerce, print-on-demand, and presentations.",
    icon: Shirt,
    gradient: "from-[#664D3F] to-[#4A3830]",
  },
  {
    title: "Remove Backgrounds",
    description: "Instantly remove backgrounds from any image with our AI-powered tool. Get clean, transparent results in seconds.",
    icon: Scissors,
    gradient: "from-[#E3B436] to-[#C99C2A]",
  },
];

const STORAGE_KEY = "ugli_onboarding_complete";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(STORAGE_KEY);
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = WELCOME_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleSkip}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
              data-testid="button-close-welcome"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className={cn("h-40 bg-gradient-to-br flex items-center justify-center", step.gradient)}>
              <motion.div
                key={currentStep}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20"
              >
                <Icon className="h-10 w-10 text-white" />
              </motion.div>
            </div>

            <div className="p-6">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              <div className="flex items-center justify-center gap-2 my-6">
                {WELCOME_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      index === currentStep
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted hover:bg-muted-foreground/30"
                    )}
                    data-testid={`step-indicator-${index}`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1"
                  data-testid="button-skip-tour"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  data-testid="button-next-step"
                >
                  {currentStep === WELCOME_STEPS.length - 1 ? "Get Started" : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
