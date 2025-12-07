import { useState } from "react";
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
  ArrowRight, 
  Bookmark, 
  BadgeCheck, 
  Eye, 
  Heart, 
  Wand2, 
  Layers
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState("Trending");

  const filters = [
    { icon: Sparkles, label: "Trending" },
    { icon: Clock, label: "New This Week" },
    { icon: Flame, label: "Most Popular" },
    { icon: Palette, label: "Styles" },
    { icon: Type, label: "Prompts" },
    { icon: Lightbulb, label: "Techniques" },
    { icon: Users, label: "Community" }
  ];

  const trendingItems = [
    {
      rank: 1,
      title: "Ethereal Glow",
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop",
      creator: "creativemind",
      verified: true,
      views: "45.2K",
      likes: "8.9K",
      uses: "3.2K",
      tags: ["portrait", "ethereal", "soft light"],
      category: "Style"
    },
    {
      rank: 2,
      title: "Neon Dystopia",
      image: "https://images.unsplash.com/photo-1580584126903-c17d41830450?q=80&w=1000&auto=format&fit=crop",
      creator: "futuredesign",
      verified: false,
      views: "38.1K",
      likes: "7.2K",
      uses: "2.8K",
      tags: ["cyberpunk", "neon", "city"],
      category: "Style"
    },
    {
      rank: 3,
      title: "Liquid Dreams",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop",
      creator: "artflow",
      verified: false,
      views: "31.4K",
      likes: "5.8K",
      uses: "2.1K",
      tags: ["watercolor", "abstract", "flowing"],
      category: "Technique"
    },
    {
      rank: 4,
      title: "Clean Commerce",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
      creator: "minimalstudio",
      verified: true,
      views: "28.9K",
      likes: "4.5K",
      uses: "1.9K",
      tags: ["minimal", "product", "clean"],
      category: "Prompt"
    },
    {
      rank: 5,
      title: "Fantasy Realms",
      image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop",
      creator: "dragonmaster",
      verified: true,
      views: "25.6K",
      likes: "4.1K",
      uses: "1.5K",
      tags: ["fantasy", "dragon", "epic"],
      category: "Style"
    },
    {
      rank: 6,
      title: "Retro Wave",
      image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
      creator: "80slover",
      verified: false,
      views: "22.1K",
      likes: "3.8K",
      uses: "1.2K",
      tags: ["retro", "synthwave", "80s"],
      category: "Style"
    },
    {
      rank: 7,
      title: "Paper Cutout",
      image: "https://images.unsplash.com/photo-1516051662668-f3b5f6b9a131?q=80&w=1000&auto=format&fit=crop",
      creator: "crafty",
      verified: false,
      views: "19.8K",
      likes: "3.2K",
      uses: "1.1K",
      tags: ["paper", "craft", "cutout"],
      category: "Technique"
    },
    {
      rank: 8,
      title: "Isometric Worlds",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
      creator: "iso_king",
      verified: true,
      views: "18.5K",
      likes: "2.9K",
      uses: "950",
      tags: ["isometric", "3d", "miniature"],
      category: "Style"
    }
  ];

  const collections = [
    {
      title: "Dark & Moody Portraits",
      curator: "shadowmaster",
      styles: 24,
      saves: "5.2K",
      preview1: "https://images.unsplash.com/photo-1535378437327-2710c0423936?q=80&w=1000&auto=format&fit=crop",
      preview2: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop",
      preview3: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Product Photography Essentials",
      curator: "AI Creative Studio",
      styles: 36,
      saves: "8.9K",
      preview1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
      preview2: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
      preview3: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Anime & Manga Masterclass",
      curator: "animeartist",
      styles: 48,
      saves: "12.3K",
      preview1: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      preview2: "https://images.unsplash.com/photo-1630478014678-12f8c384787e?q=80&w=1000&auto=format&fit=crop",
      preview3: "https://images.unsplash.com/photo-1560972550-aba3456b5564?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Vintage Film Aesthetics",
      curator: "retrowave",
      styles: 18,
      saves: "3.7K",
      preview1: "https://images.unsplash.com/photo-1516051662668-f3b5f6b9a131?q=80&w=1000&auto=format&fit=crop",
      preview2: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop",
      preview3: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA] pb-20 md:pb-0">
        
        {/* HERO SECTION */}
        <div className="relative h-[400px] bg-[#0A0A0B] overflow-hidden">
          {/* Animated Background */}
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
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 right-1/4 w-[200px] h-[200px] bg-[#664D3F] rounded-full opacity-10 blur-[60px]" 
            />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-12 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-4 mb-3">
              <Compass className="h-8 w-8 text-transparent bg-clip-text bg-gradient-to-br from-[#B94E30] to-[#E3B436]" stroke="url(#compass-gradient)" />
              <svg width="0" height="0">
                <linearGradient id="compass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop stopColor="#B94E30" offset="0%" />
                  <stop stopColor="#E3B436" offset="100%" />
                </linearGradient>
              </svg>
              <h1 className="text-[40px] font-bold text-[#FAFAFA]">Discover</h1>
            </div>
            
            <p className="text-lg text-[#A1A1AA] max-w-xl">
              Explore trending styles, innovative techniques, and creative inspiration from the community.
            </p>

            {/* Hero Search */}
            <div className="mt-8 max-w-[600px] w-full">
              <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-1 focus-within:bg-white/15 focus-within:border-white/20 transition-all">
                <Search className="h-[22px] w-[22px] text-[#71717A] ml-4" />
                <input 
                  type="text" 
                  placeholder="Search styles, prompts, techniques..."
                  className="flex-1 bg-transparent border-none p-3.5 text-base text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:ring-0"
                />
                <button className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors mr-1">
                  <SlidersHorizontal className="h-5 w-5 text-[#FAFAFA]" />
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2.5 mt-5">
              {filters.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => setActiveFilter(filter.label)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all backdrop-blur-md border",
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

            {/* Hero Stats */}
            <div className="absolute bottom-10 right-12 flex gap-8">
              {[
                { value: "12.5K+", label: "Styles" },
                { value: "50K+", label: "Prompts" },
                { value: "8.2K", label: "This Week" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-[#FAFAFA]">{stat.value}</span>
                  <span className="text-xs text-[#71717A] mt-0.5">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TRENDING NOW SECTION */}
        <div className="px-6 md:px-12 py-8 md:py-12 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-7 gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-[#B94E30]" />
              <h2 className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Trending Now</h2>
              <div className="flex items-center gap-2 px-2.5 py-1 bg-[#16A34A]/10 rounded-full ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
                </span>
                <span className="text-xs font-medium text-[#16A34A]">Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingItems.map((item, i) => (
              <div 
                key={i}
                className="group bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-[20px] overflow-hidden cursor-pointer hover:border-[#B94E30]/50 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(185,78,48,0.15)] transition-all duration-300"
              >
                {/* Card Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  
                  {/* Rank Badge */}
                  <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-[#B94E30] to-[#8B3A24] rounded-[10px] flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    #{item.rank}
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-opacity group-hover:opacity-0">
                    {item.category}
                  </div>

                  {/* Save Button (Hover) */}
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-2 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#B94E30] text-white">
                    <Bookmark className="h-5 w-5" />
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-5">
                  <h3 className="text-[17px] font-semibold text-[#18181B] dark:text-[#FAFAFA] truncate">{item.title}</h3>
                  
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#B94E30] to-[#E3B436]" />
                    <span className="text-[13px] text-[#71717A]">by @{item.creator}</span>
                    {item.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#B94E30]" />}
                  </div>

                  <div className="flex gap-4 mt-3.5">
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
                    {item.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-[#F4F4F5] dark:bg-[#1F1F25] rounded-md text-[10px] text-[#71717A]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </main>
    </div>
  );
}
