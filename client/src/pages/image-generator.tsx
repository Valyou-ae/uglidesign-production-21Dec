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
  MicOff,
  Minus,
  Plus
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
import { generateApi, imagesApi, GenerationEvent } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

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
  { id: 1, name: "Text Sentinel", status: "idle", message: "Analyzing prompt...", icon: Bot, activeColor: "#B94E30" },
  { id: 2, name: "Style Architect", status: "idle", message: "Enhancing style...", icon: Sparkles, activeColor: "#E3B436" },
  { id: 3, name: "Visual Synthesizer", status: "idle", message: "Generating image...", icon: Palette, activeColor: "#664D3F" },
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
  { id: "draft", name: "Draft", icon: Zap, tooltip: "Fast generation using Gemini 2.5 Flash" },
  { id: "premium", name: "Premium", icon: Sparkles, tooltip: "Higher quality using upgraded model" },
];

const DETAIL_LEVELS = [
  { id: "low", name: "Low", icon: Minus, tooltip: "Minimal detail, faster" },
  { id: "medium", name: "Medium", icon: Circle, tooltip: "Balanced detail level" },
  { id: "high", name: "High", icon: Plus, tooltip: "Maximum detail and texture" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "Square", ratioText: "1:1", icon: Square, tooltip: "Square - Social media profiles" },
  { id: "16:9", label: "Landscape", ratioText: "16:9", icon: RectangleHorizontal, tooltip: "Landscape - Cinematic, wallpapers" },
  { id: "9:16", label: "Portrait", ratioText: "9:16", icon: RectangleVertical, tooltip: "Portrait - Mobile, stories" },
  { id: "4:3", label: "Classic", ratioText: "4:3", icon: Monitor, tooltip: "Classic - Traditional photo" },
  { id: "3:4", label: "Tall", ratioText: "3:4", icon: Smartphone, tooltip: "Tall - Portrait photos, posters" },
];


