import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Eye, 
  Heart, 
  Wand2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PublicSidebar } from "@/components/public-sidebar";
import { FloatingPromptBar } from "@/components/floating-prompt-bar";
import { GoogleAutoSignIn } from "@/components/google-auto-signin";

interface InspirationItem {
  id: number;
  title: string;
  image: string;
  creator: string;
  verified: boolean;
  views: string;
  likes: string;
  uses: string;
  category: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5" | "3:4";
  prompt: string;
  isGenerated?: boolean;
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

function JustifiedGalleryCard({ item, rowHeight, index }: { item: InspirationItem; rowHeight: number; index: number }) {
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
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-3 text-white/80">
              <div className="flex items-center gap-1 text-xs">
                <Eye className="h-3 w-3" />
                <span>{item.views}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Heart className="h-3 w-3" />
                <span>{item.likes}</span>
              </div>
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
}

function JustifiedGallery({ items, generatedImage }: JustifiedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [rows, setRows] = useState<JustifiedRow[]>([]);
  const isHoverPausedRef = useRef(false);
  const isGenerationPausedRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayItems = useMemo(() => {
    if (!generatedImage) return items;
    
    const generatedItem: InspirationItem = {
      id: -1,
      title: "Your AI Creation ✨",
      image: `data:${generatedImage.mimeType};base64,${generatedImage.imageData}`,
      creator: "you",
      verified: false,
      views: "NEW",
      likes: "0",
      uses: "0",
      category: "Generated",
      aspectRatio: generatedImage.aspectRatio as "1:1" | "9:16" | "16:9" | "4:5" | "3:4",
      prompt: "Your generated image",
      isGenerated: true
    };
    
    // Append generated image at the end so it appears from bottom
    return [...items, generatedItem];
  }, [items, generatedImage]);

  // When a new generated image is added, scroll to bottom and pause
  useEffect(() => {
    if (generatedImage && scrollRef.current) {
      // Clear any existing pause timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      
      // Small delay to ensure rows are calculated before scrolling
      setTimeout(() => {
        if (scrollRef.current) {
          // Scroll to bottom to show the new image
          const maxScroll = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
          scrollRef.current.scrollTop = maxScroll;
        }
      }, 100);
      
      // Pause auto-scroll for 5 seconds so user can see their creation
      isGenerationPausedRef.current = true;
      pauseTimeoutRef.current = setTimeout(() => {
        isGenerationPausedRef.current = false;
      }, 5000);
    }
    
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [generatedImage]);

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
    if (!scrollRef.current || rows.length === 0) return;
    
    const scrollContainer = scrollRef.current;
    const scrollSpeed = 0.3;

    const initAndAnimate = () => {
      if (!initializedRef.current && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        scrollContainer.scrollTop = 0;
        initializedRef.current = true;
      }
    };

    const animate = () => {
      const isPaused = isHoverPausedRef.current || isGenerationPausedRef.current;
      if (!isPaused && scrollRef.current) {
        const currentScroll = scrollRef.current.scrollTop;
        const maxScroll = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
        const newScroll = currentScroll + scrollSpeed;
        
        if (newScroll >= maxScroll) {
          scrollRef.current.scrollTop = 0;
        } else {
          scrollRef.current.scrollTop = newScroll;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(() => {
      initAndAnimate();
      animationRef.current = requestAnimationFrame(animate);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rows]);

  const handleMouseEnter = () => {
    isHoverPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoverPausedRef.current = false;
  };

  let itemIndex = 0;

  return (
    <div ref={containerRef} className="w-full h-full">
      <div 
        ref={scrollRef}
        className="w-full h-screen overflow-hidden px-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 mb-1">
            {row.items.map((item) => {
              const currentIndex = itemIndex++;
              return (
                <JustifiedGalleryCard
                  key={item.id}
                  item={item}
                  rowHeight={row.height}
                  index={currentIndex}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const galleryImages: InspirationItem[] = [
  {
    id: 1,
    title: "Luxury Watch Product Shot",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
    creator: "productpro",
    verified: true,
    views: "234.5K",
    likes: "45.2K",
    uses: "18.3K",
    category: "Product",
    aspectRatio: "1:1",
    prompt: "Luxury Swiss timepiece floating on reflective black surface, dramatic side lighting creating golden highlights on brushed steel case, sapphire crystal catching prismatic light"
  },
  {
    id: 2,
    title: "Golden Hour Portrait",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop",
    creator: "portraitmaster",
    verified: true,
    views: "312.8K",
    likes: "58.7K",
    uses: "24.1K",
    category: "Portrait",
    aspectRatio: "4:5",
    prompt: "Intimate portrait bathed in warm golden hour sunlight, soft bokeh background of autumn leaves, natural skin texture, wind-swept hair catching light"
  },
  {
    id: 3,
    title: "Gourmet Burger Perfection",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop",
    creator: "foodartist",
    verified: true,
    views: "189.3K",
    likes: "37.6K",
    uses: "15.8K",
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Towering gourmet burger with perfectly melted aged cheddar, crispy bacon, caramelized onions, fresh lettuce, brioche bun with sesame seeds"
  },
  {
    id: 4,
    title: "Majestic Lion King",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1000&auto=format&fit=crop",
    creator: "wildlifeart",
    verified: true,
    views: "456.2K",
    likes: "89.4K",
    uses: "35.2K",
    category: "Wildlife",
    aspectRatio: "16:9",
    prompt: "Majestic male lion with full golden mane, intense amber eyes staring directly at camera, African savanna at golden hour, dust particles catching light"
  },
  {
    id: 5,
    title: "Modern Architecture Marvel",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1000&auto=format&fit=crop",
    creator: "archidesign",
    verified: false,
    views: "178.9K",
    likes: "32.1K",
    uses: "13.7K",
    category: "Architecture",
    aspectRatio: "9:16",
    prompt: "Stunning modern skyscraper with curved glass facade reflecting blue sky and clouds, geometric patterns created by window frames, dramatic low angle"
  },
  {
    id: 6,
    title: "Enchanted Forest Path",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop",
    creator: "naturelover",
    verified: true,
    views: "267.4K",
    likes: "51.8K",
    uses: "21.3K",
    category: "Landscape",
    aspectRatio: "3:4",
    prompt: "Mystical forest pathway covered in emerald moss, ancient trees with twisted branches forming natural cathedral, volumetric light rays piercing through canopy"
  },
  {
    id: 7,
    title: "High Fashion Editorial",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
    creator: "fashionista",
    verified: true,
    views: "345.6K",
    likes: "67.3K",
    uses: "28.9K",
    category: "Fashion",
    aspectRatio: "9:16",
    prompt: "High fashion editorial portrait, model wearing avant-garde couture gown in deep burgundy silk, dramatic studio lighting with sharp shadows"
  },
  {
    id: 8,
    title: "Neon Tokyo Nights",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
    creator: "cityscape",
    verified: true,
    views: "298.7K",
    likes: "57.2K",
    uses: "23.6K",
    category: "Urban",
    aspectRatio: "16:9",
    prompt: "Rain-soaked Tokyo street at night, neon signs reflecting on wet pavement in pink, blue, and purple, steam rising from street vents"
  },
  {
    id: 9,
    title: "Artisan Coffee Pour",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop",
    creator: "coffeeculture",
    verified: false,
    views: "156.3K",
    likes: "29.8K",
    uses: "12.4K",
    category: "Food",
    aspectRatio: "4:5",
    prompt: "Perfect latte art being poured, barista hands creating intricate rosetta pattern, warm cafe lighting, steam rising from ceramic cup"
  },
  {
    id: 10,
    title: "Ethereal Butterfly Garden",
    image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=1000&auto=format&fit=crop",
    creator: "macroworld",
    verified: true,
    views: "187.4K",
    likes: "36.5K",
    uses: "15.1K",
    category: "Nature",
    aspectRatio: "1:1",
    prompt: "Monarch butterfly resting on purple lavender flower, extreme macro photography revealing wing scale details, morning dew droplets on petals"
  },
  {
    id: 11,
    title: "Minimalist Interior Design",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
    creator: "interiorpro",
    verified: true,
    views: "234.1K",
    likes: "45.6K",
    uses: "19.2K",
    category: "Interior",
    aspectRatio: "16:9",
    prompt: "Scandinavian minimalist living room with clean lines, neutral color palette of whites and warm woods, statement arc floor lamp"
  },
  {
    id: 12,
    title: "Cosmic Galaxy Spiral",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop",
    creator: "spaceexplorer",
    verified: true,
    views: "378.9K",
    likes: "74.2K",
    uses: "31.5K",
    category: "Space",
    aspectRatio: "1:1",
    prompt: "Breathtaking spiral galaxy with vibrant purple and blue nebula clouds, millions of stars in various colors, cosmic dust lanes visible"
  },
  {
    id: 13,
    title: "Fresh Sushi Platter",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
    creator: "sushimaster",
    verified: true,
    views: "198.5K",
    likes: "38.9K",
    uses: "16.2K",
    category: "Food",
    aspectRatio: "16:9",
    prompt: "Exquisite omakase sushi platter on black slate, featuring otoro, uni, and ikura, each piece glistening with freshness"
  },
  {
    id: 14,
    title: "Vintage Porsche 911",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop",
    creator: "autoart",
    verified: true,
    views: "287.3K",
    likes: "56.1K",
    uses: "23.4K",
    category: "Automotive",
    aspectRatio: "16:9",
    prompt: "Classic Porsche 911 in racing green, parked on coastal road at sunset, chrome details catching golden light, mountains in background"
  },
  {
    id: 15,
    title: "Fluffy Corgi Portrait",
    image: "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?q=80&w=1000&auto=format&fit=crop",
    creator: "petlover",
    verified: true,
    views: "423.7K",
    likes: "82.5K",
    uses: "34.8K",
    category: "Pets",
    aspectRatio: "1:1",
    prompt: "Adorable Pembroke Welsh Corgi with perfect fluffy coat, happy expression with tongue out, sitting in flower meadow, soft natural lighting"
  },
  {
    id: 16,
    title: "Tropical Paradise Beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
    creator: "travelphoto",
    verified: true,
    views: "356.2K",
    likes: "69.8K",
    uses: "29.3K",
    category: "Travel",
    aspectRatio: "16:9",
    prompt: "Pristine white sand beach with crystal clear turquoise water, palm trees swaying gently, dramatic sunset with orange and pink clouds"
  },
  {
    id: 17,
    title: "Abstract Fluid Art",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop",
    creator: "abstractart",
    verified: true,
    views: "198.4K",
    likes: "38.7K",
    uses: "16.1K",
    category: "Abstract",
    aspectRatio: "1:1",
    prompt: "Mesmerizing fluid art with swirling metallics and vibrant colors, gold, turquoise, and deep purple creating organic patterns"
  },
  {
    id: 18,
    title: "Elegant Perfume Bottle",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop",
    creator: "luxurybrands",
    verified: true,
    views: "145.8K",
    likes: "28.3K",
    uses: "11.7K",
    category: "Product",
    aspectRatio: "3:4",
    prompt: "Luxury perfume bottle with faceted crystal design, golden cap reflecting studio lights, dramatic shadows on marble surface"
  },
  {
    id: 19,
    title: "Mountain Reflection Lake",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
    creator: "landscapepro",
    verified: true,
    views: "389.5K",
    likes: "76.2K",
    uses: "32.1K",
    category: "Landscape",
    aspectRatio: "16:9",
    prompt: "Majestic snow-capped mountains perfectly reflected in still alpine lake, pink and orange sunrise colors, foreground wildflowers"
  },
  {
    id: 20,
    title: "Decadent Chocolate Cake",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop",
    creator: "dessertlover",
    verified: true,
    views: "234.7K",
    likes: "45.8K",
    uses: "19.1K",
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Three-layer dark chocolate cake with glossy ganache dripping down sides, fresh raspberries on top, dusted with edible gold"
  },
  {
    id: 21,
    title: "Aurora Borealis Magic",
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1000&auto=format&fit=crop",
    creator: "aurorahunter",
    verified: true,
    views: "423.6K",
    likes: "82.9K",
    uses: "35.1K",
    category: "Nature",
    aspectRatio: "16:9",
    prompt: "Spectacular northern lights dancing across Arctic sky, vivid green and purple aurora curtains, snow-covered landscape below"
  },
  {
    id: 22,
    title: "Modern Sneaker Design",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    creator: "sneakerhead",
    verified: true,
    views: "312.5K",
    likes: "61.3K",
    uses: "25.7K",
    category: "Product",
    aspectRatio: "16:9",
    prompt: "Futuristic running sneaker floating in mid-air, dynamic angle showing sole design, vibrant red colorway with white accents"
  },
  {
    id: 23,
    title: "Sleeping Kitten Cuteness",
    image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1000&auto=format&fit=crop",
    creator: "catlover",
    verified: true,
    views: "567.8K",
    likes: "112.4K",
    uses: "47.2K",
    category: "Pets",
    aspectRatio: "1:1",
    prompt: "Tiny orange tabby kitten curled up sleeping on fluffy white blanket, paws tucked under chin, soft natural window light"
  },
  {
    id: 24,
    title: "Venice Canal Romance",
    image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?q=80&w=1000&auto=format&fit=crop",
    creator: "travelroma",
    verified: true,
    views: "287.6K",
    likes: "56.3K",
    uses: "23.6K",
    category: "Travel",
    aspectRatio: "3:4",
    prompt: "Gondola gliding through Venice canal at golden hour, ancient buildings with weathered facades reflecting in water"
  }
];

export default function PublicHome() {
  const [generatedImage, setGeneratedImage] = useState<{ imageData: string; mimeType: string; aspectRatio: string } | null>(null);

  const handleImageGenerated = (imageData: { imageData: string; mimeType: string; aspectRatio: string }) => {
    setGeneratedImage(imageData);
  };

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <GoogleAutoSignIn />
      <PublicSidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 relative h-full overflow-hidden bg-[#0A0A0B]">
        <JustifiedGallery items={galleryImages} generatedImage={generatedImage} />
      </main>

      <FloatingPromptBar onImageGenerated={handleImageGenerated} />
    </div>
  );
}
