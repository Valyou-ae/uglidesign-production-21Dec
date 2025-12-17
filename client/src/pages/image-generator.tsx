import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Plus,
  ClipboardCopy,
  Bookmark,
  BookmarkCheck,
  Heart,
  Coins,
  Trophy,
  Crown,
  Medal,
  Award,
  Eye
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { generateApi, imagesApi, GenerationEvent, promptFavoritesApi, PromptFavorite } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { TutorialOverlay, useTutorial } from "@/components/tutorial-overlay";
import { useCredits } from "@/hooks/use-credits";

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
  alreadySaved?: boolean;  // For images already saved by backend (premium mode)
};

interface LeaderboardEntry {
  userId: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  imageCount: number;
  likeCount: number;
  viewCount: number;
  rank: number;
}

async function fetchLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  const response = await fetch(`/api/leaderboard?period=all-time&limit=5`);
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json();
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-mono text-xs">#{rank}</span>;
  }
}

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

const PROMPT_SUGGESTIONS = [
  { category: "Trending", prompts: ["Ethereal forest with bioluminescent mushrooms", "Vintage robot in a coffee shop", "Underwater city at sunset"] },
  { category: "Portrait", prompts: ["Elegant woman in art deco style", "Warrior with glowing armor", "Cyberpunk street vendor"] },
  { category: "Landscape", prompts: ["Floating islands above clouds", "Ancient temple in jungle mist", "Neon-lit rainy Tokyo street"] },
  { category: "Abstract", prompts: ["Fractal geometry in gold and purple", "Liquid metal morphing shapes", "Cosmic energy explosion"] },
];


