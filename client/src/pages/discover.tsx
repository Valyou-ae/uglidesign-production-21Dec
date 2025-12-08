import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Compass, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Clock, 
  Flame, 
  Palette, 
  Type, 
  Lightbulb, 
  Users, 
  TrendingUp, 
  Bookmark, 
  BadgeCheck, 
  Eye, 
  Heart, 
  Wand2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";

interface InspirationItem {
  id: number;
  title: string;
  image: string;
  creator: string;
  verified: boolean;
  views: string;
  likes: string;
  uses: string;
  tags: string[];
  category: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5" | "3:4";
  prompt: string;
}

function LazyMasonryCard({ item, index }: { item: InspirationItem; index: number }) {
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
      className="break-inside-avoid mb-5"
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
          
          <div className="absolute top-3 left-3 bg-gradient-to-br from-[#B94E30] to-[#8B3A24] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white shadow-lg">
            {item.category}
          </div>

          <div className="absolute top-3 right-3 flex gap-2">
            <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-medium text-white/80">
              {item.aspectRatio}
            </div>
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#B94E30] text-white">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>

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
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#52525B]">
              <Eye className="h-3.5 w-3.5" />
              <span>{item.views}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#52525B]">
              <Heart className="h-3.5 w-3.5" />
              <span>{item.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#71717A] dark:text-[#52525B]">
              <Wand2 className="h-3.5 w-3.5" />
              <span>{item.uses}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-[#F4F4F5] dark:bg-[#1F1F25] rounded-md text-[10px] text-[#71717A]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const allInspirations: InspirationItem[] = [
  {
    id: 1,
    title: "Ethereal Glow",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop",
    creator: "creativemind",
    verified: true,
    views: "45.2K",
    likes: "8.9K",
    uses: "3.2K",
    tags: ["portrait", "ethereal", "soft light"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "A beautiful portrait with soft ethereal lighting, dreamy atmosphere, gentle bokeh background, warm golden tones"
  },
  {
    id: 2,
    title: "Neon Dystopia",
    image: "https://images.unsplash.com/photo-1580584126903-c17d41830450?q=80&w=1000&auto=format&fit=crop",
    creator: "futuredesign",
    verified: false,
    views: "38.1K",
    likes: "7.2K",
    uses: "2.8K",
    tags: ["cyberpunk", "neon", "city"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Cyberpunk cityscape at night, neon lights reflecting on wet streets, futuristic buildings, rain atmosphere"
  },
  {
    id: 3,
    title: "Liquid Dreams",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop",
    creator: "artflow",
    verified: false,
    views: "31.4K",
    likes: "5.8K",
    uses: "2.1K",
    tags: ["watercolor", "abstract", "flowing"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Abstract watercolor painting with flowing liquid forms, vibrant colors mixing together, artistic splashes"
  },
  {
    id: 4,
    title: "Clean Commerce",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    creator: "minimalstudio",
    verified: true,
    views: "28.9K",
    likes: "4.5K",
    uses: "1.9K",
    tags: ["minimal", "product", "clean"],
    category: "Prompt",
    aspectRatio: "4:5",
    prompt: "Minimalist product photography, clean white background, floating sneaker, soft shadows, commercial style"
  },
  {
    id: 5,
    title: "Fantasy Realms",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop",
    creator: "dragonmaster",
    verified: true,
    views: "25.6K",
    likes: "4.1K",
    uses: "1.5K",
    tags: ["fantasy", "dragon", "epic"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Epic fantasy landscape with majestic dragon flying over mountains, dramatic clouds, golden hour lighting"
  },
  {
    id: 6,
    title: "Retro Wave",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
    creator: "80slover",
    verified: false,
    views: "22.1K",
    likes: "3.8K",
    uses: "1.2K",
    tags: ["retro", "synthwave", "80s"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Synthwave aesthetic, retro 80s vibes, neon pink and blue gradient, geometric shapes, sunset"
  },
  {
    id: 7,
    title: "Paper Cutout",
    image: "https://images.unsplash.com/photo-1516051662668-f3b5f6b9a131?q=80&w=1000&auto=format&fit=crop",
    creator: "crafty",
    verified: false,
    views: "19.8K",
    likes: "3.2K",
    uses: "1.1K",
    tags: ["paper", "craft", "cutout"],
    category: "Technique",
    aspectRatio: "3:4",
    prompt: "Paper cutout art style illustration, layered paper effect, colorful shapes, handcraft aesthetic"
  },
  {
    id: 8,
    title: "Isometric Worlds",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
    creator: "iso_king",
    verified: true,
    views: "18.5K",
    likes: "2.9K",
    uses: "950",
    tags: ["isometric", "3d", "miniature"],
    category: "Style",
    aspectRatio: "1:1",
    prompt: "Isometric 3D miniature world, tiny buildings and trees, tilt-shift effect, cute diorama style"
  },
  {
    id: 9,
    title: "Golden Hour Portrait",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
    creator: "sunsetsnap",
    verified: true,
    views: "42.3K",
    likes: "9.1K",
    uses: "4.2K",
    tags: ["portrait", "golden hour", "warm"],
    category: "Style",
    aspectRatio: "4:5",
    prompt: "Portrait photography during golden hour, warm sunlight, natural beauty, soft skin tones, bokeh"
  },
  {
    id: 10,
    title: "Abstract Geometry",
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1000&auto=format&fit=crop",
    creator: "shapecraft",
    verified: false,
    views: "15.7K",
    likes: "2.4K",
    uses: "890",
    tags: ["abstract", "geometry", "colorful"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Abstract geometric art, bold colors, overlapping shapes, modern design, digital art style"
  },
  {
    id: 11,
    title: "Urban Architecture",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1000&auto=format&fit=crop",
    creator: "cityscape",
    verified: true,
    views: "21.4K",
    likes: "3.6K",
    uses: "1.3K",
    tags: ["architecture", "urban", "modern"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Modern urban architecture photography, tall skyscrapers, dramatic perspective, blue hour sky"
  },
  {
    id: 12,
    title: "Macro Nature",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1000&auto=format&fit=crop",
    creator: "naturelens",
    verified: false,
    views: "12.8K",
    likes: "2.1K",
    uses: "780",
    tags: ["macro", "nature", "details"],
    category: "Technique",
    aspectRatio: "3:4",
    prompt: "Macro photography of ocean waves, crystal clear water droplets, nature details, close-up textures"
  },
  {
    id: 13,
    title: "Moody Landscape",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
    creator: "wanderlust",
    verified: true,
    views: "35.2K",
    likes: "6.8K",
    uses: "2.9K",
    tags: ["landscape", "moody", "mountains"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Dramatic mountain landscape, moody atmosphere, fog rolling through valleys, cinematic composition"
  },
  {
    id: 14,
    title: "Cinematic Portrait",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop",
    creator: "filmmaker",
    verified: false,
    views: "27.9K",
    likes: "5.2K",
    uses: "1.8K",
    tags: ["cinematic", "portrait", "dramatic"],
    category: "Style",
    aspectRatio: "4:5",
    prompt: "Cinematic portrait with dramatic lighting, movie-like quality, deep shadows, professional headshot"
  },
  {
    id: 15,
    title: "Minimalist Design",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    creator: "simplicity",
    verified: true,
    views: "19.3K",
    likes: "3.4K",
    uses: "1.2K",
    tags: ["minimal", "clean", "simple"],
    category: "Prompt",
    aspectRatio: "1:1",
    prompt: "Minimalist abstract design, clean lines, simple shapes, elegant composition, soft pastel colors"
  },
  {
    id: 16,
    title: "Street Photography",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000&auto=format&fit=crop",
    creator: "streetwise",
    verified: false,
    views: "23.6K",
    likes: "4.1K",
    uses: "1.5K",
    tags: ["street", "urban", "candid"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Street photography in urban setting, candid moments, natural light, documentary style"
  },
  {
    id: 17,
    title: "Ocean Sunset",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
    creator: "beachlover",
    verified: true,
    views: "52.1K",
    likes: "11.2K",
    uses: "5.1K",
    tags: ["sunset", "ocean", "beach"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Beautiful ocean sunset, golden and orange sky, calm waves, tropical beach paradise, peaceful atmosphere"
  },
  {
    id: 18,
    title: "Vintage Film",
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b?q=80&w=1000&auto=format&fit=crop",
    creator: "filmgrain",
    verified: false,
    views: "18.4K",
    likes: "3.1K",
    uses: "980",
    tags: ["vintage", "film", "retro"],
    category: "Technique",
    aspectRatio: "3:4",
    prompt: "Vintage film photography aesthetic, grainy texture, faded colors, nostalgic atmosphere, 35mm look"
  },
  {
    id: 19,
    title: "Neon Portrait",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop",
    creator: "neonart",
    verified: true,
    views: "33.7K",
    likes: "6.4K",
    uses: "2.7K",
    tags: ["neon", "portrait", "glow"],
    category: "Style",
    aspectRatio: "4:5",
    prompt: "Portrait with neon lighting, pink and blue glow, futuristic vibes, studio photography, dramatic colors"
  },
  {
    id: 20,
    title: "Forest Mist",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop",
    creator: "forestdreams",
    verified: false,
    views: "29.5K",
    likes: "5.8K",
    uses: "2.3K",
    tags: ["forest", "mist", "nature"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Misty forest scene, tall trees fading into fog, mystical atmosphere, natural light filtering through"
  },
  {
    id: 21,
    title: "Coffee Art",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop",
    creator: "cafestyle",
    verified: true,
    views: "14.2K",
    likes: "2.6K",
    uses: "850",
    tags: ["coffee", "lifestyle", "cozy"],
    category: "Prompt",
    aspectRatio: "1:1",
    prompt: "Aesthetic coffee photography, latte art, cozy cafe vibes, warm tones, lifestyle photography"
  },
  {
    id: 22,
    title: "Space Dreams",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop",
    creator: "cosmicart",
    verified: true,
    views: "47.8K",
    likes: "9.5K",
    uses: "4.1K",
    tags: ["space", "galaxy", "cosmic"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Cosmic space nebula, galaxy colors, stars and dust clouds, astronomical photography, deep space"
  },
  {
    id: 23,
    title: "Fashion Editorial",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
    creator: "fashionista",
    verified: true,
    views: "36.4K",
    likes: "7.2K",
    uses: "3.1K",
    tags: ["fashion", "editorial", "style"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "High fashion editorial photography, dramatic pose, studio lighting, magazine quality, elegant style"
  },
  {
    id: 24,
    title: "Tokyo Nights",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
    creator: "japantravel",
    verified: false,
    views: "41.2K",
    likes: "8.1K",
    uses: "3.5K",
    tags: ["tokyo", "night", "japan"],
    category: "Style",
    aspectRatio: "3:4",
    prompt: "Tokyo city at night, neon signs in Japanese, busy streets, rain reflections, urban Japan atmosphere"
  },
  {
    id: 25,
    title: "Floral Beauty",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1000&auto=format&fit=crop",
    creator: "gardenart",
    verified: false,
    views: "22.8K",
    likes: "4.3K",
    uses: "1.6K",
    tags: ["flowers", "nature", "spring"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Beautiful flower photography, soft focus, spring colors, natural lighting, botanical art"
  },
  {
    id: 26,
    title: "Industrial Grit",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1000&auto=format&fit=crop",
    creator: "urbanexplore",
    verified: true,
    views: "17.6K",
    likes: "2.9K",
    uses: "920",
    tags: ["industrial", "urban", "gritty"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Industrial architecture, metal and concrete, gritty textures, abandoned factory aesthetic"
  },
  {
    id: 27,
    title: "Underwater World",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000&auto=format&fit=crop",
    creator: "oceandiver",
    verified: true,
    views: "31.9K",
    likes: "6.2K",
    uses: "2.4K",
    tags: ["underwater", "ocean", "marine"],
    category: "Technique",
    aspectRatio: "4:5",
    prompt: "Underwater photography, crystal clear water, marine life, sunlight rays through water, diving scene"
  },
  {
    id: 28,
    title: "Autumn Colors",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop",
    creator: "seasonalart",
    verified: false,
    views: "26.3K",
    likes: "5.1K",
    uses: "1.9K",
    tags: ["autumn", "fall", "colors"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Autumn forest scene, golden and red leaves, warm fall colors, peaceful nature photography"
  },
  {
    id: 29,
    title: "Art Deco",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop",
    creator: "decodesign",
    verified: true,
    views: "15.4K",
    likes: "2.7K",
    uses: "890",
    tags: ["art deco", "vintage", "design"],
    category: "Style",
    aspectRatio: "3:4",
    prompt: "Art deco style illustration, geometric patterns, gold and black, 1920s aesthetic, elegant design"
  },
  {
    id: 30,
    title: "Mountain Peak",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
    creator: "alpineview",
    verified: true,
    views: "44.7K",
    likes: "8.9K",
    uses: "3.8K",
    tags: ["mountain", "peak", "adventure"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Dramatic mountain peak, snow-capped summit, adventure photography, epic landscape, clear blue sky"
  },
  {
    id: 31,
    title: "Minimal Interior",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000&auto=format&fit=crop",
    creator: "homedecor",
    verified: false,
    views: "19.8K",
    likes: "3.5K",
    uses: "1.2K",
    tags: ["interior", "minimal", "home"],
    category: "Prompt",
    aspectRatio: "1:1",
    prompt: "Minimalist interior design, clean white space, modern furniture, natural light, scandinavian style"
  },
  {
    id: 32,
    title: "Night Sky",
    image: "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=1000&auto=format&fit=crop",
    creator: "stargazer",
    verified: true,
    views: "38.9K",
    likes: "7.6K",
    uses: "3.2K",
    tags: ["stars", "night", "milkyway"],
    category: "Technique",
    aspectRatio: "16:9",
    prompt: "Night sky photography, milky way visible, countless stars, dark silhouette foreground, astrophotography"
  }
];

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState("Trending");
  const [displayedItems, setDisplayedItems] = useState<InspirationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_LOAD = 8;

  const filters = [
    { icon: Sparkles, label: "Trending" },
    { icon: Clock, label: "New This Week" },
    { icon: Flame, label: "Most Popular" },
    { icon: Palette, label: "Styles" },
    { icon: Type, label: "Prompts" },
    { icon: Lightbulb, label: "Techniques" },
    { icon: Users, label: "Community" }
  ];

  useEffect(() => {
    setDisplayedItems(allInspirations.slice(0, ITEMS_PER_LOAD));
  }, []);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      const currentLength = displayedItems.length;
      const nextItems = allInspirations.slice(currentLength, currentLength + ITEMS_PER_LOAD);
      
      if (nextItems.length === 0) {
        const shuffled = [...allInspirations].sort(() => Math.random() - 0.5);
        const newItems = shuffled.slice(0, ITEMS_PER_LOAD).map((item, i) => ({
          ...item,
          id: currentLength + i + 1,
          views: `${Math.floor(Math.random() * 50 + 10)}.${Math.floor(Math.random() * 9)}K`,
          likes: `${Math.floor(Math.random() * 10 + 1)}.${Math.floor(Math.random() * 9)}K`,
          uses: `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}K`
        }));
        setDisplayedItems(prev => [...prev, ...newItems]);
      } else {
        setDisplayedItems(prev => [...prev, ...nextItems]);
      }
      
      setIsLoading(false);
    }, 500);
  }, [displayedItems.length, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA] pb-20 md:pb-0">
        
        {/* HERO SECTION */}
        <div className="relative h-[280px] md:h-[320px] bg-[#0A0A0B] overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0A0A0B] via-[#1A1A2E] to-[#16132D]" />
            
            <motion.div 
              animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[100px] -left-[100px] w-[400px] h-[400px] bg-[#B94E30] rounded-full opacity-20 blur-[100px]" 
            />
            <motion.div 
              animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#E3B436] rounded-full opacity-15 blur-[80px]" 
            />
            
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-4 mb-3">
              <Compass className="h-7 w-7 md:h-8 md:w-8 text-transparent bg-clip-text bg-gradient-to-br from-[#B94E30] to-[#E3B436]" stroke="url(#compass-gradient)" />
              <svg width="0" height="0">
                <linearGradient id="compass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop stopColor="#B94E30" offset="0%" />
                  <stop stopColor="#E3B436" offset="100%" />
                </linearGradient>
              </svg>
              <h1 className="text-3xl md:text-[40px] font-bold text-[#FAFAFA]">Discover</h1>
            </div>
            
            <p className="text-base md:text-lg text-[#A1A1AA] max-w-xl">
              Explore trending styles and creative inspiration from the community.
            </p>

            <div className="mt-5 max-w-[600px] w-full">
              <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-1 focus-within:bg-white/15 focus-within:border-white/20 transition-all">
                <Search className="h-5 w-5 text-[#71717A] ml-4" />
                <input 
                  type="text" 
                  placeholder="Search styles, prompts, techniques..."
                  className="flex-1 bg-transparent border-none p-3 text-base text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:ring-0"
                  data-testid="input-discover-search"
                />
                <button className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors mr-1" data-testid="button-discover-filters">
                  <SlidersHorizontal className="h-5 w-5 text-[#FAFAFA]" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
              {filters.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => setActiveFilter(filter.label)}
                  data-testid={`filter-${filter.label.toLowerCase().replace(/\s/g, '-')}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all backdrop-blur-md border whitespace-nowrap",
                    activeFilter === filter.label
                      ? "bg-gradient-to-r from-[#B94E30] to-[#8B3A24] border-transparent text-white shadow-lg shadow-[#B94E30]/20"
                      : "bg-white/10 border-white/10 text-[#A1A1AA] hover:bg-white/20 hover:text-[#FAFAFA]"
                  )}
                >
                  <filter.icon className="h-3.5 w-3.5" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MASONRY GRID */}
        <div className="px-4 md:px-8 lg:px-12 py-8 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-[#B94E30]" />
            <h2 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Trending Now</h2>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#16A34A]/10 rounded-full ml-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
              </span>
              <span className="text-xs font-medium text-[#16A34A]">Live</span>
            </div>
            <div className="ml-auto text-sm text-[#71717A]">
              {displayedItems.length} images
            </div>
          </div>

          {/* Masonry Layout using CSS Columns */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
            {displayedItems.map((item, index) => (
              <LazyMasonryCard key={`${item.id}-${index}`} item={item} index={index} />
            ))}
          </div>

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoading && (
              <div className="flex items-center gap-3 text-[#71717A]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more inspiration...</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
