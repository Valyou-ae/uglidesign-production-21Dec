import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Eye, 
  Heart, 
  Wand2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { FloatingPromptBar } from "@/components/floating-prompt-bar";
import { GoogleAutoSignIn } from "@/components/google-auto-signin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface InspirationItem {
  id: string;
  title: string;
  image: string;
  creator: string;
  verified: boolean;
  views: string;
  likes: number;
  uses: string;
  category: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5" | "3:4";
  prompt: string;
  isGenerated?: boolean;
  isLiked?: boolean;
}

const aspectRatioToNumber = (ratio: string): number => {
  const ratios: Record<string, number> = {
    "1:1": 1,
    "9:16": 9/16,
    "16:9": 16/9,
    "4:5": 4/5,
    "3:4": 3/4
  };
  return ratios[ratio] || 1;
};

interface JustifiedRow {
  items: InspirationItem[];
  height: number;
}

function calculateJustifiedRows(items: InspirationItem[], containerWidth: number, targetHeight: number = 280, gap: number = 4): JustifiedRow[] {
  const rows: JustifiedRow[] = [];
  let currentRow: InspirationItem[] = [];
  let currentRowWidth = 0;

  items.forEach((item) => {
    const aspectRatio = aspectRatioToNumber(item.aspectRatio);
    const itemWidth = targetHeight * aspectRatio;
    
    if (currentRowWidth + itemWidth + (currentRow.length * gap) > containerWidth && currentRow.length > 0) {
      const totalAspectRatio = currentRow.reduce((sum, i) => sum + aspectRatioToNumber(i.aspectRatio), 0);
      const availableWidth = containerWidth - (currentRow.length - 1) * gap;
      const rowHeight = availableWidth / totalAspectRatio;
      rows.push({ items: [...currentRow], height: rowHeight });
      currentRow = [item];
      currentRowWidth = itemWidth;
    } else {
      currentRow.push(item);
      currentRowWidth += itemWidth;
    }
  });

  if (currentRow.length > 0) {
    const totalAspectRatio = currentRow.reduce((sum, i) => sum + aspectRatioToNumber(i.aspectRatio), 0);
    const availableWidth = containerWidth - (currentRow.length - 1) * gap;
    const rowHeight = availableWidth / totalAspectRatio;
    rows.push({ items: currentRow, height: rowHeight });
  }

  return rows;
}

