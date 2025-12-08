import { useState, useEffect, useRef, useCallback } from "react";
import { 
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
    title: "Neon Dreams",
    image: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=1000&auto=format&fit=crop",
    creator: "neonartist",
    verified: true,
    views: "89.2K",
    likes: "12.4K",
    uses: "5.8K",
    tags: ["neon", "colorful", "vibrant"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Vibrant neon light installation, electric blue and hot pink, glowing tubes forming abstract patterns"
  },
  {
    id: 2,
    title: "Holographic Splash",
    image: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1000&auto=format&fit=crop",
    creator: "colormaster",
    verified: true,
    views: "67.3K",
    likes: "9.8K",
    uses: "4.2K",
    tags: ["gradient", "holographic", "abstract"],
    category: "Style",
    aspectRatio: "1:1",
    prompt: "Holographic gradient background, iridescent colors shifting from purple to teal to gold"
  },
  {
    id: 3,
    title: "Electric Aurora",
    image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop",
    creator: "gradientpro",
    verified: false,
    views: "54.1K",
    likes: "7.6K",
    uses: "3.1K",
    tags: ["aurora", "gradient", "colors"],
    category: "Technique",
    aspectRatio: "16:9",
    prompt: "Mesmerizing aurora borealis colors, flowing gradient from green to purple to blue, cosmic atmosphere"
  },
  {
    id: 4,
    title: "Candy Pop",
    image: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop",
    creator: "popdesign",
    verified: true,
    views: "78.5K",
    likes: "11.2K",
    uses: "4.9K",
    tags: ["pink", "bold", "pop art"],
    category: "Style",
    aspectRatio: "4:5",
    prompt: "Candy pink and electric blue gradient, bold pop art style, smooth color transitions"
  },
  {
    id: 5,
    title: "Cosmic Burst",
    image: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1000&auto=format&fit=crop",
    creator: "cosmicart",
    verified: true,
    views: "92.7K",
    likes: "14.3K",
    uses: "6.7K",
    tags: ["space", "colorful", "explosion"],
    category: "Style",
    aspectRatio: "1:1",
    prompt: "Cosmic explosion of colors, vibrant nebula with orange, pink, and purple hues, stardust particles"
  },
  {
    id: 6,
    title: "Sunset Gradient",
    image: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?q=80&w=1000&auto=format&fit=crop",
    creator: "sunsetlover",
    verified: false,
    views: "45.8K",
    likes: "6.9K",
    uses: "2.8K",
    tags: ["sunset", "warm", "gradient"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Stunning sunset gradient, warm orange melting into deep purple, golden hour atmosphere"
  },
  {
    id: 7,
    title: "Liquid Chrome",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    creator: "chromeart",
    verified: true,
    views: "61.4K",
    likes: "8.7K",
    uses: "3.6K",
    tags: ["chrome", "liquid", "metallic"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Liquid chrome waves, iridescent metallic surface, reflecting rainbow colors"
  },
  {
    id: 8,
    title: "Tropical Vibes",
    image: "https://images.unsplash.com/photo-1533628635777-112b2239b1c7?q=80&w=1000&auto=format&fit=crop",
    creator: "tropicalart",
    verified: false,
    views: "38.9K",
    likes: "5.4K",
    uses: "2.1K",
    tags: ["tropical", "colorful", "plants"],
    category: "Style",
    aspectRatio: "3:4",
    prompt: "Tropical leaves in vibrant colors, neon pink and electric green foliage, exotic pattern"
  },
  {
    id: 9,
    title: "Geometric Rainbow",
    image: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1000&auto=format&fit=crop",
    creator: "geomaster",
    verified: true,
    views: "73.2K",
    likes: "10.5K",
    uses: "4.4K",
    tags: ["geometric", "rainbow", "shapes"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Geometric shapes in rainbow colors, overlapping triangles and circles, bold design"
  },
  {
    id: 10,
    title: "Cyberpunk City",
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1000&auto=format&fit=crop",
    creator: "cyberpunk",
    verified: true,
    views: "112.4K",
    likes: "18.9K",
    uses: "8.2K",
    tags: ["cyberpunk", "neon", "city"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Futuristic cyberpunk cityscape, neon signs in pink and blue, rain-soaked streets reflecting lights"
  },
  {
    id: 11,
    title: "Paint Explosion",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop",
    creator: "splashart",
    verified: false,
    views: "56.7K",
    likes: "8.1K",
    uses: "3.3K",
    tags: ["paint", "splash", "colorful"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Explosive paint splash, vibrant colors colliding in mid-air, high-speed photography effect"
  },
  {
    id: 12,
    title: "Prism Light",
    image: "https://images.unsplash.com/photo-1550537687-c91072c4792d?q=80&w=1000&auto=format&fit=crop",
    creator: "lightart",
    verified: true,
    views: "48.3K",
    likes: "6.7K",
    uses: "2.6K",
    tags: ["prism", "rainbow", "light"],
    category: "Technique",
    aspectRatio: "16:9",
    prompt: "Light passing through prism creating rainbow spectrum, crystal clear refraction, pure colors"
  },
  {
    id: 13,
    title: "Fluid Abstract",
    image: "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?q=80&w=1000&auto=format&fit=crop",
    creator: "fluidart",
    verified: false,
    views: "41.5K",
    likes: "5.9K",
    uses: "2.3K",
    tags: ["fluid", "abstract", "marble"],
    category: "Technique",
    aspectRatio: "4:5",
    prompt: "Fluid art with swirling colors, marbled effect in gold, teal, and magenta"
  },
  {
    id: 14,
    title: "Synthwave Sunset",
    image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop",
    creator: "synthwave",
    verified: true,
    views: "87.9K",
    likes: "13.2K",
    uses: "5.9K",
    tags: ["synthwave", "retro", "80s"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Retro synthwave sunset, grid landscape, neon purple and orange sky, 80s aesthetic"
  },
  {
    id: 15,
    title: "Glass Morphism",
    image: "https://images.unsplash.com/photo-1604076913837-52ab5f25f437?q=80&w=1000&auto=format&fit=crop",
    creator: "glassui",
    verified: true,
    views: "69.4K",
    likes: "9.8K",
    uses: "4.1K",
    tags: ["glass", "blur", "modern"],
    category: "Style",
    aspectRatio: "1:1",
    prompt: "Glassmorphism design, frosted glass effect with colorful gradient background, modern UI"
  },
  {
    id: 16,
    title: "Color Smoke",
    image: "https://images.unsplash.com/photo-1558470598-a5dda9640f68?q=80&w=1000&auto=format&fit=crop",
    creator: "smokeart",
    verified: false,
    views: "52.1K",
    likes: "7.4K",
    uses: "2.9K",
    tags: ["smoke", "colorful", "flowing"],
    category: "Technique",
    aspectRatio: "9:16",
    prompt: "Colorful smoke trails intertwining, purple and cyan wisps, ethereal atmosphere"
  },
  {
    id: 17,
    title: "Neon Portrait",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
    creator: "neonface",
    verified: true,
    views: "94.6K",
    likes: "15.7K",
    uses: "7.1K",
    tags: ["portrait", "neon", "glow"],
    category: "Style",
    aspectRatio: "4:5",
    prompt: "Portrait with neon lighting, pink and blue glow on face, futuristic portrait photography"
  },
  {
    id: 18,
    title: "Crystal Colors",
    image: "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?q=80&w=1000&auto=format&fit=crop",
    creator: "crystalart",
    verified: false,
    views: "36.8K",
    likes: "5.1K",
    uses: "1.9K",
    tags: ["crystal", "colorful", "gem"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Colorful crystal formations, gemstone colors reflecting light, magical rainbow effect"
  },
  {
    id: 19,
    title: "Digital Waves",
    image: "https://images.unsplash.com/photo-1557264305-7e2764da873b?q=80&w=1000&auto=format&fit=crop",
    creator: "waveart",
    verified: true,
    views: "58.3K",
    likes: "8.4K",
    uses: "3.5K",
    tags: ["waves", "digital", "gradient"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Digital wave patterns, flowing gradients from cyan to magenta, futuristic design"
  },
  {
    id: 20,
    title: "Ink Bloom",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop",
    creator: "inkart",
    verified: false,
    views: "44.7K",
    likes: "6.3K",
    uses: "2.4K",
    tags: ["ink", "bloom", "watercolor"],
    category: "Technique",
    aspectRatio: "3:4",
    prompt: "Ink blooming in water, vibrant colors spreading organically, abstract fluid art"
  },
  {
    id: 21,
    title: "Aurora Waves",
    image: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1000&auto=format&fit=crop",
    creator: "aurorart",
    verified: true,
    views: "76.9K",
    likes: "11.8K",
    uses: "5.2K",
    tags: ["aurora", "night", "colors"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Northern lights dancing over mountains, green and purple aurora waves, starry night sky"
  },
  {
    id: 22,
    title: "Pixel Gradient",
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1000&auto=format&fit=crop",
    creator: "pixelart",
    verified: false,
    views: "29.4K",
    likes: "4.2K",
    uses: "1.6K",
    tags: ["pixel", "retro", "gradient"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Pixelated gradient pattern, colorful blocks transitioning smoothly, retro digital art"
  },
  {
    id: 23,
    title: "Fire & Ice",
    image: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=1000&auto=format&fit=crop",
    creator: "dualart",
    verified: true,
    views: "83.2K",
    likes: "12.9K",
    uses: "5.6K",
    tags: ["fire", "ice", "contrast"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Fire and ice collision, orange flames meeting blue frost, dramatic color contrast"
  },
  {
    id: 24,
    title: "Bubble Universe",
    image: "https://images.unsplash.com/photo-1528818955841-a7f1425131b5?q=80&w=1000&auto=format&fit=crop",
    creator: "bubbleart",
    verified: false,
    views: "33.6K",
    likes: "4.7K",
    uses: "1.8K",
    tags: ["bubbles", "iridescent", "macro"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Iridescent soap bubbles, rainbow reflections on surface, macro photography"
  },
  {
    id: 25,
    title: "Gradient Mesh",
    image: "https://images.unsplash.com/photo-1614851099511-773084f6911d?q=80&w=1000&auto=format&fit=crop",
    creator: "meshart",
    verified: true,
    views: "62.8K",
    likes: "9.1K",
    uses: "3.8K",
    tags: ["mesh", "gradient", "modern"],
    category: "Style",
    aspectRatio: "4:5",
    prompt: "Smooth gradient mesh, blending purple, pink, orange and blue, modern graphic design"
  },
  {
    id: 26,
    title: "Laser Beams",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
    creator: "laserart",
    verified: false,
    views: "47.2K",
    likes: "6.6K",
    uses: "2.5K",
    tags: ["laser", "neon", "tech"],
    category: "Technique",
    aspectRatio: "16:9",
    prompt: "Colorful laser beams cutting through darkness, red, green, and blue lights intersecting"
  },
  {
    id: 27,
    title: "Oil Slick",
    image: "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?q=80&w=1000&auto=format&fit=crop",
    creator: "oilart",
    verified: true,
    views: "39.5K",
    likes: "5.6K",
    uses: "2.1K",
    tags: ["oil", "rainbow", "texture"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Oil slick rainbow effect, iridescent colors on dark surface, psychedelic pattern"
  },
  {
    id: 28,
    title: "Neon Grid",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop",
    creator: "gridart",
    verified: false,
    views: "71.4K",
    likes: "10.3K",
    uses: "4.5K",
    tags: ["grid", "neon", "retro"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Retro neon grid extending to horizon, vaporwave aesthetic, purple and pink glow"
  },
  {
    id: 29,
    title: "Color Tunnel",
    image: "https://images.unsplash.com/photo-1516617442634-75371039cb3a?q=80&w=1000&auto=format&fit=crop",
    creator: "tunnelart",
    verified: true,
    views: "55.8K",
    likes: "7.9K",
    uses: "3.2K",
    tags: ["tunnel", "colorful", "abstract"],
    category: "Style",
    aspectRatio: "9:16",
    prompt: "Colorful tunnel leading to light, rainbow walls spiraling inward, trippy perspective"
  },
  {
    id: 30,
    title: "Plasma Orb",
    image: "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=1000&auto=format&fit=crop",
    creator: "plasmaart",
    verified: false,
    views: "43.1K",
    likes: "6.1K",
    uses: "2.3K",
    tags: ["plasma", "energy", "glow"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Plasma ball energy, electric purple and blue tendrils, sci-fi energy orb"
  },
  {
    id: 31,
    title: "Macro Flora",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1000&auto=format&fit=crop",
    creator: "floraart",
    verified: true,
    views: "68.7K",
    likes: "9.9K",
    uses: "4.2K",
    tags: ["flowers", "macro", "colorful"],
    category: "Style",
    aspectRatio: "3:4",
    prompt: "Macro flower photography, vibrant petals in pink and yellow, extreme close-up detail"
  },
  {
    id: 32,
    title: "Glitch Art",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
    creator: "glitchart",
    verified: false,
    views: "51.3K",
    likes: "7.3K",
    uses: "2.9K",
    tags: ["glitch", "digital", "error"],
    category: "Technique",
    aspectRatio: "16:9",
    prompt: "Digital glitch effect, fragmented RGB channels, corrupted beautiful image"
  },
  {
    id: 33,
    title: "Sunset Palms",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
    creator: "beachvibes",
    verified: true,
    views: "97.4K",
    likes: "16.2K",
    uses: "7.4K",
    tags: ["sunset", "beach", "tropical"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Tropical sunset through palm trees, orange and pink sky, silhouette of paradise"
  },
  {
    id: 34,
    title: "Crystal Cave",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1000&auto=format&fit=crop",
    creator: "caveart",
    verified: false,
    views: "37.9K",
    likes: "5.3K",
    uses: "2.0K",
    tags: ["crystal", "cave", "magical"],
    category: "Technique",
    aspectRatio: "4:5",
    prompt: "Magical crystal cave, glowing amethyst and quartz formations, ethereal light"
  },
  {
    id: 35,
    title: "Gradient Sky",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
    creator: "skyart",
    verified: true,
    views: "84.6K",
    likes: "13.5K",
    uses: "6.1K",
    tags: ["sky", "gradient", "mountains"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Dramatic mountain sky, cotton candy pink and blue gradient, epic landscape photography"
  },
  {
    id: 36,
    title: "Hologram Effect",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop",
    creator: "holoart",
    verified: false,
    views: "46.2K",
    likes: "6.5K",
    uses: "2.5K",
    tags: ["hologram", "portrait", "future"],
    category: "Technique",
    aspectRatio: "9:16",
    prompt: "Holographic portrait effect, rainbow light refractions on skin, futuristic beauty"
  },
  {
    id: 37,
    title: "Color Field",
    image: "https://images.unsplash.com/photo-1502691876148-a84978e59af8?q=80&w=1000&auto=format&fit=crop",
    creator: "fieldart",
    verified: true,
    views: "79.8K",
    likes: "12.1K",
    uses: "5.4K",
    tags: ["flowers", "field", "colorful"],
    category: "Style",
    aspectRatio: "16:9",
    prompt: "Endless field of colorful tulips, red, yellow, and purple rows, Dutch landscape"
  },
  {
    id: 38,
    title: "Electric Storm",
    image: "https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?q=80&w=1000&auto=format&fit=crop",
    creator: "stormart",
    verified: false,
    views: "59.4K",
    likes: "8.5K",
    uses: "3.4K",
    tags: ["storm", "lightning", "dramatic"],
    category: "Technique",
    aspectRatio: "1:1",
    prompt: "Purple lightning storm, electric bolts across night sky, dramatic weather photography"
  },
  {
    id: 39,
    title: "Candy Colors",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop",
    creator: "candyart",
    verified: true,
    views: "42.7K",
    likes: "6.0K",
    uses: "2.2K",
    tags: ["candy", "pastel", "sweet"],
    category: "Style",
    aspectRatio: "1:1",
    prompt: "Pastel candy colors, soft pink, mint green, and lavender gradient, sweet aesthetic"
  },
  {
    id: 40,
    title: "Ocean Gradient",
    image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=1000&auto=format&fit=crop",
    creator: "oceanart",
    verified: false,
    views: "66.1K",
    likes: "9.4K",
    uses: "4.0K",
    tags: ["ocean", "blue", "waves"],
    category: "Style",
    aspectRatio: "3:4",
    prompt: "Deep ocean gradient, turquoise to navy blue transition, underwater color palette"
  }
];

export default function Discover() {
  const [displayedItems, setDisplayedItems] = useState<InspirationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_LOAD = 12;

  useEffect(() => {
    setDisplayedItems(allInspirations.slice(0, ITEMS_PER_LOAD));
    setPage(1);
  }, []);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    
    const startIndex = page * ITEMS_PER_LOAD;
    const endIndex = startIndex + ITEMS_PER_LOAD;
    
    if (startIndex >= allInspirations.length) {
      return;
    }
    
    setIsLoading(true);
    
    setTimeout(() => {
      const nextItems = allInspirations.slice(startIndex, endIndex);
      setDisplayedItems(prev => [...prev, ...nextItems]);
      setPage(prev => prev + 1);
      setIsLoading(false);
    }, 300);
  }, [page, isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && displayedItems.length < allInspirations.length) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, displayedItems.length]);

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA] pb-20 md:pb-0">
        
        {/* MASONRY GRID - No header */}
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
            <div className="ml-auto text-sm text-[#71717A]">
              {displayedItems.length} of {allInspirations.length} designs
            </div>
          </div>

          {/* Masonry Layout using CSS Columns */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
            {displayedItems.map((item, index) => (
              <LazyMasonryCard key={item.id} item={item} index={index} />
            ))}
          </div>

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoading && (
              <div className="flex items-center gap-3 text-[#71717A]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more designs...</span>
              </div>
            )}
            {displayedItems.length >= allInspirations.length && (
              <div className="text-sm text-[#71717A]">
                You've seen all {allInspirations.length} designs
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