export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generations, setGenerations] = useState<GeneratedImage[]>([]);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [progress, setProgress] = useState(0);
  const [imageProgress, setImageProgress] = useState<{ current: number; total: number }>({ current: 0, total: 1 });
  const [pendingImages, setPendingImages] = useState<Array<{ id: string; status: 'loading' | 'complete' | 'error'; image?: GeneratedImage }>>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [imageToDelete, setImageToDelete] = useState<GeneratedImage | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [settings, setSettings] = useState({
    style: "auto",
    quality: "draft",
    detail: "medium",
    aspectRatio: "1:1",
    variations: "4",
    aiCuration: true,
    autoOptimize: true,
    speed: "quality" as "fast" | "quality"
  });
  // qualityAutoUpgraded removed - user now controls quality directly
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVarying, setIsVarying] = useState(false);
  
  const [savedPrompts, setSavedPrompts] = useState<PromptFavorite[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [favoriteName, setFavoriteName] = useState("");
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [referenceImage, setReferenceImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [imageMode, setImageMode] = useState<"reference" | "remix">("reference");
  const [isPublicImage, setIsPublicImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isOpen: isTutorialOpen, 
    hasCompleted: tutorialCompleted,
    startTutorial, 
    closeTutorial, 
    completeTutorial, 
    checkFirstVisit 
  } = useTutorial();

  const { credits, invalidate: invalidateCredits } = useCredits();

  const { data: leaderboardData, isLoading: isLoadingLeaderboard, error: leaderboardError } = useQuery({
    queryKey: ['leaderboard', 'all-time'],
    queryFn: fetchLeaderboard,
    staleTime: 1000 * 60 * 5,
  });
  const topCreators = leaderboardData?.leaderboard || [];

  useEffect(() => {
    if (tutorialCompleted) return;
    
    const timer = setTimeout(() => {
      if (checkFirstVisit()) {
        setIsPromptExpanded(true);
        startTutorial();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [checkFirstVisit, startTutorial, tutorialCompleted]);

  const handleTutorialComplete = () => {
    completeTutorial();
    toast({ 
      title: "Tutorial Complete!", 
      description: "You're ready to create amazing AI-generated images.",
      className: "bg-gradient-to-r from-[#B94E30]/10 to-[#E3B436]/10 border-[#B94E30]/30 text-foreground"
    });
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setSavedPrompts([]);
        return;
      }
      setIsLoadingFavorites(true);
      try {
        const response = await promptFavoritesApi.getAll();
        setSavedPrompts(response.favorites || []);
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      } finally {
        setIsLoadingFavorites(false);
      }
    };
    fetchFavorites();
  }, [user]);

  const handleSavePromptFavorite = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to save prompts.", variant: "destructive" });
      return;
    }
    if (!prompt.trim()) {
      toast({ title: "Empty prompt", description: "Please enter a prompt before saving.", variant: "destructive" });
      return;
    }
    if (!favoriteName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your saved prompt.", variant: "destructive" });
      return;
    }
    
    setIsSavingFavorite(true);
    try {
      const response = await promptFavoritesApi.create({
        name: favoriteName.trim(),
        prompt: prompt.trim(),
        style: settings.style,
        aspectRatio: settings.aspectRatio,
        quality: settings.quality,
        detail: settings.detail,
        speed: settings.speed
      });
      setSavedPrompts(prev => [response.favorite, ...prev]);
      setShowSaveModal(false);
      setFavoriteName("");
      toast({ 
        title: "Prompt Saved!", 
        description: `"${favoriteName}" has been saved to your favorites.`,
        className: "bg-[#B94E30]/10 border-[#B94E30]/30 text-[#B94E30] dark:bg-[#B94E30]/20 dark:border-[#B94E30]/50 dark:text-[#E3B436]"
      });
    } catch (error) {
      toast({ title: "Save Failed", description: error instanceof Error ? error.message : "Could not save prompt.", variant: "destructive" });
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const loadPromptFavorite = (favorite: PromptFavorite) => {
    setPrompt(favorite.prompt);
    setSettings(prev => ({
      ...prev,
      style: favorite.style || prev.style,
      aspectRatio: favorite.aspectRatio || prev.aspectRatio,
      quality: favorite.quality || prev.quality,
      detail: favorite.detail || prev.detail,
      speed: (favorite.speed as "fast" | "quality") || prev.speed
    }));
    toast({ 
      title: "Prompt Loaded", 
      description: `Loaded "${favorite.name}" with all settings.`,
      className: "bg-[#B94E30]/10 border-[#B94E30]/30 text-[#B94E30] dark:bg-[#B94E30]/20 dark:border-[#B94E30]/50 dark:text-[#E3B436]"
    });
  };

  const deletePromptFavorite = async (id: string) => {
    try {
      await promptFavoritesApi.delete(id);
      setSavedPrompts(prev => prev.filter(p => p.id !== id));
      toast({ 
        title: "Prompt Deleted", 
        description: "Saved prompt has been removed.",
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400"
      });
    } catch (error) {
      toast({ title: "Delete Failed", description: error instanceof Error ? error.message : "Could not delete prompt.", variant: "destructive" });
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyImageToClipboard = async (imageUrl: string): Promise<void> => {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        toast({
          variant: "destructive",
          title: "Not Supported",
          description: "Clipboard API is not supported in your browser. Try using Chrome or Edge.",
        });
        return;
      }

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const pngBlob = blob.type === 'image/png' ? blob : await new Promise<Blob>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((b) => resolve(b || blob), 'image/png');
        };
        img.onerror = () => resolve(blob);
        img.src = imageUrl;
      });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [pngBlob.type]: pngBlob
        })
      ]);
      
      toast({
        title: "Image copied to clipboard!",
        description: "You can now paste it anywhere.",
      });
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy image to clipboard. Try downloading instead.",
      });
    }
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
        isPublic: isPublicImage,
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Use user-selected quality (no auto-upgrade to premium)
    const effectiveQuality = settings.quality;
    
    setStatus("generating");
    setProgress(0);
    const totalCount = parseInt(settings.variations) || 1;
    setImageProgress({ current: 0, total: totalCount });
    setGenerationStartTime(Date.now());
    setElapsedSeconds(0);
    setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
    
    // Initialize pending image slots
    const initialPending = Array.from({ length: totalCount }, (_, i) => ({
      id: `pending-${Date.now()}-${i}`,
      status: 'loading' as const
    }));
    setPendingImages(initialPending);

    const generatedImages: GeneratedImage[] = [];
    let imageCount = 0;
    let totalExpected = totalCount;

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
        setImageProgress({ current: data.completed, total: data.total });
        totalExpected = data.total;
      }

      if (type === "image" && typeof data.index === 'number') {
        const imageIndex = data.index;
        imageCount++;
        
        // If we have savedImageId, fetch the image from the API (already saved by backend)
        if (data.savedImageId) {
          const newImage: GeneratedImage = {
            id: data.savedImageId,
            src: `/api/images/${data.savedImageId}/image`,
            prompt: prompt,
            style: settings.style,
            aspectRatio: settings.aspectRatio,
            timestamp: "Just now",
            isNew: true,
            isFavorite: false,
            alreadySaved: true
          };
          generatedImages.push(newImage);
          setGenerations(prev => [newImage, ...prev]);
          
          // Update pending image slot
          setPendingImages(prev => prev.map((p, i) => 
            i === imageIndex && p.status === 'loading' ? { ...p, status: 'complete' as const, image: newImage } : p
          ));
        } else if (data.imageData && data.mimeType) {
          // Fallback: use inline image data if provided
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
        
          // Update pending image slot only if still loading (prevent overwriting)
          setPendingImages(prev => prev.map((p, i) => 
            i === imageIndex && p.status === 'loading' ? { ...p, status: 'complete' as const, image: newImage } : p
          ));
        }
      }

      if (type === "final_image" && typeof data.index === 'number') {
        const imageIndex = data.index;
        imageCount++;
        
        // If we have savedImageId, fetch the image from the API (already saved by backend)
        if (data.savedImageId) {
          const newImage: GeneratedImage = {
            id: data.savedImageId,
            src: `/api/images/${data.savedImageId}/image`,
            prompt: prompt,
            style: settings.style,
            aspectRatio: settings.aspectRatio,
            timestamp: "Just now",
            isNew: true,
            isFavorite: false,
            alreadySaved: true  // Mark as already saved by backend
          };
          generatedImages.push(newImage);
          setGenerations(prev => [newImage, ...prev]);
          
          // Update pending image slot
          setPendingImages(prev => prev.map((p, i) => 
            i === imageIndex && p.status === 'loading' ? { ...p, status: 'complete' as const, image: newImage } : p
          ));
        } else if (data.imageData && data.mimeType) {
          // Fallback: use inline image data if provided
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
          
          // Update pending image slot
          setPendingImages(prev => prev.map((p, i) => 
            i === imageIndex && p.status === 'loading' ? { ...p, status: 'complete' as const, image: newImage } : p
          ));
        }
      }
      
      if (type === "image_error" && typeof data.index === 'number') {
        // Mark the corresponding slot as failed only if still loading
        setPendingImages(prev => prev.map((p, i) => 
          i === data.index && p.status === 'loading' ? { ...p, status: 'error' as const } : p
        ));
      }

      if (type === "complete") {
        setProgress(100);
        setAgents(prev => prev.map(a => ({ ...a, status: "complete" })));
        setStatus("complete");

        const saveAndRedirect = async () => {
          // Filter out images that were already saved by backend (premium mode)
          const unsavedImages = generatedImages.filter(img => !img.alreadySaved);
          const preSavedCount = generatedImages.filter(img => img.alreadySaved).length;
          
          if (generatedImages.length > 0 && user) {
            if (unsavedImages.length > 0) {
              toast({
                title: "Image Generated!",
                description: `Created ${imageCount} image${imageCount > 1 ? "s" : ""}. Saving to your creations...`,
                className: "bg-[#B94E30]/10 border-[#B94E30]/30 text-[#B94E30] dark:bg-[#B94E30]/20 dark:border-[#B94E30]/50 dark:text-[#E3B436]",
              });
              
              let savedCount = 0;
              const savePromises = unsavedImages.map(async (img) => {
                try {
                  await imagesApi.create({
                    imageUrl: img.src,
                    prompt: img.prompt,
                    style: img.style || "auto",
                    aspectRatio: img.aspectRatio || "1:1",
                    isPublic: isPublicImage,
                  });
                  savedCount++;
                } catch (error) {
                  console.error("Failed to save image:", error);
                }
              });
              
              await Promise.all(savePromises);
              
              const totalSaved = savedCount + preSavedCount;
              if (totalSaved > 0) {
                toast({
                  title: "Saved!",
                  description: `${totalSaved} image${totalSaved > 1 ? "s" : ""} saved to your creations.`,
                  className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400",
                });
                setTimeout(() => {
                  setStatus("idle");
                  setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
                  setProgress(0);
                  setPendingImages([]);
                }, 2000);
              } else {
                toast({
                  title: "Save Failed",
                  description: "Could not save images. They are still visible below.",
                  variant: "destructive",
                });
                setTimeout(() => {
                  setStatus("idle");
                  setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
                  setProgress(0);
                  setPendingImages([]);
                }, 3000);
              }
            } else {
              // All images were pre-saved by backend
              toast({
                title: "Image Generated!",
                description: `Created ${imageCount} image${imageCount > 1 ? "s" : ""}. Already saved to your creations!`,
                className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400",
              });
              setTimeout(() => {
                setStatus("idle");
                setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
                setProgress(0);
                setPendingImages([]);
              }, 2000);
            }
          } else {
            toast({
              title: "Image Generated!",
              description: `Created ${imageCount} image${imageCount > 1 ? "s" : ""}. ${preSavedCount > 0 ? 'Saved!' : 'Sign in to save to your library.'}`,
              className: "bg-[#B94E30]/10 border-[#B94E30]/30 text-[#B94E30] dark:bg-[#B94E30]/20 dark:border-[#B94E30]/50 dark:text-[#E3B436]",
            });
            setTimeout(() => {
              setStatus("idle");
              setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
              setProgress(0);
              setPendingImages([]);
            }, 3000);
          }
        };
        saveAndRedirect();
      }

      if (type === "error") {
        setStatus("idle");
        setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
        setProgress(0);
        setPendingImages([]);
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
            speed: settings.speed,
            imageCount: parseInt(settings.variations),
            isPublic: isPublicImage
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
            speed: settings.speed,
            imageCount: parseInt(settings.variations),
            isPublic: isPublicImage
          },
          handleEvent
        );
      }
    } catch (error) {
      setStatus("idle");
      setAgents(AGENTS.map(a => ({ ...a, status: "idle" })));
      setProgress(0);
      setPendingImages([]);
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

  // Expandable prompt bar handlers
  const handlePromptMouseEnter = () => {
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
    }
    setIsPromptExpanded(true);
  };

  const handlePromptMouseLeave = () => {
    promptTimeoutRef.current = setTimeout(() => {
      // Don't collapse if focus is still inside the container
      if (!promptContainerRef.current?.contains(document.activeElement)) {
        setIsPromptExpanded(false);
      }
    }, 400);
  };

  const handlePromptFocus = () => {
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
    }
    setIsPromptExpanded(true);
  };

  const handlePromptBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    
    // If relatedTarget is null, focus moved outside the document or to non-focusable element
    // In this case, only collapse after a longer delay and check if still not focused
    if (!relatedTarget) {
      promptTimeoutRef.current = setTimeout(() => {
        // Check if any element inside the container has focus
        if (!promptContainerRef.current?.contains(document.activeElement)) {
          setIsPromptExpanded(false);
        }
      }, 600);
      return;
    }
    
    const isInsideContainer = promptContainerRef.current?.contains(relatedTarget);
    const isInsidePopover = relatedTarget.closest?.('[data-radix-popper-content-wrapper]');
    const isInsideDropdown = relatedTarget.closest?.('[data-radix-menu-content]');
    
    if (!isInsideContainer && !isInsidePopover && !isInsideDropdown) {
      promptTimeoutRef.current = setTimeout(() => {
        setIsPromptExpanded(false);
      }, 400);
    }
  };

  // Load user's saved images from API or use sample images (limit to 12 for performance)
  useEffect(() => {
    const loadImages = async () => {
      if (user) {
        try {
          const { images } = await imagesApi.getAll(12, 0);
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
      
      <TutorialOverlay 
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
        onComplete={handleTutorialComplete}
      />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-background text-foreground">
        
        {/* TOP SECTION: PROMPT BAR (Expandable on Focus/Type) */}
        <div 
          ref={promptContainerRef}
          onFocus={handlePromptFocus}
          onBlur={handlePromptBlur}
          className="fixed bottom-[70px] left-0 right-0 md:relative md:bottom-auto md:top-0 z-[60] bg-background/80 backdrop-blur-xl border-t md:border-t-0 md:border-b border-border px-4 md:px-6 py-3 md:py-4 transition-all order-last md:order-first pb-safe"
        >
          <div className="max-w-[1800px] mx-auto w-full">
            
            {/* Unified Prompt Card - Contains Input + Settings */}
            <div 
              className={cn(
                "bg-muted/40 border border-border rounded-xl transition-all duration-300 ease-out shadow-sm overflow-hidden",
                prompt.trim().length > 0 && "bg-background/60 border-muted-foreground/30",
                isPromptExpanded && "bg-background/80 border-muted-foreground/40"
              )}
            >
              {/* Prompt Input Section */}
              <div className="flex items-end gap-3 p-2">
                
                {/* Main Input Wrapper */}
                <div 
                  data-tutorial="prompt-input"
                  className="flex-1 flex items-end gap-2 group min-h-[56px]">
                
                {/* Reference Image Upload */}
                <div className="self-end mb-0.5 shrink-0 flex items-center gap-1">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="reference-image-input"
                    accept="image/*"
                    className="sr-only"
                    data-testid="input-reference-image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (referenceImage) {
                          URL.revokeObjectURL(referenceImage.previewUrl);
                        }
                        const previewUrl = URL.createObjectURL(file);
                        setReferenceImage({ file, previewUrl });
                        toast({ title: "Image uploaded", description: "Reference image ready for generation." });
                      }
                      e.target.value = '';
                    }}
                  />
                  
                  {referenceImage ? (
                    <div className="flex items-center gap-1.5">
                      {/* Thumbnail with remove button */}
                      <div className="relative group">
                        <img 
                          src={referenceImage.previewUrl} 
                          alt={imageMode === "reference" ? "Reference" : "Remix"} 
                          className="h-10 w-10 rounded-lg object-cover border border-border"
                          data-testid="img-reference-preview"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            URL.revokeObjectURL(referenceImage.previewUrl);
                            setReferenceImage(null);
                            setImageMode("reference");
                          }}
                          data-testid="button-remove-reference"
                          className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      
                      {/* Mode Selector - Reference / Remix toggle */}
                      <div className="flex items-center bg-muted/60 rounded-lg p-0.5 border border-border/50">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageMode("reference");
                          }}
                          data-testid="button-mode-reference"
                          className={cn(
                            "px-2 py-1 text-[11px] font-medium rounded-md transition-all",
                            imageMode === "reference" 
                              ? "bg-background text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Reference
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageMode("remix");
                          }}
                          data-testid="button-mode-remix"
                          className={cn(
                            "px-2 py-1 text-[11px] font-medium rounded-md transition-all",
                            imageMode === "remix" 
                              ? "bg-background text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Remix
                        </button>
                      </div>
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label 
                            htmlFor="reference-image-input"
                            data-testid="button-upload-reference"
                            className="h-10 w-10 text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-border/40 flex items-center justify-center cursor-pointer"
                          >
                            <ImageIconLucide className="h-5 w-5" strokeWidth={1.5} />
                          </label>
                        </TooltipTrigger>
                        <TooltipContent><p>Upload reference image</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Textarea */}
                <div className="flex-1 relative py-2 self-end">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handlePromptFocus}
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
                        data-tutorial="generate-button"
                      >
                        <Button 
                          onClick={handleGenerate}
                          disabled={status === "generating"}
                          size="icon"
                          data-testid="button-generate"
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

                  {/* Save Prompt Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setShowSaveModal(true)}
                          disabled={!prompt.trim()}
                          data-testid="button-save-prompt"
                          className={cn(
                            "h-9 w-9 rounded-lg transition-all",
                            !prompt.trim() && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Bookmark className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Save Prompt</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Saved Prompts Dropdown */}
                  {user && savedPrompts.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          data-testid="button-load-prompts"
                          className="h-9 w-9 rounded-lg transition-all"
                        >
                          <BookmarkCheck className="h-5 w-5 text-[#B94E30]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[280px] max-h-[320px] overflow-y-auto">
                        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
                          <BookmarkCheck className="h-3.5 w-3.5 text-[#B94E30]" />
                          Saved Prompts ({savedPrompts.length})
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {savedPrompts.map((fav) => (
                          <DropdownMenuItem 
                            key={fav.id}
                            className="flex items-start justify-between gap-2 py-2 cursor-pointer group"
                            data-testid={`saved-prompt-${fav.id}`}
                          >
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => loadPromptFavorite(fav)}
                            >
                              <div className="font-medium text-sm truncate">{fav.name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[180px]">{fav.prompt}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{fav.style}</Badge>
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{fav.aspectRatio}</Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePromptFavorite(fav.id);
                              }}
                              data-testid={`delete-prompt-${fav.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              </div>
              
              {/* Expand Hint - shows when collapsed */}
              {!isPromptExpanded && (
                <div 
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-2 border-t border-border/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPromptExpanded(true);
                  }}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Tap to adjust settings</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              )}

              {/* Settings Panel - CSS Transition for smooth expand/collapse */}
              <div 
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isPromptExpanded 
                    ? "grid-rows-[1fr] opacity-100" 
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  {/* Subtle divider */}
                  <div className="border-t border-border/50 mx-2" />
                  
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    
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
                    <div className="space-y-1.5" data-tutorial="ratio-selector">
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
                      <div className="flex gap-1.5">
                        {DETAIL_LEVELS.map(d => (
                          <TooltipProvider key={d.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setSettings({...settings, detail: d.id})}
                                  className={cn(
                                    "h-9 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all border whitespace-nowrap",
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
                    <div className="space-y-1.5" data-tutorial="style-selector">
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

                    {/* More Options Dropdown - Count, Visibility */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">More</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between h-9 text-xs bg-background/50 border-transparent hover:bg-background px-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Settings className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="font-medium truncate text-[10px]">
                                {settings.variations}x · {isPublicImage ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0 ml-1" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[200px] p-3 space-y-4">
                          {/* Count */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Image Count</label>
                            <div className="flex gap-1">
                              {["1", "2", "4"].map(v => (
                                <button
                                  key={v}
                                  onClick={() => setSettings({...settings, variations: v})}
                                  className={cn(
                                    "flex-1 h-8 rounded-md flex items-center justify-center text-[10px] font-medium transition-all border",
                                    settings.variations === v 
                                      ? "bg-primary/10 border-primary/50 text-primary" 
                                      : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Visibility */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visibility</label>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setIsPublicImage(false)}
                                data-testid="button-visibility-private"
                                className={cn(
                                  "flex-1 h-8 rounded-md flex items-center justify-center text-[10px] font-medium transition-all border",
                                  !isPublicImage 
                                    ? "bg-primary/10 border-primary/50 text-primary" 
                                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                Private
                              </button>
                              <button
                                onClick={() => setIsPublicImage(true)}
                                data-testid="button-visibility-public"
                                className={cn(
                                  "flex-1 h-8 rounded-md flex items-center justify-center text-[10px] font-medium transition-all border",
                                  isPublicImage 
                                    ? "bg-primary/10 border-primary/50 text-primary" 
                                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                Public
                              </button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* AI Agents Status Bar (During Generation) */}
            {/* Removed as per user request */}

          </div>
        </div>

        {/* CREATIVE WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-40 md:pb-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* Generation Status - Shows during generation with progressive image cards */}
            {status === "generating" && pendingImages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Header with timer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full border-2 border-[#B94E30]/30 flex items-center justify-center backdrop-blur-sm bg-background/50">
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[#B94E30]"
                          style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-sm font-mono font-bold text-foreground tabular-nums">
                          {formatTime(elapsedSeconds)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{getProgressText()}</p>
                      <p className="text-muted-foreground text-xs">
                        {pendingImages.filter(p => p.status === 'complete').length} of {pendingImages.length} complete
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Progressive Image Grid */}
                <div className={cn(
                  "grid gap-3",
                  pendingImages.length === 1 ? "grid-cols-1 max-w-md mx-auto" :
                  pendingImages.length === 2 ? "grid-cols-2" :
                  "grid-cols-2 md:grid-cols-4"
                )}>
                  {pendingImages.map((pending, index) => (
                    <motion.div
                      key={pending.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "relative rounded-xl overflow-hidden border transition-all",
                        pending.status === 'loading' 
                          ? "bg-gradient-to-br from-[#B94E30]/5 to-[#E3B436]/5 border-[#B94E30]/20" 
                          : "border-border bg-card"
                      )}
                      style={{ aspectRatio: settings.aspectRatio === "16:9" ? "16/9" : settings.aspectRatio === "9:16" ? "9/16" : settings.aspectRatio === "4:3" ? "4/3" : settings.aspectRatio === "3:4" ? "3/4" : "1/1" }}
                    >
                      {pending.status === 'loading' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <motion.div
                            className="h-8 w-8 rounded-full border-2 border-[#B94E30] border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="text-xs text-muted-foreground">Image {index + 1}</span>
                        </div>
                      ) : pending.image ? (
                        <motion.img 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={pending.image.src} 
                          alt={pending.image.prompt} 
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedImage(pending.image!)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-destructive">Failed</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Session History - Last 6 generations */}
            {generations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Recent Creations</h3>
                    <span className="text-xs text-muted-foreground">({Math.min(generations.length, 6)} of {generations.length})</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setLocation('/my-creations')}
                  >
                    View All in Library
                    <ChevronDown className="h-3 w-3 ml-1 -rotate-90" />
                  </Button>
                </div>
                
                <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-6 gap-3">
                  {generations.slice(0, 6).map((gen) => (
                    <motion.div 
                      key={gen.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setSelectedImage(gen)}
                      className="relative group rounded-xl overflow-hidden cursor-pointer bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all break-inside-avoid mb-3"
                    >
                      <img src={gen.src} alt={gen.prompt} className="w-full h-auto object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            className="h-7 w-7 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVary(gen);
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            className="h-7 w-7 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImage(gen.src, `generated_${gen.id}.png`);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            className="h-7 w-7 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(gen.id);
                            }}
                          >
                            <Star className={cn("h-3 w-3", gen.isFavorite && "fill-yellow-400 text-yellow-400")} />
                          </Button>
                        </div>
                      </div>
                      {gen.isNew && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#B94E30] text-white text-[9px] font-bold rounded">NEW</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Suggestions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Prompt Ideas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PROMPT_SUGGESTIONS.map((category) => (
                  <div key={category.category} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{category.category}</h4>
                    <div className="space-y-2">
                      {category.prompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPrompt(p)}
                          className="w-full text-left text-sm text-foreground/80 hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors line-clamp-2"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Creators Leaderboard */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#E3B436]" />
                <h3 className="text-sm font-semibold text-foreground">Top Creators</h3>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                {isLoadingLeaderboard ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                        <div className="w-6 h-4 bg-muted rounded" />
                        <div className="h-8 w-8 bg-muted rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-muted rounded" />
                        </div>
                        <div className="text-right">
                          <div className="h-4 w-8 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : leaderboardError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Could not load leaderboard</p>
                  </div>
                ) : topCreators.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Be the first to create!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCreators.map((creator) => (
                      <div
                        key={creator.userId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`leaderboard-entry-${creator.rank}`}
                      >
                        <div className="w-6 flex justify-center shrink-0">
                          {getRankIcon(creator.rank)}
                        </div>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={creator.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {(creator.displayName || creator.username || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {creator.displayName || creator.username || "Anonymous"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ImageIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">{creator.imageCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            <span className="text-xs font-medium">{creator.likeCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs font-medium">{creator.viewCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Empty State - Only when no generations at all */}
            {generations.length === 0 && status !== "generating" && (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-tr from-[#B94E30] to-[#E3B436] rounded-full blur-[60px] opacity-20 mb-6" />
                <h2 className="text-2xl font-bold mb-2 text-foreground">Ready to Create</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Type a prompt above or pick one from the suggestions to generate your first image.
                </p>
              </div>
            )}
          </div>
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
                    <div className="grid grid-cols-5 gap-2">
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
                        onClick={() => copyImageToClipboard(selectedImage.src)}
                        data-testid="button-copy-detail"
                      >
                        <ClipboardCopy className="h-5 w-5" />
                        <span className="text-[10px]">Copy</span>
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
                        <span className="text-xs font-medium text-foreground">
                          {(() => {
                            const ratio = selectedImage.aspectRatio || "1:1";
                            const dims: Record<string, string> = {
                              "1:1": "1024 × 1024",
                              "16:9": "1024 × 576",
                              "9:16": "576 × 1024",
                              "4:3": "1024 × 768",
                              "3:4": "768 × 1024"
                            };
                            return dims[ratio] || "1024 × 1024";
                          })()}
                        </span>
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

      {/* Save Prompt Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-[#B94E30]" />
              Save Prompt
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="favorite-name">Preset Name</Label>
              <Input
                id="favorite-name"
                placeholder="e.g., Cyberpunk City Style"
                value={favoriteName}
                onChange={(e) => setFavoriteName(e.target.value)}
                data-testid="input-favorite-name"
                className="focus-visible:ring-[#B94E30]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Prompt Preview</Label>
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                {prompt || "No prompt entered"}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Settings to be saved</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  {STYLE_PRESETS.find(s => s.id === settings.style)?.name || settings.style}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Square className="h-3 w-3 mr-1" />
                  {settings.aspectRatio}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {settings.quality}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {settings.speed}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  {settings.detail}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSaveModal(false);
                setFavoriteName("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePromptFavorite}
              disabled={isSavingFavorite || !favoriteName.trim()}
              data-testid="button-confirm-save-prompt"
              className="bg-[#B94E30] hover:bg-[#8B3A24] text-white"
            >
              {isSavingFavorite ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Save Prompt
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
