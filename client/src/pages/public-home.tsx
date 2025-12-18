import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Eye, 
  Heart, 
  Wand2,
  Sparkles,
  Clock,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { FloatingPromptBar } from "@/components/floating-prompt-bar";
import { GoogleAutoSignIn } from "@/components/google-auto-signin";
import { Button } from "@/components/ui/button";
import { useLoginPopup } from "@/components/login-popup";
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
  createdAt?: string;
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

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
          
          {!item.isGenerated && item.createdAt && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 z-10">
              <Clock className="h-3 w-3 text-[#E3B436]" />
              <span className="text-[10px] font-medium text-white">{formatTimeAgo(new Date(item.createdAt))}</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-3 text-white/80 flex-wrap">
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
  const isHoverPausedRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const animationStartedRef = useRef(false);
  const [persistedGeneratedImages, setPersistedGeneratedImages] = useState<InspirationItem[]>([]);
  const lastGeneratedImageRef = useRef<string | null>(null);
  const originalContentHeightRef = useRef<number>(0);
  const scrollPositionRef = useRef<number>(0);

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
    const baseItems = [...items, ...persistedGeneratedImages];
    if (baseItems.length < 20) {
      return [
        ...baseItems.map((item) => ({ ...item, id: `${item.id}-a` })),
        ...baseItems.map((item) => ({ ...item, id: `${item.id}-b` })),
      ];
    }
    return baseItems;
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
    const targetHeight = containerWidth < 640 ? 140 : containerWidth < 1024 ? 180 : 220;
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
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
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
  );
}

const formatViewCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Fallback images to show if API fails - ensures gallery always loads
const FALLBACK_GALLERY: InspirationItem[] = [
  { id: "f1", title: "Mountain Lake", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", creator: "nature", verified: true, views: "523K", likes: 97301, uses: "38K", category: "Landscape", aspectRatio: "16:9", prompt: "Alpine lake with mountain reflections" },
  { id: "f2", title: "Majestic Lion", image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800", creator: "wildlife", verified: true, views: "456K", likes: 89400, uses: "35K", category: "Wildlife", aspectRatio: "16:9", prompt: "Male lion with golden mane" },
  { id: "f3", title: "Tropical Beach", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", creator: "travel", verified: true, views: "476K", likes: 88501, uses: "35K", category: "Landscape", aspectRatio: "16:9", prompt: "Pristine white sand beach" },
  { id: "f4", title: "Sports Car", image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800", creator: "auto", verified: true, views: "445K", likes: 84200, uses: "33K", category: "Automotive", aspectRatio: "16:9", prompt: "Sleek Italian supercar" },
  { id: "f5", title: "Tokyo Streets", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", creator: "urban", verified: true, views: "398K", likes: 72800, uses: "29K", category: "Street", aspectRatio: "9:16", prompt: "Neon-lit Tokyo alleyway" },
  { id: "f6", title: "Cherry Blossoms", image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800", creator: "nature", verified: true, views: "342K", likes: 63801, uses: "25K", category: "Nature", aspectRatio: "3:4", prompt: "Pink cherry blossoms in spring" },
  { id: "f7", title: "Portrait", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800", creator: "portrait", verified: true, views: "312K", likes: 58700, uses: "23K", category: "Portrait", aspectRatio: "4:5", prompt: "Golden hour portrait photography" },
  { id: "f8", title: "Wisdom Portrait", image: "/attached_assets/WhatsApp_Image_2025-12-12_at_23.13.24_1765705608734.jpeg", creator: "portrait", verified: true, views: "287K", likes: 54200, uses: "21K", category: "Portrait", aspectRatio: "1:1", prompt: "Elderly woman portrait with natural lighting" },
  { id: "f9", title: "Studio Portrait", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800", creator: "fashion", verified: true, views: "289K", likes: 53900, uses: "21K", category: "Portrait", aspectRatio: "4:5", prompt: "Professional studio lighting" },
  { id: "f10", title: "Forest Path", image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", creator: "nature", verified: true, views: "267K", likes: 51300, uses: "20K", category: "Landscape", aspectRatio: "3:4", prompt: "Mystical forest in autumn" },
  { id: "f11", title: "Tribal Warrior", image: "/attached_assets/WhatsApp_Image_2025-12-12_at_23.13.44_1765705621612.jpeg", creator: "culture", verified: true, views: "234K", likes: 45200, uses: "18K", category: "Portrait", aspectRatio: "1:1", prompt: "Tribal man with traditional face paint" },
  { id: "f12", title: "Orchestra Maestro", image: "/attached_assets/WhatsApp_Image_2025-12-11_at_19.53.53_1765705631516.jpeg", creator: "music", verified: true, views: "215K", likes: 41700, uses: "16K", category: "Performance", aspectRatio: "1:1", prompt: "Orchestra conductor in action" },
  { id: "f13", title: "Glass Artisan", image: "/attached_assets/WhatsApp_Image_2025-12-11_at_19.54.24_1765705654685.jpeg", creator: "craft", verified: true, views: "189K", likes: 37600, uses: "15K", category: "Craft", aspectRatio: "1:1", prompt: "Glassblower craftsman at work" },
  { id: "f14", title: "City Lights", image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800", creator: "urban", verified: false, views: "198K", likes: 36400, uses: "14K", category: "Street", aspectRatio: "16:9", prompt: "Long exposure city street" },
  { id: "f15", title: "Architecture", image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800", creator: "archi", verified: false, views: "178K", likes: 32100, uses: "12K", category: "Architecture", aspectRatio: "9:16", prompt: "Modern glass skyscraper" },
  { id: "f16", title: "Aboriginal Art", image: "/attached_assets/WhatsApp_Image_2025-12-11_at_19.54.06_1765705682455.jpeg", creator: "art", verified: false, views: "156K", likes: 29801, uses: "11K", category: "Art", aspectRatio: "1:1", prompt: "Aboriginal art sunset scene" },
];

function BrandingHeader() {
  const { openLoginPopup } = useLoginPopup();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
    >
      <div className="bg-gradient-to-b from-[#0A0A0B]/90 via-[#0A0A0B]/60 to-transparent pt-8 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center pointer-events-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#B94E30] to-[#E3B436] flex items-center justify-center shadow-lg shadow-[#B94E30]/30">
              <div className="h-4 w-4 bg-white/20 rounded-md backdrop-blur-sm" />
            </div>
            <span className="font-bold text-3xl text-white" data-testid="text-ugli-logo">UGLI</span>
          </div>
          
          <h1 className="text-xl md:text-2xl font-medium text-white/90 mb-2" data-testid="text-tagline">
            AI-Powered Creative Studio
          </h1>
          <p className="text-sm md:text-base text-white/60 mb-6 max-w-lg mx-auto" data-testid="text-description">
            Generate stunning images, product mockups, and remove backgrounds — all with AI
          </p>
          
          <Button 
            onClick={() => openLoginPopup()}
            className="bg-gradient-to-r from-[#B94E30] to-[#E3B436] hover:from-[#A3442A] hover:to-[#CDA130] text-white font-medium px-6 py-2.5 rounded-full shadow-lg shadow-[#B94E30]/30 transition-all hover:scale-105"
            data-testid="button-get-started-hero"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PublicHome() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generatedImage, setGeneratedImage] = useState<{ imageData: string; mimeType: string; aspectRatio: string } | null>(null);

  const [useFallback, setUseFallback] = useState(false);
  
  // Set a timeout to use fallback if API doesn't respond
  useEffect(() => {
    const timer = setTimeout(() => {
      setUseFallback(true);
    }, 3000); // 3 second timeout
    return () => clearTimeout(timer);
  }, []);

  const { data: galleryData, isLoading: isGalleryLoading } = useQuery<{ images: any[] }>({
    queryKey: ['/api/gallery'],
    queryFn: async () => {
      try {
        // Add timestamp to URL to completely bypass any caching
        const timestamp = Date.now();
        const response = await fetch(`/api/gallery?_t=${timestamp}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        
        // Handle 304 (CDN cache hit) - return cached data or use localStorage
        if (response.status === 304) {
          const cached = queryClient.getQueryData<{ images: any[] }>(['/api/gallery']);
          if (cached && cached.images.length > 0) {
            return cached;
          }
          // Try localStorage fallback
          const stored = localStorage.getItem('gallery_cache');
          if (stored) {
            return JSON.parse(stored);
          }
          return { images: [] };
        }
        
        // Handle other non-OK responses
        if (!response.ok) {
          console.error('Gallery API error:', response.status, response.statusText);
          const cached = queryClient.getQueryData<{ images: any[] }>(['/api/gallery']);
          if (cached && cached.images.length > 0) {
            return cached;
          }
          return { images: [] };
        }
        
        const text = await response.text();
        if (!text) {
          console.error('Gallery API returned empty response');
          return { images: [] };
        }
        
        const data = JSON.parse(text);
        // Store in localStorage for fallback
        try {
          localStorage.setItem('gallery_cache', JSON.stringify(data));
        } catch (e) {
          // localStorage might be full or disabled
        }
        return data;
      } catch (error) {
        console.error('Gallery fetch error:', error);
        return { images: [] };
      }
    },
    staleTime: 60000,
    refetchOnMount: true,
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
    const apiImages = galleryData?.images;
    
    // If API returned images, use them
    if (apiImages && apiImages.length > 0) {
      return apiImages.map((img: any) => ({
        id: String(img.id),
        title: img.title || 'Untitled',
        image: img.imageUrl,
        creator: img.creator || 'unknown',
        verified: Boolean(img.verified),
        views: formatViewCount(img.viewCount || 0),
        likes: img.likeCount || 0,
        uses: formatViewCount(Math.floor((img.likeCount || 0) * 0.4)),
        category: img.category || 'General',
        aspectRatio: (img.aspectRatio || '1:1') as "1:1" | "9:16" | "16:9" | "4:5" | "3:4",
        prompt: img.prompt || '',
        isLiked: Boolean(img.isLiked),
        createdAt: img.createdAt
      }));
    }
    
    // If timeout reached and no API data, use fallback
    if (useFallback) {
      return FALLBACK_GALLERY;
    }
    
    return [];
  }, [galleryData, useFallback]);
  
  // Gallery is ready if we have images from API OR fallback kicked in
  const isGalleryReady = galleryImages.length > 0;

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
        {!user && <BrandingHeader />}
        {isGalleryReady ? (
          <JustifiedGallery 
            items={galleryImages} 
            generatedImage={generatedImage} 
            onLike={handleLike} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#B94E30] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading gallery...</p>
            </div>
          </div>
        )}
      </main>

      <FloatingPromptBar onImageGenerated={handleImageGenerated} />
    </div>
  );
}
