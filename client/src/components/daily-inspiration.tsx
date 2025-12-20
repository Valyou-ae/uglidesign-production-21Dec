import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, ChevronLeft, ChevronRight, Lightbulb, Tag, Zap, User, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { inspirationsApi, promptsApi, type DailyInspiration, type PromptRecommendation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface DailyInspirationProps {
  onTryPrompt?: (prompt: string) => void;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  fantasy: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  portrait: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  landscape: { bg: "bg-green-500/20", text: "text-green-300", border: "border-green-500/30" },
  abstract: { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
  product: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  architecture: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-500/30" },
  nature: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  scifi: { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  default: { bg: "bg-[#ed5387]/20", text: "text-[#ed5387]", border: "border-[#ed5387]/30" },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: "Beginner", color: "text-green-400" },
  medium: { label: "Intermediate", color: "text-yellow-400" },
  hard: { label: "Advanced", color: "text-red-400" },
};

function InspirationCard({ 
  inspiration, 
  onTryPrompt,
  isActive = false
}: { 
  inspiration: DailyInspiration; 
  onTryPrompt?: (prompt: string) => void;
  isActive?: boolean;
}) {
  const { toast } = useToast();
  const colorScheme = categoryColors[inspiration.category.toLowerCase()] || categoryColors.default;
  const difficulty = difficultyConfig[inspiration.difficulty || "medium"] || difficultyConfig.medium;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(inspiration.prompt);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard",
    });
  };

  const handleTryPrompt = () => {
    if (onTryPrompt) {
      onTryPrompt(inspiration.prompt);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-2xl overflow-hidden border backdrop-blur-sm",
        colorScheme.border,
        "bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90",
        isActive && "ring-2 ring-[#ed5387]/50"
      )}
      data-testid={`inspiration-card-${inspiration.id}`}
    >
      {inspiration.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={inspiration.imageUrl} 
            alt={inspiration.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
        </div>
      )}

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {inspiration.featured && (
                <Badge variant="outline" className="bg-[#9C27B0]/20 text-[#9C27B0] border-[#9C27B0]/30 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={cn("text-xs capitalize", colorScheme.bg, colorScheme.text, colorScheme.border)}
              >
                {inspiration.category}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-white">{inspiration.title}</h3>
          </div>
          <span className={cn("text-xs flex items-center gap-1", difficulty.color)}>
            <Zap className="w-3 h-3" />
            {difficulty.label}
          </span>
        </div>

        <div className="relative bg-[#1a1a1a] rounded-lg p-3 border border-white/5">
          <p className="text-sm text-white/80 line-clamp-3 pr-8">
            {inspiration.prompt}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
            onClick={handleCopyPrompt}
            data-testid={`copy-prompt-${inspiration.id}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {inspiration.tags && inspiration.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {inspiration.tags.slice(0, 4).map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/60"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {inspiration.tags.length > 4 && (
              <span className="text-xs text-white/40">+{inspiration.tags.length - 4} more</span>
            )}
          </div>
        )}

        {onTryPrompt && (
          <Button
            onClick={handleTryPrompt}
            className="w-full bg-[#ed5387] hover:bg-[#C2185B] text-white"
            data-testid={`try-prompt-${inspiration.id}`}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Try This Prompt
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function DailyInspirationFeed({ onTryPrompt }: DailyInspirationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: inspirationsData, isLoading, error } = useQuery({
    queryKey: ["/api/inspirations/featured"],
    queryFn: () => inspirationsApi.getFeatured(10),
    staleTime: 5 * 60 * 1000,
  });

  const inspirations = inspirationsData?.inspirations || [];
  const hasMultiple = inspirations.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? inspirations.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === inspirations.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-white/10 rounded" />
        <div className="h-64 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (error || inspirations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="daily-inspiration-feed">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#9C27B0]" />
          <h2 className="text-lg font-semibold text-white">Daily Inspiration</h2>
        </div>
        {hasMultiple && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white"
              onClick={goToPrevious}
              data-testid="inspiration-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white/60 min-w-[3rem] text-center">
              {currentIndex + 1} / {inspirations.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white"
              onClick={goToNext}
              data-testid="inspiration-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {inspirations[currentIndex] && (
          <InspirationCard
            key={inspirations[currentIndex].id}
            inspiration={inspirations[currentIndex]}
            onTryPrompt={onTryPrompt}
            isActive
          />
        )}
      </AnimatePresence>

      {hasMultiple && (
        <div className="flex justify-center gap-1.5">
          {inspirations.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-[#ed5387] w-6" 
                  : "bg-white/20 hover:bg-white/40"
              )}
              data-testid={`inspiration-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TodaysInspiration({ onTryPrompt }: DailyInspirationProps) {
  const { data: inspiration, isLoading, error } = useQuery({
    queryKey: ["/api/inspirations/today"],
    queryFn: () => inspirationsApi.getToday(),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (error || !inspiration) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="todays-inspiration">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#9C27B0]" />
        <h2 className="text-lg font-semibold text-white">Today's Inspiration</h2>
      </div>
      <InspirationCard inspiration={inspiration} onTryPrompt={onTryPrompt} isActive />
    </div>
  );
}

export function InspirationGrid({ onTryPrompt, limit = 6 }: DailyInspirationProps & { limit?: number }) {
  const { data: inspirationsData, isLoading, error } = useQuery({
    queryKey: ["/api/inspirations", limit],
    queryFn: () => inspirationsApi.getAll(limit),
    staleTime: 5 * 60 * 1000,
  });

  const inspirations = inspirationsData?.inspirations || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-64 bg-white/10 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error || inspirations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="inspiration-grid">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-[#9C27B0]" />
        <h2 className="text-lg font-semibold text-white">Prompt Ideas</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inspirations.map((inspiration) => (
          <InspirationCard
            key={inspiration.id}
            inspiration={inspiration}
            onTryPrompt={onTryPrompt}
          />
        ))}
      </div>
    </div>
  );
}

function PersonalizedPromptCard({ 
  recommendation, 
  onTryPrompt 
}: { 
  recommendation: PromptRecommendation; 
  onTryPrompt?: (prompt: string) => void;
}) {
  const { toast } = useToast();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(recommendation.prompt);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard",
    });
  };

  const handleTryPrompt = () => {
    if (onTryPrompt) {
      onTryPrompt(recommendation.prompt);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl overflow-hidden border border-[#ed5387]/20 bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90 p-4"
      data-testid={`personalized-prompt-${recommendation.id}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="bg-[#ed5387]/20 text-[#ed5387] border-[#ed5387]/30 text-xs">
            <User className="w-3 h-3 mr-1" />
            For You
          </Badge>
          <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10 text-xs">
            {recommendation.category}
          </Badge>
        </div>
        
        <div className="relative bg-[#1a1a1a] rounded-lg p-3 border border-white/5">
          <p className="text-sm text-white/90 line-clamp-3 pr-8">
            {recommendation.prompt}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
            onClick={handleCopyPrompt}
            data-testid={`copy-personalized-prompt-${recommendation.id}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <p className="text-xs text-white/50 italic">
          {recommendation.reason}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {recommendation.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/60"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        {onTryPrompt && (
          <Button
            onClick={handleTryPrompt}
            size="sm"
            className="w-full bg-[#ed5387] hover:bg-[#C2185B] text-white"
            data-testid={`try-personalized-prompt-${recommendation.id}`}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Try This
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function PersonalizedPrompts({ onTryPrompt }: DailyInspirationProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/prompts/recommendations"],
    queryFn: () => promptsApi.getRecommendations(),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const recommendations = data?.recommendations || [];
  const hasMultiple = recommendations.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? recommendations.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === recommendations.length - 1 ? 0 : prev + 1));
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-32 bg-white/10 rounded" />
        <div className="h-48 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="personalized-prompts">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-[#ed5387]" />
          <h2 className="text-lg font-semibold text-white">For You</h2>
        </div>
        {hasMultiple && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white"
              onClick={goToPrevious}
              data-testid="personalized-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white/60 min-w-[3rem] text-center">
              {currentIndex + 1} / {recommendations.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white"
              onClick={goToNext}
              data-testid="personalized-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <PersonalizedPromptCard
          key={recommendations[currentIndex].id}
          recommendation={recommendations[currentIndex]}
          onTryPrompt={onTryPrompt}
        />
      </AnimatePresence>

      {hasMultiple && (
        <div className="flex justify-center gap-1.5">
          {recommendations.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-[#ed5387] w-6" 
                  : "bg-white/20 hover:bg-white/40"
              )}
              data-testid={`personalized-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