export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
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
    quality: "draft",
    detail: "medium",
    aspectRatio: "1:1",
    variations: "1",
    aiCuration: true,
    autoOptimize: true,
    speed: "quality" as "fast" | "quality"
  });
  const [qualityAutoUpgraded, setQualityAutoUpgraded] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVarying, setIsVarying] = useState(false);

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isUnsavedImage = (id: string): boolean => {
    return id.includes('-') && !id.startsWith('sample-');
  };

  const saveToLibrary = async (image: GeneratedImage) => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to save images.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await imagesApi.create({
        imageUrl: image.src,
        prompt: image.prompt,
        style: image.style || "auto",
        aspectRatio: image.aspectRatio || "1:1",
      });
      const savedImage = response.image;
      setGenerations(prev => prev.map(g => 
        g.id === image.id 
          ? { ...g, id: String(savedImage.id), isFavorite: savedImage.isFavorite || false } 
          : g
      ));
      if (selectedImage && selectedImage.id === image.id) {
        setSelectedImage(prev => prev ? { ...prev, id: String(savedImage.id), isFavorite: savedImage.isFavorite || false } : null);
      }
      toast({ title: "Saved to Library", description: "Image has been saved to your creations." });
    } catch (error) {
      toast({ title: "Save Failed", description: error instanceof Error ? error.message : "Could not save image.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to save favorites.", variant: "destructive" });
      return;
    }
    
    if (id.startsWith("sample-") || isUnsavedImage(id)) {
      setGenerations(prev => prev.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g));
      if (selectedImage && selectedImage.id === id) {
        setSelectedImage(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
      if (isUnsavedImage(id)) {
        toast({ title: "Save First", description: "Save the image to persist your favorite.", className: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400" });
      }
      return;
    }
    
    const prevFavorite = generations.find(g => g.id === id)?.isFavorite;
    setGenerations(prev => prev.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g));
    if (selectedImage && selectedImage.id === id) {
      setSelectedImage(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
    try {
      await imagesApi.toggleFavorite(id);
    } catch (error) {
      setGenerations(prev => prev.map(g => g.id === id ? { ...g, isFavorite: prevFavorite } : g));
      if (selectedImage && selectedImage.id === id) {
        setSelectedImage(prev => prev ? { ...prev, isFavorite: prevFavorite } : null);
      }
      toast({ title: "Failed", description: "Could not update favorite status.", variant: "destructive" });
    }
  };

  const handleVary = async (image: GeneratedImage) => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to create variations.", variant: "destructive" });
      return;
    }
    if (isVarying || status === "generating") return;
    setIsVarying(true);
    setSelectedImage(null);
    setPrompt(image.prompt);
    
    const imageStyle = image.style || "auto";
    const imageAspectRatio = image.aspectRatio || "1:1";
    
    toast({ title: "Generating Variation", description: "Creating a new variation of your image..." });
    
    setStatus("generating");
    setProgress(0);
    setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));

    let imageCount = 0;

    const handleEvent = (event: GenerationEvent) => {
      const { type, data } = event;

      if (type === "status" && data.agent && data.status) {
        setAgents(prev => {
          const updated = prev.map(a => {
            if (a.name === data.agent) {
              return { ...a, status: data.status as Agent["status"], message: data.message || a.message };
            }
            return a;
          });
          const completedCount = updated.filter(a => a.status === "complete").length;
          const workingCount = updated.filter(a => a.status === "working").length;
          const baseProgress = Math.round((completedCount / 3) * 100);
          const workingBonus = workingCount > 0 ? 5 : 0;
          const agentProgress = Math.min(100, baseProgress + workingBonus);
          setProgress(prev => Math.max(prev, agentProgress));
          return updated;
        });
      }

      if (type === "image" && data.imageData && data.mimeType) {
        imageCount++;
        const newImage: GeneratedImage = {
          id: `${Date.now()}-${imageCount}`,
          src: `data:${data.mimeType};base64,${data.imageData}`,
          prompt: image.prompt,
          style: imageStyle,
          aspectRatio: imageAspectRatio,
          timestamp: "Just now",
          isNew: true,
          isFavorite: false
        };
        setGenerations(prev => [newImage, ...prev]);
      }

      if (type === "final_image" && data.imageData && data.mimeType) {
        imageCount++;
        const newImage: GeneratedImage = {
          id: `${Date.now()}-${imageCount}`,
          src: `data:${data.mimeType};base64,${data.imageData}`,
          prompt: image.prompt,
          style: imageStyle,
          aspectRatio: imageAspectRatio,
          timestamp: "Just now",
          isNew: true,
          isFavorite: false
        };
        setGenerations(prev => [newImage, ...prev]);
      }

      if (type === "complete") {
        setProgress(100);
        setAgents(prev => prev.map(a => ({ ...a, status: "complete" })));
        setStatus("complete");
        toast({ title: "Variation Complete", description: "New variation has been created." });
        setTimeout(() => {
          setStatus("idle");
          setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
          setProgress(0);
          setIsVarying(false);
        }, 3000);
      }

      if (type === "error") {
        setStatus("idle");
        setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
        setProgress(0);
        setIsVarying(false);
        toast({ title: "Variation Failed", description: data.message || "Could not create variation.", variant: "destructive" });
      }
    };

    try {
      await generateApi.draft(image.prompt, { stylePreset: imageStyle, aspectRatio: imageAspectRatio }, handleEvent);
    } catch (error) {
      setStatus("idle");
      setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
      setProgress(0);
      setIsVarying(false);
      toast({ title: "Variation Failed", description: error instanceof Error ? error.message : "Could not create variation.", variant: "destructive" });
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (id.startsWith("sample-")) {
      setGenerations(prev => prev.filter(g => g.id !== id));
      setImageToDelete(null);
      toast({ title: "Image Removed", description: "Sample image has been removed from view." });
      return;
    }
    
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to delete images.", variant: "destructive" });
      setImageToDelete(null);
      return;
    }
    
    try {
      await imagesApi.delete(id);
      setGenerations(prev => prev.filter(g => g.id !== id));
      setImageToDelete(null);
      toast({ title: "Image Deleted", description: "The image has been removed." });
    } catch (error) {
      setImageToDelete(null);
      toast({ title: "Delete Failed", description: error instanceof Error ? error.message : "Could not delete image.", variant: "destructive" });
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      toast({ title: "Voice input stopped" });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition. Try Chrome or Edge.",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);
    toast({
      title: "Listening...",
      description: "Speak now to add to your prompt.",
      className: "bg-[#B94E30]/10 border-[#B94E30]/30 text-[#B94E30]"
    });

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      setPrompt(prev => {
        const newPrompt = prev.trim() ? `${prev.trim()} ${transcript}` : transcript;
        return newPrompt;
      });
      
      setIsListening(false);
      toast({
        title: "Voice Recognized",
        description: `Added: "${transcript}"`,
      });
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'no-speech') {
        toast({
          title: "No speech detected",
          description: "Please try again and speak clearly.",
        });
      } else if (event.error === 'not-allowed') {
        toast({
          variant: "destructive",
          title: "Microphone access denied",
          description: "Please enable microphone access in your browser settings.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Voice input error",
          description: `Error: ${event.error}`,
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      toast({
        variant: "destructive",
        title: "Failed to start voice input",
        description: "Please try again.",
      });
    }
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

  // Generation timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === "generating" && generationStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - generationStartTime) / 1000));
      }, 100);
    } else if (status !== "generating") {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, generationStartTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const isTextHeavyPrompt = (text: string): boolean => {
    const wordCount = text.trim().split(/\s+/).length;
    const charCount = text.length;
    const hasTextRenderingKeywords = /\b(text|write|letter|word|font|typography|quote|sign|banner|label|caption|title|heading)\b/i.test(text);
    const hasQuotedText = /"[^"]+"|'[^']+'/.test(text);
    return wordCount > 30 || charCount > 180 || hasTextRenderingKeywords || hasQuotedText;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    let effectiveQuality = settings.quality;
    
    if (settings.quality === "draft" && isTextHeavyPrompt(prompt) && !qualityAutoUpgraded) {
      effectiveQuality = "premium";
      setSettings(prev => ({ ...prev, quality: "premium" }));
      setQualityAutoUpgraded(true);
      toast({
        title: "Quality Upgraded to Premium",
        description: "Your prompt contains detailed text or is complex. Using Premium mode for better results.",
        className: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400",
      });
    }
    
    setStatus("generating");
    setProgress(0);
    setGenerationStartTime(Date.now());
    setElapsedSeconds(0);
    setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));

    const generatedImages: GeneratedImage[] = [];
    let imageCount = 0;
    let totalExpected = 1;

    const handleEvent = (event: GenerationEvent) => {
      const { type, data } = event;
      console.log("SSE Event:", type, data);

      if (type === "status" && data.agent && data.status) {
        setAgents(prev => {
          const updated = prev.map(a => {
            if (a.name === data.agent) {
              return { ...a, status: data.status as Agent["status"], message: data.message || a.message };
            }
            return a;
          });
          
          const completedCount = updated.filter(a => a.status === "complete").length;
          const workingCount = updated.filter(a => a.status === "working").length;
          const baseProgress = Math.round((completedCount / 3) * 100);
          const workingBonus = workingCount > 0 ? 5 : 0;
          const agentProgress = Math.min(100, baseProgress + workingBonus);
          setProgress(prev => Math.max(prev, agentProgress));
          
          return updated;
        });
      }

      if (type === "progress" && data.completed !== undefined && data.total !== undefined) {
        const progressPercent = Math.round((data.completed / data.total) * 100);
        setProgress(prev => Math.max(prev, progressPercent));
        totalExpected = data.total;
      }

      if (type === "image" && data.imageData && data.mimeType) {
        imageCount++;
        const newImage: GeneratedImage = {
          id: `${Date.now()}-${imageCount}`,
          src: `data:${data.mimeType};base64,${data.imageData}`,
          prompt: prompt,
          style: settings.style,
          aspectRatio: settings.aspectRatio,
          timestamp: "Just now",
          isNew: true,
          isFavorite: false
        };
        generatedImages.push(newImage);
        setGenerations(prev => [newImage, ...prev]);
      }

      if (type === "final_image" && data.imageData && data.mimeType) {
        imageCount++;
        const newImage: GeneratedImage = {
          id: `${Date.now()}-${imageCount}`,
          src: `data:${data.mimeType};base64,${data.imageData}`,
          prompt: prompt,
          style: settings.style,
          aspectRatio: settings.aspectRatio,
          timestamp: "Just now",
          isNew: true,
          isFavorite: false
        };
        generatedImages.push(newImage);
        setGenerations(prev => [newImage, ...prev]);
      }

      if (type === "complete") {
        setProgress(100);
        setAgents(prev => prev.map(a => ({ ...a, status: "complete" })));
        setStatus("complete");
        
        toast({
          title: "Image Generated!",
          description: `Created ${imageCount} image${imageCount > 1 ? "s" : ""}.`,
          className: "bg-[#B94E30]/10 border-[#B94E30]/30 text-[#B94E30] dark:bg-[#B94E30]/20 dark:border-[#B94E30]/50 dark:text-[#E3B436]",
        });

        setTimeout(() => {
          setStatus("idle");
          setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
          setProgress(0);
        }, 3000);
      }

      if (type === "error") {
        setStatus("idle");
        setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
        setProgress(0);
        toast({
          title: "Generation Failed",
          description: data.message || "An error occurred during generation.",
          variant: "destructive",
        });
      }
    };

    try {
      if (effectiveQuality === "draft") {
        await generateApi.draft(
          prompt,
          { 
            stylePreset: settings.style, 
            aspectRatio: settings.aspectRatio,
            detail: settings.detail,
            speed: settings.speed
          },
          handleEvent
        );
      } else {
        await generateApi.final(
          prompt,
          { 
            stylePreset: settings.style, 
            qualityLevel: effectiveQuality,
            aspectRatio: settings.aspectRatio,
            enableCuration: settings.aiCuration,
            detail: settings.detail,
            speed: settings.speed
          },
          handleEvent
        );
      }
    } catch (error) {
      setStatus("idle");
      setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
      setProgress(0);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred during generation.",
        variant: "destructive",
      });
    }
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
      className: "bg-[#B94E30]/10 border-[#B94E30]/30 text-[#B94E30] dark:bg-[#B94E30]/20 dark:border-[#B94E30]/50 dark:text-[#E3B436]",
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

  // Load user's saved images from API or use sample images
  useEffect(() => {
    const loadImages = async () => {
      if (user) {
        try {
          const { images } = await imagesApi.getAll();
          if (images && images.length > 0) {
            const loadedImages: GeneratedImage[] = images.map((img: any) => ({
              id: img.id,
              src: img.imageUrl,
              prompt: img.prompt,
              style: img.style || "auto",
              aspectRatio: img.aspectRatio || "1:1",
              timestamp: new Date(img.createdAt).toLocaleDateString(),
              isFavorite: img.isFavorite || false
            }));
            setGenerations(loadedImages);
            return;
          }
        } catch (error) {
          console.error("Failed to load images:", error);
        }
      }
      
      if (generations.length === 0) {
        setGenerations([
          {
            id: "sample-1",
            src: oilPainting,
            prompt: "Oil painting portrait of a young woman with flowers in her hair",
            style: "oil",
            aspectRatio: "1:1",
            timestamp: "Sample",
            isFavorite: false
          },
          {
            id: "sample-2",
            src: fantasyLandscape,
            prompt: "Epic fantasy landscape with mountains and a dragon flying",
            style: "fantasy",
            aspectRatio: "16:9",
            timestamp: "Sample",
            isFavorite: false
          },
          {
            id: "sample-3",
            src: scifiSpaceship,
            prompt: "Sci-fi spaceship landing on an alien planet with two moons",
            style: "scifi",
            aspectRatio: "16:9",
            timestamp: "Sample",
            isFavorite: false
          }
        ]);
      }
    };
    
    loadImages();
  }, [user]);

  // Helper function to get progress text based on active agent
  const getProgressText = () => {
    const workingAgent = agents.find(a => a.status === "working");
    if (workingAgent) {
      return workingAgent.message;
    }
    const completedCount = agents.filter(a => a.status === "complete").length;
    if (completedCount === agents.length) {
      return "Generation complete!";
    }
    if (completedCount > 0) {
      return "Processing...";
    }
    return "Initializing AI Agents...";
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
                          <div className="h-8 w-8 rounded-full bg-[#E3B436]/10 flex items-center justify-center text-[#E3B436]">
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
                    placeholder="A futuristic city with neon lights and flying cars in cyberpunk style..."
                    className="w-full bg-transparent border-0 focus:ring-0 px-0 pt-[3px] text-sm sm:text-base text-foreground placeholder:text-muted-foreground/50 placeholder:italic resize-none min-h-[24px] max-h-[120px] leading-relaxed outline-none ring-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                          className="h-9 w-9 rounded-lg bg-gradient-to-r from-[#B94E30] to-[#8B3A24] hover:brightness-110 text-white shadow-sm transition-all"
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
                  <div className="bg-muted/30 border border-border rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shadow-inner mb-4">
                    
                    {/* Quality */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Quality</label>
                      <div className="grid grid-cols-2 gap-1">
                        {QUALITY_PRESETS.map(q => (
                          <TooltipProvider key={q.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    setSettings({...settings, quality: q.id});
                                    setQualityAutoUpgraded(false);
                                  }}
                                  className={cn(
                                    "h-9 rounded-lg flex items-center justify-center gap-1.5 transition-all border",
                                    settings.quality === q.id 
                                      ? "bg-background border-primary/50 text-primary shadow-sm" 
                                      : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                                  )}
                                >
                                  <q.icon className={cn("h-3.5 w-3.5 shrink-0", settings.quality === q.id ? "text-primary" : "opacity-70")} />
                                  <span className="text-[10px] font-medium">{q.name}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom"><p>{q.tooltip}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Speed</label>
                      <div className="grid grid-cols-2 gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                data-testid="button-speed-fast"
                                onClick={() => setSettings({...settings, speed: "fast"})}
                                className={cn(
                                  "h-9 rounded-lg flex items-center justify-center gap-1.5 transition-all border",
                                  settings.speed === "fast" 
                                    ? "bg-background border-primary/50 text-primary shadow-sm" 
                                    : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                                )}
                              >
                                <Zap className={cn("h-3.5 w-3.5 shrink-0", settings.speed === "fast" ? "text-primary" : "opacity-70")} />
                                <span className="text-[10px] font-medium">Fast</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Fast (~5s) - Gemini Flash</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                data-testid="button-speed-quality"
                                onClick={() => setSettings({...settings, speed: "quality"})}
                                className={cn(
                                  "h-9 rounded-lg flex items-center justify-center gap-1.5 transition-all border",
                                  settings.speed === "quality" 
                                    ? "bg-background border-primary/50 text-primary shadow-sm" 
                                    : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                                )}
                              >
                                <Sparkles className={cn("h-3.5 w-3.5 shrink-0", settings.speed === "quality" ? "text-primary" : "opacity-70")} />
                                <span className="text-[10px] font-medium">Quality</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Quality (~15s) - Gemini Pro</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Ratio</label>
                      <div className="grid grid-cols-5 gap-1">
                        {ASPECT_RATIOS.map(r => (
                          <TooltipProvider key={r.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, aspectRatio: r.id})}
                                  className={cn(
                                    "h-9 rounded-lg flex items-center justify-center transition-all border",
                                    settings.aspectRatio === r.id 
                                      ? "bg-background border-primary/50 text-primary shadow-sm" 
                                      : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                                  )}
                                >
                                  <r.icon className={cn("h-3.5 w-3.5 shrink-0", settings.aspectRatio === r.id ? "text-primary" : "opacity-70")} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom"><p>{r.label} ({r.ratioText})</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">Details</label>
                      <div className="grid grid-cols-3 gap-1">
                        {DETAIL_LEVELS.map(d => (
                          <TooltipProvider key={d.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, detail: d.id})}
                                  className={cn(
                                    "h-9 rounded-lg flex items-center justify-center gap-1 transition-all border",
                                    settings.detail === d.id 
                                      ? "bg-background border-primary/50 text-primary shadow-sm" 
                                      : "bg-background/50 border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                                  )}
                                >
                                  <d.icon className={cn("h-3.5 w-3.5 shrink-0", settings.detail === d.id ? "text-primary" : "opacity-70")} />
                                  <span className="text-[10px] font-medium hidden sm:inline">{d.name}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom"><p>{d.tooltip}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    {/* Style */}
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
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
              <div className="w-40 h-40 bg-gradient-to-tr from-[#B94E30] to-[#E3B436] rounded-full blur-[80px] opacity-20 mb-8" />
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
                  <div className="w-full aspect-square bg-gradient-to-br from-[#B94E30] via-[#8B3A24] to-[#664D3F] animate-pulse flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMzhoNDB2MmgtNDB6Ii8+PHBhdGggZD0iTTAgMGg0MHYyaC00MHoiLz48cGF0aCBkPSJNMCAwdjQwaDJWMHoiLz48cGF0aCBkPSJNMzggMHY0MGgyVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    {/* Timer Display */}
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full border-2 border-white/20 flex items-center justify-center backdrop-blur-sm bg-white/5">
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-white/60"
                          style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-2xl font-mono font-bold text-white tabular-nums">
                          {formatTime(elapsedSeconds)}
                        </span>
                      </div>
                    </div>
                    <p className="text-white/90 font-medium mt-4 text-sm">{getProgressText()}</p>
                    
                    {/* Animated Loader */}
                    <div className="w-3/4 mt-3">
                      <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div 
                          className="h-full bg-white/80 rounded-full w-1/4"
                          animate={{ x: ["-100%", "400%"] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
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
                        onClick={() => saveToLibrary(selectedImage)}
                        disabled={isSaving}
                        data-testid="button-save-library"
                      >
                        <Download className={cn("h-5 w-5", isSaving && "animate-pulse")} />
                        <span className="text-[10px]">{isSaving ? "Saving..." : "Save"}</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                        onClick={() => handleVary(selectedImage)}
                        disabled={isVarying || status === "generating"}
                        data-testid="button-vary"
                      >
                        <RefreshCw className={cn("h-5 w-5", isVarying && "animate-spin")} />
                        <span className="text-[10px]">Vary</span>
                      </Button>

                      <Button 
                        variant="ghost" 
                        className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                        onClick={() => {
                          setPrompt(selectedImage.prompt);
                          setSelectedImage(null);
                          toast({ title: "Prompt Loaded", description: "Edit the prompt and generate a new image." });
                        }}
                        data-testid="button-edit"
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
                        data-testid="button-like"
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
              onClick={() => imageToDelete && handleDeleteImage(imageToDelete.id)}
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
