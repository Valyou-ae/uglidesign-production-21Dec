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
  Moon,
  Filter,
  Upload,
  RefreshCcw,
  LayoutGrid,
  ImageIcon as ImageIconLucide,
  Mic,
  MicOff
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  isFavorite?: boolean;
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
  { id: "1:1", label: "Square", ratioText: "1:1", icon: Square, tooltip: "Square - Social media profiles" },
  { id: "16:9", label: "Landscape", ratioText: "16:9", icon: RectangleHorizontal, tooltip: "Landscape - Cinematic, wallpapers" },
  { id: "9:16", label: "Portrait", ratioText: "9:16", icon: RectangleVertical, tooltip: "Portrait - Mobile, stories" },
  { id: "4:3", label: "Classic", ratioText: "4:3", icon: Monitor, tooltip: "Classic - Traditional photo" },
  { id: "3:4", label: "Tall", ratioText: "3:4", icon: Smartphone, tooltip: "Tall - Portrait photos, posters" },
];

const REFINER_PRESETS = [
  { id: "cinematic", name: "Cinematic", icon: Clapperboard },
  { id: "sharp", name: "Sharp Detail", icon: Crosshair },
  { id: "soft", name: "Soft Glow", icon: Sun },
  { id: "vibrant", name: "Vibrant", icon: Palette },
  { id: "moody", name: "Moody", icon: Moon },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("A futuristic city with neon lights and flying cars in cyberpunk style");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generations, setGenerations] = useState<GeneratedImage[]>([]);
  const [filteredGenerations, setFilteredGenerations] = useState<GeneratedImage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [imageToDelete, setImageToDelete] = useState<GeneratedImage | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [settings, setSettings] = useState({
    style: "auto",
    quality: "standard",
    aspectRatio: "1:1",
    variations: "4",
    refiner: false,
    refinerPreset: "cinematic",
    aiCuration: true,
    autoOptimize: true
  });
  
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFavorite = (id: string) => {
    setGenerations(prev => prev.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g));
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      toast({ title: "Voice input stopped" });
      return;
    }

    setIsListening(true);
    toast({
      title: "Listening...",
      description: "Speak now to add to your prompt.",
      className: "bg-blue-50 border-blue-200 text-blue-800"
    });

    // Simulate voice recognition for consistent mockup experience
    setTimeout(() => {
      const simulatedPhrases = [
        "with cinematic lighting and dramatic shadows",
        "in high resolution 8k detail",
        "trending on artstation",
        "with a golden hour sunset background",
        "photorealistic style",
        "vibrant neon colors",
        "minimalist composition"
      ];
      const randomPhrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
      
      setPrompt(prev => {
        const newPrompt = prev.trim() ? `${prev.trim()} ${randomPhrase}` : randomPhrase;
        return newPrompt;
      });
      
      setIsListening(false);
      toast({
        title: "Voice Recognized",
        description: `Added: "${randomPhrase}"`,
      });
    }, 2000);
  };

  // Initialize prompt from URL if available
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      setPrompt(promptParam);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  // Filter generations
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredGenerations(generations);
    } else if (activeFilter === "favorites") {
      setFilteredGenerations(generations.filter(g => g.isFavorite));
    } else {
      setFilteredGenerations(generations.filter(g => g.style === activeFilter));
    }
  }, [generations, activeFilter]);

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
      isNew: true,
      isFavorite: false
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

  const handleDeleteConfirm = (id: string) => {
    setGenerations(prev => prev.filter(g => g.id !== id));
    setImageToDelete(null);
    toast({
      title: "Image Deleted",
      description: "The image has been permanently removed.",
      className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400",
    });
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
          timestamp: "2 hours ago",
          isFavorite: false
        },
        {
          id: "2",
          src: fantasyLandscape,
          prompt: "Epic fantasy landscape with mountains and a dragon flying",
          style: "fantasy",
          aspectRatio: "16:9",
          timestamp: "5 hours ago",
          isFavorite: true
        },
        {
          id: "3",
          src: scifiSpaceship,
          prompt: "Sci-fi spaceship landing on an alien planet with two moons",
          style: "scifi",
          aspectRatio: "16:9",
          timestamp: "1 day ago",
          isFavorite: false
        }
      ]);
    }
  }, []);

  // Helper function to get progress text
  const getProgressText = (prog: number) => {
    if (prog < 20) return "Initializing AI Agents...";
    if (prog < 40) return "Analyzing prompt structure...";
    if (prog < 60) return "Synthesizing visual elements...";
    if (prog < 80) return "Refining details and textures...";
    return "Final polishing...";
  };

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-background text-foreground">
        
        {/* TOP SECTION: PROMPT BAR (Minimalistic) */}
        <div className="fixed bottom-[70px] left-0 right-0 md:relative md:bottom-auto md:top-0 z-[60] bg-background/80 backdrop-blur-xl border-t md:border-t-0 md:border-b border-border px-4 md:px-6 py-3 md:py-4 transition-all order-last md:order-first pb-safe">
          <div className="max-w-[1800px] mx-auto w-full space-y-4">
            
            {/* Prompt Input & Controls */}
            <div className="flex items-end gap-3">
              
              {/* Main Input Wrapper */}
              <div className={cn(
                "flex-1 bg-muted/40 border border-border rounded-xl transition-all duration-200 flex items-end p-2 gap-2 group focus-within:bg-background shadow-sm min-h-[56px]",
                prompt.trim().length > 0 && "bg-background border-muted-foreground/40"
              )}>
                
                {/* Reference Image Trigger with Popover */}
                <div className="self-end mb-0.5 shrink-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-border/40"
                      >
                        <ImageIconLucide className="h-5 w-5" strokeWidth={1.5} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" className="flex flex-col items-center justify-center h-20 w-24 gap-2 text-xs hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50 rounded-xl transition-all">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Upload className="h-4 w-4" />
                          </div>
                          Reference
                        </Button>
                        <div className="w-px bg-border/50 my-2" />
                        <Button variant="ghost" className="flex flex-col items-center justify-center h-20 w-24 gap-2 text-xs hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50 rounded-xl transition-all">
                          <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <RefreshCcw className="h-4 w-4" />
                          </div>
                          Remix
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Textarea */}
                <div className="flex-1 relative py-2 self-end">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what you want to create..."
                    className={cn(
                      "w-full bg-transparent border-0 focus:ring-0 px-0 pt-[3px] text-sm sm:text-base placeholder:text-muted-foreground/50 placeholder:italic resize-none min-h-[24px] max-h-[120px] leading-relaxed outline-none ring-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                      prompt === "A futuristic city with neon lights and flying cars in cyberpunk style" ? "text-muted-foreground italic" : "text-foreground"
                    )}
                    rows={1}
                  />
                </div>

                {/* Right Side Actions inside Input - Bottom Aligned */}
                <div className="flex items-center gap-1 mb-0.5 shrink-0 self-end">
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={isListening ? "destructive" : "ghost"} 
                          size="icon" 
                          onClick={toggleVoiceInput}
                          className={cn(
                            "h-9 w-9 rounded-lg transition-all",
                            isListening && "animate-pulse"
                          )}
                        >
                          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{isListening ? "Stop Listening" : "Voice Input"}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Generate Button (Visible only when typing) */}
                  <AnimatePresence>
                    {prompt.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: "auto" }}
                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                        className="overflow-hidden mr-1"
                      >
                        <Button 
                          onClick={handleGenerate}
                          disabled={status === "generating"}
                          size="icon"
                          className="h-9 w-9 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:brightness-110 text-white shadow-sm transition-all"
                        >
                          {status === "generating" ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 fill-white" />
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={showSettings ? "secondary" : "ghost"} 
                          size="icon" 
                          onClick={() => setShowSettings(!showSettings)}
                          className={cn("h-9 w-9 rounded-lg transition-all", showSettings && "bg-muted text-foreground")}
                        >
                          <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Settings</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

            </div>

            {/* Settings Panel (Inline Expandable) */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/30 border border-border rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 shadow-inner mb-4">
                    
                    {/* Quality */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Quality</label>
                      <div className="flex gap-1.5">
                        {QUALITY_PRESETS.map(q => (
                          <TooltipProvider key={q.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, quality: q.id})}
                                  className={cn(
                                    "flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-all border",
                                    settings.quality === q.id 
                                      ? "bg-background border-primary/50 text-primary shadow-sm" 
                                      : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                                  )}
                                >
                                  <q.icon className={cn("h-3.5 w-3.5", settings.quality === q.id ? "text-primary" : "opacity-70")} />
                                  <span className="text-[10px] font-medium">{q.name}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom"><p>{q.tooltip}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Ratio</label>
                      <div className="flex gap-1.5">
                        {ASPECT_RATIOS.map(r => (
                          <TooltipProvider key={r.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, aspectRatio: r.id})}
                                  className={cn(
                                    "flex-1 h-9 rounded-lg flex items-center justify-center gap-1 transition-all border",
                                    settings.aspectRatio === r.id 
                                      ? "bg-background border-primary/50 text-primary shadow-sm" 
                                      : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                                  )}
                                >
                                  <r.icon className={cn("h-3.5 w-3.5", settings.aspectRatio === r.id ? "text-primary" : "opacity-70")} />
                                  <span className="text-[9px] text-muted-foreground/70 font-medium hidden sm:inline">{r.ratioText}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom"><p>{r.label}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Style */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Style</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between h-9 text-xs bg-background/50 border-transparent hover:bg-background px-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {STYLE_PRESETS.find(s => s.id === settings.style)?.icon && (
                                 <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                              <span className="font-medium truncate text-[10px]">
                                {STYLE_PRESETS.find(s => s.id === settings.style)?.name}
                              </span>
                            </div>
                            <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px] max-h-[300px] overflow-y-auto">
                          {STYLE_PRESETS.map(style => (
                            <DropdownMenuItem 
                              key={style.id}
                              onClick={() => setSettings({...settings, style: style.id})}
                              className="text-xs cursor-pointer py-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <style.icon className="h-3.5 w-3.5" />
                                {style.name}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Previews (Variations) */}
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Count</label>
                      <div className="flex bg-background/50 rounded-lg p-0.5 h-9 items-center border border-transparent hover:border-border/50 transition-colors">
                        {["1", "2", "4"].map(v => (
                          <button
                            key={v}
                            onClick={() => setSettings({...settings, variations: v})}
                            className={cn(
                              "flex-1 h-full rounded-md flex items-center justify-center text-[10px] font-medium transition-all",
                              settings.variations === v 
                                ? "bg-background shadow-sm text-primary font-bold" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Master Refiner */}
                    <div className="space-y-1.5 col-span-2 md:col-span-4 lg:col-span-1">
                      <div className="flex items-center justify-between h-[15px]">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Refiner</label>
                        <Switch 
                          checked={settings.refiner}
                          onCheckedChange={(c) => setSettings({...settings, refiner: c})}
                          className="scale-75 origin-right data-[state=checked]:bg-primary"
                        />
                      </div>
                      
                      <div className={cn(
                        "grid grid-cols-4 lg:grid-cols-2 gap-1.5 transition-all duration-300 h-9",
                        settings.refiner ? "opacity-100" : "opacity-40 pointer-events-none grayscale"
                      )}>
                        {REFINER_PRESETS.slice(0, 2).map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => setSettings({...settings, refinerPreset: preset.id})}
                            disabled={!settings.refiner}
                            className={cn(
                              "h-full rounded-md flex items-center justify-center gap-1 px-1 text-[9px] font-medium transition-all border",
                              settings.refinerPreset === preset.id 
                                ? "bg-primary/10 border-primary/30 text-primary" 
                                : "bg-background/30 border-transparent text-muted-foreground hover:bg-background/50"
                            )}
                          >
                            <preset.icon className="h-3 w-3 shrink-0" />
                            <span className="truncate hidden xl:inline">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Agents Status Bar (During Generation) */}
            {/* Removed as per user request */}

          </div>
        </div>

        {/* SCROLLABLE GALLERY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-40 md:pb-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Gallery Filter Bar */}
          {generations.length > 0 && (
             <div className="max-w-[1800px] mx-auto mb-6 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-6 px-6 md:mx-0 md:px-0">
               <div className="flex p-1 bg-muted/50 rounded-lg shrink-0 h-8 items-center">
                 <button
                   onClick={() => setActiveFilter("all")}
                   className={cn(
                     "px-3 rounded-md text-[11px] font-medium transition-all h-6 flex items-center",
                     activeFilter === "all" 
                       ? "bg-background text-foreground shadow-sm" 
                       : "text-muted-foreground hover:text-foreground"
                   )}
                 >
                   All ({generations.length})
                 </button>
                 <button
                   onClick={() => setActiveFilter("favorites")}
                   className={cn(
                     "px-3 rounded-md text-[11px] font-medium transition-all h-6 flex items-center gap-1",
                     activeFilter === "favorites" 
                       ? "bg-background text-foreground shadow-sm" 
                       : "text-muted-foreground hover:text-foreground"
                   )}
                 >
                   <Star className={cn("h-3 w-3", activeFilter === "favorites" && "fill-yellow-400 text-yellow-400")} />
                   Favs
                 </button>
               </div>

               <div className="w-px h-4 bg-border mx-1 shrink-0" />
               
               {Array.from(new Set(generations.map(g => g.style))).map(style => (
                 <button
                   key={style}
                   onClick={() => setActiveFilter(style)}
                   className={cn(
                     "rounded-full h-7 px-3 text-[11px] capitalize border transition-all whitespace-nowrap",
                     activeFilter === style 
                       ? "bg-primary/10 border-primary/20 text-primary" 
                       : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                   )}
                 >
                   {STYLE_PRESETS.find(s => s.id === style)?.name || style}
                 </button>
               ))}
             </div>
          )}

          {filteredGenerations.length === 0 && status !== "generating" ? (
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
              {/* Loading State Card */}
              {status === "generating" && (
                <div className="break-inside-avoid mb-6 relative group rounded-xl overflow-hidden bg-card border border-border shadow-xl animate-in fade-in zoom-in duration-300">
                  <div className="w-full aspect-square bg-gradient-to-br from-[#7C3AED] via-purple-600 to-[#9333EA] animate-pulse flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMzhoNDB2MmgtNDB6Ii8+PHBhdGggZD0iTTAgMGg0MHYyaC00MHoiLz48cGF0aCBkPSJNMCAwdjQwaDJWMHoiLz48cGF0aCBkPSJNMzggMHY0MGgyVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    <Sparkles className="h-12 w-12 text-white animate-spin-slow duration-[3s]" />
                    <p className="text-white/90 font-medium mt-4 text-sm animate-pulse">Generating masterpiece...</p>
                    
                    {/* Progress Bar & Percentage */}
                    <div className="w-3/4 mt-3 space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-medium text-white/80">{getProgressText(progress)}</span>
                        <span className="text-[10px] font-bold text-white">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div 
                          className="h-full bg-white/90 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "spring", stiffness: 50, damping: 20 }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3 bg-card">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    <div className="pt-2 flex items-center justify-between">
                       <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                       <div className="flex gap-1">
                         <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                         <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                       </div>
                    </div>
                  </div>
                </div>
              )}
              
              {filteredGenerations.map((gen) => (
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
                      <Button 
                        size="sm" 
                        className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(gen.src, `generated_${gen.id}.png`);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>
                      <div className="flex items-center gap-1 ml-auto">
                        <Button 
                          size="icon" 
                          className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(gen.id);
                          }}
                        >
                          <Star className={cn("h-3.5 w-3.5", gen.isFavorite && "fill-yellow-400 text-yellow-400")} />
                        </Button>
                        <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          className="h-8 w-8 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border-0 backdrop-blur-md rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageToDelete(gen);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
                className="w-full max-w-7xl h-[90vh] md:h-[85vh] bg-card rounded-2xl overflow-hidden flex flex-col md:flex-row border border-border shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Left: Image */}
                <div className="w-full h-[40vh] md:h-auto md:flex-1 bg-muted/20 flex items-center justify-center p-4 md:p-8 relative group bg-checkerboard">
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
                <div className="w-full md:w-[400px] bg-card border-t md:border-t-0 md:border-l border-border flex flex-col h-[50vh] md:h-auto">
                  <div className="p-4 md:p-6 border-b border-border flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-foreground">Image Details</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
                    {/* Actions */}
                    <div className="grid grid-cols-4 gap-2">
                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                        onClick={() => downloadImage(selectedImage.src, `generated_${selectedImage.id}.png`)}
                      >
                        <Download className="h-5 w-5" />
                        <span className="text-[10px]">Save</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                      >
                        <RefreshCw className="h-5 w-5" />
                        <span className="text-[10px]">Vary</span>
                      </Button>

                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                        onClick={() => {
                          setPrompt(selectedImage.prompt);
                          setSelectedImage(null);
                        }}
                      >
                        <Edit className="h-5 w-5" />
                        <span className="text-[10px]">Edit</span>
                      </Button>

                      <Button 
                        variant="ghost" 
                        className={cn(
                          "flex flex-col h-16 gap-1 rounded-xl border border-border",
                          selectedImage.isFavorite 
                            ? "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100" 
                            : "bg-muted/30 hover:bg-muted text-foreground"
                        )}
                        onClick={() => toggleFavorite(selectedImage.id)}
                      >
                        <Star className={cn("h-5 w-5", selectedImage.isFavorite && "fill-current")} />
                        <span className="text-[10px]">Like</span>
                      </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the generated image from your gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => imageToDelete && handleDeleteConfirm(imageToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
