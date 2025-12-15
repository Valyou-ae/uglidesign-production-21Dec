import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  TrendingUp, 
  BadgeCheck, 
  Eye, 
  Heart, 
  Wand2,
  Loader2,
  Users,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { galleryApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

interface InspirationItem {
  id: number | string;
  title: string;
  image: string;
  creator: string;
  verified: boolean;
  views: number;
  likes: number;
  uses: number;
  tags: string[];
  category: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5" | "3:4";
  prompt: string;
  isLiked?: boolean;
  isGalleryImage?: boolean;
}

function LazyMasonryCard({ item, index, onLike, onUse, onCopy }: { item: InspirationItem; index: number; onLike?: (id: string) => void; onUse?: (id: string) => void; onCopy?: (prompt: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const [useCount, setUseCount] = useState(item.uses);
  const [viewCount, setViewCount] = useState(item.views);
  const [copied, setCopied] = useState(false);
  const [remixed, setRemixed] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (item.isGalleryImage && !viewTracked) {
            setViewTracked(true);
            galleryApi.viewImage(String(item.id))
              .then(result => setViewCount(result.viewCount))
              .catch(() => {});
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [item.id, item.isGalleryImage, viewTracked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isGalleryImage) return;
    
    try {
      const result = await galleryApi.likeImage(String(item.id));
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      onLike?.(String(item.id));
    } catch {
      // Silently fail - user not logged in
    }
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    toast({ title: "Prompt copied!", description: "The prompt has been copied to your clipboard." });
    setTimeout(() => setCopied(false), 2000);
    
    if (item.isGalleryImage) {
      galleryApi.useImage(String(item.id)).catch(() => {});
      onUse?.(String(item.id));
    }
    
    onCopy?.(item.prompt);
  };

  const handleRemix = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.prompt);
    setRemixed(true);
    toast({ title: "Prompt copied!", description: "Go to Image Creation to create your own variant." });
    setTimeout(() => setRemixed(false), 2000);
    
    if (item.isGalleryImage) {
      try {
        const result = await galleryApi.useImage(String(item.id));
        setUseCount(result.useCount);
      } catch {
        setUseCount(prev => prev + 1);
      }
      onUse?.(String(item.id));
    }
    
    onCopy?.(item.prompt);
  };

  const aspectClasses: Record<string, string> = {
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-[16/9]",
    "4:5": "aspect-[4/5]",
    "3:4": "aspect-[3/4]"
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.05, ease: "easeOut" }}
      className="break-inside-avoid mb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="group bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-[20px] overflow-hidden cursor-pointer hover:border-[#B94E30]/50 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(185,78,48,0.15)] transition-all duration-300">
        <div className={cn("relative overflow-hidden", aspectClasses[item.aspectRatio])}>
          {isVisible ? (
            <>
              <img 
                src={item.image} 
                alt={item.title} 
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "w-full h-full object-cover transition-all duration-700 group-hover:scale-110",
                  imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
                )}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#B94E30]/20 to-[#664D3F]/20 animate-pulse" />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 animate-pulse" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
          
          {item.category === 'Community' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-[#B94E30]/90 backdrop-blur-sm rounded-full">
              <Users className="h-3 w-3 text-white" />
              <span className="text-[10px] font-medium text-white">Community</span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-base font-semibold text-white truncate drop-shadow-lg">{item.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#B94E30] to-[#E3B436]" />
              <span className="text-xs text-white/80">@{item.creator}</span>
              {item.verified && <BadgeCheck className="h-3 w-3 text-[#E3B436]" />}
            </div>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="bg-black/40 backdrop-blur-md rounded-lg p-3">
                    <p className="text-[11px] text-white/90 leading-relaxed line-clamp-3">
                      <span className="text-[#E3B436] font-medium">Prompt: </span>
                      {item.prompt}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#52525B]" title="Views">
                <Eye className="h-3.5 w-3.5" />
                <span>{formatCount(viewCount)}</span>
              </div>
              <button
                onClick={handleLike}
                disabled={!item.isGalleryImage}
                title={item.isGalleryImage ? (liked ? "Unlike" : "Like") : "Like community creations only"}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  !item.isGalleryImage && "opacity-50 cursor-not-allowed",
                  liked 
                    ? "text-red-500" 
                    : "text-[#71717A] dark:text-[#52525B]",
                  item.isGalleryImage && !liked && "hover:text-red-500"
                )}
                data-testid={`button-like-${item.id}`}
              >
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                <span>{formatCount(likeCount)}</span>
              </button>
              <button
                onClick={handleRemix}
                title="Remix - Copy prompt to create your own version"
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  remixed 
                    ? "text-[#B94E30]" 
                    : "text-[#71717A] dark:text-[#52525B] hover:text-[#B94E30]"
                )}
                data-testid={`button-remix-${item.id}`}
              >
                {remixed ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Wand2 className="h-3.5 w-3.5" />}
                <span>{formatCount(useCount)}</span>
              </button>
            </div>
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#52525B] hover:text-[#B94E30] transition-colors"
              data-testid={`button-copy-${item.id}`}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const allInspirations: InspirationItem[] = [
  {
    id: 1,
    title: "Luxury Watch Product Shot",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
    creator: "productpro",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["product", "luxury", "watch"],
    category: "Product",
    aspectRatio: "1:1",
    prompt: "Luxury Swiss timepiece floating on reflective black surface, dramatic side lighting creating golden highlights on brushed steel case, sapphire crystal catching prismatic light, leather strap with visible grain texture, commercial photography style, 8K resolution"
  },
  {
    id: 2,
    title: "Golden Hour Portrait",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop",
    creator: "portraitmaster",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["portrait", "golden hour", "natural"],
    category: "Portrait",
    aspectRatio: "4:5",
    prompt: "Intimate portrait of a woman bathed in warm golden hour sunlight, soft bokeh background of autumn leaves, natural skin texture with subtle frecles, wind-swept hair catching light, Hasselblad medium format quality, shallow depth of field f/1.4"
  },
  {
    id: 3,
    title: "Gourmet Burger Perfection",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop",
    creator: "foodartist",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["food", "burger", "gourmet"],
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Towering gourmet burger with perfectly melted aged cheddar, crispy bacon, caramelized onions, fresh lettuce, and brioche bun with sesame seeds, dramatic dark background, food styling with visible steam and juice drips, commercial food photography lighting"
  },
  {
    id: 4,
    title: "Majestic Lion King",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1000&auto=format&fit=crop",
    creator: "wildlifeart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["wildlife", "lion", "majestic"],
    category: "Wildlife",
    aspectRatio: "16:9",
    prompt: "Majestic male lion with full golden mane, intense amber eyes staring directly at camera, African savanna at golden hour, dust particles catching light, shallow depth of field isolating subject, National Geographic quality wildlife photography"
  },
  {
    id: 5,
    title: "Modern Architecture Marvel",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1000&auto=format&fit=crop",
    creator: "archidesign",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["architecture", "modern", "minimal"],
    category: "Architecture",
    aspectRatio: "9:16",
    prompt: "Stunning modern skyscraper with curved glass facade reflecting blue sky and clouds, geometric patterns created by window frames, shot from dramatic low angle, clean minimalist aesthetic, architectural photography with tilt-shift effect"
  },
  {
    id: 6,
    title: "Enchanted Forest Path",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop",
    creator: "naturelover",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["nature", "forest", "mystical"],
    category: "Landscape",
    aspectRatio: "3:4",
    prompt: "Mystical forest pathway covered in emerald moss, ancient trees with twisted branches forming natural cathedral, volumetric light rays piercing through canopy creating god rays, morning mist adding ethereal atmosphere, fantasy landscape photography"
  },
  {
    id: 7,
    title: "High Fashion Editorial",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
    creator: "fashionista",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["fashion", "editorial", "elegant"],
    category: "Fashion",
    aspectRatio: "9:16",
    prompt: "High fashion editorial portrait, model wearing avant-garde couture gown in deep burgundy silk, dramatic studio lighting with sharp shadows, minimalist white background, Vogue magazine cover quality, sophisticated and elegant pose"
  },
  {
    id: 8,
    title: "Neon Tokyo Nights",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
    creator: "cityscape",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cityscape", "neon", "tokyo"],
    category: "Urban",
    aspectRatio: "16:9",
    prompt: "Rain-soaked Tokyo street at night, neon signs reflecting on wet pavement in pink, blue, and purple, steam rising from street vents, silhouettes of pedestrians with umbrellas, cyberpunk atmosphere, cinematic color grading"
  },
  {
    id: 9,
    title: "Artisan Coffee Pour",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop",
    creator: "coffeeculture",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["coffee", "latte art", "cafe"],
    category: "Food",
    aspectRatio: "4:5",
    prompt: "Perfect latte art being poured, barista hands creating intricate rosetta pattern, warm cafe lighting, steam rising from ceramic cup, wooden counter with coffee beans scattered, shallow depth of field, cozy coffee shop atmosphere"
  },
  {
    id: 10,
    title: "Ethereal Butterfly Garden",
    image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=1000&auto=format&fit=crop",
    creator: "macroworld",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["butterfly", "macro", "nature"],
    category: "Nature",
    aspectRatio: "1:1",
    prompt: "Monarch butterfly resting on purple lavender flower, extreme macro photography revealing wing scale details, morning dew droplets on petals, soft bokeh background with hint of other butterflies, natural sunlight creating warm glow"
  },
  {
    id: 11,
    title: "Minimalist Interior Design",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
    creator: "interiorpro",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["interior", "minimalist", "modern"],
    category: "Interior",
    aspectRatio: "16:9",
    prompt: "Scandinavian minimalist living room with clean lines, neutral color palette of whites and warm woods, statement arc floor lamp, plush cream sofa, large windows with natural light streaming in, architectural digest quality photography"
  },
  {
    id: 12,
    title: "Cosmic Galaxy Spiral",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop",
    creator: "spaceexplorer",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["space", "galaxy", "cosmic"],
    category: "Space",
    aspectRatio: "1:1",
    prompt: "Breathtaking spiral galaxy with vibrant purple and blue nebula clouds, millions of stars in various colors, cosmic dust lanes visible, central bright core, Hubble telescope quality, deep space astrophotography"
  },
  {
    id: 13,
    title: "Fresh Sushi Platter",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
    creator: "sushimaster",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["sushi", "japanese", "food"],
    category: "Food",
    aspectRatio: "16:9",
    prompt: "Exquisite omakase sushi platter on black slate, featuring otoro, uni, and ikura, each piece glistening with freshness, wasabi and pickled ginger artfully placed, chopsticks resting elegantly, soft diffused lighting, Michelin star presentation"
  },
  {
    id: 14,
    title: "Vintage Porsche 911",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop",
    creator: "autoart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["car", "vintage", "porsche"],
    category: "Automotive",
    aspectRatio: "16:9",
    prompt: "Classic Porsche 911 in racing green, parked on coastal road at sunset, chrome details catching golden light, mountains in background, automotive photography with dramatic sky, nostalgic 1970s sports car aesthetic"
  },
  {
    id: 15,
    title: "Serene Japanese Garden",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
    creator: "zenmaster",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["garden", "japanese", "zen"],
    category: "Landscape",
    aspectRatio: "16:9",
    prompt: "Tranquil Japanese zen garden with perfectly raked gravel, ancient maple tree with vibrant red autumn leaves, traditional stone lantern, koi pond with reflections, morning mist adding serenity, peaceful contemplative atmosphere"
  },
  {
    id: 16,
    title: "Fluffy Corgi Portrait",
    image: "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?q=80&w=1000&auto=format&fit=crop",
    creator: "petlover",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["dog", "corgi", "cute"],
    category: "Pets",
    aspectRatio: "1:1",
    prompt: "Adorable Pembroke Welsh Corgi with perfect fluffy coat, happy expression with tongue out, sitting in flower meadow, soft natural lighting, sharp focus on eyes, professional pet photography, heartwarming and joyful mood"
  },
  {
    id: 17,
    title: "Tropical Paradise Beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
    creator: "travelphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["beach", "tropical", "paradise"],
    category: "Travel",
    aspectRatio: "16:9",
    prompt: "Pristine white sand beach with crystal clear turquoise water, palm trees swaying gently, dramatic sunset with orange and pink clouds, small wooden boat on shore, Maldives luxury resort vibes, travel photography"
  },
  {
    id: 18,
    title: "Abstract Fluid Art",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop",
    creator: "abstractart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["abstract", "fluid", "colorful"],
    category: "Abstract",
    aspectRatio: "1:1",
    prompt: "Mesmerizing fluid art with swirling metallics and vibrant colors, gold, turquoise, and deep purple creating organic patterns, high gloss finish, macro view showing cellular patterns, contemporary abstract art piece"
  },
  {
    id: 19,
    title: "Cozy Reading Nook",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000&auto=format&fit=crop",
    creator: "bookworm",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["books", "cozy", "reading"],
    category: "Lifestyle",
    aspectRatio: "4:5",
    prompt: "Inviting reading corner with floor-to-ceiling bookshelves, velvet armchair in forest green, warm lamp light, steaming cup of tea, rain visible through nearby window, hygge atmosphere, book lover's paradise"
  },
  {
    id: 20,
    title: "Elegant Perfume Bottle",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop",
    creator: "luxurybrands",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["perfume", "luxury", "product"],
    category: "Product",
    aspectRatio: "3:4",
    prompt: "Luxury perfume bottle with faceted crystal design, golden cap reflecting studio lights, dramatic shadows on marble surface, water droplets suggesting freshness, high-end cosmetics advertising photography"
  },
  {
    id: 21,
    title: "Mountain Reflection Lake",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
    creator: "landscapepro",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["mountain", "lake", "reflection"],
    category: "Landscape",
    aspectRatio: "16:9",
    prompt: "Majestic snow-capped mountains perfectly reflected in still alpine lake, pink and orange sunrise colors, foreground wildflowers, mirror-like water surface, Swiss Alps grandeur, landscape photography masterpiece"
  },
  {
    id: 22,
    title: "Street Style Fashion",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
    creator: "streetstyle",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["fashion", "street", "urban"],
    category: "Fashion",
    aspectRatio: "9:16",
    prompt: "Confident model in trendy streetwear, oversized vintage denim jacket, high-waisted pants, urban graffiti wall background, golden hour side lighting, candid walking pose, contemporary street fashion photography"
  },
  {
    id: 23,
    title: "Decadent Chocolate Cake",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop",
    creator: "dessertlover",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cake", "chocolate", "dessert"],
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Three-layer dark chocolate cake with glossy ganache dripping down sides, fresh raspberries on top, dusted with edible gold, rustic wooden cake stand, moody dark food photography, bakery advertisement quality"
  },
  {
    id: 24,
    title: "Wise Owl Portrait",
    image: "https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?q=80&w=1000&auto=format&fit=crop",
    creator: "birdphotog",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["owl", "wildlife", "portrait"],
    category: "Wildlife",
    aspectRatio: "4:5",
    prompt: "Great horned owl with piercing golden eyes, detailed feather texture visible, dark forest background with bokeh, dramatic lighting highlighting facial features, wise and mysterious expression, wildlife portrait photography"
  },
  {
    id: 25,
    title: "Modern Sneaker Design",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    creator: "sneakerhead",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["sneakers", "product", "modern"],
    category: "Product",
    aspectRatio: "16:9",
    prompt: "Futuristic running sneaker floating in mid-air, dynamic angle showing sole design, vibrant red colorway with white accents, gradient background matching shoe colors, commercial product photography with motion blur"
  },
  {
    id: 26,
    title: "Aurora Borealis Magic",
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1000&auto=format&fit=crop",
    creator: "aurorahunter",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["aurora", "night sky", "nature"],
    category: "Nature",
    aspectRatio: "16:9",
    prompt: "Spectacular northern lights dancing across Arctic sky, vivid green and purple aurora curtains, snow-covered landscape below, starry night with Milky Way visible, long exposure photography capturing light movement"
  },
  {
    id: 27,
    title: "Vintage Film Camera",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1000&auto=format&fit=crop",
    creator: "vintagecollector",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["camera", "vintage", "retro"],
    category: "Product",
    aspectRatio: "1:1",
    prompt: "Classic Leica film camera on aged leather surface, brass details catching warm light, worn patina showing years of use, shallow depth of field, nostalgic still life photography, collector's item showcase"
  },
  {
    id: 28,
    title: "Colorful Hot Air Balloons",
    image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1000&auto=format&fit=crop",
    creator: "adventurer",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["balloons", "colorful", "sky"],
    category: "Travel",
    aspectRatio: "3:4",
    prompt: "Dozens of colorful hot air balloons rising at dawn over Cappadocia fairy chimneys, soft pink and orange sunrise colors, misty valleys below, dream-like atmosphere, travel photography bucket list moment"
  },
  {
    id: 29,
    title: "Artisan Sourdough Bread",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop",
    creator: "bakeryart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["bread", "artisan", "bakery"],
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Rustic sourdough loaf with perfect ear and crust scoring, flour dusting, warm interior crumb visible in cross-section, wooden cutting board, wheat stalks as props, artisan bakery photography with natural window light"
  },
  {
    id: 30,
    title: "Cyberpunk City Portrait",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1000&auto=format&fit=crop",
    creator: "cyberpunk",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cyberpunk", "portrait", "neon"],
    category: "Portrait",
    aspectRatio: "4:5",
    prompt: "Cyberpunk portrait with neon pink and blue lighting on face, futuristic sunglasses reflecting city lights, rain droplets on skin, holographic jacket, dark urban background with neon signs, cinematic sci-fi aesthetic"
  },
  {
    id: 31,
    title: "Macro Water Droplet",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop",
    creator: "macrolens",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["macro", "water", "nature"],
    category: "Nature",
    aspectRatio: "16:9",
    prompt: "Perfect water droplet on green leaf surface, entire landscape reflected and inverted inside the drop, morning dew atmosphere, extreme macro photography with focus stacking, nature's tiny world revealed"
  },
  {
    id: 32,
    title: "Elegant Rose Bouquet",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1000&auto=format&fit=crop",
    creator: "floralart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["flowers", "roses", "elegant"],
    category: "Floral",
    aspectRatio: "4:5",
    prompt: "Luxurious bouquet of garden roses in soft pink and cream, romantic lighting with gentle shadows, vintage vase on marble surface, scattered petals, fine art floral photography with painterly quality"
  },
  {
    id: 33,
    title: "Industrial Loft Space",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000&auto=format&fit=crop",
    creator: "architech",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["interior", "loft", "industrial"],
    category: "Interior",
    aspectRatio: "16:9",
    prompt: "Stunning industrial loft conversion with exposed brick walls, steel beam ceiling, large factory windows, mix of vintage and modern furniture, warm Edison bulb lighting, urban chic living space photography"
  },
  {
    id: 34,
    title: "Sleeping Kitten Cuteness",
    image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1000&auto=format&fit=crop",
    creator: "catlover",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cat", "kitten", "cute"],
    category: "Pets",
    aspectRatio: "1:1",
    prompt: "Tiny orange tabby kitten curled up sleeping on fluffy white blanket, paws tucked under chin, soft natural window light, peaceful expression, extreme cuteness, heartwarming pet photography"
  },
  {
    id: 35,
    title: "Dramatic Storm Clouds",
    image: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop",
    creator: "stormphotog",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["storm", "dramatic", "sky"],
    category: "Nature",
    aspectRatio: "16:9",
    prompt: "Dramatic supercell thunderstorm with swirling cloud formations, lightning bolt illuminating dark purple sky, vast prairie landscape below, nature's raw power captured, storm chaser photography"
  },
  {
    id: 36,
    title: "Luxury Diamond Ring",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop",
    creator: "jewelryart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["jewelry", "diamond", "luxury"],
    category: "Product",
    aspectRatio: "1:1",
    prompt: "Exquisite solitaire diamond engagement ring, brilliant cut stone catching light with fire and sparkle, platinum band on black velvet, dramatic spot lighting, luxury jewelry advertising photography"
  },
  {
    id: 37,
    title: "Venice Canal Romance",
    image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?q=80&w=1000&auto=format&fit=crop",
    creator: "travelroma",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["venice", "travel", "romantic"],
    category: "Travel",
    aspectRatio: "3:4",
    prompt: "Gondola gliding through Venice canal at golden hour, ancient buildings with weathered facades reflecting in water, gondolier in striped shirt, fairy lights beginning to glow, romantic Italian travel photography"
  },
  {
    id: 38,
    title: "Geometric Abstract Pattern",
    image: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1000&auto=format&fit=crop",
    creator: "patternpro",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["geometric", "pattern", "abstract"],
    category: "Abstract",
    aspectRatio: "1:1",
    prompt: "Bold geometric pattern with overlapping circles and triangles, gradient colors from coral to teal, perfect symmetry, modern graphic design, seamless wallpaper texture, contemporary abstract art"
  },
  {
    id: 39,
    title: "Healthy Acai Bowl",
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=1000&auto=format&fit=crop",
    creator: "healthyfood",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["acai", "healthy", "food"],
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Vibrant purple acai smoothie bowl topped with fresh berries, granola, coconut flakes, and chia seeds arranged in beautiful pattern, white ceramic bowl, bright natural light, wellness food photography"
  },
  {
    id: 40,
    title: "Misty Mountain Sunrise",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop",
    creator: "mountaineer",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["mountain", "sunrise", "misty"],
    category: "Landscape",
    aspectRatio: "16:9",
    prompt: "Breathtaking mountain range emerging from sea of clouds at sunrise, first golden rays hitting snow-capped peaks, layers of misty valleys, epic scale and grandeur, fine art landscape photography masterpiece"
  },
  {
    id: 41,
    title: "Electric Guitar Hero",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1000&auto=format&fit=crop",
    creator: "musicshot",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["music", "guitar", "instrument"],
    category: "Music",
    aspectRatio: "3:4",
    prompt: "Vintage electric guitar with sunburst finish on dark wooden stage floor, dramatic spotlight creating lens flare, visible wood grain and chrome hardware details, rock concert atmosphere with subtle smoke haze, professional music photography with moody cinematic lighting"
  },
  {
    id: 42,
    title: "Tech Workspace Setup",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop",
    creator: "techdesign",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["technology", "workspace", "coding"],
    category: "Technology",
    aspectRatio: "16:9",
    prompt: "Modern developer workspace with dual monitors displaying code, mechanical keyboard with RGB backlighting, minimalist desk setup with potted succulent, warm ambient lighting from desk lamp, clean tech aesthetic photography showcasing productive creative environment"
  },
  {
    id: 43,
    title: "Basketball Action Shot",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop",
    creator: "sportsphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["basketball", "sports", "action"],
    category: "Sports",
    aspectRatio: "4:5",
    prompt: "Dynamic basketball player mid-dunk silhouette against gymnasium lights, motion blur on ball showing speed, dramatic backlighting creating rim light on athlete, hardwood court reflections visible, professional sports photography capturing peak athletic moment"
  },
  {
    id: 44,
    title: "Oil Painting Masterpiece",
    image: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?q=80&w=1000&auto=format&fit=crop",
    creator: "artcollector",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["art", "painting", "gallery"],
    category: "Art",
    aspectRatio: "3:4",
    prompt: "Classical oil painting in ornate gilded frame hanging in museum gallery, visible brushstroke texture and crackle patina, soft museum lighting highlighting rich color palette, art history masterpiece presentation with elegant wall mounting"
  },
  {
    id: 45,
    title: "Exotic Peacock Display",
    image: "https://images.unsplash.com/photo-1497206365907-f5e630693df0?q=80&w=1000&auto=format&fit=crop",
    creator: "birdwatcher",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["peacock", "wildlife", "colorful"],
    category: "Wildlife",
    aspectRatio: "16:9",
    prompt: "Magnificent peacock displaying full iridescent tail feathers in spectacular fan, emerald green and sapphire blue eyespots catching sunlight, shallow depth of field isolating bird against soft garden background, wildlife photography showcasing nature's brilliant artistry"
  },
  {
    id: 46,
    title: "Gothic Cathedral Interior",
    image: "https://images.unsplash.com/photo-1548407260-da850faa41e3?q=80&w=1000&auto=format&fit=crop",
    creator: "sacredspaces",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cathedral", "architecture", "gothic"],
    category: "Architecture",
    aspectRatio: "9:16",
    prompt: "Soaring Gothic cathedral interior with ribbed vaulted ceiling, stained glass windows casting colorful light beams onto stone floor, dramatic vertical perspective emphasizing height and grandeur, sacred architecture photography capturing spiritual atmosphere"
  },
  {
    id: 47,
    title: "Scandinavian Bedroom Design",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000&auto=format&fit=crop",
    creator: "homedecor",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["bedroom", "interior", "scandinavian"],
    category: "Interior",
    aspectRatio: "16:9",
    prompt: "Serene Scandinavian bedroom with crisp white linen bedding, natural wood headboard, minimalist nightstand with ceramic lamp, soft morning light through sheer curtains, hygge interior design photography creating peaceful restful atmosphere"
  },
  {
    id: 48,
    title: "Tropical Waterfall Paradise",
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1000&auto=format&fit=crop",
    creator: "waterfallhunter",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["waterfall", "tropical", "nature"],
    category: "Nature",
    aspectRatio: "3:4",
    prompt: "Majestic tropical waterfall cascading into crystal clear turquoise pool, lush green rainforest vegetation framing the scene, mist rising from impact creating rainbow, long exposure smoothing water into silky flow, paradise landscape photography"
  },
  {
    id: 49,
    title: "Vintage Vinyl Records",
    image: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=1000&auto=format&fit=crop",
    creator: "retrovinyl",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["vinyl", "music", "vintage"],
    category: "Music",
    aspectRatio: "1:1",
    prompt: "Stack of vintage vinyl records with colorful album covers, classic turntable in background, warm nostalgic lighting emphasizing retro aesthetic, visible record grooves and wear marks showing character, music lover's collection photography"
  },
  {
    id: 50,
    title: "Neon Sign Glow",
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1000&auto=format&fit=crop",
    creator: "neonlights",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["neon", "urban", "night"],
    category: "Urban",
    aspectRatio: "4:5",
    prompt: "Vibrant neon sign glowing against dark brick wall, pink and blue tubes forming artistic lettering, reflections on wet pavement below, urban night photography with cinematic color grading, retro-futuristic city atmosphere"
  },
  {
    id: 51,
    title: "Exotic Macaw Portrait",
    image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?q=80&w=1000&auto=format&fit=crop",
    creator: "exoticbirds",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["macaw", "parrot", "wildlife"],
    category: "Wildlife",
    aspectRatio: "4:5",
    prompt: "Stunning scarlet macaw with vivid red, yellow, and blue plumage, sharp detail on feather texture and curved beak, intelligent eye with catchlight, tropical jungle bokeh background, exotic bird portrait photography"
  },
  {
    id: 52,
    title: "Artisan Pizza Perfection",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop",
    creator: "pizzamaster",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["pizza", "food", "italian"],
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Wood-fired Neapolitan pizza with leopard-spotted crust, fresh buffalo mozzarella, San Marzano tomatoes, and basil leaves, rustic wooden pizza peel, dramatic overhead food photography with visible cheese pull and steam rising"
  },
  {
    id: 53,
    title: "Mountain Biking Adventure",
    image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?q=80&w=1000&auto=format&fit=crop",
    creator: "bikelife",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["biking", "sports", "adventure"],
    category: "Sports",
    aspectRatio: "16:9",
    prompt: "Mountain biker navigating rocky trail with dramatic mountain backdrop, dust cloud behind wheels showing speed, afternoon sun creating long shadows, action sports photography capturing adrenaline moment, adventure lifestyle imagery"
  },
  {
    id: 54,
    title: "Luxury Leather Handbag",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop",
    creator: "luxuryfashion",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["handbag", "luxury", "fashion"],
    category: "Fashion",
    aspectRatio: "1:1",
    prompt: "Premium Italian leather handbag with gold hardware details, artisan stitching visible, rich cognac brown patina, positioned on marble pedestal with dramatic side lighting, high-end product photography for luxury fashion advertising"
  },
  {
    id: 55,
    title: "Cherry Blossom Pathway",
    image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1000&auto=format&fit=crop",
    creator: "sakuralover",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cherry blossom", "spring", "japan"],
    category: "Floral",
    aspectRatio: "3:4",
    prompt: "Enchanting tunnel of pink cherry blossom trees in full bloom, petals gently falling like snow, stone pathway leading into the distance, soft diffused spring light, Japanese hanami season photography capturing ephemeral beauty"
  },
  {
    id: 56,
    title: "Retro Muscle Car",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop",
    creator: "musclecar",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["car", "muscle", "classic"],
    category: "Automotive",
    aspectRatio: "16:9",
    prompt: "Classic American muscle car in cherry red with chrome bumpers, parked on empty desert highway, dramatic sunset sky with orange and purple clouds, automotive photography capturing freedom and power, nostalgic road trip aesthetic"
  },
  {
    id: 57,
    title: "Smartphone Technology",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop",
    creator: "gadgetpro",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["smartphone", "technology", "device"],
    category: "Technology",
    aspectRatio: "4:5",
    prompt: "Premium smartphone floating against gradient background, edge-to-edge display showing colorful interface, subtle reflections on glass back, product photography with clean minimalist aesthetic, consumer electronics advertising imagery"
  },
  {
    id: 58,
    title: "Soccer Stadium Atmosphere",
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1000&auto=format&fit=crop",
    creator: "footballfan",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["soccer", "stadium", "sports"],
    category: "Sports",
    aspectRatio: "16:9",
    prompt: "Packed soccer stadium at night with floodlights illuminating green pitch, crowd creating sea of colors and scarves, player silhouettes on field, dramatic sports photography capturing electric match day atmosphere and fan passion"
  },
  {
    id: 59,
    title: "Abstract Marble Texture",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop",
    creator: "textureart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["marble", "texture", "abstract"],
    category: "Abstract",
    aspectRatio: "1:1",
    prompt: "Luxurious marble surface with dramatic veining patterns in gold and grey, high-resolution macro photography showing mineral details, elegant natural stone texture, sophisticated background for product photography and design projects"
  },
  {
    id: 60,
    title: "Golden Retriever Joy",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1000&auto=format&fit=crop",
    creator: "doglife",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["dog", "golden retriever", "happy"],
    category: "Pets",
    aspectRatio: "1:1",
    prompt: "Joyful golden retriever running through meadow with tongue out, ears flying back, golden fur catching sunlight, blurred flower field background, action pet photography capturing pure happiness and energy of beloved companion"
  },
  {
    id: 61,
    title: "Santorini Blue Domes",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1000&auto=format&fit=crop",
    creator: "greekislands",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["santorini", "greece", "travel"],
    category: "Travel",
    aspectRatio: "4:5",
    prompt: "Iconic Santorini white-washed buildings with bright blue domes overlooking Aegean Sea, sunset painting sky in warm orange and pink, cascading architecture down volcanic cliff, Mediterranean travel photography capturing Greek island magic"
  },
  {
    id: 62,
    title: "Nebula Star Formation",
    image: "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1000&auto=format&fit=crop",
    creator: "deepspace",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["nebula", "space", "stars"],
    category: "Space",
    aspectRatio: "16:9",
    prompt: "Spectacular nebula cloud with pillars of cosmic gas and dust, newborn stars glowing within stellar nursery, rich palette of crimson, gold, and turquoise, deep space astrophotography resembling Hubble telescope imagery"
  },
  {
    id: 63,
    title: "Sashimi Selection",
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=1000&auto=format&fit=crop",
    creator: "japanesefood",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["sashimi", "japanese", "seafood"],
    category: "Food",
    aspectRatio: "16:9",
    prompt: "Premium sashimi platter with glistening cuts of salmon, tuna, and yellowtail arranged on ice bed, shiso leaves and daikon garnish, traditional black slate presentation, moody food photography highlighting freshness and quality"
  },
  {
    id: 64,
    title: "Concert Stage Lights",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1000&auto=format&fit=crop",
    creator: "livemusicphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["concert", "music", "lights"],
    category: "Music",
    aspectRatio: "16:9",
    prompt: "Spectacular concert stage with dramatic lighting rig, laser beams cutting through smoke and haze, silhouetted crowd with raised hands, live music photography capturing energy and excitement of arena performance"
  },
  {
    id: 65,
    title: "Boutique Hotel Lobby",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1000&auto=format&fit=crop",
    creator: "hoteldesign",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["hotel", "interior", "luxury"],
    category: "Interior",
    aspectRatio: "16:9",
    prompt: "Elegant boutique hotel lobby with statement chandelier, plush velvet seating, marble floors with geometric patterns, curated art pieces, architectural interior photography showcasing sophisticated hospitality design"
  },
  {
    id: 66,
    title: "Wild Elephant Herd",
    image: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?q=80&w=1000&auto=format&fit=crop",
    creator: "safariphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["elephant", "safari", "wildlife"],
    category: "Wildlife",
    aspectRatio: "16:9",
    prompt: "Majestic elephant herd crossing African savanna at golden hour, dust clouds rising from dry earth, matriarch leading family group, acacia trees in background, National Geographic quality wildlife photography capturing family bonds"
  },
  {
    id: 67,
    title: "Modern Glass Tower",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1000&auto=format&fit=crop",
    creator: "urbanarch",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["skyscraper", "architecture", "modern"],
    category: "Architecture",
    aspectRatio: "9:16",
    prompt: "Contemporary glass skyscraper reflecting clouds and city skyline, geometric curtain wall facade with subtle blue tint, dramatic upward perspective, architectural photography emphasizing height and modern engineering achievement"
  },
  {
    id: 68,
    title: "Lavender Fields Forever",
    image: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?q=80&w=1000&auto=format&fit=crop",
    creator: "provencephoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["lavender", "provence", "floral"],
    category: "Floral",
    aspectRatio: "16:9",
    prompt: "Endless rows of purple lavender stretching to horizon in Provence, lone tree providing focal point, golden sunset light warming the scene, fragrant flower field landscape photography capturing French countryside romance"
  },
  {
    id: 69,
    title: "Swimming Competition",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1000&auto=format&fit=crop",
    creator: "swimphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["swimming", "sports", "competition"],
    category: "Sports",
    aspectRatio: "16:9",
    prompt: "Olympic swimmer cutting through crystal clear pool water, underwater camera angle showing perfect form, bubble trail and splash dynamics frozen in time, professional sports photography capturing athletic excellence and determination"
  },
  {
    id: 70,
    title: "Sunset Surfer Silhouette",
    image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1000&auto=format&fit=crop",
    creator: "surfphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["surfing", "sunset", "ocean"],
    category: "Sports",
    aspectRatio: "16:9",
    prompt: "Surfer silhouette riding wave against spectacular orange and pink sunset sky, spray catching golden light, dramatic ocean action photography, adventure lifestyle imagery capturing freedom and connection with nature"
  },
  {
    id: 71,
    title: "Artisan Cocktail Creation",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
    creator: "mixologist",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cocktail", "drink", "bar"],
    category: "Food",
    aspectRatio: "4:5",
    prompt: "Expertly crafted cocktail in crystal coupe glass with perfect citrus twist garnish, condensation droplets on glass, moody bar lighting with bokeh bottles in background, beverage photography for upscale establishment"
  },
  {
    id: 72,
    title: "Robot Technology Future",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop",
    creator: "futuretech",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["robot", "technology", "future"],
    category: "Technology",
    aspectRatio: "1:1",
    prompt: "Advanced humanoid robot with sleek white and silver design, articulated joints and sensor arrays visible, soft studio lighting creating futuristic atmosphere, artificial intelligence and robotics product photography"
  },
  {
    id: 73,
    title: "Street Art Mural",
    image: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?q=80&w=1000&auto=format&fit=crop",
    creator: "streetart",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["mural", "street art", "urban"],
    category: "Art",
    aspectRatio: "16:9",
    prompt: "Vibrant large-scale street mural covering entire building facade, bold colors and intricate details, urban art photography capturing graffiti culture, creative expression transforming city landscape into open-air gallery"
  },
  {
    id: 74,
    title: "Fluffy Bunny Portrait",
    image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=1000&auto=format&fit=crop",
    creator: "bunnylove",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["bunny", "rabbit", "cute"],
    category: "Pets",
    aspectRatio: "1:1",
    prompt: "Adorable lop-eared bunny with soft brown and white fur, twitching nose and alert eyes, sitting in meadow with clover, gentle natural lighting creating soft pet portrait, heartwarming animal photography"
  },
  {
    id: 75,
    title: "Northern Lights Iceland",
    image: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?q=80&w=1000&auto=format&fit=crop",
    creator: "icelandphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["aurora", "iceland", "night"],
    category: "Landscape",
    aspectRatio: "16:9",
    prompt: "Spectacular aurora borealis dancing over Icelandic volcanic landscape, green and purple light curtains reflected in glacial lagoon, icebergs floating in foreground, long exposure night photography capturing nature's light show"
  },
  {
    id: 76,
    title: "Haute Couture Runway",
    image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=1000&auto=format&fit=crop",
    creator: "fashionweek",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["fashion", "runway", "couture"],
    category: "Fashion",
    aspectRatio: "9:16",
    prompt: "High fashion model on illuminated runway in avant-garde designer gown, dramatic theatrical lighting from above, audience silhouettes in darkness, fashion week photography capturing movement and haute couture artistry"
  },
  {
    id: 77,
    title: "Moroccan Tagine Feast",
    image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?q=80&w=1000&auto=format&fit=crop",
    creator: "worldfood",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["moroccan", "tagine", "food"],
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Traditional Moroccan tagine with aromatic lamb stew, preserved lemons and olives, steam rising from conical clay pot, colorful spice market backdrop, exotic world cuisine photography celebrating culinary traditions"
  },
  {
    id: 78,
    title: "Drone Aerial Coastline",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1000&auto=format&fit=crop",
    creator: "aerialphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["aerial", "beach", "coastline"],
    category: "Travel",
    aspectRatio: "16:9",
    prompt: "Stunning drone perspective of turquoise ocean meeting white sand beach, waves creating foam patterns, lone figure providing scale, aerial photography revealing hidden coastal beauty and geometric shoreline patterns"
  },
  {
    id: 79,
    title: "Antique Bookshop Charm",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000&auto=format&fit=crop",
    creator: "booklover",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["books", "antique", "library"],
    category: "Interior",
    aspectRatio: "3:4",
    prompt: "Charming antique bookshop with floor-to-ceiling wooden shelves, leather-bound volumes and rolling ladder, warm golden lamp light, dust motes floating in sunbeam, nostalgic interior photography celebrating literary heritage"
  },
  {
    id: 80,
    title: "Geometric Color Explosion",
    image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1000&auto=format&fit=crop",
    creator: "colordesign",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["geometric", "colorful", "abstract"],
    category: "Abstract",
    aspectRatio: "1:1",
    prompt: "Explosion of geometric shapes in vibrant rainbow colors, overlapping translucent circles and triangles creating depth, contemporary graphic design aesthetic, bold abstract art suitable for modern interior decoration"
  },
  {
    id: 81,
    title: "Machu Picchu Mystique",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1000&auto=format&fit=crop",
    creator: "incatrails",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["machu picchu", "peru", "ancient"],
    category: "Travel",
    aspectRatio: "16:9",
    prompt: "Mystical Machu Picchu emerging from morning clouds, ancient Incan stone terraces cascading down mountain, Huayna Picchu peak rising dramatically, travel photography capturing wonder of archaeological marvel"
  },
  {
    id: 82,
    title: "Polar Bear Arctic",
    image: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=1000&auto=format&fit=crop",
    creator: "arcticwildlife",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["polar bear", "arctic", "wildlife"],
    category: "Wildlife",
    aspectRatio: "16:9",
    prompt: "Magnificent polar bear on sea ice scanning Arctic horizon, thick white fur contrasting with blue ice tones, powerful predator in natural habitat, wildlife photography highlighting climate change vulnerable species"
  },
  {
    id: 83,
    title: "Piano Keys Artistry",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=1000&auto=format&fit=crop",
    creator: "pianophoto",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["piano", "music", "keys"],
    category: "Music",
    aspectRatio: "16:9",
    prompt: "Grand piano keys in dramatic black and white, selective focus creating depth, side lighting revealing ivory texture, classical music photography celebrating instrument craftsmanship and musical artistry"
  },
  {
    id: 84,
    title: "Brutalist Architecture",
    image: "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?q=80&w=1000&auto=format&fit=crop",
    creator: "brutalism",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["brutalist", "concrete", "architecture"],
    category: "Architecture",
    aspectRatio: "9:16",
    prompt: "Bold brutalist concrete building with geometric angular forms, dramatic shadows creating strong graphic patterns, overcast sky emphasizing raw material textures, architectural photography celebrating modernist design movement"
  },
  {
    id: 85,
    title: "Succulent Garden Macro",
    image: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?q=80&w=1000&auto=format&fit=crop",
    creator: "plantmacro",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["succulent", "plants", "macro"],
    category: "Floral",
    aspectRatio: "1:1",
    prompt: "Stunning rosette succulent in perfect spiral formation, gradient from sage green to dusty rose pink, water droplets on fleshy leaves, extreme macro photography revealing nature's mathematical patterns"
  },
  {
    id: 86,
    title: "Tennis Court Action",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1000&auto=format&fit=crop",
    creator: "tennisphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["tennis", "sports", "action"],
    category: "Sports",
    aspectRatio: "16:9",
    prompt: "Intense tennis serve at peak motion, clay court dust flying, ball compression visible on racket strings, professional sports photography freezing athletic power and precision, dramatic side lighting"
  },
  {
    id: 87,
    title: "Artisan Cheese Board",
    image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?q=80&w=1000&auto=format&fit=crop",
    creator: "cheeseart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cheese", "charcuterie", "food"],
    category: "Food",
    aspectRatio: "16:9",
    prompt: "Curated artisan cheese board with aged brie, blue cheese, and manchego, accompanied by honey, nuts, and dried fruits, rustic wooden board, warm ambient lighting, gourmet food photography"
  },
  {
    id: 88,
    title: "Vintage Motorcycle",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1000&auto=format&fit=crop",
    creator: "motophoto",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["motorcycle", "vintage", "classic"],
    category: "Automotive",
    aspectRatio: "16:9",
    prompt: "Classic vintage motorcycle with chrome details gleaming, cafe racer styling with leather seat, parked against industrial brick wall, nostalgic automotive photography celebrating two-wheeled heritage and craftsmanship"
  },
  {
    id: 89,
    title: "VR Technology Experience",
    image: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?q=80&w=1000&auto=format&fit=crop",
    creator: "vrtech",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["VR", "technology", "future"],
    category: "Technology",
    aspectRatio: "4:5",
    prompt: "Person wearing sleek VR headset with hands reaching into virtual space, neon blue glow on face, futuristic technology photography capturing immersive digital experience, cutting-edge consumer electronics imagery"
  },
  {
    id: 90,
    title: "Parisian Cafe Scene",
    image: "https://images.unsplash.com/photo-1549339529-e7c9e80f67c7?q=80&w=1000&auto=format&fit=crop",
    creator: "parisphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["paris", "cafe", "street"],
    category: "Urban",
    aspectRatio: "4:5",
    prompt: "Quintessential Parisian sidewalk cafe with rattan chairs and marble tables, croissant and espresso in foreground, pedestrians strolling past, romantic French atmosphere, street photography capturing joie de vivre"
  },
  {
    id: 91,
    title: "Origami Art Display",
    image: "https://images.unsplash.com/photo-1528938102132-4a9276b8e320?q=80&w=1000&auto=format&fit=crop",
    creator: "paperart",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["origami", "paper", "art"],
    category: "Art",
    aspectRatio: "1:1",
    prompt: "Intricate origami crane collection in gradient rainbow colors, delicate paper folds catching soft light, minimalist white background, Japanese paper folding art photography celebrating patience and precision craftsmanship"
  },
  {
    id: 92,
    title: "Hamster Wheel Cuteness",
    image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=1000&auto=format&fit=crop",
    creator: "smallpets",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["hamster", "pet", "cute"],
    category: "Pets",
    aspectRatio: "1:1",
    prompt: "Adorable fluffy hamster with cheeks stuffed full, tiny paws and whiskers detailed in sharp focus, soft bedding background, heartwarming small pet photography capturing irresistible cuteness"
  },
  {
    id: 93,
    title: "Milky Way Galaxy",
    image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1000&auto=format&fit=crop",
    creator: "nightsky",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["milky way", "stars", "night"],
    category: "Space",
    aspectRatio: "16:9",
    prompt: "Breathtaking Milky Way galaxy arching across night sky, millions of stars visible in dark sky location, silhouetted mountain ridge providing scale, long exposure astrophotography revealing cosmic grandeur"
  },
  {
    id: 94,
    title: "Cozy Fireplace Evening",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1000&auto=format&fit=crop",
    creator: "cozyhome",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["fireplace", "cozy", "interior"],
    category: "Interior",
    aspectRatio: "16:9",
    prompt: "Crackling fireplace with dancing flames, cozy armchair with knit throw blanket, warm golden light filling rustic living room, hygge winter evening atmosphere, inviting interior photography"
  },
  {
    id: 95,
    title: "Colorful Macarons Tower",
    image: "https://images.unsplash.com/photo-1558326567-98ae2405596b?q=80&w=1000&auto=format&fit=crop",
    creator: "patisserie",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["macarons", "dessert", "colorful"],
    category: "Food",
    aspectRatio: "4:5",
    prompt: "Elegant tower of French macarons in pastel rainbow colors, perfect smooth shells and ruffled feet visible, arranged on vintage cake stand, Parisian patisserie photography with soft feminine aesthetic"
  },
  {
    id: 96,
    title: "Lightning Storm Drama",
    image: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=80&w=1000&auto=format&fit=crop",
    creator: "stormchase",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["lightning", "storm", "dramatic"],
    category: "Nature",
    aspectRatio: "16:9",
    prompt: "Spectacular lightning bolt striking across stormy purple sky, multiple branches illuminating thunderclouds, dramatic weather photography capturing raw electrical power of nature's fury"
  },
  {
    id: 97,
    title: "Sunflower Field Glory",
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=1000&auto=format&fit=crop",
    creator: "sunflowerlove",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["sunflower", "field", "summer"],
    category: "Floral",
    aspectRatio: "16:9",
    prompt: "Endless sunflower field stretching to horizon under blue summer sky, bright yellow petals facing the sun, golden hour light enhancing warm tones, cheerful landscape photography celebrating summer abundance"
  },
  {
    id: 98,
    title: "Yoga Beach Sunrise",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
    creator: "yogalife",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["yoga", "beach", "wellness"],
    category: "Sports",
    aspectRatio: "16:9",
    prompt: "Silhouette of person in graceful yoga pose on beach at sunrise, calm ocean reflecting warm sky colors, peaceful wellness photography capturing mindfulness and connection with nature"
  },
  {
    id: 99,
    title: "Gaming Setup RGB",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1000&auto=format&fit=crop",
    creator: "gamingsetup",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["gaming", "RGB", "technology"],
    category: "Technology",
    aspectRatio: "16:9",
    prompt: "Ultimate gaming battlestation with RGB lighting in purple and cyan, multiple monitors displaying game graphics, mechanical keyboard and gaming mouse, neon-lit technology photography for gaming enthusiasts"
  },
  {
    id: 100,
    title: "Dubai Skyline Night",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1000&auto=format&fit=crop",
    creator: "dubaiphoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["dubai", "skyline", "night"],
    category: "Urban",
    aspectRatio: "16:9",
    prompt: "Glittering Dubai skyline at night with Burj Khalifa towering above, city lights reflecting on water, futuristic architecture illuminated, urban nightscape photography capturing modern metropolis grandeur"
  },
  {
    id: 101,
    title: "Abstract Ink Flow",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop",
    creator: "inkart",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["ink", "abstract", "fluid"],
    category: "Abstract",
    aspectRatio: "4:5",
    prompt: "Mesmerizing ink diffusion in water creating organic flowing patterns, deep indigo and gold intermingling, macro photography capturing moment of fluid dynamics, ethereal abstract art photography"
  },
  {
    id: 102,
    title: "Cheetah Speed Portrait",
    image: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?q=80&w=1000&auto=format&fit=crop",
    creator: "fastcat",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cheetah", "wildlife", "speed"],
    category: "Wildlife",
    aspectRatio: "16:9",
    prompt: "Sleek cheetah in intense focus, spotted coat pattern in sharp detail, powerful muscles visible beneath fur, African grassland background, wildlife portrait photography capturing fastest land animal"
  },
  {
    id: 103,
    title: "Art Deco Building",
    image: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?q=80&w=1000&auto=format&fit=crop",
    creator: "artdeco",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["art deco", "building", "architecture"],
    category: "Architecture",
    aspectRatio: "9:16",
    prompt: "Stunning Art Deco building facade with geometric patterns and sunburst motifs, gilded details catching morning light, architectural photography celebrating 1920s design elegance and craftsmanship"
  },
  {
    id: 104,
    title: "Tropical Cocktail Paradise",
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=1000&auto=format&fit=crop",
    creator: "tropicaldrinks",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["cocktail", "tropical", "beach"],
    category: "Food",
    aspectRatio: "4:5",
    prompt: "Refreshing tropical cocktail in tiki glass with umbrella garnish, turquoise pool water background, condensation droplets catching sunlight, vacation lifestyle beverage photography evoking paradise"
  },
  {
    id: 105,
    title: "Vinyl DJ Setup",
    image: "https://images.unsplash.com/photo-1571266028243-d220c6a8b0e6?q=80&w=1000&auto=format&fit=crop",
    creator: "djculture",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["DJ", "vinyl", "music"],
    category: "Music",
    aspectRatio: "16:9",
    prompt: "Professional DJ turntables with vinyl record spinning, mixer console with glowing buttons, club lighting in background, electronic music culture photography capturing nightlife atmosphere"
  },
  {
    id: 106,
    title: "Siamese Cat Elegance",
    image: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?q=80&w=1000&auto=format&fit=crop",
    creator: "catelegance",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["siamese", "cat", "elegant"],
    category: "Pets",
    aspectRatio: "4:5",
    prompt: "Regal Siamese cat with striking blue eyes and cream and chocolate point coloring, elegant pose showing slender form, soft window light creating rim lighting, sophisticated cat portrait photography"
  },
  {
    id: 107,
    title: "Modern Kitchen Design",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1000&auto=format&fit=crop",
    creator: "kitchendesign",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["kitchen", "modern", "interior"],
    category: "Interior",
    aspectRatio: "16:9",
    prompt: "Sleek contemporary kitchen with marble waterfall island, matte black fixtures, integrated appliances, pendant lighting over breakfast bar, architectural interior photography showcasing luxury home design"
  },
  {
    id: 108,
    title: "Autumn Maple Forest",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop",
    creator: "autumnlover",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["autumn", "maple", "forest"],
    category: "Landscape",
    aspectRatio: "16:9",
    prompt: "Breathtaking autumn forest with maple trees in peak fall color, carpet of red and orange leaves covering forest floor, sunlight filtering through golden canopy, seasonal landscape photography"
  },
  {
    id: 109,
    title: "Skateboard Culture",
    image: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?q=80&w=1000&auto=format&fit=crop",
    creator: "skatephoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["skateboard", "urban", "youth"],
    category: "Sports",
    aspectRatio: "4:5",
    prompt: "Skateboarder performing trick at urban skatepark, dynamic action freeze capturing mid-air moment, graffiti covered ramps in background, youth culture action sports photography with gritty urban aesthetic"
  },
  {
    id: 110,
    title: "Electric Car Future",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1000&auto=format&fit=crop",
    creator: "evfuture",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["electric car", "future", "automotive"],
    category: "Automotive",
    aspectRatio: "16:9",
    prompt: "Sleek electric vehicle with futuristic design, charging at modern station, LED headlights glowing, sustainable transportation automotive photography capturing clean energy future"
  },
  {
    id: 111,
    title: "Cherry Pie Homemade",
    image: "https://images.unsplash.com/photo-1562007908-17c67e878c88?q=80&w=1000&auto=format&fit=crop",
    creator: "homebaker",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["pie", "cherry", "homemade"],
    category: "Food",
    aspectRatio: "1:1",
    prompt: "Fresh-baked cherry pie with golden lattice crust, ruby red filling visible through woven top, dusted with powdered sugar, rustic farmhouse table setting, homestyle baking photography with nostalgic warmth"
  },
  {
    id: 112,
    title: "Drone Racing Action",
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=1000&auto=format&fit=crop",
    creator: "dronepilot",
    verified: false,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["drone", "technology", "racing"],
    category: "Technology",
    aspectRatio: "16:9",
    prompt: "High-speed racing drone hovering in flight, carbon fiber frame with LED lights, motion blur suggesting movement, action technology photography capturing emerging esport and aerial innovation"
  },
  {
    id: 113,
    title: "Ballet Dancer Grace",
    image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=1000&auto=format&fit=crop",
    creator: "dancephoto",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["ballet", "dance", "art"],
    category: "Art",
    aspectRatio: "9:16",
    prompt: "Graceful ballerina in mid-leap, flowing tutu capturing motion, perfect pointed toes and extended arms, dramatic side lighting creating silhouette effect, performing arts photography celebrating dance athleticism and artistry"
  },
  {
    id: 114,
    title: "Tropical Bird Paradise",
    image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=1000&auto=format&fit=crop",
    creator: "tropicalbirds",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["toucan", "tropical", "bird"],
    category: "Wildlife",
    aspectRatio: "4:5",
    prompt: "Colorful toucan with oversized orange and yellow beak, perched on tropical branch, lush green rainforest bokeh background, exotic bird wildlife photography showcasing nature's vibrant palette"
  },
  {
    id: 115,
    title: "Watercolor Art Studio",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1000&auto=format&fit=crop",
    creator: "artmaterials",
    verified: true,
    views: 0,
    likes: 0,
    uses: 0,
    tags: ["watercolor", "art", "studio"],
    category: "Art",
    aspectRatio: "1:1",
    prompt: "Artist workspace with watercolor palette and brushes, paint swatches on paper showing color mixing, natural light from studio window, creative process photography capturing artistic tools and inspiration"
  }
];