function JustifiedGalleryCard({ item, rowHeight, index, onLike }: { item: InspirationItem; rowHeight: number; index: number; onLike?: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const aspectRatio = aspectRatioToNumber(item.aspectRatio);
  const cardWidth = rowHeight * aspectRatio;

  const formatLikeCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike && !item.isGenerated) {
      onLike(item.id);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.05, ease: "easeOut" }}
      style={{ width: cardWidth, height: rowHeight, flexShrink: 0 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "group w-full h-full bg-white dark:bg-[#111113] rounded-lg overflow-hidden cursor-pointer hover:shadow-[0_10px_40px_rgba(185,78,48,0.2)] transition-all duration-300",
        item.isGenerated && "ring-2 ring-[#E3B436] ring-offset-2 ring-offset-[#0A0A0B]"
      )}>
        <div className="relative w-full h-full overflow-hidden">
          {isVisible ? (
            <>
              <img 
                src={item.image} 
                alt={item.title} 
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#B94E30]/20 to-[#664D3F]/20 animate-pulse" />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 animate-pulse" />
          )}
          
          {item.isGenerated && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-[#B94E30] to-[#E3B436] px-2 py-1 rounded-full flex items-center gap-1 z-10">
              <Sparkles className="h-3 w-3 text-white" />
              <span className="text-[10px] font-medium text-white">NEW</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-3 text-white/80">
              <div className="flex items-center gap-1 text-xs">
                <Eye className="h-3 w-3" />
                <span>{item.views}</span>
              </div>
              <button 
                onClick={handleLikeClick}
                data-testid={`button-like-${item.id}`}
                className={cn(
                  "flex items-center gap-1 text-xs transition-all duration-200 hover:scale-110",
                  item.isLiked ? "text-[#B94E30]" : "text-white/80 hover:text-[#B94E30]"
                )}
              >
                <Heart className={cn("h-3 w-3", item.isLiked && "fill-current")} />
                <span>{formatLikeCount(item.likes)}</span>
              </button>
              <div className="flex items-center gap-1 text-xs">
                <Wand2 className="h-3 w-3" />
                <span>{item.uses}</span>
              </div>
            </div>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="bg-black/40 backdrop-blur-md rounded-lg p-2">
                    <p className="text-[10px] text-white/90 leading-relaxed line-clamp-2">
                      <span className="text-[#E3B436] font-medium">Prompt: </span>
                      {item.prompt}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface JustifiedGalleryProps {
  items: InspirationItem[];
  generatedImage?: { imageData: string; mimeType: string; aspectRatio: string } | null;
  onLike?: (id: string) => void;
}

function JustifiedGallery({ items, generatedImage, onLike }: JustifiedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [rows, setRows] = useState<JustifiedRow[]>([]);
  const [contentHeight, setContentHeight] = useState(0);
  const isHoverPausedRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const animationStartedRef = useRef(false);
  const [persistedGeneratedImages, setPersistedGeneratedImages] = useState<InspirationItem[]>([]);
  const lastGeneratedImageRef = useRef<string | null>(null);
  const originalContentHeightRef = useRef<number>(0);
  const scrollPositionRef = useRef<number>(0);
  const prevContentHeightRef = useRef<number>(0);

  useEffect(() => {
    if (generatedImage) {
      // Use hash of full image data for unique identification (not just first 50 chars which can be identical for different images)
      const imageHash = generatedImage.imageData.length.toString() + '-' + generatedImage.imageData.slice(-100);
      if (lastGeneratedImageRef.current !== imageHash) {
        lastGeneratedImageRef.current = imageHash;
        const newGeneratedItem: InspirationItem = {
          id: `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: "Your AI Creation ✨",
          image: `data:${generatedImage.mimeType};base64,${generatedImage.imageData}`,
          creator: "you",
          verified: false,
          views: "NEW",
          likes: 0,
          uses: "0",
          category: "Generated",
          aspectRatio: generatedImage.aspectRatio as "1:1" | "9:16" | "16:9" | "4:5" | "3:4",
          prompt: "Your generated image",
          isGenerated: true
        };
        setPersistedGeneratedImages(prev => [...prev, newGeneratedItem]);
      }
    }
  }, [generatedImage]);

  const displayItems = useMemo(() => {
    // Append generated images at the end so they scroll up naturally from below
    return [...items, ...persistedGeneratedImages];
  }, [items, persistedGeneratedImages]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const targetHeight = containerWidth < 640 ? 180 : containerWidth < 1024 ? 220 : 280;
    const calculatedRows = calculateJustifiedRows(displayItems, containerWidth, targetHeight, 4);
    setRows(calculatedRows);
  }, [displayItems, containerWidth]);

  useEffect(() => {
    if (scrollRef.current && rows.length > 0) {
      // Use setTimeout to ensure DOM has rendered
      setTimeout(() => {
        if (scrollRef.current) {
          const totalHeight = scrollRef.current.scrollHeight;
          const newHalfHeight = totalHeight / 2;
          
          originalContentHeightRef.current = newHalfHeight;
          prevContentHeightRef.current = newHalfHeight;
          setContentHeight(newHalfHeight);
        }
      }, 100);
    }
  }, [rows]);

  const handleMouseEnter = () => {
    isHoverPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoverPausedRef.current = false;
  };

  const renderRows = (keyPrefix: string) => {
    let itemIndex = 0;
    return rows.map((row, rowIndex) => (
      <div key={`${keyPrefix}-${rowIndex}`} className="flex gap-1 mb-1">
        {row.items.map((item) => {
          const currentIndex = itemIndex++;
          return (
            <JustifiedGalleryCard
              key={`${keyPrefix}-${item.id}`}
              item={item}
              rowHeight={row.height}
              index={currentIndex}
              onLike={onLike}
            />
          );
        })}
      </div>
    ));
  };

  // Start animation once and keep it running - don't restart on row changes
  useEffect(() => {
    if (animationStartedRef.current) return; // Already running
    if (rows.length === 0 || !scrollRef.current) return;
    
    const speed = 0.5;
    
    const animate = () => {
      if (!isHoverPausedRef.current && scrollRef.current) {
        scrollPositionRef.current += speed;
        const halfHeight = originalContentHeightRef.current;
        if (halfHeight > 0 && scrollPositionRef.current >= halfHeight) {
          scrollPositionRef.current = scrollPositionRef.current - halfHeight;
        }
        scrollRef.current.style.transform = `translateY(-${scrollPositionRef.current}px)`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    const timeout = setTimeout(() => {
      animationStartedRef.current = true;
      animationRef.current = requestAnimationFrame(animate);
    }, 1000);
    
    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rows.length > 0]); // Only depend on whether we have rows, not the rows themselves

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      {/* Viewport wrapper - clips to show only one set of content */}
      <div 
        className="w-full overflow-hidden"
        style={{ height: contentHeight > 0 ? `${contentHeight}px` : '100%' }}
      >
        <div 
          ref={scrollRef}
          className="w-full px-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {renderRows('first')}
          {renderRows('second')}
        </div>
      </div>
    </div>
  );
}

const formatViewCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const fallbackGalleryImages: InspirationItem[] = [
  {
    id: "fallback-1",
    title: "Luxury Watch Product Shot",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
    creator: "productpro",
    verified: true,
    views: "234.5K",
    likes: 45200,
    uses: "18.3K",
    category: "Product",
    aspectRatio: "1:1",
    prompt: "Luxury Swiss timepiece floating on reflective black surface, dramatic side lighting"
  },
  {
    id: "fallback-2",
    title: "Golden Hour Portrait",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop",
    creator: "portraitmaster",
    verified: true,
    views: "312.8K",
    likes: 58700,
    uses: "24.1K",
    category: "Portrait",
    aspectRatio: "4:5",
    prompt: "Intimate portrait bathed in warm golden hour sunlight"
  },
  {
    id: "fallback-3",
    title: "Mountain Lake Reflection",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
    creator: "alpinedreamer",
    verified: true,
    views: "523.4K",
    likes: 97300,
    uses: "35.2K",
    category: "Landscape",
    aspectRatio: "16:9",
    prompt: "Crystal clear alpine lake reflecting snow-capped mountains"
  },
  {
    id: "fallback-4",
    title: "Neon Tokyo Streets",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
    creator: "cyberpunker",
    verified: true,
    views: "398.1K",
    likes: 72800,
    uses: "30.1K",
    category: "Street",
    aspectRatio: "9:16",
    prompt: "Rain-soaked Tokyo alleyway at night with vibrant neon signs"
  },
  {
    id: "fallback-5",
    title: "Cherry Blossom Dreams",
    image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1000&auto=format&fit=crop",
    creator: "sakuralove",
    verified: true,
    views: "342.1K",
    likes: 63800,
    uses: "26.5K",
    category: "Nature",
    aspectRatio: "3:4",
    prompt: "Delicate pink cherry blossoms against soft blue sky"
  }
];

export default function PublicHome() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generatedImage, setGeneratedImage] = useState<{ imageData: string; mimeType: string; aspectRatio: string } | null>(null);

  const { data: galleryData } = useQuery<{ images: any[] }>({
    queryKey: ['/api/gallery'],
    queryFn: async () => {
      const response = await fetch('/api/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery');
      return response.json();
    },
    staleTime: 30000,
  });

  const likeMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await apiRequest('POST', `/api/gallery/${imageId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
    }
  });

  const galleryImages: InspirationItem[] = useMemo(() => {
    if (!galleryData?.images?.length) return fallbackGalleryImages;
    return galleryData.images.map((img: any) => ({
      id: img.id,
      title: img.title,
      image: img.imageUrl,
      creator: img.creator,
      verified: img.verified,
      views: formatViewCount(img.viewCount || 0),
      likes: img.likeCount || 0,
      uses: formatViewCount(Math.floor((img.likeCount || 0) * 0.4)),
      category: img.category,
      aspectRatio: img.aspectRatio as "1:1" | "9:16" | "16:9" | "4:5" | "3:4",
      prompt: img.prompt,
      isLiked: img.isLiked
    }));
  }, [galleryData]);

  const handleLike = useCallback((imageId: string) => {
    if (!user) return;
    likeMutation.mutate(imageId);
  }, [user]);

  const handleImageGenerated = useCallback((imageData: { imageData: string; mimeType: string; aspectRatio: string }) => {
    setGeneratedImage(imageData);
  }, []);

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <GoogleAutoSignIn />
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 relative h-full overflow-hidden bg-[#0A0A0B]">
        <JustifiedGallery items={galleryImages} generatedImage={generatedImage} onLike={handleLike} />
      </main>

      <FloatingPromptBar onImageGenerated={handleImageGenerated} />
    </div>
  );
}
