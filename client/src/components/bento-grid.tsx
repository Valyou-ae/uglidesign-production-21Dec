import { useState } from "react";
import { 
  Sparkles, 
  Shirt, 
  Scissors, 
  ArrowRight, 
  Image as ImageIcon, 
  Clock, 
  TrendingUp, 
  Zap, 
  Plus, 
  Upload, 
  Layers, 
  Link as LinkIcon, 
  Shuffle,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Assets
import project1 from "@assets/generated_images/abstract_creative_digital_art_of_a_beach_sunset_with_geometric_overlays.png";
import project2 from "@assets/generated_images/minimalist_logo_design_sketch_with_geometric_shapes.png";
import project3 from "@assets/generated_images/cyberpunk_neon_cityscape_with_futuristic_purple_and_blue_tones.png";
import suggestionImg from "@assets/generated_images/vintage_polaroid_photo_effect_with_warm_tones.png";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  circleColor: string;
  badge?: string;
  badgeCount?: string;
  delay?: number;
  href?: string;
}

const SUGGESTIONS_POOL = [
  { badge: "Trending", text: "A cyberpunk cityscape at night with neon signs...", fullText: "A cyberpunk cityscape at night with neon signs, flying cars, rain reflecting on the streets, cinematic lighting, highly detailed, 8k resolution" },
  { badge: "For You", text: "Minimalist logo design with geometric shapes...", fullText: "Minimalist logo design with geometric shapes, vector art, flat design, clean lines, professional, corporate identity, white background" },
  { badge: "Popular", text: "Vintage polaroid photo effect with warm tones...", fullText: "Vintage polaroid photo effect with warm tones, nostalgic atmosphere, grain, scratch textures, emotional, candid shot" },
  { badge: "Featured", text: "Abstract fluid art with gold and marble...", fullText: "Abstract fluid art with gold and marble textures, swirling colors, luxury aesthetic, high contrast, macro photography" },
  { badge: "New", text: "Isometric 3D room design with plants...", fullText: "Isometric 3D room design with plants, cozy atmosphere, soft lighting, pastel colors, blender render, cute style" },
  { badge: "Hot", text: "Synthwave sunset over a grid landscape...", fullText: "Synthwave sunset over a grid landscape, retro 80s style, mountains in background, chrome typography, purple and orange gradient" },
  { badge: "Creative", text: "Surreal double exposure of forest and bear...", fullText: "Surreal double exposure of forest and bear silhouette, nature photography, misty trees, wildlife art, monochromatic" },
  { badge: "Style", text: "Pop art portrait in Lichtenstein style...", fullText: "Pop art portrait in Lichtenstein style, comic book dots, bold outlines, primary colors, speech bubble, retro comic" },
  { badge: "Decor", text: "Boho chic living room interior design...", fullText: "Boho chic living room interior design, macrame wall hanging, plants, rattan furniture, warm sunlight, cozy texture" },
];

