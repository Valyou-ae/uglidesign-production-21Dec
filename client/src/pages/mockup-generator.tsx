import { useState, useRef, useEffect } from "react";
import { 
  Shirt, 
  Grid, 
  Cloud, 
  ShoppingBag, 
  Building, 
  Sparkles, 
  MapPin, 
  Palette, 
  Camera, 
  Wand2,
  Repeat,
  Check,
  Upload,
  ChevronRight,
  ChevronLeft,
  Maximize,
  Download,
  Copy,
  RefreshCw,
  X,
  Sun,
  Trees,
  Coffee,
  Dumbbell,
  User,
  Users,
  UserCheck,
  Plus,
  Check as CheckIcon,
  ChevronDown,
  Menu,
  Tag,
  Layers,
  Footprints,
  Smartphone,
  Laptop,
  Monitor,
  Image as ImageIcon,
  StickyNote,
  Utensils,
  BookOpen,
  Smile,
  Scissors,
  LayoutGrid,
  Briefcase,
  Heart,
  Baby,
  Award,
  MoveHorizontal,
  Wind,
  Umbrella,
  Shield,
  Watch,
  Frame,
  Timer,
  PersonStanding,
  View,
  Combine,
  Search,
  Maximize2,
  Loader2,
  Info,
  AlertTriangle,
  Star,
  CheckCircle2,
  Ruler
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { mockupApi, MockupEvent } from "@/lib/api";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Import sample mood images
import moodMinimal from "@assets/generated_images/mood_image_for_minimalist_luxury_style.png";
import moodUrban from "@assets/generated_images/mood_image_for_urban_street_style.png";
import moodNatural from "@assets/generated_images/mood_image_for_natural_organic_style.png";
import moodBold from "@assets/generated_images/mood_image_for_bold_vibrant_style.png";

// Import brand archetype images
import brandUrbanEdge from "@assets/generated_images/urban_edge_brand_style.png";
import brandSoftMinimalist from "@assets/generated_images/soft_minimalist_brand_style.png";
import brandBoldPlayful from "@assets/generated_images/bold_playful_brand_style.png";
import brandPremiumLuxe from "@assets/generated_images/premium_luxe_brand_style.png";
import brandVintageAuthentic from "@assets/generated_images/vintage_authentic_brand_style.png";

// Brand style data with images, taglines, and mood keywords
const BRAND_STYLES = [
  { 
    id: "ECOMMERCE_CLEAN", 
    name: "E-Commerce Clean", 
    img: brandSoftMinimalist, 
    tagline: "Clean & Professional",
    keywords: ["Minimal", "Trust", "Conversion", "Clarity"]
  },
  { 
    id: "EDITORIAL_FASHION", 
    name: "Editorial Fashion", 
    img: brandUrbanEdge, 
    tagline: "Dramatic & Bold",
    keywords: ["High Fashion", "Editorial", "Dramatic", "Artistic"]
  },
  { 
    id: "VINTAGE_RETRO", 
    name: "Vintage Retro", 
    img: brandVintageAuthentic, 
    tagline: "Nostalgic & Timeless",
    keywords: ["Classic", "Authentic", "Heritage", "Warm"]
  },
  { 
    id: "STREET_URBAN", 
    name: "Street Style Urban", 
    img: brandUrbanEdge, 
    tagline: "Gritty & Authentic",
    keywords: ["Urban", "Raw", "Street", "Edge"]
  },
  { 
    id: "MINIMALIST_MODERN", 
    name: "Minimalist Modern", 
    img: brandSoftMinimalist, 
    tagline: "Less is More",
    keywords: ["Sleek", "Refined", "Elegant", "Simple"]
  },
  { 
    id: "BOLD_PLAYFUL", 
    name: "Bold & Playful", 
    img: brandBoldPlayful, 
    tagline: "Vibrant & Energetic",
    keywords: ["Fun", "Colorful", "Dynamic", "Youth"]
  },
  { 
    id: "PREMIUM_LUXE", 
    name: "Premium Luxe", 
    img: brandPremiumLuxe, 
    tagline: "Sophisticated & Elite",
    keywords: ["Luxury", "Premium", "Exclusive", "Opulent"]
  },
  { 
    id: "NATURAL_ORGANIC", 
    name: "Natural Organic", 
    img: moodNatural, 
    tagline: "Earthy & Sustainable",
    keywords: ["Eco", "Natural", "Organic", "Earthy"]
  },
];

// Types
type JourneyType = "DTG" | "AOP" | null;
type WizardStep = 
  | "upload" 
  | "seamless" 
  | "product" 
  | "model"
  | "style" 
  | "scene" 
  | "angles" 
  | "generate";

type AgeGroup = "ADULT" | "YOUNG_ADULT" | "TEEN";
type Sex = "MALE" | "FEMALE";
type Ethnicity = "CAUCASIAN" | "AFRICAN" | "ASIAN" | "SOUTHEAST_ASIAN" | "HISPANIC" | "SOUTH_ASIAN" | "MIDDLE_EASTERN" | "INDIGENOUS" | "MIXED";
type ModelSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

interface ModelDetails {
  age: AgeGroup;
  sex: Sex;
  ethnicity: Ethnicity;
  modelSize: ModelSize;
}

interface MockupDetails {
  src: string;
  angle: string;
  color: string;
  size: string;
  brandStyle: string;
  index: number;
}

interface GeneratedMockupData {
  src: string;
  angle: string;
  color: string;
  size: string;
}

const DTG_STEPS: WizardStep[] = ["upload", "product", "model", "style", "scene", "angles", "generate"];
const AOP_STEPS: WizardStep[] = ["upload", "seamless", "product", "model", "style", "scene", "angles", "generate"];

const MOCKUP_ANGLES = [
  { id: 'front', name: 'Front View', description: 'Direct frontal shot - the hero image.', icon: PersonStanding, recommended: true },
  { id: 'three-quarter', name: 'Three-Quarter', description: '45° angle to show dimension and fit.', icon: View, recommended: true },
  { id: 'side', name: 'Side Profile', description: '90° side view to showcase silhouette.', icon: Combine, recommended: false },
  { id: 'closeup', name: 'Close-up View', description: 'Detailed shot of the design and fabric.', icon: Search, recommended: true },
];

const getGenderFromCategory = (category: string): Sex | null => {
  if (category.toLowerCase().includes("men's") && !category.toLowerCase().includes("women's")) return "MALE";
  if (category.toLowerCase().includes("women's")) return "FEMALE";
  return null;
};

const isNonWearableCategory = (category: string): boolean => {
  const nonWearable = ["accessories", "home & living"];
  return nonWearable.some(nw => category.toLowerCase().includes(nw));
};

export default function MockupGenerator() {
  const [journey, setJourney] = useState<JourneyType>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Men's Clothing");
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  const [environmentPrompt, setEnvironmentPrompt] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>(["White"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["L"]);
  const [selectedAngles, setSelectedAngles] = useState<string[]>(["front"]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [modelDetails, setModelDetails] = useState<ModelDetails>({
    age: "ADULT",
    sex: "MALE",
    ethnicity: "CAUCASIAN",
    modelSize: "M"
  });
  const [useModel, setUseModel] = useState<boolean>(true);
  const [genderAutoSelected, setGenderAutoSelected] = useState<boolean>(true);
  const [personaHeadshot, setPersonaHeadshot] = useState<string | null>(null);
  // Seamless Pattern State
  const [seamlessPhase, setSeamlessPhase] = useState<'analyzing' | 'generating' | 'selecting'>('analyzing');
  const [seamlessVariations, setSeamlessVariations] = useState<any[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [patternScale, setPatternScale] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockupData[]>([]);
  const [expectedMockupsCount, setExpectedMockupsCount] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedMockupDetails, setSelectedMockupDetails] = useState<MockupDetails | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const steps = journey === "AOP" ? AOP_STEPS : DTG_STEPS;
  const currentStep = steps[currentStepIndex];

  // Mock effect to simulate analyzing phase
  useEffect(() => {
    if (currentStep === "seamless" && seamlessPhase === 'analyzing') {
      const timer = setTimeout(() => {
        setSeamlessPhase('generating');
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (currentStep === "seamless" && seamlessPhase === 'generating') {
      const timer = setTimeout(() => {
        setSeamlessPhase('selecting');
        setSeamlessVariations([
          { id: 'offset_blend', name: 'Offset & Blend', description: 'Classic seamless tile', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80', isRecommended: true },
          { id: 'mirror', name: 'Mirror Symmetry', description: 'Kaleidoscopic effect', url: 'https://images.unsplash.com/photo-1548586196-aa5803b77379?auto=format&fit=crop&w=300&q=80', isRecommended: false },
          { id: 'graph_cut', name: 'Graph-Cut', description: 'Advanced texture synthesis', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80', isRecommended: false },
          { id: 'edge_average', name: 'Edge Average', description: 'Smooth edge blending', url: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?auto=format&fit=crop&w=300&q=80', isRecommended: false },
          { id: 'ai_enhanced', name: 'AI Enhanced', description: 'Creative AI-generated pattern (slower)', url: '', isRecommended: false },
        ]);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, seamlessPhase]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Restore state from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const restore = searchParams.get('restore');
    const journeyParam = searchParams.get('journey') as JourneyType;

    if (restore === 'true' && journeyParam) {
      setJourney(journeyParam);
      setUploadedImage("https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1000&q=80");
      setGeneratedMockups([
        { src: moodMinimal, angle: 'front', color: 'White', size: 'M' },
        { src: moodUrban, angle: 'three-quarter', color: 'White', size: 'M' },
        { src: moodNatural, angle: 'side', color: 'White', size: 'M' },
        { src: moodBold, angle: 'closeup', color: 'White', size: 'M' }
      ]);
      setCurrentStepIndex(journeyParam === "AOP" ? AOP_STEPS.length - 1 : DTG_STEPS.length - 1);
    }
  }, []);

  const handleJourneySelect = (type: JourneyType) => {
    setJourney(type);
    setCurrentStepIndex(0);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      let nextIndex = currentStepIndex + 1;
      // Skip model step for non-wearable categories (Accessories, Home & Living)
      if (steps[nextIndex] === "model" && isNonWearableCategory(activeCategory)) {
        setUseModel(false);
        nextIndex = nextIndex + 1;
      }
      setCurrentStepIndex(nextIndex);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      let prevIndex = currentStepIndex - 1;
      // Skip model step when going back for non-wearable categories
      if (steps[prevIndex] === "model" && isNonWearableCategory(activeCategory)) {
        prevIndex = prevIndex - 1;
      }
      setCurrentStepIndex(Math.max(0, prevIndex));
    } else {
      setJourney(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast({
        title: "No design uploaded",
        description: "Please upload a design image first.",
        variant: "destructive",
      });
      return;
    }

    const styleName = selectedStyle || "minimal";
    const productName = selectedProductType || "t-shirt";
    const colors = selectedColors.length > 0 ? selectedColors : ["White"];
    const sizes = selectedSizes.length > 0 ? selectedSizes : ["M"];
    const scene = environmentPrompt || "studio";
    const totalExpected = Math.max(1, selectedAngles.length * colors.length * sizes.length);

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStage("Initializing...");
    setGeneratedMockups([]);
    setExpectedMockupsCount(totalExpected);

    if (intervalRef.current) clearInterval(intervalRef.current);

    const generatedImages: GeneratedMockupData[] = [];

    try {
      await mockupApi.generateBatch(
        uploadedImage,
        {
          productType: productName,
          productColors: colors,
          productSizes: useModel ? sizes : undefined,
          angles: selectedAngles,
          scene: scene,
          style: styleName,
          modelDetails: useModel ? modelDetails : undefined,
        },
        (event: MockupEvent) => {
          switch (event.type) {
            case "status":
              if (event.data.message) {
                setGenerationStage(event.data.message);
              }
              if (event.data.progress !== undefined) {
                setGenerationProgress(event.data.progress);
              }
              break;
            case "analysis":
              setGenerationStage("Design analyzed, generating mockups...");
              setGenerationProgress(10);
              break;
            case "persona_lock":
              if (event.data.headshotImage) {
                const headshotUrl = `data:image/png;base64,${event.data.headshotImage}`;
                setPersonaHeadshot(headshotUrl);
                setGenerationStage("Model reference generated, creating mockups...");
              }
              break;
            case "persona_lock_failed":
              console.error("Persona lock failed:", event.data.message);
              toast({
                title: "Model Generation Issue",
                description: event.data.suggestion || "Could not generate consistent model. Trying alternative approach.",
                variant: "destructive",
              });
              break;
            case "image":
              if (event.data.imageData && event.data.mimeType) {
                const imageUrl = `data:${event.data.mimeType};base64,${event.data.imageData}`;
                const mockupData: GeneratedMockupData = {
                  src: imageUrl,
                  angle: event.data.angle || 'front',
                  color: event.data.color || 'White',
                  size: event.data.size || 'M'
                };
                generatedImages.push(mockupData);
                setGeneratedMockups([...generatedImages]);
                const progress = 10 + Math.round((generatedImages.length / totalExpected) * 85);
                setGenerationProgress(Math.min(progress, 95));
              }
              break;
            case "image_error":
              console.error(`Failed to generate ${event.data.angle} ${event.data.color || ''} view`);
              toast({
                title: "Image Error",
                description: `Failed to generate ${event.data.angle} view. Continuing with others...`,
                variant: "destructive",
              });
              break;
            case "complete":
              setGenerationProgress(100);
              setGenerationStage("Complete!");
              break;
            case "stream_end":
              if (!event.data.success && generatedImages.length === 0) {
                setIsGenerating(false);
                setGenerationProgress(0);
                toast({
                  title: "Generation Failed",
                  description: "No images were produced. Please try again.",
                  variant: "destructive",
                });
              }
              break;
            case "batch_error":
              console.error("Batch error:", event.data.message);
              break;
            case "error":
              throw new Error(event.data.message || "Generation failed");
          }
        }
      );

      setIsGenerating(false);
      if (generatedImages.length > 0) {
        toast({
          title: "Mockups Generated!",
          description: `${generatedImages.length} professional product photo${generatedImages.length > 1 ? 's' : ''} ready.`,
          className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400",
        });
      } else {
        throw new Error("No images were generated");
      }
    } catch (error: any) {
      console.error("Mockup generation failed:", error);
      setIsGenerating(false);
      setGenerationProgress(0);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate mockups. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto relative flex flex-col pb-20 md:pb-0">
        {/* State 1: Journey Selection */}
        {!journey ? (
          <div className="p-4 md:p-8 lg:p-10 max-w-[1400px] mx-auto min-h-full flex flex-col animate-fade-in">
            {/* Header with USPs */}
            <div className="mb-4 md:mb-8">
              <div className="flex items-center text-[13px] text-muted-foreground mb-2">
                <span>Home</span>
                <span className="mx-2">/</span>
                <span>Mockup Generator</span>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-16 mb-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-indigo-600">
                      Mockup Generator
                    </h1>
                    <Shirt className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 animate-cut" />
                  </div>
                  <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-2 py-0.5 text-[11px]">
                    Professional
                  </Badge>
                </div>

                <div className="flex items-center gap-8 opacity-0 lg:opacity-100 animate-fade-in hidden lg:flex">
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Photorealistic 8K</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Grid className="h-3.5 w-3.5 text-purple-500" />
                    <span>Smart 3D Mapping</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Camera className="h-3.5 w-3.5 text-pink-500" />
                    <span>Multi-Angle Studio</span>
                  </div>
                </div>
              </div>
              <p className="text-sm md:text-[15px] text-muted-foreground mt-1 md:mt-2">
                Create professional product photos in seconds without a photoshoot
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="max-w-[800px] w-full text-center mb-4 md:mb-12">
                <p className="text-base md:text-lg text-muted-foreground">Choose your print method to get started</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 w-full max-w-[900px]">
                {/* DTG Card */}
                <div 
                  onClick={() => handleJourneySelect("DTG")}
                  className="bg-card border-2 border-border rounded-[20px] md:rounded-[24px] p-5 md:p-10 text-left cursor-pointer transition-all duration-300 hover:border-indigo-600 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/15 group"
                >
                  <div className="h-10 w-10 md:h-16 md:w-16 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
                    <Shirt className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-foreground mb-1 md:mb-3">Direct-to-Garment (DTG)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 md:mb-6">
                    For designs placed on a specific area of a product, like a logo on the chest of a t-shirt or a graphic on a tote bag.
                  </p>
                  <span className="text-xs md:text-sm font-bold text-indigo-600 group-hover:underline flex items-center">
                    Choose DTG <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </span>
                </div>

                {/* AOP Card */}
                <div 
                  onClick={() => handleJourneySelect("AOP")}
                  className="bg-card border-2 border-border rounded-[20px] md:rounded-[24px] p-5 md:p-10 text-left cursor-pointer transition-all duration-300 hover:border-purple-600 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/15 group relative overflow-hidden"
                >
                  <Badge className="absolute top-3 right-3 md:top-6 md:right-6 bg-amber-500 text-white hover:bg-amber-600 text-[10px] md:text-[11px]">Pro</Badge>
                  <div className="h-10 w-10 md:h-16 md:w-16 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
                    <Grid className="h-5 w-5 md:h-8 md:w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-foreground mb-1 md:mb-3">All-Over Print (AOP)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 md:mb-6">
                    For seamless patterns that cover the entire surface of a product, like leggings, backpacks, or custom-cut apparel.
                  </p>
                  <span className="text-xs md:text-sm font-bold text-purple-600 group-hover:underline flex items-center">
                    Choose AOP <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // State 2: Step-by-Step Wizard
          <div className="flex-1 flex flex-col h-full">
            {/* Top Progress Bar */}
            <div className="bg-card border-b border-border px-4 md:px-10 py-4 md:py-6">
              <div className="max-w-[1000px] mx-auto">
                <div className="relative flex justify-between items-center">
                  {/* Connecting Line */}
                  <div className="absolute top-[18px] left-0 w-full h-[2px] bg-border -z-10">
                    <motion.div 
                      className="h-full bg-indigo-600"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    const icons = {
                      upload: Cloud,
                      seamless: Repeat,
                      product: ShoppingBag,
                      model: User,
                      style: Sparkles,
                      scene: MapPin,
                      angles: Camera,
                      generate: Wand2
                    };
                    const StepIcon = icons[step];

                    return (
                      <div key={step} className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                          isCompleted ? "bg-indigo-600 border-indigo-600 text-white" :
                          isCurrent ? "bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-600/20" :
                          "bg-card border-border text-muted-foreground"
                        )}>
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          "text-[8px] md:text-[10px] font-bold uppercase tracking-wider transition-colors text-center",
                          isCurrent ? "text-indigo-600" : "text-muted-foreground"
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="flex-1 p-4 lg:p-10 overflow-hidden flex flex-col">
              <div className="flex-1 bg-card border border-border rounded-[20px] shadow-sm overflow-hidden flex flex-col relative max-w-[1400px] mx-auto w-full">
                
                <div className="flex-1 overflow-y-auto p-5 md:p-8 lg:p-12 scroll-smooth">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {/* STEP CONTENT SWITCHER */}
                      {currentStep === "upload" && (
                        <div className="flex flex-col h-full">
                          <div className="flex flex-col items-center justify-center h-full max-w-[600px] mx-auto text-center flex-1">
                          {!uploadedImage ? (
                            <div 
                              className="w-full border-2 border-dashed border-border rounded-[20px] p-8 md:p-16 hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileUpload}
                              />
                              <div className="h-16 w-16 md:h-20 md:w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Cloud className="h-8 w-8 md:h-10 md:w-10 text-indigo-600" />
                              </div>
                              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Drag & drop your design</h2>
                              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                              <Badge variant="outline" className="text-xs text-muted-foreground">PNG recommended • Max 20MB</Badge>
                            </div>
                          ) : (
                            <div className="relative w-full aspect-square max-w-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbC1vcGFjaXR5PSIwLjEiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat rounded-xl border border-border overflow-hidden">
                              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 flex justify-between items-center">
                                <span className="text-xs text-white truncate">design_v1.png</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setUploadedImage(null)}
                                  className="text-white hover:text-white hover:bg-white/20 h-6 px-2 text-xs"
                                >
                                  Change
                                </Button>
                              </div>
                            </div>
                          )}
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-auto pt-4 md:pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={!uploadedImage}
                                    className={cn(
                                        "gap-2 px-6 transition-all",
                                        uploadedImage
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Enter</kbd> 
                                    Next
                                </span>
                                <span className="mx-1">•</span>
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Esc</kbd> 
                                    Back
                                </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === "product" && (
                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 h-auto lg:h-full min-h-full">
                          {/* Categories - Mobile: Horizontal Scroll, Desktop: Vertical List */}
                          <div className="lg:col-span-3 lg:border-r border-border lg:pr-6 flex flex-col gap-4 lg:gap-6 shrink-0">
                            <div className="flex items-center gap-2 text-foreground lg:mb-4">
                              <LayoutGrid className="h-4 w-4 text-indigo-600" />
                              <h3 className="text-lg font-bold">Select Category</h3>
                            </div>

                            <div className="flex lg:flex-col overflow-x-auto pb-2 lg:pb-0 gap-2 lg:gap-1 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                              {[
                                { 
                                  name: "Men's Clothing", 
                                  icon: User,
                                  items: [
                                    { name: "T-shirts", icon: Shirt },
                                    { name: "Polo shirts", icon: Award },
                                    { name: "Tank tops", icon: Sun },
                                    { name: "3/4 sleeve shirts", icon: MoveHorizontal },
                                    { name: "Long sleeve shirts", icon: Wind },
                                    { name: "Embroidered shirts", icon: Tag },
                                    { name: "Jackets & vests", icon: Shield },
                                    { name: "Hoodies", icon: Cloud },
                                    { name: "Sweatshirts", icon: Layers },
                                    { name: "Knitwear", icon: Grid },
                                  ]
                                },
                                { 
                                  name: "Women's Clothing", 
                                  icon: Heart,
                                  items: [
                                    { name: "T-shirts", icon: Shirt },
                                    { name: "Polo shirts", icon: Award },
                                    { name: "Tank tops", icon: Sun },
                                    { name: "Crop tops", icon: Scissors },
                                    { name: "Embroidered shirts", icon: Tag },
                                    { name: "3/4 sleeve shirts", icon: MoveHorizontal },
                                    { name: "Long sleeve shirts", icon: Wind },
                                    { name: "Dresses", icon: Umbrella }, 
                                    { name: "Knitwear", icon: Grid },
                                    { name: "Jackets", icon: Shield },
                                    { name: "Hoodies", icon: Cloud },
                                    { name: "Sweatshirts", icon: Layers },
                                  ]
                                },
                                { 
                                  name: "Kids' Clothing", 
                                  icon: Smile, 
                                  items: [
                                    { name: "T-shirts", icon: Shirt },
                                    { name: "All-over shirts", icon: Grid },
                                    { name: "3/4 sleeve shirts", icon: MoveHorizontal },
                                    { name: "Long sleeve shirts", icon: Wind },
                                    { name: "Hoodies", icon: Cloud },
                                    { name: "Sweatshirts", icon: Layers },
                                    { name: "Hats", icon: Smile }, 
                                    { name: "Leggings", icon: Layers },
                                    { name: "Baby bodysuits", icon: Baby },
                                  ] 
                                }, 
                                { 
                                  name: "Accessories", 
                                  icon: Watch, 
                                  items: [
                                    { name: "Tote bags", icon: ShoppingBag },
                                    { name: "Duffle bags", icon: ShoppingBag },
                                    { name: "Drawstring bags", icon: ShoppingBag },
                                    { name: "Backpacks", icon: ShoppingBag },
                                    { name: "Handbags", icon: ShoppingBag },
                                    { name: "Flip flops", icon: Footprints },
                                    { name: "Shoes", icon: Footprints },
                                    { name: "Socks", icon: Footprints },
                                    { name: "Phone cases", icon: Smartphone },
                                    { name: "Laptop cases", icon: Laptop },
                                    { name: "Mouse pads", icon: Monitor },
                                    { name: "Face masks", icon: Smile },
                                  ] 
                                },
                                { 
                                  name: "Home & Living", 
                                  icon: Coffee, 
                                  items: [
                                    { name: "Wall art", icon: Frame },
                                    { name: "Posters", icon: StickyNote },
                                    { name: "Framed posters", icon: Frame },
                                    { name: "Blankets", icon: Layers },
                                    { name: "Pillow cases", icon: Layers },
                                    { name: "Magnets", icon: StickyNote },
                                    { name: "Tableware", icon: Utensils },
                                    { name: "Water bottles", icon: Coffee },
                                    { name: "Mugs", icon: Coffee },
                                    { name: "Tumblers", icon: Coffee },
                                    { name: "Coasters", icon: Coffee },
                                    { name: "Postcards", icon: StickyNote },
                                    { name: "Notebooks", icon: BookOpen },
                                    { name: "Stickers", icon: StickyNote },
                                    { name: "Aprons", icon: Scissors },
                                    { name: "Towels", icon: Layers },
                                  ] 
                                }
                              ].map((cat) => {
                                const isActive = activeCategory === cat.name;
                                return (
                                  <button 
                                    key={cat.name}
                                    onClick={() => {
                                      setActiveCategory(cat.name);
                                      // For non-wearable categories, auto-set to no model
                                      if (isNonWearableCategory(cat.name)) {
                                        setUseModel(false);
                                      } else {
                                        setUseModel(true);
                                        const autoGender = getGenderFromCategory(cat.name);
                                        if (autoGender) {
                                          setModelDetails(prev => ({...prev, sex: autoGender}));
                                          setGenderAutoSelected(true);
                                        }
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 lg:w-full lg:justify-between lg:px-3 lg:py-3 lg:rounded-xl",
                                      isActive 
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                                        : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border lg:border-transparent lg:hover:border-border"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 lg:gap-3">
                                      <cat.icon className={cn("h-4 w-4 lg:h-5 lg:w-5", isActive ? "text-white" : "text-muted-foreground")} />
                                      {cat.name}
                                    </div>
                                    {isActive && <ChevronRight className="h-4 w-4 opacity-80 hidden lg:block" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Product Grid */}
                          <div className="lg:col-span-6 w-full lg:flex-1 flex flex-col lg:min-h-0">
                            <div className="flex items-center gap-2 text-foreground mb-4 shrink-0">
                              <ShoppingBag className="h-4 w-4 text-indigo-600" />
                              <h3 className="text-lg font-bold">Choose Product</h3>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 lg:gap-3 lg:overflow-y-auto pr-2 pb-4 content-start h-auto lg:h-full min-h-0">
                              {[
                                { 
                                  name: "Men's Clothing", 
                                  items: [
                                    { name: "T-shirts", icon: Shirt },
                                    { name: "Polo shirts", icon: Award },
                                    { name: "Tank tops", icon: Sun },
                                    { name: "3/4 sleeve shirts", icon: MoveHorizontal },
                                    { name: "Long sleeve shirts", icon: Wind },
                                    { name: "Embroidered shirts", icon: Tag },
                                    { name: "Jackets & vests", icon: Shield },
                                    { name: "Hoodies", icon: Cloud },
                                    { name: "Sweatshirts", icon: Layers },
                                    { name: "Knitwear", icon: Grid },
                                  ]
                                },
                                { 
                                  name: "Women's Clothing", 
                                  items: [
                                    { name: "T-shirts", icon: Shirt },
                                    { name: "Polo shirts", icon: Award },
                                    { name: "Tank tops", icon: Sun },
                                    { name: "Crop tops", icon: Scissors },
                                    { name: "Embroidered shirts", icon: Tag },
                                    { name: "3/4 sleeve shirts", icon: MoveHorizontal },
                                    { name: "Long sleeve shirts", icon: Wind },
                                    { name: "Dresses", icon: Umbrella }, 
                                    { name: "Knitwear", icon: Grid },
                                    { name: "Jackets", icon: Shield },
                                    { name: "Hoodies", icon: Cloud },
                                    { name: "Sweatshirts", icon: Layers },
                                  ]
                                },
                                { 
                                  name: "Kids' Clothing", 
                                  items: [
                                    { name: "T-shirts", icon: Shirt },
                                    { name: "All-over shirts", icon: Grid },
                                    { name: "3/4 sleeve shirts", icon: MoveHorizontal },
                                    { name: "Long sleeve shirts", icon: Wind },
                                    { name: "Hoodies", icon: Cloud },
                                    { name: "Sweatshirts", icon: Layers },
                                    { name: "Hats", icon: Smile }, 
                                    { name: "Leggings", icon: Layers },
                                    { name: "Baby bodysuits", icon: Baby },
                                  ] 
                                }, 
                                { 
                                  name: "Accessories", 
                                  items: [
                                    { name: "Tote bags", icon: ShoppingBag },
                                    { name: "Duffle bags", icon: ShoppingBag },
                                    { name: "Drawstring bags", icon: ShoppingBag },
                                    { name: "Backpacks", icon: ShoppingBag },
                                    { name: "Handbags", icon: ShoppingBag },
                                    { name: "Flip flops", icon: Footprints },
                                    { name: "Shoes", icon: Footprints },
                                    { name: "Socks", icon: Footprints },
                                    { name: "Phone cases", icon: Smartphone },
                                    { name: "Laptop cases", icon: Laptop },
                                    { name: "Mouse pads", icon: Monitor },
                                    { name: "Face masks", icon: Smile },
                                  ] 
                                },
                                { 
                                  name: "Home & Living", 
                                  items: [
                                    { name: "Wall art", icon: Frame },
                                    { name: "Posters", icon: StickyNote },
                                    { name: "Framed posters", icon: Frame },
                                    { name: "Blankets", icon: Layers },
                                    { name: "Pillow cases", icon: Layers },
                                    { name: "Magnets", icon: StickyNote },
                                    { name: "Tableware", icon: Utensils },
                                    { name: "Water bottles", icon: Coffee },
                                    { name: "Mugs", icon: Coffee },
                                    { name: "Tumblers", icon: Coffee },
                                    { name: "Coasters", icon: Coffee },
                                    { name: "Postcards", icon: StickyNote },
                                    { name: "Notebooks", icon: BookOpen },
                                    { name: "Stickers", icon: StickyNote },
                                    { name: "Aprons", icon: Scissors },
                                    { name: "Towels", icon: Layers },
                                  ] 
                                }
                              ].find(c => c.name === activeCategory)?.items.map((item) => {
                                const isSelected = selectedProductType === item.name;
                                return (
                                  <div 
                                    key={item.name} 
                                    onClick={() => setSelectedProductType(item.name)}
                                    className={cn(
                                      "group relative border rounded-xl p-2 md:p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 md:gap-3 h-[100px] md:h-[140px]",
                                      isSelected 
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm" 
                                        : "border-border hover:border-indigo-300 hover:shadow-md bg-card"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-8 w-8 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors",
                                      isSelected ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-muted text-muted-foreground group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20"
                                    )}>
                                      <item.icon className="h-4 w-4 md:h-6 md:w-6" />
                                    </div>
                                    <p className={cn("font-medium text-[10px] md:text-sm leading-tight", isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-foreground")}>{item.name}</p>
                                    
                                    {isSelected && (
                                      <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 h-3.5 w-3.5 md:h-5 md:w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                        <Check className="h-2 w-2 md:h-3 md:w-3" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Model Config - Desktop: Column, Mobile: Bottom Sheet/Section */}
                          <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-6">
                            <div className="flex items-center gap-2 text-foreground mb-4">
                              <Sparkles className="h-4 w-4 text-indigo-600" />
                              <h3 className="text-lg font-bold">Configuration</h3>
                            </div>
                            <div className="lg:sticky lg:top-6">
                              
                              <div className="space-y-6 bg-card/50 rounded-xl p-1">
                                {/* Product Size Selection */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Sizes</label>
                                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400">
                                      {selectedSizes.length} Selected
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"].map((size) => {
                                      const isSelected = selectedSizes.includes(size);
                                      return (
                                        <button
                                          key={size}
                                          onClick={() => {
                                            if (isSelected) {
                                              setSelectedSizes(selectedSizes.filter(s => s !== size));
                                            } else {
                                              setSelectedSizes([...selectedSizes, size]);
                                            }
                                          }}
                                          className={cn(
                                            "h-9 min-w-[36px] px-2 rounded-lg text-xs font-medium border transition-all",
                                            isSelected 
                                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                                              : "bg-background border-border text-muted-foreground hover:border-indigo-300 hover:text-foreground"
                                          )}
                                        >
                                          {size}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <Separator />

                                {/* Color Selection */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Color</label>
                                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400">
                                      {selectedColors.length} Selected
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-8 gap-1.5">
                                    {[
                                      { name: "White", class: "bg-white border-gray-200" },
                                      { name: "Black", class: "bg-black border-black" },
                                      { name: "Sport Grey", class: "bg-[#9E9E9E] border-gray-400" },
                                      { name: "Dark Heather", class: "bg-[#545454] border-gray-600" },
                                      { name: "Charcoal", class: "bg-[#424242] border-gray-700" },
                                      { name: "Navy", class: "bg-[#1A237E] border-blue-900" },
                                      { name: "Royal", class: "bg-[#0D47A1] border-blue-700" },
                                      { name: "Light Blue", class: "bg-[#ADD8E6] border-blue-200" },
                                      { name: "Red", class: "bg-[#D32F2F] border-red-600" },
                                      { name: "Cardinal", class: "bg-[#880E4F] border-red-900" },
                                      { name: "Maroon", class: "bg-[#4A148C] border-purple-900" },
                                      { name: "Orange", class: "bg-[#F57C00] border-orange-600" },
                                      { name: "Gold", class: "bg-[#FBC02D] border-yellow-500" },
                                      { name: "Yellow", class: "bg-[#FFEB3B] border-yellow-400" },
                                      { name: "Irish Green", class: "bg-[#388E3C] border-green-600" },
                                      { name: "Military Green", class: "bg-[#558B2F] border-green-700" },
                                      { name: "Forest", class: "bg-[#1B5E20] border-green-900" },
                                      { name: "Purple", class: "bg-[#7B1FA2] border-purple-700" },
                                      { name: "Light Pink", class: "bg-[#F8BBD0] border-pink-200" },
                                      { name: "Sand", class: "bg-[#F5F5DC] border-stone-200" },
                                    ].map((color) => {
                                      const isSelected = selectedColors.includes(color.name);
                                      return (
                                        <TooltipProvider key={color.name}>
                                          <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                              <div 
                                                onClick={() => {
                                                  if (isSelected) {
                                                    setSelectedColors(selectedColors.filter(c => c !== color.name));
                                                  } else {
                                                    setSelectedColors([...selectedColors, color.name]);
                                                  }
                                                }}
                                                className="group relative h-6 w-6 rounded-full border cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                                              >
                                                <div className={cn(
                                                  "h-full w-full rounded-full border shadow-sm",
                                                  color.class,
                                                  isSelected ? "ring-2 ring-indigo-600 ring-offset-1 dark:ring-offset-background" : ""
                                                )} />
                                                {isSelected && (
                                                  <div className="absolute -top-0.5 -right-0.5 bg-indigo-600 rounded-full p-[1px] border border-background z-10">
                                                    <CheckIcon className="h-1.5 w-1.5 text-white" />
                                                  </div>
                                                )}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-[10px] px-2 py-1">
                                              <p>{color.name}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Footer Navigation */}
                              <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                        className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!selectedProductType || selectedSizes.length === 0 || selectedColors.length === 0}
                                        className={cn(
                                            "gap-2 px-6 transition-all",
                                            (selectedProductType && selectedSizes.length > 0 && selectedColors.length > 0)
                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5" 
                                                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        Next Step
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
                                    <span className="flex items-center gap-1">
                                        <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Enter</kbd> 
                                        Next
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Esc</kbd> 
                                        Back
                                    </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === "model" && (
                        <div className="flex flex-col h-full max-w-[800px] mx-auto w-full animate-fade-in">
                          <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold mb-2">Choose Your Model</h2>
                            <p className="text-muted-foreground">Select the model who will wear your product in the mockups</p>
                          </div>

                          <div className="flex items-center justify-center gap-4 mb-6">
                            <button
                              onClick={() => setUseModel(true)}
                              className={cn(
                                "flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all",
                                useModel 
                                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
                                  : "border-border hover:border-indigo-300"
                              )}
                            >
                              <User className={cn("h-6 w-6", useModel ? "text-indigo-600" : "text-muted-foreground")} />
                              <div className="text-left">
                                <p className={cn("font-semibold", useModel ? "text-indigo-900 dark:text-indigo-100" : "")}>On Model</p>
                                <p className="text-xs text-muted-foreground">Show on a real person</p>
                              </div>
                              {useModel && <Check className="h-5 w-5 text-indigo-600" />}
                            </button>
                            <button
                              onClick={() => setUseModel(false)}
                              className={cn(
                                "flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all",
                                !useModel 
                                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
                                  : "border-border hover:border-indigo-300"
                              )}
                            >
                              <Shirt className={cn("h-6 w-6", !useModel ? "text-indigo-600" : "text-muted-foreground")} />
                              <div className="text-left">
                                <p className={cn("font-semibold", !useModel ? "text-indigo-900 dark:text-indigo-100" : "")}>Flat Lay</p>
                                <p className="text-xs text-muted-foreground">Product only, no model</p>
                              </div>
                              {!useModel && <Check className="h-5 w-5 text-indigo-600" />}
                            </button>
                          </div>

                          {useModel && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <label className="text-sm font-semibold text-foreground">Sex</label>
                                    {genderAutoSelected && getGenderFromCategory(activeCategory) && (
                                      <span className="text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                        Auto-selected based on product
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    {(["MALE", "FEMALE"] as Sex[]).map((sex) => (
                                      <button
                                        key={sex}
                                        onClick={() => {
                                          setModelDetails({...modelDetails, sex});
                                          setGenderAutoSelected(false);
                                        }}
                                        className={cn(
                                          "flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all",
                                          modelDetails.sex === sex
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                            : "border-border hover:border-indigo-300"
                                        )}
                                      >
                                        {sex === "MALE" ? "Male" : "Female"}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-semibold text-foreground">Age Group</label>
                                  <Select 
                                    value={modelDetails.age} 
                                    onValueChange={(value: AgeGroup) => setModelDetails({...modelDetails, age: value})}
                                  >
                                    <SelectTrigger className="w-full h-12 rounded-lg">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="TEEN">Teen (13-17)</SelectItem>
                                      <SelectItem value="YOUNG_ADULT">Young Adult (18-25)</SelectItem>
                                      <SelectItem value="ADULT">Adult (26-45)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold text-foreground">Ethnicity</label>
                                  <Select 
                                    value={modelDetails.ethnicity} 
                                    onValueChange={(value: Ethnicity) => setModelDetails({...modelDetails, ethnicity: value})}
                                  >
                                    <SelectTrigger className="w-full h-12 rounded-lg">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="CAUCASIAN">Caucasian</SelectItem>
                                      <SelectItem value="AFRICAN">African</SelectItem>
                                      <SelectItem value="ASIAN">Asian</SelectItem>
                                      <SelectItem value="SOUTHEAST_ASIAN">Southeast Asian</SelectItem>
                                      <SelectItem value="HISPANIC">Hispanic</SelectItem>
                                      <SelectItem value="SOUTH_ASIAN">South Asian</SelectItem>
                                      <SelectItem value="MIDDLE_EASTERN">Middle Eastern</SelectItem>
                                      <SelectItem value="INDIGENOUS">Indigenous</SelectItem>
                                      <SelectItem value="MIXED">Mixed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-semibold text-foreground">Model Size</label>
                                  <div className="grid grid-cols-6 gap-1.5">
                                    {(["XS", "S", "M", "L", "XL", "XXL"] as ModelSize[]).map((size) => (
                                      <button
                                        key={size}
                                        onClick={() => setModelDetails({...modelDetails, modelSize: size})}
                                        className={cn(
                                          "py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                                          modelDetails.modelSize === size
                                            ? "border-indigo-600 bg-indigo-600 text-white"
                                            : "border-border hover:border-indigo-300"
                                        )}
                                      >
                                        {size}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {!useModel && (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="text-center p-8 bg-muted/50 rounded-2xl max-w-md">
                                <Shirt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Flat Lay Mode</h3>
                                <p className="text-muted-foreground text-sm">
                                  Your product will be displayed on a flat surface or invisible mannequin without a human model.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between">
                              <Button
                                variant="ghost"
                                onClick={handleBack}
                                className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Back
                              </Button>
                              <Button
                                onClick={handleNext}
                                className="gap-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all"
                              >
                                Next Step
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === "seamless" && (
                        <div className="h-full flex flex-col overflow-hidden animate-fade-in">
                          {/* Phase 1 & 2: Loading States */}
                          {(seamlessPhase === 'analyzing' || seamlessPhase === 'generating') && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                              <h2 className="text-lg font-medium text-foreground mb-1">
                                {seamlessPhase === 'analyzing' ? "Analyzing your image..." : "Running pattern lab..."}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {seamlessPhase === 'analyzing' ? "Recommending the best methods." : "Generating deterministic variations."}
                              </p>
                            </div>
                          )}

                          {/* Phase 3: Selecting Variation */}
                          {seamlessPhase === 'selecting' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                              {/* Info Banner */}
                              <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-4 mb-6 shrink-0">
                                <div className="flex items-start gap-3">
                                  <Info className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-100 mb-1">Pattern Lab</h3>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                      We analyzed your image and generated several options. The best methods are marked with a <span className="inline-flex items-center"><Star className="h-2.5 w-2.5 mx-0.5 fill-current" /></span>. Select your favorite pattern to continue.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {/* Variations Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                                  {seamlessVariations.map((variation) => {
                                    const isSelected = selectedVariationId === variation.id;
                                    const isAi = variation.id === 'ai_enhanced';
                                    
                                    if (isAi) {
                                      return (
                                        <div 
                                          key={variation.id}
                                          className="relative aspect-square rounded-xl border-4 border-dashed border-border bg-card/50 flex flex-col items-center justify-center text-center p-4 group cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                                        >
                                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4">
                                            <span className="text-xs font-bold text-white block truncate">{variation.name}</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mb-3">{variation.description}</p>
                                          <Button size="sm" className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
                                            <Sparkles className="h-3 w-3" />
                                            Generate
                                          </Button>
                                          <span className="text-[10px] text-muted-foreground mt-2">API Key required</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={variation.id}
                                        onClick={() => setSelectedVariationId(variation.id)}
                                        className={cn(
                                          "relative aspect-square rounded-xl overflow-hidden border-4 transition-all duration-200 cursor-pointer group",
                                          isSelected 
                                            ? "border-indigo-600 shadow-lg shadow-indigo-500/25 scale-105 z-10" 
                                            : "border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg"
                                        )}
                                      >
                                        {/* Pattern Preview */}
                                        <div 
                                          className="w-full h-full bg-muted"
                                          style={{
                                            backgroundImage: `url(${variation.url})`,
                                            backgroundSize: '33.33%',
                                            backgroundRepeat: 'repeat'
                                          }}
                                        />
                                        
                                        {/* Name Label */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4">
                                          <span className="text-xs font-bold text-white block truncate">{variation.name}</span>
                                        </div>

                                        {/* Recommended Badge */}
                                        {variation.isRecommended && (
                                          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                            <Star className="h-3 w-3 fill-current" />
                                            Best
                                          </div>
                                        )}

                                        {/* Selection Overlay */}
                                        {isSelected && (
                                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center backdrop-blur-[1px]">
                                            <CheckCircle2 className="h-12 w-12 text-white drop-shadow-md" />
                                          </div>
                                        )}

                                        {/* Download Button (Hover) */}
                                        {!isSelected && (
                                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black rounded-full shadow-sm backdrop-blur-sm text-foreground transition-colors">
                                              <Download className="h-4 w-4" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Live Preview & Scale */}
                                {selectedVariationId && (
                                  <div className="bg-card border-2 border-border rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-3">
                                      <h3 className="text-sm font-bold text-foreground">Live Preview & Scale</h3>
                                      <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                        <Download className="h-4 w-4" />
                                        Download Texture
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* Left: Preview */}
                                      <div 
                                        className="aspect-square rounded-lg border-2 border-border shadow-inner bg-muted w-full"
                                        style={{
                                          backgroundImage: `url(${seamlessVariations.find(v => v.id === selectedVariationId)?.url})`,
                                          backgroundSize: `${101 - patternScale}%`,
                                          backgroundRepeat: 'repeat'
                                        }}
                                      />

                                      {/* Right: Controls */}
                                      <div className="flex flex-col gap-3">
                                        <div className="bg-background border border-border rounded-lg p-4">
                                          <div className="flex items-center gap-2 mb-3">
                                            <Ruler className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-bold text-foreground">Pattern Scale</span>
                                          </div>
                                          
                                          <Slider 
                                            value={[patternScale]}
                                            onValueChange={(val) => setPatternScale(val[0])}
                                            min={1}
                                            max={100}
                                            step={1}
                                            className="py-2"
                                          />
                                          
                                          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
                                            <span>Small</span>
                                            <span>Large</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Footer Navigation */}
                              <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                        className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!selectedVariationId}
                                        className={cn(
                                            "gap-2 px-6 transition-all",
                                            selectedVariationId
                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5" 
                                                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        Next Step
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
                                    <span className="flex items-center gap-1">
                                        <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Enter</kbd> 
                                        Next
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Esc</kbd> 
                                        Back
                                    </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentStep === "angles" && (
                        <div className="flex flex-col h-full overflow-hidden animate-fade-in max-w-[640px] mx-auto w-full">
                          <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="mb-4 shrink-0">
                               <div className="flex items-center justify-between mb-2">
                                 <div className="flex items-center gap-2">
                                   <PersonStanding className="h-4 w-4 text-indigo-600" />
                                   <h2 className="text-sm font-bold text-foreground">Choose Camera Angles</h2>
                                 </div>
                                 
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => setSelectedAngles(MOCKUP_ANGLES.map(a => a.id))}
                                     disabled={selectedAngles.length === MOCKUP_ANGLES.length}
                                     className="text-[10px] font-medium text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                     Select All
                                   </button>
                                   <span className="text-border text-[10px]">|</span>
                                   <button 
                                     onClick={() => setSelectedAngles([])}
                                     disabled={selectedAngles.length === 0}
                                     className="text-[10px] font-medium text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                     Clear
                                   </button>
                                 </div>
                               </div>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4">
                              <div className="grid grid-cols-2 gap-2 md:gap-3 pb-4">
                                {MOCKUP_ANGLES.map((angle) => {
                                  const isSelected = selectedAngles.includes(angle.id);
                                  return (
                                    <div
                                      key={angle.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedAngles(selectedAngles.filter(id => id !== angle.id));
                                        } else {
                                          setSelectedAngles([...selectedAngles, angle.id]);
                                        }
                                      }}
                                      className={cn(
                                        "relative p-3 rounded-xl border-2 text-left transition-all duration-200 flex flex-col justify-between cursor-pointer min-h-[100px]",
                                        isSelected 
                                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm" 
                                          : "border-border bg-card hover:border-indigo-300 dark:hover:border-indigo-700"
                                      )}
                                    >
                                      {/* Top Section */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            isSelected ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-muted"
                                          )}>
                                            <angle.icon className={cn(
                                              "h-4 w-4",
                                              isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
                                            )} />
                                          </div>
                                          {angle.recommended && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px] font-bold uppercase border-0 px-1.5 h-5">
                                              Rec
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        <h3 className={cn(
                                          "text-xs font-bold mb-0.5 transition-colors",
                                          isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-foreground"
                                        )}>
                                          {angle.name}
                                        </h3>
                                        <p className={cn(
                                          "text-[10px] leading-tight transition-colors line-clamp-2",
                                          isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-muted-foreground"
                                        )}>
                                          {angle.description}
                                        </p>
                                      </div>

                                      {/* Bottom Section */}
                                      <div className="absolute top-2 right-2">
                                        <div className={cn(
                                          "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                          isSelected 
                                            ? "border-indigo-600 bg-indigo-600" 
                                            : "border-muted-foreground/20 bg-transparent"
                                        )}>
                                          {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Bottom Controls */}
                            <div className="pt-3 border-t border-border flex flex-col gap-3 mt-auto shrink-0">
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => setSelectedAngles(['front', 'three-quarter'])}
                                  className="flex-1 px-3 py-2 text-[10px] md:text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-100 dark:border-indigo-900/50"
                                >
                                  Standard Pack (2)
                                </button>
                                <button
                                  onClick={() => setSelectedAngles(MOCKUP_ANGLES.map(a => a.id))}
                                  className="flex-1 px-3 py-2 text-[10px] md:text-xs font-bold bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors border border-border"
                                >
                                  Full Collection ({MOCKUP_ANGLES.length})
                                </button>
                              </div>
                              
                              {selectedAngles.length > 0 && (
                                <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-lg px-3 py-2 text-[10px] md:text-xs font-medium w-full text-center shadow-sm flex justify-between items-center">
                                  <span>Total Output:</span>
                                  <span>
                                    <span className="font-bold text-indigo-300">{selectedAngles.length}</span> Angles × <span className="font-bold text-indigo-300">{selectedColors.length}</span> Colors = <span className="font-bold text-green-400">{selectedAngles.length * selectedColors.length}</span> Mockups
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={selectedAngles.length === 0}
                                    className={cn(
                                        "gap-2 px-6 transition-all",
                                        selectedAngles.length > 0
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Enter</kbd> 
                                    Next
                                </span>
                                <span className="mx-1">•</span>
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Esc</kbd> 
                                    Back
                                </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === "scene" && (
                        <div className="flex flex-col h-full max-w-[640px] mx-auto w-full animate-fade-in">
                          {/* Section 1: Quick Templates */}
                          <div className="mb-4 md:mb-6 shrink-0">
                            <h3 className="text-sm font-bold text-foreground/80 mb-3 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-indigo-600" />
                              Quick Templates
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { icon: Building, label: "Urban", prompt: "A vibrant urban street scene with graffiti walls, neon lights, and natural sunlight" },
                                { icon: Camera, label: "Studio", prompt: "A minimalist gray or white photography studio with professional soft lighting" },
                                { icon: Trees, label: "Nature", prompt: "A beautiful outdoor park setting with lush greenery and golden hour lighting" },
                                { icon: Coffee, label: "Cafe", prompt: "A cozy coffee shop interior with warm lighting, wood accents, and modern decor" },
                                { icon: Dumbbell, label: "Gym", prompt: "A modern fitness gym with motivational atmosphere and athletic equipment in the background" },
                                { icon: Sun, label: "Beach", prompt: "A sunny beach setting with sand, ocean waves, and bright summery daylight" },
                              ].map((template, i) => (
                                <button
                                  key={i}
                                  onClick={() => setEnvironmentPrompt(template.prompt)}
                                  className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-2 md:p-3 text-center rounded-xl border transition-all duration-150 h-[80px] md:h-[100px]",
                                    environmentPrompt === template.prompt
                                      ? "bg-indigo-50 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500 shadow-sm"
                                      : "bg-card border-border hover:bg-accent dark:hover:bg-accent/50 text-muted-foreground hover:text-foreground hover:border-indigo-300"
                                  )}
                                >
                                  <div className={cn(
                                    "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-colors",
                                    environmentPrompt === template.prompt ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-muted text-muted-foreground"
                                  )}>
                                    <template.icon className="h-4 w-4 md:h-5 md:w-5" />
                                  </div>
                                  <span className={cn(
                                    "text-[10px] md:text-sm font-medium",
                                    environmentPrompt === template.prompt ? "text-indigo-900 dark:text-indigo-100" : "text-current"
                                  )}>
                                    {template.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Section 2: Custom Scene Textarea */}
                          <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="text-sm font-bold text-foreground/80 mb-3 flex items-center gap-2">
                              <Wand2 className="h-4 w-4 text-indigo-600" />
                              Custom Scene
                            </h3>
                            <div className="relative flex-1 max-h-[200px] mb-2 group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                              <Textarea
                                value={environmentPrompt}
                                onChange={(e) => setEnvironmentPrompt(e.target.value)}
                                placeholder="Describe your perfect scene (e.g., Walking down a busy Tokyo street at night...)"
                                className={cn(
                                  "relative w-full h-full min-h-[120px] p-4 rounded-xl border-2 resize-none transition-colors text-sm md:text-base bg-background/95 backdrop-blur-sm",
                                  "focus-visible:ring-0 focus-visible:border-indigo-600 placeholder:text-muted-foreground/50"
                                )}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (environmentPrompt.length > 5) handleNext();
                                    }
                                    if (e.key === "Escape") handleBack();
                                }}
                              />
                              <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border border-border">
                                {environmentPrompt.length} chars
                              </div>
                            </div>
                            <p className="text-[10px] md:text-xs text-center text-muted-foreground">
                              AI will interpret this scene within your chosen Brand Style.
                            </p>
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-auto pt-6 border-t border-border flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={environmentPrompt.length <= 5}
                                    className={cn(
                                        "gap-2 px-6 transition-all",
                                        environmentPrompt.length > 5 
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Enter</kbd> 
                                    Next
                                </span>
                                <span className="mx-1">•</span>
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Esc</kbd> 
                                    Back
                                </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === "style" && (
                        <div>
                          <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold mb-2">Choose Brand Archetype</h2>
                            <p className="text-muted-foreground">Define the mood and aesthetic of your photoshoot</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {BRAND_STYLES.map((style) => {
                              const isSelected = selectedStyle === style.id;
                              return (
                                <div 
                                  key={style.id} 
                                  onClick={() => setSelectedStyle(style.id)}
                                  data-testid={`style-card-${style.id}`}
                                  className={cn(
                                    "group relative bg-card rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-lg",
                                    isSelected 
                                      ? "border-indigo-600 ring-4 ring-indigo-600/20 shadow-lg" 
                                      : "border-border hover:border-indigo-600/50"
                                  )}
                                >
                                  <div className="p-4 flex flex-col">
                                    <div className="relative w-full h-[120px] rounded-lg overflow-hidden mb-4 bg-muted">
                                      <img 
                                        src={style.img} 
                                        alt={style.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                      />
                                      {isSelected && (
                                        <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-1.5 shadow-lg">
                                          <Check className="h-3.5 w-3.5 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <h3 className="font-bold text-foreground text-sm">{style.name}</h3>
                                      <p className="text-muted-foreground text-xs">{style.tagline}</p>
                                      
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {style.keywords.map((keyword, idx) => (
                                          <Badge 
                                            key={idx}
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0.5 font-normal bg-muted hover:bg-muted text-muted-foreground"
                                          >
                                            {keyword}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={!selectedStyle}
                                    className={cn(
                                        "gap-2 px-6 transition-all",
                                        selectedStyle
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Enter</kbd> 
                                    Next
                                </span>
                                <span className="mx-1">•</span>
                                <span className="flex items-center gap-1">
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">Esc</kbd> 
                                    Back
                                </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === "generate" && (
                        <div className="h-full flex flex-col">
                          {!generatedMockups.length && !isGenerating ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[600px] mx-auto">
                              <h2 className="text-3xl font-bold mb-6">Ready to Generate Photoshoot</h2>
                              
                              <div className="bg-muted/30 rounded-2xl p-6 w-full mb-8 border border-border">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                                  <span className="text-sm font-medium text-muted-foreground">Product</span>
                                  <span className="font-bold">{selectedProductType || "T-Shirt"}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                                  <span className="text-sm font-medium text-muted-foreground">Model</span>
                                  <span className="font-bold">{useModel ? `${modelDetails.sex === "MALE" ? "Male" : "Female"} - ${modelDetails.ethnicity.charAt(0) + modelDetails.ethnicity.slice(1).toLowerCase().replace("_", " ")}` : "Flat Lay"}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                                  <span className="text-sm font-medium text-muted-foreground">Style</span>
                                  <span className="font-bold">{BRAND_STYLES.find(s => s.id === selectedStyle)?.name || "Minimal"}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                                  <span className="text-sm font-medium text-muted-foreground">Colors</span>
                                  <span className="font-bold">{selectedColors.length > 0 ? selectedColors.slice(0, 3).join(", ") + (selectedColors.length > 3 ? ` +${selectedColors.length - 3}` : "") : "White"}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                                  <span className="text-sm font-medium text-muted-foreground">Angles</span>
                                  <span className="font-bold">{selectedAngles.length > 0 ? selectedAngles.join(", ") : "front"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-muted-foreground">Total Output</span>
                                  <Badge className="bg-indigo-600">{Math.max(1, selectedAngles.length * selectedColors.length)} Mockups</Badge>
                                </div>
                              </div>

                              <Button 
                                size="lg" 
                                onClick={handleGenerate}
                                className="h-14 px-10 text-lg rounded-[12px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:brightness-110 shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-[1px]"
                              >
                                <Wand2 className="mr-2 h-5 w-5" />
                                Generate {Math.max(1, selectedAngles.length * selectedColors.length)} Mockups
                              </Button>
                            </div>
                          ) : isGenerating && generatedMockups.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[400px] mx-auto">
                              <div className="relative mb-8 w-full">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                                <RefreshCw className="h-16 w-16 text-indigo-600 animate-spin relative z-10 mx-auto" />
                              </div>
                              
                              <h2 className="text-2xl font-bold mb-2">Generating Photoshoot...</h2>
                              <p className="text-indigo-600 font-medium mb-4">{generationStage}</p>
                              
                              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden mb-2">
                                <motion.div 
                                  className="bg-indigo-600 h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${generationProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mb-4">{generationProgress}% complete</p>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setIsGenerating(false);
                                  setGenerationProgress(0);
                                  setGenerationStage("");
                                  toast({
                                    title: "Generation Cancelled",
                                    description: "You can restart the generation anytime.",
                                  });
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Cancel Generation
                              </Button>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                      {isGenerating 
                                        ? `${generatedMockups.length} of ${expectedMockupsCount} Generating...`
                                        : `${generatedMockups.length} ${generatedMockups.length === 1 ? "Mockup" : "Mockups"} Ready`
                                      }
                                    </h2>
                                    {isGenerating && (
                                      <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{selectedProductType || "T-Shirt"} - {BRAND_STYLES.find(s => s.id === selectedStyle)?.name || "Minimal"}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                                  <Button variant="outline" onClick={() => setJourney(null)} className="flex-1 sm:flex-none" disabled={isGenerating}>Start Over</Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => {
                                      setGeneratedMockups([]);
                                      handleGenerate();
                                    }}
                                    className="flex-1 sm:flex-none"
                                    data-testid="button-regenerate"
                                    disabled={isGenerating}
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Regenerate
                                  </Button>
                                  <Button 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none"
                                    onClick={() => {
                                      const timestamp = Date.now();
                                      generatedMockups.forEach((mockup, i) => 
                                        downloadImage(mockup.src, `mockup_${mockup.size}_${mockup.color.replace(/\s+/g, '-')}_${mockup.angle}_${timestamp}_${i}.png`)
                                      );
                                    }}
                                    disabled={isGenerating || generatedMockups.length === 0}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download All
                                  </Button>
                                </div>
                              </div>

                              {/* Collapsible Summary Panel */}
                              <Collapsible
                                open={summaryOpen}
                                onOpenChange={setSummaryOpen}
                                className="mb-4 shrink-0"
                                data-testid="collapsible-summary"
                              >
                                <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
                                  <CollapsibleTrigger asChild>
                                    <button className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors" data-testid="button-toggle-summary">
                                      <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-indigo-600" />
                                        <span className="text-sm font-medium text-foreground">Generation Summary</span>
                                      </div>
                                      <ChevronDown className={cn(
                                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                        summaryOpen && "rotate-180"
                                      )} />
                                    </button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="px-4 pb-4 pt-0">
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {/* Product */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-product">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Shirt className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Product</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">{selectedProductType || "T-Shirt"}</p>
                                        </div>

                                        {/* Colors */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-colors">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Palette className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Colors</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">
                                            {selectedColors.length > 0 
                                              ? selectedColors.slice(0, 3).join(", ") + (selectedColors.length > 3 ? ` +${selectedColors.length - 3}` : "") 
                                              : "White"}
                                          </p>
                                        </div>

                                        {/* Sizes */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-sizes">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Ruler className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sizes</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">
                                            {selectedSizes.length > 0 ? selectedSizes.join(", ") : "L"}
                                          </p>
                                        </div>

                                        {/* Model */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-model">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <User className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Model</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">
                                            {useModel 
                                              ? `${modelDetails.sex === "MALE" ? "M" : "F"}, ${modelDetails.age === "ADULT" ? "Adult" : modelDetails.age === "YOUNG_ADULT" ? "Young" : "Teen"}, ${modelDetails.ethnicity.charAt(0) + modelDetails.ethnicity.slice(1).toLowerCase().replace("_", " ")}, ${modelDetails.modelSize}`
                                              : "Flat Lay"}
                                          </p>
                                        </div>

                                        {/* Brand Style */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-brand-style">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Sparkles className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Style</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">
                                            {BRAND_STYLES.find(s => s.id === selectedStyle)?.name || "Minimal"}
                                          </p>
                                        </div>

                                        {/* Angles */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-angles">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Camera className="h-3 w-3 text-indigo-600" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Angles</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">
                                            {selectedAngles.length > 0 
                                              ? selectedAngles.map(a => 
                                                  a === 'front' ? 'Front' : 
                                                  a === 'three-quarter' ? '3/4' : 
                                                  a === 'side' ? 'Side' : 
                                                  a === 'closeup' ? 'Close' : a
                                                ).join(", ")
                                              : "Front"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>

                              {isGenerating && (
                                <div className="mb-4 shrink-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-indigo-600 font-medium">{generationStage}</p>
                                    <p className="text-xs text-muted-foreground">{generationProgress}%</p>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <motion.div 
                                      className="bg-indigo-600 h-full rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${generationProgress}%` }}
                                    />
                                  </div>
                                  <Button 
                                    variant="link" 
                                    size="sm"
                                    onClick={() => {
                                      setIsGenerating(false);
                                      setGenerationProgress(0);
                                      setGenerationStage("");
                                      toast({
                                        title: "Generation Cancelled",
                                        description: "You can restart the generation anytime.",
                                      });
                                    }}
                                    className="text-muted-foreground hover:text-foreground p-0 h-auto mt-2"
                                  >
                                    Cancel Generation
                                  </Button>
                                </div>
                              )}

                              <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 md:mx-0 md:px-0">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pb-20">
                                  {personaHeadshot && useModel && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3 }}
                                      className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent"
                                    >
                                      <img src={personaHeadshot} alt="Character Reference" className="w-full h-full object-cover" />
                                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                        <p className="text-white text-xs font-medium text-center">Character Reference</p>
                                        <p className="text-white/70 text-[10px] text-center">All mockups feature this model</p>
                                      </div>
                                      <Badge className="absolute top-2 left-2 bg-indigo-600 text-[10px] border-0 text-white font-semibold px-2 py-0.5">
                                        <User className="h-3 w-3 mr-1" />
                                        Persona Lock
                                      </Badge>
                                    </motion.div>
                                  )}
                                  {generatedMockups.map((mockup, i) => {
                                    const angleName = mockup.angle === 'front' ? 'Front View' : 
                                                     mockup.angle === 'three-quarter' ? 'Three-Quarter View' :
                                                     mockup.angle === 'side' ? 'Side View' :
                                                     mockup.angle === 'closeup' ? 'Close-up View' : mockup.angle;
                                    return (
                                      <motion.div
                                        key={`mockup-${i}`}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-border cursor-pointer"
                                      >
                                        <img src={mockup.src} alt={`Mockup ${i + 1}`} className="w-full h-full object-cover" />
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                                          <div className="flex items-center justify-end gap-2">
                                            <Button 
                                              size="icon" 
                                              className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const styleName = BRAND_STYLES.find(s => s.id === selectedStyle)?.name || "Minimal";
                                                setSelectedMockupDetails({
                                                  src: mockup.src,
                                                  angle: angleName,
                                                  color: mockup.color,
                                                  size: mockup.size,
                                                  brandStyle: styleName,
                                                  index: i
                                                });
                                              }}
                                            >
                                              <Maximize className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                downloadImage(mockup.src, `mockup_${mockup.size}_${mockup.color.replace(/\s+/g, '-')}_${mockup.angle}_${Date.now()}_${i}.png`);
                                              }}
                                            >
                                              <Download className="h-3.5 w-3.5 mr-1.5" />
                                              Download
                                            </Button>
                                          </div>
                                        </div>

                                        <Badge className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-[10px] border-0 text-white font-normal px-2 py-0.5">
                                          {angleName}
                                        </Badge>
                                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                                          <Badge className="bg-indigo-600/80 backdrop-blur-md text-[10px] border-0 text-white font-semibold px-2 py-0.5">
                                            {mockup.size}
                                          </Badge>
                                          <Badge className="bg-emerald-600/80 backdrop-blur-md text-[10px] border-0 text-white font-normal px-2 py-0.5">
                                            {mockup.color}
                                          </Badge>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                  
                                  {isGenerating && Array.from({ length: Math.max(0, expectedMockupsCount - generatedMockups.length) }).map((_, i) => (
                                    <motion.div
                                      key={`placeholder-${i}`}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ duration: 0.2 }}
                                      className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted/30"
                                    >
                                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                        <div className="relative">
                                          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin relative z-10" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Generating...</p>
                                      </div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-muted/50 to-transparent" />
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>


              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMockupDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectedMockupDetails(null)}
            data-testid="modal-mockup-details"
          >
            <div 
              className="w-full max-w-7xl h-[90vh] md:h-[85vh] bg-card rounded-2xl overflow-hidden flex flex-col md:flex-row border border-border shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Left: Image */}
              <div className="w-full h-[40vh] md:h-auto md:flex-1 bg-muted/20 flex items-center justify-center p-4 md:p-8 relative group bg-checkerboard">
                <img 
                  src={selectedMockupDetails.src} 
                  alt={`Mockup ${selectedMockupDetails.index + 1}`} 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                  data-testid="img-mockup-fullsize"
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
                  <h3 className="font-bold text-foreground">Mockup Details</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedMockupDetails(null)} 
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="button-close-modal"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                      onClick={() => downloadImage(selectedMockupDetails.src, `mockup_${selectedMockupDetails.index + 1}_${selectedMockupDetails.color}_${selectedMockupDetails.angle.replace(/\s+/g, '_')}.png`)}
                      data-testid="button-download-mockup"
                    >
                      <Download className="h-5 w-5" />
                      <span className="text-[10px]">Download</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                      onClick={() => toast({ title: "Copied to clipboard" })}
                    >
                      <Copy className="h-5 w-5" />
                      <span className="text-[10px]">Copy</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                    >
                      <Star className="h-5 w-5" />
                      <span className="text-[10px]">Like</span>
                    </Button>
                  </div>

                  {/* Mockup Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mockup Info</label>
                    <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <Camera className="h-3.5 w-3.5" />
                          View Angle
                        </span>
                        <span className="text-sm font-medium text-foreground" data-testid="text-view-angle">{selectedMockupDetails.angle}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <Palette className="h-3.5 w-3.5" />
                          Product Color
                        </span>
                        <span className="text-sm font-medium text-foreground" data-testid="text-product-color">{selectedMockupDetails.color}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          Brand Style
                        </span>
                        <span className="text-sm font-medium text-foreground" data-testid="text-brand-style">{selectedMockupDetails.brandStyle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Type</span>
                      <Badge variant="outline" className="uppercase">MOCKUP</Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Dimensions</span>
                      <span className="text-xs font-medium text-foreground">2048 x 2048</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Date Created</span>
                      <span className="text-xs font-medium text-foreground">Just now</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {[selectedMockupDetails.angle, selectedMockupDetails.color, selectedMockupDetails.brandStyle].map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