export default function Discover() {
  const [displayedItems, setDisplayedItems] = useState<InspirationItem[]>([]);
  const [communityImages, setCommunityImages] = useState<InspirationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
  const [page, setPage] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_LOAD = 12;

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setIsLoadingCommunity(true);
        const data = await galleryApi.getAll();
        const galleryItems: InspirationItem[] = (data.images || []).map((img: any) => ({
          id: img.id,
          title: img.prompt?.slice(0, 40) + (img.prompt?.length > 40 ? '...' : '') || 'Community Creation',
          image: img.imageUrl,
          creator: img.creatorName || 'anonymous',
          verified: false,
          views: img.viewCount || 0,
          likes: img.likeCount || 0,
          uses: img.useCount || 0,
          tags: img.tags || ['creative'],
          category: 'Community',
          aspectRatio: (img.aspectRatio as "1:1" | "9:16" | "16:9" | "4:5" | "3:4") || '1:1',
          prompt: img.prompt || '',
          isLiked: img.isLiked || false,
          isGalleryImage: true
        }));
        setCommunityImages(galleryItems);
      } catch (error) {
        console.error('Failed to fetch gallery images:', error);
      } finally {
        setIsLoadingCommunity(false);
      }
    };
    fetchGalleryImages();
  }, []);

  const allContent = useMemo(() => [...communityImages, ...allInspirations], [communityImages]);
  const totalItems = allContent.length;

  useEffect(() => {
    if (!isLoadingCommunity) {
      setDisplayedItems(allContent.slice(0, ITEMS_PER_LOAD));
      setPage(1);
    }
  }, [isLoadingCommunity, allContent]);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    
    const startIndex = page * ITEMS_PER_LOAD;
    const endIndex = startIndex + ITEMS_PER_LOAD;
    
    if (startIndex >= totalItems) {
      return;
    }
    
    setIsLoading(true);
    
    setTimeout(() => {
      const nextItems = allContent.slice(startIndex, endIndex);
      setDisplayedItems(prev => [...prev, ...nextItems]);
      setPage(prev => prev + 1);
      setIsLoading(false);
    }, 300);
  }, [page, isLoading, totalItems, allContent]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && displayedItems.length < totalItems) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, displayedItems.length, totalItems]);

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA] pb-20 md:pb-0">
        
        <div className="px-4 md:px-8 lg:px-12 py-6 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-[#B94E30]" />
            <h2 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Discover</h2>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#16A34A]/10 rounded-full ml-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
              </span>
              <span className="text-xs font-medium text-[#16A34A]">Live</span>
            </div>
          </div>

          {isLoadingCommunity ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#B94E30] mb-4" />
              <span className="text-sm text-[#71717A]">Loading community creations...</span>
            </div>
          ) : (
            <>
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-2">
                {displayedItems.map((item, index) => (
                  <LazyMasonryCard key={item.id} item={item} index={index} onLike={() => {}} onUse={() => {}} onCopy={() => {}} />
                ))}
              </div>

              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isLoading && (
                  <div className="flex items-center gap-3 text-[#71717A]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
