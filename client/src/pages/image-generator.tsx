import { useState, useRef, useEffect } from "react";
import { 
  Wand2, 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  MoreHorizontal, 
  Maximize2, 
  X, 
  Zap, 
  Clock, 
  Layers, 
  Settings,
  ChevronDown,
  Paperclip,
  SlidersHorizontal,
  Check,
  Info,
  Trash2,
  Copy,
  RefreshCw,
  Search,
  Star,
  Edit,
  Keyboard,
  BookOpen,
  ImagePlus,
  Camera,
  Clapperboard,
  Tv,
  Palette,
  Droplets,
  Monitor,
  Circle,
  Sunset,
  Sword,
  Shapes,
  Box,
  Pencil,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
  BrainCircuit,
  Target,
  Bot,
  Crosshair,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Import generated images for the gallery
import cyberpunkCity from "@assets/generated_images/futuristic_cyberpunk_city_street_at_night_with_neon_lights_and_rain.png";
import oilPainting from "@assets/generated_images/oil_painting_portrait_of_a_young_woman_with_flowers_in_her_hair.png";
import fantasyLandscape from "@assets/generated_images/epic_fantasy_landscape_with_mountains_and_a_dragon_flying.png";
import scifiSpaceship from "@assets/generated_images/sci-fi_spaceship_landing_on_an_alien_planet_with_two_moons.png";

// Types
type GenerationStatus = "idle" | "generating" | "complete";

type GeneratedImage = {
  id: string;
  src: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  timestamp: string;
  isNew?: boolean;
};

type Agent = {
  id: number;
  name: string;
  status: "idle" | "working" | "complete" | "error";
  message: string;
  icon: any;
  activeColor: string;
};

const AGENTS: Agent[] = [
  { id: 1, name: "Text Sentinel", status: "idle", message: "Checking spelling...", icon: Bot, activeColor: "#3B82F6" },
  { id: 2, name: "Style Architect", status: "idle", message: "Enhancing style...", icon: Sparkles, activeColor: "#8B5CF6" },
  { id: 3, name: "Visual Synthesizer", status: "idle", message: "Generating image...", icon: Palette, activeColor: "#EC4899" },
  { id: 4, name: "Master Refiner", status: "idle", message: "Refining details...", icon: SlidersHorizontal, activeColor: "#F59E0B" },
  { id: 5, name: "Quality Analyst", status: "idle", message: "Analyzing quality...", icon: BrainCircuit, activeColor: "#10B981" },
];

const STYLE_PRESETS = [
  { name: "Auto", id: "auto", icon: Sparkles, desc: "AI selects best style" },
  { name: "Photorealistic", id: "photo", icon: Camera, desc: "DSLR quality, natural lighting" },
  { name: "Cinematic", id: "cinematic", icon: Clapperboard, desc: "Film grain, dramatic shadows" },
  { name: "Anime/Manga", id: "anime", icon: Tv, desc: "Cel shaded, vibrant colors" },
  { name: "Oil Painting", id: "oil", icon: Palette, desc: "Visible brushstrokes, Renaissance" },
  { name: "Watercolor", id: "watercolor", icon: Droplets, desc: "Soft edges, paper texture" },
  { name: "Digital Art", id: "digital", icon: Monitor, desc: "Trending on ArtStation" },
  { name: "Minimalist", id: "minimal", icon: Circle, desc: "Clean lines, negative space" },
  { name: "Retrowave", id: "retro", icon: Sunset, desc: "Neon lights, 80s aesthetic" },
  { name: "Dark Fantasy", id: "fantasy", icon: Sword, desc: "Gothic, dramatic lighting" },
  { name: "Pop Art", id: "pop", icon: Shapes, desc: "Bold colors, Ben-Day dots" },
  { name: "Isometric 3D", id: "iso", icon: Box, desc: "Clean geometry, soft shadows" },
  { name: "Pencil Sketch", id: "sketch", icon: Pencil, desc: "Graphite, crosshatching" },
];

const QUALITY_PRESETS = [
  { id: "draft", name: "Draft", icon: Zap, tooltip: "Fast preview, good for iteration" },
  { id: "standard", name: "Standard", icon: Sparkles, tooltip: "Balanced quality and speed" },
  { id: "premium", name: "Premium", icon: BookOpen, tooltip: "Maximum quality, slower" }, // Using BookOpen as generic gem replacement
  { id: "ultra", name: "Ultra", icon: Zap, tooltip: "Extreme detail, longest generation" }, // Using Zap as generic flame replacement
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", icon: Square, tooltip: "Square - Social media profiles" },
  { id: "16:9", label: "16:9", icon: RectangleHorizontal, tooltip: "Landscape - Cinematic, wallpapers" },
  { id: "9:16", label: "9:16", icon: RectangleVertical, tooltip: "Portrait - Mobile, stories" },
  { id: "4:3", label: "4:3", icon: Monitor, tooltip: "Classic - Traditional photo" },
  { id: "3:4", label: "3:4", icon: Smartphone, tooltip: "Tall - Portrait photos, posters" },
];

const REFINER_PRESETS = [
  { id: "cinematic", name: "Cinematic", icon: Clapperboard },
  { id: "sharp", name: "Sharp Detail", icon: Crosshair },
  { id: "soft", name: "Soft Glow", icon: Sun },
  { id: "vibrant", name: "Vibrant", icon: Palette },
  { id: "moody", name: "Moody", icon: Moon },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generations, setGenerations] = useState<GeneratedImage[]>([]);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [settings, setSettings] = useState({
    style: "auto",
    quality: "standard",
    aspectRatio: "1:1",
    variations: "4",
    refiner: true,
    refinerPreset: "cinematic",
    aiCuration: true,
    autoOptimize: true
  });
  
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setStatus("generating");
    setProgress(0);
    setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));

    // Simulation pipeline
    let currentAgentIndex = 0;
    const totalDuration = 5000; // 5 seconds total
    const intervalTime = totalDuration / 100;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeGeneration();
          return 100;
        }
        return prev + 1;
      });

      // Update agents based on progress
      const stage = Math.floor((progress / 100) * 5);
      if (stage !== currentAgentIndex && stage < 5) {
        setAgents(prev => prev.map((a, i) => {
          if (i < stage) return { ...a, status: "complete" };
          if (i === stage) return { ...a, status: "working" };
          return { ...a, status: "idle" };
        }));
        currentAgentIndex = stage;
      }
    }, intervalTime);
  };

  const completeGeneration = () => {
    setStatus("complete");
    setAgents(prev => prev.map(a => ({ ...a, status: "complete" })));
    
    // Add new generation
    const newImage: GeneratedImage = {
      id: Date.now().toString(),
      src: cyberpunkCity, // Just using one as example result
      prompt: prompt,
      style: settings.style,
      aspectRatio: settings.aspectRatio,
      timestamp: "Just now",
      isNew: true
    };
    
    setGenerations(prev => [newImage, ...prev]);
    
    toast({
      title: "Image Generated!",
      description: "Your creation is ready.",
      className: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-900/50 dark:text-purple-400",
    });

    // Reset agents after delay
    setTimeout(() => {
      setStatus("idle");
      setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
      setProgress(0);
    }, 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Initialize with some sample images if empty
  useEffect(() => {
    if (generations.length === 0) {
      setGenerations([
        {
          id: "1",
          src: oilPainting,
          prompt: "Oil painting portrait of a young woman with flowers in her hair",
          style: "oil",
          aspectRatio: "1:1",
          timestamp: "2 hours ago"
        },
        {
          id: "2",
          src: fantasyLandscape,
          prompt: "Epic fantasy landscape with mountains and a dragon flying",
          style: "fantasy",
          aspectRatio: "16:9",
          timestamp: "5 hours ago"
        },
        {
          id: "3",
          src: scifiSpaceship,
          prompt: "Sci-fi spaceship landing on an alien planet with two moons",
          style: "scifi",
          aspectRatio: "16:9",
          timestamp: "1 day ago"
        }
      ]);
    }
  }, []);

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-background text-foreground">
        
        {/* TOP SECTION: PROMPT BAR (Hero) */}
        <div className="sticky top-0 z-50 bg-background border-b border-border/50 px-10 py-6 shadow-xl">
          
          {/* Header Row */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <Wand2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Image Generator</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 text-[13px] gap-2">
                <BookOpen className="h-4 w-4" />
                Style Library
              </Button>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 text-[13px] gap-2">
                <Keyboard className="h-4 w-4" />
                Shortcuts
              </Button>
              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3.5 py-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[13px] font-semibold text-foreground">1,523</span>
              </div>
            </div>
          </div>

          {/* Main Prompt Container */}
          <div className={cn(
            "bg-muted/20 border-2 rounded-[20px] p-1.5 transition-all duration-200 flex items-start gap-3 group focus-within:bg-card focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.15)]",
            prompt.trim().length > 0 ? "border-muted-foreground/30" : "border-border"
          )}>
            
            {/* Left: Reference Image Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="h-12 w-12 bg-muted hover:bg-muted/80 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
                    <ImagePlus className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Add reference image (optional)</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Center: Prompt Input */}
            <div className="flex-1 flex flex-col gap-1 py-1 relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to create..."
                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[16px] text-foreground placeholder:text-muted-foreground resize-none min-h-[48px] max-h-[140px] leading-relaxed"
                rows={1}
              />
              <div className={cn(
                "self-end text-[11px] font-medium transition-colors",
                prompt.length > 1800 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {prompt.length} / 2000
              </div>
            </div>

            {/* Right: Controls Column */}
            <div className="flex flex-col gap-2 items-end">
              {/* Top Row: Settings */}
              <div className="flex items-center gap-2">
                {/* Quick Settings Pills */}
                <div className="flex items-center gap-2 mr-1">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {STYLE_PRESETS.find(s => s.id === settings.style)?.icon && (
                       <span className="text-primary"><Sparkles className="h-3 w-3" /></span>
                    )}
                    {STYLE_PRESETS.find(s => s.id === settings.style)?.name || "Style"}
                  </button>
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="text-primary"><Zap className="h-3 w-3" /></span>
                    {QUALITY_PRESETS.find(q => q.id === settings.quality)?.name || "Standard"}
                  </button>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
                          showSettings ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        <SlidersHorizontal className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>Generation Settings</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Bottom Row: Generate */}
              <div className="flex flex-col items-center gap-1">
                <Button 
                  onClick={handleGenerate}
                  disabled={status === "generating" || !prompt.trim()}
                  className={cn(
                    "h-auto py-3.5 px-7 rounded-xl font-bold text-[15px] transition-all duration-200 min-w-[140px] shadow-lg hover:translate-y-[-2px] active:scale-98",
                    status === "generating" 
                      ? "bg-primary opacity-90 cursor-wait" 
                      : "bg-gradient-to-br from-purple-600 to-purple-700 hover:brightness-110 text-white"
                  )}
                >
                  {status === "generating" ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5" />
                      <span>Imagine</span>
                    </div>
                  )}
                </Button>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <div className="flex items-center justify-center h-3 w-3 rounded-[3px] bg-muted border border-border">⌘</div>
                  <span>Enter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel (Expandable) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden bg-card border-t border-border rounded-b-xl"
              >
                <div className="py-6">
                  {/* Row 1: Main Settings Grid */}
                  <div className="grid grid-cols-5 gap-6">
                    
                    {/* Column 1: Style */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Style</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full h-[46px] bg-muted/30 border border-border hover:border-border/80 rounded-xl px-3.5 flex items-center justify-between text-[13px] text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              {STYLE_PRESETS.find(s => s.id === settings.style)?.icon && (
                                 <span className="text-primary"><Sparkles className="h-4 w-4" /></span>
                              )}
                              {STYLE_PRESETS.find(s => s.id === settings.style)?.name}
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px] bg-popover border-border text-popover-foreground max-h-[300px] overflow-y-auto p-1.5">
                          {STYLE_PRESETS.map(style => (
                            <DropdownMenuItem 
                              key={style.id}
                              onClick={() => setSettings({...settings, style: style.id})}
                              className={cn(
                                "px-3 py-2.5 rounded-lg cursor-pointer text-[13px]",
                                settings.style === style.id ? "bg-primary/20 text-primary" : "hover:bg-muted"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <style.icon className="h-4 w-4" />
                                {style.name}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Column 2: Quality */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quality</label>
                      <div className="flex bg-muted/30 rounded-[10px] p-1 border border-border">
                        {QUALITY_PRESETS.map(q => (
                          <TooltipProvider key={q.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, quality: q.id})}
                                  className={cn(
                                    "flex-1 h-[38px] rounded-lg flex items-center justify-center gap-1.5 text-[12px] font-medium transition-all",
                                    settings.quality === q.id 
                                      ? "bg-primary text-white shadow-sm" 
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                >
                                  <q.icon className="h-3.5 w-3.5" />
                                  <span className="hidden xl:inline">{q.name}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>{q.tooltip}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Aspect Ratio */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ratio</label>
                      <div className="flex gap-2">
                        {ASPECT_RATIOS.map(r => (
                          <TooltipProvider key={r.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, aspectRatio: r.id})}
                                  className={cn(
                                    "h-[42px] w-[42px] rounded-lg flex items-center justify-center border transition-all",
                                    settings.aspectRatio === r.id 
                                      ? "bg-primary/20 border-primary text-primary" 
                                      : "bg-muted/30 border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                                  )}
                                >
                                  <r.icon className="h-5 w-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>{r.tooltip}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Variations */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Variations</label>
                      <div className="flex bg-muted/30 rounded-[10px] p-1 border border-border">
                        {["1", "2", "4"].map(v => (
                          <button
                            key={v}
                            onClick={() => setSettings({...settings, variations: v})}
                            className={cn(
                              "flex-1 h-[38px] rounded-lg flex items-center justify-center text-[12px] font-medium transition-all",
                              settings.variations === v 
                                ? "bg-primary text-white shadow-sm" 
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 5: Refiner */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enhance</label>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-muted-foreground">Master Refiner</span>
                          <Switch 
                            checked={settings.refiner}
                            onCheckedChange={(c) => setSettings({...settings, refiner: c})}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                        {settings.refiner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-full h-[36px] bg-muted/30 border border-border hover:border-border/80 rounded-lg px-3 flex items-center justify-between text-[12px] text-foreground transition-colors">
                                <div className="flex items-center gap-2">
                                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                                  {REFINER_PRESETS.find(p => p.id === settings.refinerPreset)?.name}
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[160px] bg-popover border-border text-popover-foreground">
                              {REFINER_PRESETS.map(preset => (
                                <DropdownMenuItem 
                                  key={preset.id}
                                  onClick={() => setSettings({...settings, refinerPreset: preset.id})}
                                  className={cn(
                                    "px-3 py-2 rounded-md cursor-pointer text-[12px]",
                                    settings.refinerPreset === preset.id ? "bg-primary/20 text-primary" : "hover:bg-muted"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <preset.icon className="h-3.5 w-3.5" />
                                    {preset.name}
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Row 2: AI Features */}
                  <div className="mt-5 pt-5 border-t border-border flex items-center gap-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Features</span>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSettings({...settings, aiCuration: !settings.aiCuration})}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-full border text-[13px] font-medium transition-all",
                          settings.aiCuration 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-muted/30 border-border text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <BrainCircuit className="h-4 w-4" />
                        AI Curation
                      </button>
                      
                      <button 
                        onClick={() => setSettings({...settings, autoOptimize: !settings.autoOptimize})}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-full border text-[13px] font-medium transition-all",
                          settings.autoOptimize 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-muted/30 border-border text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <Target className="h-4 w-4" />
                        Auto Optimize
                      </button>

                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/30 border border-border text-muted-foreground text-[13px] font-medium hover:border-border/80 transition-all ml-auto">
                        <BookOpen className="h-4 w-4" />
                        Knowledge Base
                        <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Agents Status Bar (During Generation) */}
          <AnimatePresence>
            {status === "generating" && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, marginBottom: 20 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                className="bg-card border-b border-border -mx-10 px-10 py-5 overflow-hidden relative"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-0">
                    {agents.map((agent, i) => (
                      <div key={agent.id} className="flex items-center">
                        {/* Node */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                                agent.status === "working" 
                                  ? `bg-primary shadow-[0_0_20px_rgba(124,58,237,0.5)] scale-110 text-white` 
                                  : agent.status === "complete" 
                                    ? "bg-green-600 text-white" 
                                    : "bg-muted border-2 border-border text-muted-foreground"
                              )}>
                                {agent.status === "working" && (
                                  <div className="absolute inset-0 rounded-full border-2 border-white opacity-50 animate-ping" />
                                )}
                                <agent.icon className={cn(
                                  "h-5 w-5 transition-colors"
                                )} />
                                
                                {/* Label */}
                                <div className="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold uppercase text-muted-foreground">
                                  {agent.name.split(" ")[0]}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{agent.name} - {agent.message}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Connecting Line */}
                        {i < agents.length - 1 && (
                          <div className="w-[60px] h-[3px] bg-muted -mx-[1px] relative overflow-hidden">
                            {agent.status === "complete" && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                className="h-full bg-primary"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* SCROLLABLE GALLERY */}
        <div className="flex-1 overflow-y-auto p-10">
          {generations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in max-w-xl mx-auto mt-[-100px]">
              <div className="w-40 h-40 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-[80px] opacity-20 mb-8" />
              <h2 className="text-3xl font-bold mb-3 text-foreground">Start Creating</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Enter a prompt above to unleash the power of our 5-agent AI system.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {["Futuristic city with neon lights", "Oil painting of a cat king", "Cyberpunk street food stall"].map(p => (
                  <button 
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-full text-sm text-muted-foreground hover:text-foreground transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 mx-auto max-w-[1800px]">
              {generations.map((gen) => (
                <div 
                  key={gen.id}
                  onClick={() => setSelectedImage(gen)}
                  className="break-inside-avoid mb-6 relative group rounded-xl overflow-hidden cursor-pointer bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <img src={gen.src} alt={gen.prompt} className="w-full h-auto object-cover" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-5">
                    <p className="text-white text-sm line-clamp-2 mb-4 font-medium leading-relaxed">{gen.prompt}</p>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg">
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>
                      <div className="flex items-center gap-1 ml-auto">
                        <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setSelectedImage(null)}
            >
              <div 
                className="w-full max-w-7xl h-[85vh] bg-card rounded-2xl overflow-hidden flex border border-border shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Left: Image */}
                <div className="flex-1 bg-muted/20 flex items-center justify-center p-8 relative group">
                  <img 
                    src={selectedImage.src} 
                    alt={selectedImage.prompt} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                  />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button size="icon" className="rounded-full bg-black/50 text-white border-0 hover:bg-black/70">
                       <Maximize2 className="h-4 w-4" />
                     </Button>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="w-[400px] bg-card border-l border-border flex flex-col">
                  <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-foreground">Image Details</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Actions */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { icon: Download, label: "Save" },
                        { icon: RefreshCw, label: "Vary" },
                        { icon: Edit, label: "Edit" },
                        { icon: Star, label: "Like" }
                      ].map((action, i) => (
                        <Button key={i} variant="ghost" className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border">
                          <action.icon className="h-5 w-5" />
                          <span className="text-[10px]">{action.label}</span>
                        </Button>
                      ))}
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prompt</label>
                      <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed border border-border relative group">
                        {selectedImage.prompt}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                             navigator.clipboard.writeText(selectedImage.prompt);
                             toast({ title: "Copied" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-xs text-muted-foreground">Style</span>
                        <span className="text-xs font-medium text-foreground capitalize">{selectedImage.style}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-xs text-muted-foreground">Dimensions</span>
                        <span className="text-xs font-medium text-foreground">1024 × 1024</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-xs text-muted-foreground">Model</span>
                        <span className="text-xs font-medium text-foreground">V5.2</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-xs text-muted-foreground">Seed</span>
                        <span className="text-xs font-medium text-foreground font-mono">82739103</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
