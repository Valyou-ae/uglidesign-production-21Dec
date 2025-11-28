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
    <div className="h-screen bg-[#0A0A0B] flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-[#1F1F23] bg-[#111113]" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#0A0A0B] text-[#FAFAFA]">
        
        {/* TOP SECTION: PROMPT BAR (Hero) */}
        <div className="sticky top-0 z-50 bg-[#111113] border-b border-[#1F1F23] px-10 py-6 shadow-xl">
          
          {/* Header Row */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <Wand2 className="h-6 w-6 text-[#7C3AED]" />
              <h1 className="text-2xl font-bold text-[#FAFAFA]">Image Generator</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-[#A1A1AA] hover:text-white hover:bg-[#1F1F23] h-8 text-[13px] gap-2">
                <BookOpen className="h-4 w-4" />
                Style Library
              </Button>
              <Button variant="ghost" className="text-[#A1A1AA] hover:text-white hover:bg-[#1F1F23] h-8 text-[13px] gap-2">
                <Keyboard className="h-4 w-4" />
                Shortcuts
              </Button>
              <div className="flex items-center gap-2 bg-[#1F1F23] rounded-full px-3.5 py-1.5">
                <Zap className="h-3.5 w-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="text-[13px] font-semibold text-[#FAFAFA]">1,523</span>
              </div>
            </div>
          </div>

          {/* Main Prompt Container */}
          <div className={cn(
            "bg-[#1A1A1F] border-2 rounded-[20px] p-1.5 transition-all duration-200 flex items-start gap-3 group focus-within:bg-[#1F1F25] focus-within:border-[#7C3AED] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.15)]",
            prompt.trim().length > 0 ? "border-[#3F3F46]" : "border-[#2A2A30]"
          )}>
            
            {/* Left: Reference Image Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="h-12 w-12 bg-[#2A2A30] hover:bg-[#3A3A40] rounded-xl flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
                    <ImagePlus className="h-5 w-5 text-[#71717A] group-hover:text-[#A1A1AA]" />
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
                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[16px] text-[#FAFAFA] placeholder:text-[#52525B] resize-none min-h-[48px] max-h-[140px] leading-relaxed"
                rows={1}
              />
              <div className={cn(
                "self-end text-[11px] font-medium transition-colors",
                prompt.length > 1800 ? "text-[#F59E0B]" : "text-[#52525B]"
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
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2A2A30] hover:bg-[#3A3A40] text-[10px] font-medium text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    {STYLE_PRESETS.find(s => s.id === settings.style)?.icon && (
                       <span className="text-[#7C3AED]"><Sparkles className="h-3 w-3" /></span>
                    )}
                    {STYLE_PRESETS.find(s => s.id === settings.style)?.name || "Style"}
                  </button>
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2A2A30] hover:bg-[#3A3A40] text-[10px] font-medium text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    <span className="text-[#7C3AED]"><Zap className="h-3 w-3" /></span>
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
                          showSettings ? "bg-[#7C3AED] text-white" : "bg-[#2A2A30] text-[#A1A1AA] hover:bg-[#3A3A40] hover:text-white"
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
                    "h-auto py-3.5 px-7 rounded-xl font-bold text-[15px] transition-all duration-200 min-w-[140px] shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:translate-y-[-2px] hover:shadow-[0_6px_24px_rgba(124,58,237,0.5)] active:scale-98",
                    status === "generating" 
                      ? "bg-[#7C3AED] opacity-90 cursor-wait" 
                      : "bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white hover:brightness-110"
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
                <div className="flex items-center gap-1 text-[10px] text-[#52525B]">
                  <div className="flex items-center justify-center h-3 w-3 rounded-[3px] bg-[#2A2A30] border border-[#3F3F46]">⌘</div>
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
                className="overflow-hidden bg-[#151518] border-t border-[#2A2A30]"
              >
                <div className="py-6">
                  {/* Row 1: Main Settings Grid */}
                  <div className="grid grid-cols-5 gap-6">
                    
                    {/* Column 1: Style */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Style</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-full h-[46px] bg-[#1F1F25] border border-[#2A2A30] hover:border-[#3A3A40] rounded-xl px-3.5 flex items-center justify-between text-[13px] text-[#FAFAFA] transition-colors">
                            <div className="flex items-center gap-2">
                              {STYLE_PRESETS.find(s => s.id === settings.style)?.icon && (
                                 <span className="text-[#7C3AED]"><Sparkles className="h-4 w-4" /></span>
                              )}
                              {STYLE_PRESETS.find(s => s.id === settings.style)?.name}
                            </div>
                            <ChevronDown className="h-4 w-4 text-[#71717A]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px] bg-[#1F1F25] border-[#2A2A30] text-[#FAFAFA] max-h-[300px] overflow-y-auto p-1.5">
                          {STYLE_PRESETS.map(style => (
                            <DropdownMenuItem 
                              key={style.id}
                              onClick={() => setSettings({...settings, style: style.id})}
                              className={cn(
                                "px-3 py-2.5 rounded-lg cursor-pointer text-[13px]",
                                settings.style === style.id ? "bg-[#7C3AED]/20 text-[#7C3AED]" : "hover:bg-[#2A2A30]"
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
                      <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Quality</label>
                      <div className="flex bg-[#1F1F25] rounded-[10px] p-1 border border-[#2A2A30]">
                        {QUALITY_PRESETS.map(q => (
                          <TooltipProvider key={q.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, quality: q.id})}
                                  className={cn(
                                    "flex-1 h-[38px] rounded-lg flex items-center justify-center gap-1.5 text-[12px] font-medium transition-all",
                                    settings.quality === q.id 
                                      ? "bg-[#7C3AED] text-white shadow-sm" 
                                      : "text-[#71717A] hover:bg-[#2A2A30]/50 hover:text-[#FAFAFA]"
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
                      <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Ratio</label>
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
                                      ? "bg-[#7C3AED]/20 border-[#7C3AED] text-[#7C3AED]" 
                                      : "bg-[#1F1F25] border-[#2A2A30] text-[#71717A] hover:border-[#3A3A40] hover:text-[#FAFAFA]"
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
                      <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Variations</label>
                      <div className="flex bg-[#1F1F25] rounded-[10px] p-1 border border-[#2A2A30]">
                        {["1", "2", "4"].map(v => (
                          <button
                            key={v}
                            onClick={() => setSettings({...settings, variations: v})}
                            className={cn(
                              "flex-1 h-[38px] rounded-lg flex items-center justify-center text-[12px] font-medium transition-all",
                              settings.variations === v 
                                ? "bg-[#7C3AED] text-white shadow-sm" 
                                : "text-[#71717A] hover:bg-[#2A2A30]/50 hover:text-[#FAFAFA]"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 5: Refiner */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Enhance</label>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-[#E4E4E7]">Master Refiner</span>
                          <Switch 
                            checked={settings.refiner}
                            onCheckedChange={(c) => setSettings({...settings, refiner: c})}
                            className="data-[state=checked]:bg-[#7C3AED] data-[state=unchecked]:bg-[#2A2A30]"
                          />
                        </div>
                        {settings.refiner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-full h-[36px] bg-[#1F1F25] border border-[#2A2A30] hover:border-[#3A3A40] rounded-lg px-3 flex items-center justify-between text-[12px] text-[#FAFAFA] transition-colors">
                                <div className="flex items-center gap-2">
                                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#7C3AED]" />
                                  {REFINER_PRESETS.find(p => p.id === settings.refinerPreset)?.name}
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 text-[#71717A]" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[160px] bg-[#1F1F25] border-[#2A2A30] text-[#FAFAFA]">
                              {REFINER_PRESETS.map(preset => (
                                <DropdownMenuItem 
                                  key={preset.id}
                                  onClick={() => setSettings({...settings, refinerPreset: preset.id})}
                                  className={cn(
                                    "px-3 py-2 rounded-md cursor-pointer text-[12px]",
                                    settings.refinerPreset === preset.id ? "bg-[#7C3AED]/20 text-[#7C3AED]" : "hover:bg-[#2A2A30]"
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
                  <div className="mt-5 pt-5 border-t border-[#1F1F23] flex items-center gap-4">
                    <span className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">AI Features</span>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSettings({...settings, aiCuration: !settings.aiCuration})}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-full border text-[13px] font-medium transition-all",
                          settings.aiCuration 
                            ? "bg-[#7C3AED]/15 border-[#7C3AED] text-[#C4B5FD]" 
                            : "bg-[#1F1F25] border-[#2A2A30] text-[#A1A1AA] hover:border-[#3A3A40]"
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
                            ? "bg-[#7C3AED]/15 border-[#7C3AED] text-[#C4B5FD]" 
                            : "bg-[#1F1F25] border-[#2A2A30] text-[#A1A1AA] hover:border-[#3A3A40]"
                        )}
                      >
                        <Target className="h-4 w-4" />
                        Auto Optimize
                      </button>

                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1F1F25] border border-[#2A2A30] text-[#A1A1AA] text-[13px] font-medium hover:border-[#3A3A40] transition-all ml-auto">
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
                className="bg-[#111113] border-b border-[#1F1F23] -mx-10 px-10 py-5 overflow-hidden relative"
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
                                  ? `bg-[#7C3AED] shadow-[0_0_20px_rgba(124,58,237,0.5)] scale-110` 
                                  : agent.status === "complete" 
                                    ? "bg-[#16A34A]" 
                                    : "bg-[#1F1F25] border-2 border-[#2A2A30]"
                              )}>
                                {agent.status === "working" && (
                                  <div className="absolute inset-0 rounded-full border-2 border-white opacity-50 animate-ping" />
                                )}
                                <agent.icon className={cn(
                                  "h-5 w-5 transition-colors",
                                  agent.status === "idle" ? "text-[#52525B]" : "text-white"
                                )} />
                                
                                {/* Label */}
                                <div className="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold uppercase text-[#52525B]">
                                  {agent.name.split(" ")[0]}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{agent.name} - {agent.message}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Connecting Line */}
                        {i < agents.length - 1 && (
                          <div className="w-[60px] h-[3px] bg-[#2A2A30] -mx-[1px] relative overflow-hidden">
                            {agent.status === "complete" && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                className="h-full bg-[#7C3AED]"
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
              <div className="w-40 h-40 bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] rounded-full blur-[80px] opacity-20 mb-8" />
              <h2 className="text-3xl font-bold mb-3 text-[#FAFAFA]">Start Creating</h2>
              <p className="text-[#71717A] text-lg mb-8 leading-relaxed">
                Enter a prompt above to unleash the power of our 5-agent AI system.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {["Futuristic city with neon lights", "Oil painting of a cat king", "Cyberpunk street food stall"].map(p => (
                  <button 
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="px-4 py-2 bg-[#1F1F25] hover:bg-[#2A2A30] border border-[#2A2A30] rounded-full text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-all"
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
                  className="break-inside-avoid mb-6 relative group rounded-xl overflow-hidden cursor-pointer bg-[#111113] border border-[#1F1F23] hover:border-[#7C3AED]/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.02]"
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
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setSelectedImage(null)}
            >
              <div 
                className="w-full max-w-7xl h-[85vh] bg-[#0A0A0B] rounded-2xl overflow-hidden flex border border-[#1F1F23] shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Left: Image */}
                <div className="flex-1 bg-[#111113] flex items-center justify-center p-8 relative group">
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
                <div className="w-[400px] bg-[#1A1A1F] border-l border-[#2A2A30] flex flex-col">
                  <div className="p-6 border-b border-[#2A2A30] flex justify-between items-center">
                    <h3 className="font-bold text-[#FAFAFA]">Image Details</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)} className="text-[#71717A] hover:text-white">
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
                        <Button key={i} variant="ghost" className="flex flex-col h-16 gap-1 bg-[#2A2A30] hover:bg-[#3A3A40] text-[#FAFAFA] rounded-xl border border-[#3F3F46]">
                          <action.icon className="h-5 w-5" />
                          <span className="text-[10px]">{action.label}</span>
                        </Button>
                      ))}
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Prompt</label>
                      <div className="bg-[#111113] rounded-xl p-4 text-sm text-[#E4E4E7] leading-relaxed border border-[#2A2A30] relative group">
                        {selectedImage.prompt}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute top-2 right-2 h-6 w-6 text-[#71717A] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <div className="flex justify-between py-2 border-b border-[#2A2A30]">
                        <span className="text-xs text-[#71717A]">Style</span>
                        <span className="text-xs font-medium text-[#FAFAFA] capitalize">{selectedImage.style}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#2A2A30]">
                        <span className="text-xs text-[#71717A]">Dimensions</span>
                        <span className="text-xs font-medium text-[#FAFAFA]">1024 × 1024</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#2A2A30]">
                        <span className="text-xs text-[#71717A]">Model</span>
                        <span className="text-xs font-medium text-[#FAFAFA]">V5.2</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#2A2A30]">
                        <span className="text-xs text-[#71717A]">Seed</span>
                        <span className="text-xs font-medium text-[#FAFAFA] font-mono">82739103</span>
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