function ModuleCard({ title, description, icon: Icon, gradient, circleColor, badge, badgeCount, delay = 0, href }: ModuleCardProps) {
  const content = (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-[24px] p-5 md:p-7 min-h-[160px] md:min-h-[220px] cursor-pointer group transition-all duration-500 h-full",
        gradient
      )}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      {/* Decorative Circle */}
      <div 
        className="absolute -top-20 -right-20 w-[240px] h-[240px] rounded-full blur-3xl opacity-40 transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundColor: circleColor }}
      />

      {/* Badge */}
      {(badge || badgeCount) && (
        <div className="absolute top-7 right-7">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-white">
              {badge || badgeCount}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end z-10">
        <div className="mb-auto">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border border-white/10 shadow-inner">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{title}</h3>
        <p className="text-sm text-white/80 font-medium">{description}</p>
        
        <div className="absolute bottom-0 right-0 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}

function StatCard({ icon: Icon, value, label, trend, colorClass, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="bg-sidebar-accent/40 border border-sidebar-border/50 rounded-2xl p-5 flex flex-col hover:bg-sidebar-accent/60 transition-colors"
    >
      <div className="flex justify-between items-start mb-3">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="inline-flex items-center text-[10px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">
          {trend}
        </span>
      </div>
      <div className="mt-auto">
        <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground font-medium mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, href }: any) {
  const content = (
    <div className="group flex items-center justify-between p-3.5 bg-card border border-sidebar-border/50 rounded-xl cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/50 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ProjectCard({ image, title, time, type, delay, prompt, journey, restoreImage }: any) {
  const colors = {
    image: "border-[#B94E30]/50 hover:shadow-[#B94E30]/20",
    mockup: "border-[#664D3F]/50 hover:shadow-[#664D3F]/20",
    bg: "border-[#E3B436]/50 hover:shadow-[#E3B436]/20",
  };

  let linkHref = "#";
  if (type === "image") {
    linkHref = `/image-gen?prompt=${encodeURIComponent(prompt || title)}`;
  } else if (type === "mockup") {
    linkHref = `/mockup?journey=${journey || 'DTG'}&restore=true`;
  } else if (type === "bg") {
    linkHref = `/bg-remover?image=${encodeURIComponent(restoreImage || image)}&restore=true`;
  }

  return (
    <Link href={linkHref}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay }}
        className={cn(
          "group relative aspect-square rounded-2xl overflow-hidden border border-border cursor-pointer hover:border-2 transition-all duration-300 hover:shadow-lg",
          colors[type as keyof typeof colors]
        )}
      >
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
          <p className="text-[10px] text-white/70">{time}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export function BentoGrid() {
  const [suggestions, setSuggestions] = useState(SUGGESTIONS_POOL.slice(0, 3));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshSuggestions = () => {
    setIsRefreshing(true);
    
    // Shuffle and pick 3 random suggestions
    const shuffled = [...SUGGESTIONS_POOL].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 3));

    // Add a small delay for the animation
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
      
      {/* ROW 1: Modules */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModuleCard 
          title="Image Generator" 
          description="Create stunning visuals with AI"
          icon={Sparkles}
          gradient="bg-gradient-to-br from-[#B94E30] to-[#8B3A24]"
          circleColor="#B94E30"
          badgeCount="5 AI Agents"
          delay={0.1}
          href="/image-gen"
        />
        <ModuleCard 
          title="Mockup Generator" 
          description="Professional product mockups"
          icon={Shirt}
          gradient="bg-gradient-to-br from-[#664D3F] to-[#4A3830]"
          circleColor="#664D3F"
          badge="50+ Products"
          delay={0.2}
          href="/mockup"
        />
        <ModuleCard 
          title="Background Remover" 
          description="Remove backgrounds in seconds"
          icon={Scissors}
          gradient="bg-gradient-to-br from-[#E3B436] to-[#C99C2A]"
          circleColor="#E3B436"
          badge="Instant"
          delay={0.3}
          href="/bg-remover"
        />
      </div>

      {/* ROW 2 */}
      <div className="lg:col-span-2 bg-card border border-sidebar-border/50 rounded-[24px] p-5 md:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <h2 className="text-lg font-bold text-foreground">This Month's Stats</h2>
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-full border-border">
            December 2024 <ArrowRight className="ml-2 h-3 w-3 rotate-90" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={ImageIcon} 
            value="247" 
            label="Images Created" 
            trend="↑ 12%" 
            colorClass="bg-[#B94E30]/10 text-[#B94E30] dark:bg-[#B94E30]/20 dark:text-[#D4674A]"
            delay={0.4}
          />
          <StatCard 
            icon={Shirt} 
            value="89" 
            label="Mockups Gen" 
            trend="↑ 8%" 
            colorClass="bg-[#664D3F]/10 text-[#664D3F] dark:bg-[#664D3F]/20 dark:text-[#8B6B5A]"
            delay={0.5}
          />
          <StatCard 
            icon={Scissors} 
            value="156" 
            label="BG Removed" 
            trend="↑ 23%" 
            colorClass="bg-[#E3B436]/10 text-[#B99A2C] dark:bg-[#E3B436]/20 dark:text-[#E3B436]"
            delay={0.6}
          />
          <StatCard 
            icon={Clock} 
            value="12.5h" 
            label="Time Saved" 
            trend="↑ 15%" 
            colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            delay={0.7}
          />
        </div>
      </div>

      {/* AI Suggestions (Moved from Row 3 to Row 2) */}
      <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-200/50 dark:border-amber-900/20 rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
            <h2 className="text-lg font-bold text-foreground">AI Suggestions</h2>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-full"
            onClick={handleRefreshSuggestions}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        <div className="space-y-3">
          {suggestions.map((item, i) => (
            <Link key={i} href={`/image-gen?prompt=${encodeURIComponent(item.fullText)}`}>
              <div className="group bg-card border border-sidebar-border/50 p-4 rounded-xl cursor-pointer hover:border-l-4 hover:border-l-amber-500 hover:translate-x-1 transition-all duration-300 shadow-sm h-full">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 mb-2">
                  {item.badge}
                </span>
                <p className="text-sm text-foreground/80 line-clamp-2 group-hover:text-foreground">{item.text}</p>
                <div className="h-0 overflow-hidden group-hover:h-5 transition-all duration-300">
                  <span className="text-xs font-medium text-amber-600 mt-2 inline-block">Use Prompt →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ROW 3: Recent Work (Full Width) */}
      <div className="lg:col-span-3 bg-card border border-sidebar-border/50 rounded-[24px] p-7 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Recent Work</h2>
          <Link href="/my-creations" className="text-sm font-medium text-primary hover:underline">View All →</Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <ProjectCard image={project1} title="Beach Sunset" time="2h ago" type="image" delay={0.5} prompt="Abstract creative digital art of a beach sunset with geometric overlays" />
          <ProjectCard image={project2} title="Tech Logo" time="4h ago" type="mockup" delay={0.6} journey="DTG" />
          <ProjectCard image={project3} title="Neon City" time="Yesterday" type="bg" delay={0.7} restoreImage={project3} />
          <ProjectCard image={suggestionImg} title="Vintage Photo" time="Yesterday" type="image" delay={0.8} prompt="Vintage polaroid photo effect with warm tones" />
          {/* Reuse images for demo */}
          <ProjectCard image={project3} title="Cyberpunk Char" time="2 days ago" type="image" delay={0.9} prompt="Cyberpunk character concept art" />
          <ProjectCard image={project1} title="Abstract Wave" time="3 days ago" type="bg" delay={1.0} restoreImage={project1} />
        </div>
      </div>


    </div>
  );
}
