import { useState, useRef, useEffect, useCallback } from "react";
import JSZip from "jszip";
import { 
  generateAllPatternVariations, 
  downloadTexture, 
  type PatternVariation 
} from "@/lib/patternUtils";
import type { BatchJob, BatchJobStatus } from "@shared/mockupTypes";
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
  ChevronUp,
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
  Minimize2,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
  Star,
  CheckCircle2,
  Ruler,
  Eye,
  EyeOff,
  Package,
  RotateCw,
  Archive
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
import { getTransferredImage, clearTransferredImage, fetchImageAsDataUrl } from "@/lib/image-transfer";
import { Input } from "@/components/ui/input";
import { mockupApi, MockupEvent } from "@/lib/api";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

// Import sample mood images
import moodMinimal from "@assets/generated_images/mood_image_for_minimalist_luxury_style.png";
import moodUrban from "@assets/generated_images/mood_image_for_urban_street_style.png";
import moodNatural from "@assets/generated_images/mood_image_for_natural_organic_style.png";
import moodBold from "@assets/generated_images/mood_image_for_bold_vibrant_style.png";


// Types
type JourneyType = "DTG" | "AOP" | null;
type WizardStep = 
  | "design"      // Upload design (+ Seamless for AOP)
  | "product"     // Product picker only
  | "customize"   // Sizes + Colors + Model + Scene
  | "output";     // Angles + Quality + Generate

type AgeGroup = "ADULT" | "YOUNG_ADULT" | "TEEN";
type Sex = "MALE" | "FEMALE";
type Ethnicity = "CAUCASIAN" | "AFRICAN" | "ASIAN" | "SOUTHEAST_ASIAN" | "HISPANIC" | "SOUTH_ASIAN" | "MIDDLE_EASTERN" | "INDIGENOUS" | "MIXED";
type ModelSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";
type OutputQuality = "standard" | "high" | "ultra";
type HairStyle = "Short" | "Medium" | "Long" | "Bald";
type Expression = "Neutral" | "Smiling" | "Serious" | "Candid";
type PoseSuggestion = "Casual" | "Athletic" | "Professional" | "Lifestyle";

interface ModelCustomization {
  hairStyle?: HairStyle;
  expression?: Expression;
  poseSuggestion?: PoseSuggestion;
}

interface ModelDetails {
  age: AgeGroup;
  sex: Sex;
  ethnicity: Ethnicity;
  modelSize: ModelSize;
  customization?: ModelCustomization;
}

const OUTPUT_QUALITY_OPTIONS: { id: OutputQuality; name: string; resolution: string; credits: number; bestFor: string }[] = [
  { id: "standard", name: "Standard", resolution: "512px", credits: 1, bestFor: "Web previews, social media thumbnails" },
  { id: "high", name: "High", resolution: "1024px", credits: 2, bestFor: "E-commerce, websites, high-quality social media" },
  { id: "ultra", name: "Ultra", resolution: "2048px", credits: 4, bestFor: "Print-ready, large format, professional catalogs" }
];

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

const DTG_STEPS: WizardStep[] = ["design", "product", "customize", "output"];
const AOP_STEPS: WizardStep[] = ["design", "product", "customize", "output"];

interface ProductItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProductCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ProductItem[];
}

const DTG_PRODUCT_CATEGORIES: ProductCategory[] = [
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
];

const AOP_PRODUCT_CATEGORIES: ProductCategory[] = [
  { 
    name: "Apparel", 
    icon: Shirt,
    items: [
      { name: "AOP Men's Cut & Sew Tee", icon: Shirt },
      { name: "Unisex AOP Hoodie", icon: Cloud },
      { name: "Unisex AOP Sweatshirt", icon: Layers },
      { name: "AOP Women's Tee", icon: Shirt },
      { name: "AOP Women's Leggings", icon: Layers },
      { name: "AOP One-Piece Swimsuit", icon: Umbrella },
    ]
  },
  { 
    name: "Accessories", 
    icon: Watch, 
    items: [
      { name: "AOP Tote Bag", icon: ShoppingBag },
    ] 
  },
  { 
    name: "Home & Living", 
    icon: Coffee, 
    items: [
      { name: "AOP Square Pillow", icon: Layers },
      { name: "AOP Fleece Blanket", icon: Layers },
      { name: "AOP Beach Towel", icon: Layers },
    ] 
  }
];

const MOCKUP_ANGLES = [
  { id: 'front', name: 'Front View', description: 'Direct frontal shot - the hero image.', icon: PersonStanding, recommended: true },
  { id: 'three-quarter', name: 'Three-Quarter', description: '45° angle to show dimension and fit.', icon: View, recommended: true },
  { id: 'side', name: 'Side Profile', description: '90° side view to showcase silhouette.', icon: Combine, recommended: false },
  { id: 'closeup', name: 'Close-up View', description: 'Detailed shot of the design and fabric.', icon: Search, recommended: true },
];

const PRODUCT_SILHOUETTES: Record<string, { svg: string; designArea: { top: string; left: string; width: string; height: string } }> = {
  "T-shirts": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 5 L35 0 L50 5 L65 0 L80 5 L95 25 L75 35 L75 115 L25 115 L25 35 L5 25 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "30%", left: "28%", width: "44%", height: "40%" }
  },
  "Hoodies": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 15 L35 5 L50 15 L65 5 L85 15 L95 40 L80 45 L80 115 L20 115 L20 45 L5 40 Z M35 5 Q50 -5 65 5" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M35 115 L35 85 L65 85 L65 115" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.3"/></svg>`,
    designArea: { top: "25%", left: "30%", width: "40%", height: "35%" }
  },
  "Sweatshirts": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 15 L35 5 L50 10 L65 5 L85 15 L95 40 L80 45 L80 115 L20 115 L20 45 L5 40 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "25%", left: "28%", width: "44%", height: "38%" }
  },
  "Tank tops": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M25 0 L35 0 L35 15 L65 15 L65 0 L75 0 L80 30 L80 115 L20 115 L20 30 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "25%", left: "28%", width: "44%", height: "42%" }
  },
  "Polo shirts": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 5 L35 0 L50 8 L65 0 L80 5 L95 25 L75 35 L75 115 L25 115 L25 35 L5 25 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M42 0 L50 15 L58 0" stroke="currentColor" stroke-width="1" fill="none" opacity="0.4"/></svg>`,
    designArea: { top: "30%", left: "28%", width: "44%", height: "40%" }
  },
  "3/4 sleeve shirts": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 5 L35 0 L50 5 L65 0 L80 5 L92 20 L78 28 L78 115 L22 115 L22 28 L8 20 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "30%", left: "28%", width: "44%", height: "40%" }
  },
  "Long sleeve shirts": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 5 L35 0 L50 5 L65 0 L80 5 L100 45 L90 50 L80 35 L80 115 L20 115 L20 35 L10 50 L0 45 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "30%", left: "28%", width: "44%", height: "40%" }
  },
  "Embroidered shirts": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 5 L35 0 L50 5 L65 0 L80 5 L95 25 L75 35 L75 115 L25 115 L25 35 L5 25 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><circle cx="35" cy="35" r="8" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.4"/></svg>`,
    designArea: { top: "30%", left: "28%", width: "44%", height: "40%" }
  },
  "Jackets & vests": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 10 L35 0 L50 8 L65 0 L85 10 L100 50 L85 55 L85 115 L15 115 L15 55 L0 50 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M50 8 L50 115" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.3"/><path d="M35 25 L35 35" stroke="currentColor" stroke-width="2" opacity="0.3"/><path d="M65 25 L65 35" stroke="currentColor" stroke-width="2" opacity="0.3"/></svg>`,
    designArea: { top: "25%", left: "28%", width: "44%", height: "40%" }
  },
  "Jackets": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 10 L35 0 L50 8 L65 0 L85 10 L100 50 L85 55 L85 115 L15 115 L15 55 L0 50 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M50 8 L50 115" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.3"/></svg>`,
    designArea: { top: "25%", left: "28%", width: "44%", height: "40%" }
  },
  "Knitwear": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 15 L35 5 L50 10 L65 5 L85 15 L95 40 L80 45 L80 115 L20 115 L20 45 L5 40 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M25 30 L75 30 M25 40 L75 40 M25 50 L75 50" stroke="currentColor" stroke-width="0.5" opacity="0.3"/></svg>`,
    designArea: { top: "25%", left: "28%", width: "44%", height: "38%" }
  },
  "Crop tops": {
    svg: `<svg viewBox="0 0 100 90" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M25 0 L35 0 L35 12 L65 12 L65 0 L75 0 L80 25 L80 85 L20 85 L20 25 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "25%", left: "28%", width: "44%", height: "45%" }
  },
  "Dresses": {
    svg: `<svg viewBox="0 0 100 140" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M30 0 L40 0 L40 10 L60 10 L60 0 L70 0 L75 20 L70 40 L85 135 L15 135 L30 40 L25 20 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "15%", left: "28%", width: "44%", height: "50%" }
  },
  "All-over shirts": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 5 L35 0 L50 5 L65 0 L80 5 L95 25 L75 35 L75 115 L25 115 L25 35 L5 25 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M30 45 L40 45 M60 45 L70 45 M30 65 L40 65 M60 65 L70 65 M45 55 L55 55" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>`,
    designArea: { top: "30%", left: "28%", width: "44%", height: "40%" }
  },
  "Hats": {
    svg: `<svg viewBox="0 0 100 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 55 Q10 25 50 25 Q90 25 90 55 L95 60 L95 70 L5 70 L5 60 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M25 25 Q25 10 50 10 Q75 10 75 25" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "35%", left: "25%", width: "50%", height: "35%" }
  },
  "Leggings": {
    svg: `<svg viewBox="0 0 80 140" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 0 L70 0 L70 20 Q55 25 55 40 L55 135 L45 135 L45 40 Q45 30 40 25 Q35 30 35 40 L35 135 L25 135 L25 40 Q25 25 10 20 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "5%", left: "20%", width: "60%", height: "25%" }
  },
  "Baby bodysuits": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M25 5 L35 0 L50 5 L65 0 L75 5 L90 20 L75 28 L75 60 L70 75 L60 75 L55 60 L45 60 L40 75 L30 75 L25 60 L25 28 L10 20 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "30%", left: "30%", width: "40%", height: "35%" }
  },
  "Tote bags": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 25 L85 25 L85 115 L15 115 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M30 25 Q30 5 50 5 Q70 5 70 25" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    designArea: { top: "30%", left: "20%", width: "60%", height: "55%" }
  },
  "AOP Tote Bag": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 25 L85 25 L85 115 L15 115 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M30 25 Q30 5 50 5 Q70 5 70 25" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    designArea: { top: "30%", left: "20%", width: "60%", height: "55%" }
  },
  "Duffle bags": {
    svg: `<svg viewBox="0 0 120 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="45" rx="55" ry="30" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M30 20 Q60 5 90 20" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    designArea: { top: "25%", left: "20%", width: "60%", height: "50%" }
  },
  "Drawstring bags": {
    svg: `<svg viewBox="0 0 80 110" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 L70 20 L75 105 L5 105 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M20 20 Q20 5 40 5 Q60 5 60 20" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15 25 L65 25" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>`,
    designArea: { top: "25%", left: "18%", width: "64%", height: "55%" }
  },
  "Backpacks": {
    svg: `<svg viewBox="0 0 90 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 25 L75 25 L80 115 L10 115 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M25 25 Q25 10 45 10 Q65 10 65 25" stroke="currentColor" stroke-width="2" fill="none"/><rect x="25" y="60" width="40" height="25" rx="3" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.3"/></svg>`,
    designArea: { top: "30%", left: "20%", width: "60%", height: "45%" }
  },
  "Handbags": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 35 L85 35 L80 95 L20 95 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M30 35 Q30 10 50 10 Q70 10 70 35" stroke="currentColor" stroke-width="3" fill="none"/><path d="M40 55 L60 55" stroke="currentColor" stroke-width="2" opacity="0.3"/></svg>`,
    designArea: { top: "40%", left: "22%", width: "56%", height: "45%" }
  },
  "Flip flops": {
    svg: `<svg viewBox="0 0 100 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><ellipse cx="30" cy="60" rx="22" ry="45" stroke="currentColor" stroke-width="1" fill="currentColor"/><ellipse cx="70" cy="60" rx="22" ry="45" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M30 25 L30 50 M25 45 L35 45" stroke="currentColor" stroke-width="2" opacity="0.3"/><path d="M70 25 L70 50 M65 45 L75 45" stroke="currentColor" stroke-width="2" opacity="0.3"/></svg>`,
    designArea: { top: "20%", left: "15%", width: "70%", height: "50%" }
  },
  "Shoes": {
    svg: `<svg viewBox="0 0 120 70" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 35 Q10 15 40 15 L80 15 Q110 15 115 35 L115 55 L10 55 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M40 25 L80 25" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>`,
    designArea: { top: "20%", left: "25%", width: "50%", height: "50%" }
  },
  "Socks": {
    svg: `<svg viewBox="0 0 60 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 0 L50 0 L50 70 Q50 95 35 100 L20 105 Q5 105 5 90 L5 80 Q5 70 15 65 L15 0" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M10 20 L50 20" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>`,
    designArea: { top: "25%", left: "20%", width: "60%", height: "35%" }
  },
  "Phone cases": {
    svg: `<svg viewBox="0 0 60 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="50" height="110" rx="8" stroke="currentColor" stroke-width="1" fill="currentColor"/><rect x="20" y="10" width="20" height="5" rx="2" fill="currentColor" opacity="0.3"/></svg>`,
    designArea: { top: "15%", left: "15%", width: "70%", height: "70%" }
  },
  "Laptop cases": {
    svg: `<svg viewBox="0 0 130 90" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="120" height="80" rx="5" stroke="currentColor" stroke-width="1" fill="currentColor"/><rect x="15" y="15" width="100" height="60" rx="2" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3"/></svg>`,
    designArea: { top: "15%", left: "15%", width: "70%", height: "70%" }
  },
  "Mouse pads": {
    svg: `<svg viewBox="0 0 120 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10" width="110" height="80" rx="5" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "12%", left: "10%", width: "80%", height: "76%" }
  },
  "Face masks": {
    svg: `<svg viewBox="0 0 100 70" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 25 Q10 10 50 10 Q90 10 90 25 L90 50 Q90 65 50 65 Q10 65 10 50 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M5 30 L10 30 M90 30 L95 30" stroke="currentColor" stroke-width="2" opacity="0.5"/><path d="M25 35 L75 35 M25 45 L75 45" stroke="currentColor" stroke-width="0.5" opacity="0.3"/></svg>`,
    designArea: { top: "20%", left: "20%", width: "60%", height: "55%" }
  },
  "Wall art": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="2" stroke="currentColor" stroke-width="1" fill="currentColor"/><rect x="15" y="15" width="70" height="70" rx="1" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3"/></svg>`,
    designArea: { top: "15%", left: "15%", width: "70%", height: "70%" }
  },
  "Mugs": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 20 L70 20 L70 85 Q70 95 50 95 L35 95 Q15 95 15 85 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M70 35 Q90 35 90 55 Q90 75 70 75" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
    designArea: { top: "25%", left: "18%", width: "50%", height: "50%" }
  },
  "Posters": {
    svg: `<svg viewBox="0 0 100 130" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="110" rx="2" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "12%", left: "15%", width: "70%", height: "76%" }
  },
  "Framed posters": {
    svg: `<svg viewBox="0 0 110 140" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="100" height="130" rx="2" stroke="currentColor" stroke-width="3" fill="none"/><rect x="12" y="12" width="86" height="116" rx="1" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "12%", left: "14%", width: "72%", height: "76%" }
  },
  "Blankets": {
    svg: `<svg viewBox="0 0 120 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 10 L110 10 L110 90 L10 90 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M10 90 Q15 95 20 90 Q25 85 30 90 Q35 95 40 90 Q45 85 50 90 Q55 95 60 90 Q65 85 70 90 Q75 95 80 90 Q85 85 90 90 Q95 95 100 90 Q105 85 110 90" stroke="currentColor" stroke-width="1" fill="none" opacity="0.3"/></svg>`,
    designArea: { top: "10%", left: "10%", width: "80%", height: "75%" }
  },
  "AOP Fleece Blanket": {
    svg: `<svg viewBox="0 0 120 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 10 L110 10 L110 90 L10 90 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M10 90 Q15 95 20 90 Q25 85 30 90 Q35 95 40 90 Q45 85 50 90 Q55 95 60 90 Q65 85 70 90 Q75 95 80 90 Q85 85 90 90 Q95 95 100 90 Q105 85 110 90" stroke="currentColor" stroke-width="1" fill="none" opacity="0.3"/></svg>`,
    designArea: { top: "10%", left: "10%", width: "80%", height: "75%" }
  },
  "AOP Beach Towel": {
    svg: `<svg viewBox="0 0 80 140" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="70" height="130" rx="2" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M10 130 L70 130" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>`,
    designArea: { top: "8%", left: "12%", width: "76%", height: "84%" }
  },
  "Pillow cases": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="5" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "15%", left: "15%", width: "70%", height: "70%" }
  },
  "AOP Square Pillow": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="5" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "15%", left: "15%", width: "70%", height: "70%" }
  },
  "Magnets": {
    svg: `<svg viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="60" height="60" rx="3" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "15%", left: "15%", width: "70%", height: "70%" }
  },
  "Tableware": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="1" fill="currentColor"/><circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.3"/></svg>`,
    designArea: { top: "20%", left: "20%", width: "60%", height: "60%" }
  },
  "Water bottles": {
    svg: `<svg viewBox="0 0 50 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15 20 L35 20 L35 15 Q35 5 25 5 Q15 5 15 15 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M10 25 L40 25 L42 115 L8 115 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "25%", left: "18%", width: "64%", height: "55%" }
  },
  "Tumblers": {
    svg: `<svg viewBox="0 0 60 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 10 L50 10 L48 110 L12 110 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><ellipse cx="30" cy="10" rx="20" ry="5" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M15 25 L45 25" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>`,
    designArea: { top: "20%", left: "18%", width: "64%", height: "55%" }
  },
  "Coasters": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "18%", left: "18%", width: "64%", height: "64%" }
  },
  "Postcards": {
    svg: `<svg viewBox="0 0 120 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="110" height="70" rx="2" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M60 10 L60 70" stroke="currentColor" stroke-width="0.5" opacity="0.3"/></svg>`,
    designArea: { top: "12%", left: "8%", width: "42%", height: "76%" }
  },
  "Notebooks": {
    svg: `<svg viewBox="0 0 80 110" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="5" width="65" height="100" rx="2" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M5 15 L10 15 M5 30 L10 30 M5 45 L10 45 M5 60 L10 60 M5 75 L10 75 M5 90 L10 90" stroke="currentColor" stroke-width="2" opacity="0.4"/></svg>`,
    designArea: { top: "10%", left: "18%", width: "70%", height: "80%" }
  },
  "Stickers": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M75 75 Q85 75 85 65" stroke="currentColor" stroke-width="1" fill="none" opacity="0.4"/></svg>`,
    designArea: { top: "18%", left: "18%", width: "64%", height: "64%" }
  },
  "Aprons": {
    svg: `<svg viewBox="0 0 100 130" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M25 10 L75 10 L80 35 L80 125 L20 125 L20 35 Z" stroke="currentColor" stroke-width="1" fill="currentColor"/><path d="M25 10 Q10 15 10 25 M75 10 Q90 15 90 25" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 55 L5 55 M80 55 L95 55" stroke="currentColor" stroke-width="2" fill="none"/><rect x="35" y="75" width="30" height="25" rx="2" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.3"/></svg>`,
    designArea: { top: "15%", left: "28%", width: "44%", height: "40%" }
  },
  "default": {
    svg: `<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="15" width="70" height="70" rx="5" stroke="currentColor" stroke-width="1" fill="currentColor"/></svg>`,
    designArea: { top: "20%", left: "20%", width: "60%", height: "60%" }
  }
};

const PRODUCT_COLOR_MAP: Record<string, string> = {
  "White": "#FFFFFF",
  "Black": "#1a1a1a",
  "Sport Grey": "#9E9E9E",
  "Dark Heather": "#545454",
  "Charcoal": "#424242",
  "Navy": "#1A237E",
  "Royal": "#0D47A1",
  "Light Blue": "#ADD8E6",
  "Red": "#D32F2F",
  "Cardinal": "#880E4F",
  "Maroon": "#4A148C",
  "Orange": "#F57C00",
  "Gold": "#FBC02D",
  "Irish Green": "#388E3C",
  "Forest": "#1B5E20",
  "Purple": "#7B1FA2",
  "Light Pink": "#F8BBD0",
  "Sand": "#F5F5DC",
};

interface ProductPreviewProps {
  uploadedImage: string | null;
  selectedProduct: string | null;
  selectedColor: string;
  isMinimized: boolean;
  onToggle: () => void;
  journey: "DTG" | "AOP" | null;
}

function ProductPreview({ uploadedImage, selectedProduct, selectedColor, isMinimized, onToggle, journey }: ProductPreviewProps) {
  const productKey = selectedProduct || "T-shirts";
  const silhouette = PRODUCT_SILHOUETTES[productKey] || PRODUCT_SILHOUETTES["default"];
  const colorHex = PRODUCT_COLOR_MAP[selectedColor] || "#FFFFFF";
  const isLightColor = colorHex === "#FFFFFF" || colorHex === "#F5F5DC" || colorHex === "#F8BBD0" || colorHex === "#ADD8E6" || colorHex === "#FBC02D";
  
  if (isMinimized) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={onToggle}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-30 h-14 w-14 rounded-full bg-card border-2 border-border shadow-lg flex items-center justify-center hover:border-[#ed5387] hover:shadow-xl transition-all group"
        data-testid="button-expand-preview"
      >
        <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        {uploadedImage && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
            <CheckIcon className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </motion.button>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-30 w-[200px] md:w-[240px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      data-testid="panel-product-preview"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Preview</span>
        </div>
        <button
          onClick={onToggle}
          className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
          data-testid="button-minimize-preview"
        >
          <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <div className="p-3">
        <div 
          className="relative aspect-square rounded-xl overflow-hidden border border-border/50"
          style={{ backgroundColor: colorHex }}
        >
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: isLightColor ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" }}
            dangerouslySetInnerHTML={{ __html: silhouette.svg }}
          />
          
          {uploadedImage && (
            <div 
              className="absolute flex items-center justify-center"
              style={{
                top: silhouette.designArea.top,
                left: silhouette.designArea.left,
                width: silhouette.designArea.width,
                height: silhouette.designArea.height,
              }}
            >
              <img 
                src={uploadedImage} 
                alt="Design preview" 
                className="max-w-full max-h-full object-contain drop-shadow-md"
                style={{ 
                  mixBlendMode: journey === "AOP" ? "normal" : "multiply",
                  opacity: journey === "AOP" ? 1 : 0.95 
                }}
              />
            </div>
          )}
          
          {!uploadedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <ImageIcon className={cn("h-8 w-8 mb-2", isLightColor ? "text-gray-300" : "text-white/30")} />
              <span className={cn("text-xs", isLightColor ? "text-gray-400" : "text-white/40")}>Upload a design</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Product</span>
            <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{selectedProduct || "T-shirt"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Color</span>
            <div className="flex items-center gap-1.5">
              <div 
                className="h-3 w-3 rounded-full border border-border/50" 
                style={{ backgroundColor: colorHex }}
              />
              <span className="text-xs font-medium text-foreground">{selectedColor}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ProductThumbnailProps {
  productName: string;
  isSelected: boolean;
  color?: string;
}

function ProductThumbnail({ productName, isSelected, color = "#FFFFFF" }: ProductThumbnailProps) {
  const silhouette = PRODUCT_SILHOUETTES[productName] || PRODUCT_SILHOUETTES["default"];
  
  return (
    <div 
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center transition-colors overflow-hidden",
        isSelected ? "bg-[#ed5387]/20 dark:bg-[#ed5387]/40" : "bg-muted"
      )}
      style={{ backgroundColor: isSelected ? undefined : color }}
    >
      <div 
        className="h-6 w-6"
        style={{ color: isSelected ? "#ed5387" : "rgba(0,0,0,0.15)" }}
        dangerouslySetInnerHTML={{ __html: silhouette.svg }}
      />
    </div>
  );
}

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
  const [selectedProductType, setSelectedProductType] = useState<string | null>("T-shirts");
  const [environmentPrompt, setEnvironmentPrompt] = useState("A minimalist gray or white photography studio with professional soft lighting");
  const [selectedColors, setSelectedColors] = useState<string[]>(["White"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["M"]);
  const [selectedAngles, setSelectedAngles] = useState<string[]>(["front"]);
  const [modelDetails, setModelDetails] = useState<ModelDetails>({
    age: "ADULT",
    sex: "MALE",
    ethnicity: "CAUCASIAN",
    modelSize: "M"
  });
  const [useModel, setUseModel] = useState<boolean>(true);
  const [genderAutoSelected, setGenderAutoSelected] = useState<boolean>(true);
  const [personaHeadshot, setPersonaHeadshot] = useState<string | null>(null);
  const [outputQuality, setOutputQuality] = useState<OutputQuality>("high");
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState<boolean>(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showAllColors, setShowAllColors] = useState(false);
  // AOP-specific state
  const [isAlreadySeamless, setIsAlreadySeamless] = useState<boolean>(false);
  // Seamless Pattern State
  const [seamlessPhase, setSeamlessPhase] = useState<'analyzing' | 'generating' | 'selecting'>('analyzing');
  const [seamlessVariations, setSeamlessVariations] = useState<PatternVariation[]>([]);
  const [isGeneratingPatterns, setIsGeneratingPatterns] = useState(false);
  const [isGeneratingAIPattern, setIsGeneratingAIPattern] = useState(false);
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
  const [previewMinimized, setPreviewMinimized] = useState(true);
  const [showTransferBanner, setShowTransferBanner] = useState(false);
  
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const [failedJobs, setFailedJobs] = useState<BatchJob[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const completedJobs = batchJobs.filter(j => j.status === 'completed').length;
  const failedJobsCount = batchJobs.filter(j => j.status === 'failed').length;
  const pendingJobs = batchJobs.filter(j => j.status === 'pending').length;

  // Check for transferred image from My Creations on mount
  useEffect(() => {
    const transferred = getTransferredImage();
    if (transferred && transferred.src) {
      const loadTransferredImage = async () => {
        try {
          let imageSrc = transferred.src;
          // If it's a URL (not data URL), fetch and convert to data URL
          if (!imageSrc.startsWith('data:')) {
            imageSrc = await fetchImageAsDataUrl(imageSrc);
          }
          setUploadedImage(imageSrc);
          setPreviewMinimized(false);
          setShowTransferBanner(true);
          clearTransferredImage();
          // Auto-hide banner after 5 seconds
          setTimeout(() => setShowTransferBanner(false), 5000);
        } catch (error) {
          console.error("Failed to load transferred image:", error);
          clearTransferredImage();
        }
      };
      loadTransferredImage();
    }
  }, []);

  // Track previous journey to detect actual journey changes
  const prevJourneyRef = useRef<JourneyType>(null);
  
  // Reset product selection only when journey actually changes
  useEffect(() => {
    if (journey && journey !== prevJourneyRef.current) {
      const categories = journey === "AOP" ? AOP_PRODUCT_CATEGORIES : DTG_PRODUCT_CATEGORIES;
      const currentCat = categories.find(c => c.name === activeCategory);
      const products = currentCat?.items || categories[0]?.items || [];
      if (products.length > 0) {
        setSelectedProductType(products[0].name);
      }
      prevJourneyRef.current = journey;
    }
  }, [journey, activeCategory]);

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    if (generatedMockups.length === 0) return;
    
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const productName = (selectedProductType || 'product').replace(/\s+/g, '_').toLowerCase();
      const folderName = `mockups_${productName}_${Date.now()}`;
      const folder = zip.folder(folderName);
      
      if (!folder) throw new Error('Failed to create zip folder');

      const fetchPromises = generatedMockups.map(async (mockup, index) => {
        try {
          const colorName = mockup.color.replace(/\s+/g, '-').toLowerCase();
          const angleName = mockup.angle.replace(/\s+/g, '-').toLowerCase();
          const sizeName = mockup.size.toLowerCase();
          const filename = `${productName}_${colorName}_${angleName}_${sizeName}_${index + 1}.png`;
          
          if (mockup.src.startsWith('data:')) {
            const base64Data = mockup.src.split(',')[1];
            folder.file(filename, base64Data, { base64: true });
          } else {
            const response = await fetch(mockup.src);
            const blob = await response.blob();
            folder.file(filename, blob);
          }
        } catch (err) {
          console.error(`Failed to add ${mockup.angle} to zip:`, err);
        }
      });

      await Promise.all(fetchPromises);

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${generatedMockups.length} mockups saved as ZIP file`,
      });
    } catch (error) {
      console.error('ZIP download failed:', error);
      toast({
        title: "Download Failed",
        description: "Could not create ZIP file. Please try downloading individually.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const retryFailedJob = async (jobId: string) => {
    const job = batchJobs.find(j => j.id === jobId);
    if (!job) return;

    setBatchJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'pending' as BatchJobStatus, error: undefined, retryCount: j.retryCount + 1 } : j
    ));
    
    toast({
      title: "Retrying...",
      description: `Retrying generation for ${job.color} - ${job.angle}`,
    });
  };

  const retryAllFailed = () => {
    const failed = batchJobs.filter(j => j.status === 'failed');
    setBatchJobs(prev => prev.map(j => 
      j.status === 'failed' ? { ...j, status: 'pending' as BatchJobStatus, error: undefined, retryCount: j.retryCount + 1 } : j
    ));
    
    toast({
      title: "Retrying All Failed",
      description: `Retrying ${failed.length} failed generations`,
    });
  };

  // Both DTG and AOP now use the same 3-step flow
  const steps = DTG_STEPS;
  const currentStep = steps[currentStepIndex];
  
  const productCategories = journey === "AOP" ? AOP_PRODUCT_CATEGORIES : DTG_PRODUCT_CATEGORIES;
  
  const activeProductCategory = productCategories.find(c => c.name === activeCategory);
  const effectiveActiveCategory = activeProductCategory ? activeCategory : productCategories[0]?.name || "";
  const effectiveItems = activeProductCategory?.items || productCategories[0]?.items || [];
  
  useEffect(() => {
    if (journey && productCategories.length > 0) {
      const firstCategory = productCategories[0].name;
      if (!productCategories.find(c => c.name === activeCategory)) {
        setActiveCategory(firstCategory);
        setSelectedProductType(null);
      }
    }
  }, [journey, activeCategory, productCategories]);
  
  useEffect(() => {
    if (journey === "AOP" && isAlreadySeamless && uploadedImage) {
      setSelectedVariationId("original-seamless");
      setSeamlessVariations([{
        id: "original-seamless",
        name: "Original Pattern",
        description: "Your uploaded seamless pattern",
        url: uploadedImage,
        isRecommended: true
      }]);
      setSeamlessPhase('selecting');
    }
  }, [isAlreadySeamless, journey, uploadedImage]);

  // Generate pattern variations when entering seamless step
  const generatePatternVariations = useCallback(async () => {
    if (!uploadedImage || isGeneratingPatterns) return;
    
    setIsGeneratingPatterns(true);
    setSeamlessPhase('analyzing');
    
    try {
      // Short delay for analyzing phase visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      setSeamlessPhase('generating');
      
      // Generate actual pattern variations from uploaded image
      const variations = await generateAllPatternVariations(uploadedImage);
      setSeamlessVariations(variations);
      setSeamlessPhase('selecting');
      
      // Auto-select the recommended variation
      const recommended = variations.find(v => v.isRecommended);
      if (recommended) {
        setSelectedVariationId(recommended.id);
      }
    } catch (error) {
      console.error('Failed to generate patterns:', error);
      toast({
        title: "Pattern Generation Failed",
        description: "Could not generate seamless patterns. Please try again.",
        variant: "destructive",
      });
      setSeamlessPhase('selecting');
    } finally {
      setIsGeneratingPatterns(false);
    }
  }, [uploadedImage, isGeneratingPatterns, toast]);
  
  // Trigger pattern generation when entering design step with AOP journey
  useEffect(() => {
    if (currentStep === "design" && journey === "AOP" && !isAlreadySeamless && seamlessPhase === 'analyzing' && !isGeneratingPatterns && seamlessVariations.length === 0) {
      generatePatternVariations();
    }
  }, [currentStep, journey, isAlreadySeamless, seamlessPhase, isGeneratingPatterns, seamlessVariations.length, generatePatternVariations]);

  // Generate AI-enhanced pattern via API
  const generateAIEnhancedPattern = useCallback(async () => {
    if (!uploadedImage || isGeneratingAIPattern) return;
    
    setIsGeneratingAIPattern(true);
    
    try {
      const response = await fetch('/api/seamless-pattern/ai-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designImage: uploadedImage }),
      });
      
      const data = await response.json();
      
      if (data.success && data.patternUrl) {
        // Update the AI Enhanced variation with the generated pattern
        setSeamlessVariations(prev => prev.map(v => 
          v.id === 'ai_enhanced' 
            ? { ...v, url: data.patternUrl, isRecommended: false }
            : v
        ));
        // Auto-select the AI Enhanced pattern
        setSelectedVariationId('ai_enhanced');
        
        toast({
          title: "AI Pattern Generated",
          description: "Your AI-enhanced seamless pattern is ready!",
        });
      } else {
        throw new Error(data.message || 'Failed to generate AI pattern');
      }
    } catch (error) {
      console.error('AI pattern generation failed:', error);
      toast({
        title: "AI Pattern Failed",
        description: "Could not generate AI-enhanced pattern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAIPattern(false);
    }
  }, [uploadedImage, isGeneratingAIPattern, toast]);

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
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
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

    const styleName = "ECOMMERCE_CLEAN";
    const productName = selectedProductType || "t-shirt";
    const isAopJourney = journey === "AOP";
    const colors = isAopJourney ? ["White"] : (selectedColors.length > 0 ? selectedColors : ["White"]);
    const sizes = selectedSizes.length > 0 ? selectedSizes : ["M"];
    const angles = selectedAngles.length > 0 ? selectedAngles : ["front"];
    const scene = environmentPrompt || "studio";
    const totalExpected = Math.max(1, angles.length * colors.length);

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStage("Initializing...");
    setGeneratedMockups([]);
    setExpectedMockupsCount(totalExpected);

    const initialBatchJobs: BatchJob[] = [];
    colors.forEach((color) => {
      angles.forEach((angle) => {
        initialBatchJobs.push({
          id: `${color}-${angle}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          color,
          angle,
          size: sizes[0],
          status: 'pending',
          retryCount: 0
        });
      });
    });
    setBatchJobs(initialBatchJobs);
    setCurrentlyProcessing(null);

    if (intervalRef.current) clearInterval(intervalRef.current);

    const generatedImages: GeneratedMockupData[] = [];

    const selectedPattern = isAopJourney && selectedVariationId 
      ? seamlessVariations.find(v => v.id === selectedVariationId)
      : null;
    const designToUse = selectedPattern?.url || uploadedImage;

    try {
      await mockupApi.generateBatch(
        designToUse,
        {
          productType: productName,
          productColors: colors,
          productSizes: useModel ? sizes : undefined,
          angles: selectedAngles,
          scene: scene,
          style: styleName,
          modelDetails: useModel ? modelDetails : undefined,
          journey: journey || "DTG",
          patternScale: isAopJourney ? patternScale : undefined,
          isSeamlessPattern: isAopJourney,
          outputQuality: outputQuality,
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
                
                setBatchJobs(prev => prev.map(job => 
                  job.color === mockupData.color && job.angle === mockupData.angle
                    ? { ...job, status: 'completed' as BatchJobStatus, imageData: event.data.imageData, mimeType: event.data.mimeType }
                    : job
                ));
                setCurrentlyProcessing(null);
              }
              break;
            case "image_error":
              console.error(`Failed to generate ${event.data.angle} ${event.data.color || ''} view`);
              setBatchJobs(prev => prev.map(job => 
                job.color === event.data.color && job.angle === event.data.angle
                  ? { ...job, status: 'failed' as BatchJobStatus, error: event.data.error || 'Generation failed' }
                  : job
              ));
              setCurrentlyProcessing(null);
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
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
                      Mockup Generator
                    </h1>
                    <Shirt className="h-5 w-5 md:h-6 md:w-6 text-primary animate-cut" />
                  </div>
                  <Badge className="bg-primary hover:bg-[#C2185B] text-white rounded-full px-2 py-0.5 text-[11px]">
                    Professional
                  </Badge>
                </div>

                <div className="flex items-center gap-8 opacity-0 lg:opacity-100 animate-fade-in hidden lg:flex">
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Photorealistic 8K</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Grid className="h-3.5 w-3.5 text-secondary" />
                    <span>Smart 3D Mapping</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Camera className="h-3.5 w-3.5 text-[#1A1A2E]" />
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
                  className="bg-card border-2 border-border rounded-[20px] md:rounded-[24px] p-5 md:p-10 text-left cursor-pointer transition-all duration-300 hover:border-[#ed5387] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#ed5387]/15 group"
                >
                  <div className="h-10 w-10 md:h-16 md:w-16 rounded-xl bg-[#ed5387]/10 dark:bg-[#ed5387]/20 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
                    <Shirt className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-foreground mb-1 md:mb-3">Direct-to-Garment (DTG)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 md:mb-6">
                    For designs placed on a specific area of a product, like a logo on the chest of a t-shirt or a graphic on a tote bag.
                  </p>
                  <span className="text-xs md:text-sm font-bold text-primary group-hover:underline flex items-center">
                    Choose DTG <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </span>
                </div>

                {/* AOP Card */}
                <div 
                  onClick={() => handleJourneySelect("AOP")}
                  className="bg-card border-2 border-border rounded-[20px] md:rounded-[24px] p-5 md:p-10 text-left cursor-pointer transition-all duration-300 hover:border-secondary hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#9C27B0]/15 group relative overflow-hidden"
                >
                  <Badge className="absolute top-3 right-3 md:top-6 md:right-6 bg-purple-500 text-white hover:bg-purple-600 text-[10px] md:text-[11px]">Pro</Badge>
                  <div className="h-10 w-10 md:h-16 md:w-16 rounded-xl bg-[#9C27B0]/10 dark:bg-[#9C27B0]/20 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
                    <Grid className="h-5 w-5 md:h-8 md:w-8 text-secondary" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-foreground mb-1 md:mb-3">All-Over Print (AOP)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 md:mb-6">
                    For seamless patterns that cover the entire surface of a product, like leggings, backpacks, or custom-cut apparel.
                  </p>
                  <span className="text-xs md:text-sm font-bold text-secondary group-hover:underline flex items-center">
                    Choose AOP <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </span>
                </div>
              </div>

              {/* Design Transfer Banner - shown below DTG/AOP cards */}
              <AnimatePresence>
                {showTransferBanner && uploadedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-6 md:mt-8 w-full max-w-[900px] bg-gradient-to-r from-[#ed5387]/10 via-[#9C27B0]/10 to-[#ed5387]/10 border border-[#ed5387]/30 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl border-2 border-[#ed5387] overflow-hidden bg-white/10 flex-shrink-0 shadow-lg">
                        <img src={uploadedImage} alt="Transferred design" className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-5 w-5 text-[#ed5387]" />
                          <span className="font-bold text-foreground">Design Ready</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Your design from My Creations is loaded. Choose DTG or AOP above to continue.</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => setShowTransferBanner(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          // State 2: Step-by-Step Wizard
          <div className="flex-1 flex flex-col h-full">
            {/* Top Progress Bar - Mobile scrollable, desktop fixed */}
            <div className="bg-card border-b border-border px-2 sm:px-4 md:px-10 py-3 md:py-6">
              <div className="max-w-[1000px] mx-auto">
                <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 sm:overflow-visible sm:mx-0 sm:px-0">
                  <div className="relative flex justify-between items-center min-w-[340px] sm:min-w-0">
                    {/* Connecting Line */}
                    <div className="absolute top-[16px] sm:top-[18px] left-0 w-full h-[2px] bg-border -z-10">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {steps.map((step, index) => {
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      
                      const icons: Record<WizardStep, typeof Cloud> = {
                        design: Palette,
                        product: ShoppingBag,
                        customize: Layers,
                        output: Wand2
                      };
                      const stepLabels: Record<WizardStep, string> = {
                        design: "Design",
                        product: "Product",
                        customize: "Customize",
                        output: "Output"
                      };
                      const StepIcon = icons[step];

                      return (
                        <div key={step} className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0">
                          <div className={cn(
                            "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                            isCompleted ? "bg-primary border-primary text-white" :
                            isCurrent ? "bg-primary border-primary text-white ring-2 sm:ring-4 ring-[#ed5387]/20" :
                            "bg-card border-border text-muted-foreground"
                          )}>
                            <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                          <span className={cn(
                            "text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors text-center",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                          )}>
                            {stepLabels[step]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
                      {/* STEP CONTENT SWITCHER - CONSOLIDATED 3 STEPS */}
                      
                      {/* ========== STEP 1: DESIGN (Upload + Style + Seamless for AOP) ========== */}
                      {currentStep === "design" && (
                        <div className="flex flex-col h-full">
                          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
                            {/* Section 1: Upload Design */}
                            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <Cloud className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground">Upload Design</h3>
                                {uploadedImage && <Badge variant="secondary" className="text-[10px] ml-auto">Ready</Badge>}
                              </div>
                              
                              {!uploadedImage ? (
                                <div 
                                  className="w-full border-2 border-dashed border-border rounded-xl p-6 sm:p-10 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group active:scale-[0.99] text-center"
                                  onClick={() => fileInputRef.current?.click()}
                                  data-testid="dropzone-upload"
                                >
                                  <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                  />
                                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    <Cloud className="h-6 w-6 text-primary" />
                                  </div>
                                  <h4 className="text-base font-bold text-foreground mb-1">Drag & drop your design</h4>
                                  <p className="text-xs text-muted-foreground mb-2">or tap to browse</p>
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">PNG recommended</Badge>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbC1vcGFjaXR5PSIwLjEiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat rounded-lg border border-border overflow-hidden flex-shrink-0">
                                    <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">design_v1.png</p>
                                    <p className="text-xs text-muted-foreground mb-2">Ready for mockup</p>
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="h-8 text-xs"
                                      data-testid="button-change-image"
                                    >
                                      Change Image
                                    </Button>
                                    <input 
                                      type="file" 
                                      ref={fileInputRef} 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={handleFileUpload}
                                    />
                                  </div>
                                  
                                  {journey === "AOP" && (
                                    <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                                      <input 
                                        type="checkbox"
                                        checked={isAlreadySeamless}
                                        onChange={(e) => setIsAlreadySeamless(e.target.checked)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                      />
                                      <span className="text-xs text-muted-foreground">Already seamless</span>
                                    </label>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Section 2: Seamless Pattern (AOP only, when not already seamless) */}
                            {journey === "AOP" && uploadedImage && !isAlreadySeamless && (
                              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-4">
                                  <Layers className="h-4 w-4 text-secondary" />
                                  <h3 className="text-sm font-bold text-foreground">Pattern Lab</h3>
                                  {selectedVariationId && <Badge variant="secondary" className="text-[10px] ml-auto bg-secondary/20 text-secondary">Pattern Selected</Badge>}
                                </div>

                                {(seamlessPhase === 'analyzing' || seamlessPhase === 'generating') && (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                    <p className="ml-3 text-sm text-muted-foreground">
                                      {seamlessPhase === 'analyzing' ? "Analyzing design..." : "Generating patterns..."}
                                    </p>
                                  </div>
                                )}

                                {seamlessPhase === 'selecting' && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                      {seamlessVariations.map((variation) => {
                                        const isSelected = selectedVariationId === variation.id;
                                        const isAi = variation.id === 'ai_enhanced';
                                        
                                        if (isAi && (!variation.url || variation.url.length === 0)) {
                                          return (
                                            <div 
                                              key={variation.id}
                                              className="relative aspect-square rounded-lg border-2 border-dashed border-secondary/30 bg-secondary/5 flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:border-secondary/50 transition-all"
                                            >
                                              <Sparkles className="h-5 w-5 text-secondary mb-1" />
                                              <span className="text-[10px] font-medium text-foreground">AI</span>
                                              <Button 
                                                size="sm" 
                                                onClick={(e) => { e.stopPropagation(); generateAIEnhancedPattern(); }}
                                                disabled={isGeneratingAIPattern}
                                                className="h-6 text-[9px] mt-1 bg-secondary hover:bg-secondary/80"
                                              >
                                                {isGeneratingAIPattern ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generate"}
                                              </Button>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={variation.id}
                                            onClick={() => setSelectedVariationId(variation.id)}
                                            className={cn(
                                              "relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                                              isSelected 
                                                ? "border-primary shadow-lg scale-105 z-10" 
                                                : "border-transparent hover:border-primary/30"
                                            )}
                                          >
                                            <div 
                                              className="w-full h-full bg-muted"
                                              style={{
                                                backgroundImage: `url(${variation.url})`,
                                                backgroundSize: '33.33%',
                                                backgroundRepeat: 'repeat'
                                              }}
                                            />
                                            {variation.isRecommended && (
                                              <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                                                <Star className="h-2 w-2 fill-current" />
                                              </div>
                                            )}
                                            {isSelected && (
                                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <CheckCircle2 className="h-6 w-6 text-white drop-shadow" />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {selectedVariationId && (
                                      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-2 flex-1">
                                          <Layers className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-xs font-medium">Scale</span>
                                          <Slider 
                                            value={[patternScale]}
                                            onValueChange={(val) => setPatternScale(val[0])}
                                            min={10}
                                            max={100}
                                            step={1}
                                            className="flex-1 max-w-[200px]"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
                            <Button variant="ghost" onClick={handleBack} className="gap-2 min-h-[44px]" data-testid="button-back">
                              <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
                            </Button>
                            <Button
                              onClick={handleNext}
                              disabled={!uploadedImage || (journey === "AOP" && !isAlreadySeamless && !selectedVariationId)}
                              className={cn(
                                "gap-2 px-6 min-h-[44px] flex-1 sm:flex-none max-w-[200px]",
                                (uploadedImage && (journey !== "AOP" || isAlreadySeamless || selectedVariationId))
                                  ? "bg-primary hover:bg-[#C2185B] text-white" 
                                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                              )}
                              data-testid="button-next"
                            >
                              Next Step <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ========== STEP 2: PRODUCT (Product picker + Colors + Sizes + Model + Scene) ========== */}
                      {currentStep === "product" && (
                        <div className="flex flex-col h-full animate-fade-in">
                          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
                            {/* Product Picker - Visual Grid */}
                            <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                              <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-bold text-foreground">Select Product</label>
                                {selectedProductType && (
                                  <Badge variant="secondary" className="text-xs gap-1.5">
                                    <Check className="h-3 w-3" />
                                    {selectedProductType}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Search Input */}
                              <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search products..."
                                  value={productSearchQuery}
                                  onChange={(e) => setProductSearchQuery(e.target.value)}
                                  className="pl-10 h-10"
                                  data-testid="input-product-search"
                                />
                                {productSearchQuery && (
                                  <button
                                    onClick={() => setProductSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              {/* Category Tabs */}
                              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                {productCategories.map((cat) => {
                                  const isActive = effectiveActiveCategory === cat.name;
                                  const CatIcon = cat.icon;
                                  return (
                                    <button
                                      key={cat.name}
                                      onClick={() => {
                                        setActiveCategory(cat.name);
                                        setProductSearchQuery("");
                                      }}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                                        isActive
                                          ? "bg-primary text-white"
                                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      )}
                                      data-testid={`category-tab-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
                                    >
                                      <CatIcon className="h-4 w-4" />
                                      <span className="hidden sm:inline">{cat.name}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Product Grid */}
                              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1">
                                {(() => {
                                  const searchLower = productSearchQuery.toLowerCase();
                                  const itemsToShow = productSearchQuery
                                    ? productCategories.flatMap(cat => 
                                        cat.items
                                          .filter(item => item.name.toLowerCase().includes(searchLower))
                                          .map(item => ({ ...item, category: cat.name }))
                                      )
                                    : effectiveItems.map(item => ({ ...item, category: effectiveActiveCategory }));

                                  if (itemsToShow.length === 0) {
                                    return (
                                      <div className="col-span-full text-center py-8 text-muted-foreground">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No products found</p>
                                      </div>
                                    );
                                  }

                                  return itemsToShow.map((item) => {
                                    const isSelected = selectedProductType === item.name && effectiveActiveCategory === item.category;
                                    const silhouette = PRODUCT_SILHOUETTES[item.name] || PRODUCT_SILHOUETTES["default"];
                                    return (
                                      <button
                                        key={`${item.category}-${item.name}`}
                                        onClick={() => {
                                          setActiveCategory(item.category);
                                          setSelectedProductType(item.name);
                                          setProductSearchQuery("");
                                          if (isNonWearableCategory(item.category)) {
                                            setUseModel(false);
                                          } else {
                                            setUseModel(true);
                                            const autoGender = getGenderFromCategory(item.category);
                                            if (autoGender) {
                                              setModelDetails(prev => ({...prev, sex: autoGender}));
                                              setGenderAutoSelected(true);
                                            }
                                          }
                                        }}
                                        className={cn(
                                          "relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]",
                                          isSelected
                                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                            : "border-border bg-background hover:border-primary/30 hover:bg-muted/50"
                                        )}
                                        data-testid={`product-card-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                                      >
                                        <div 
                                          className={cn(
                                            "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                                            isSelected ? "bg-primary/20" : "bg-muted"
                                          )}
                                        >
                                          <div 
                                            className="w-5 h-5"
                                            style={{ color: isSelected ? "#ed5387" : "currentColor" }}
                                            dangerouslySetInnerHTML={{ __html: silhouette.svg }}
                                          />
                                        </div>
                                        <span className={cn(
                                          "text-xs text-center font-medium leading-tight line-clamp-2",
                                          isSelected ? "text-primary" : "text-muted-foreground"
                                        )}>
                                          {item.name}
                                        </span>
                                        {isSelected && (
                                          <div className="absolute top-1 right-1">
                                            <Check className="h-4 w-4 text-primary" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Footer Navigation */}
                          <div className="pt-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
                            <Button variant="ghost" onClick={handleBack} className="gap-2 min-h-[44px]" data-testid="button-back">
                              <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
                            </Button>
                            <Button
                              onClick={handleNext}
                              disabled={!selectedProductType}
                              className={cn(
                                "gap-2 px-6 min-h-[44px] flex-1 sm:flex-none max-w-[200px]",
                                selectedProductType
                                  ? "bg-primary hover:bg-[#C2185B] text-white" 
                                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                              )}
                              data-testid="button-next"
                            >
                              Next Step <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ========== STEP 3: CUSTOMIZE (Sizes + Colors + Model + Scene) ========== */}
                      {currentStep === "customize" && (
                        <div className="flex flex-col h-full animate-fade-in">
                          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4">
                            {/* Sizes + Colors */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Sizes */}
                              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-bold text-foreground">Sizes</label>
                                  <Badge variant="secondary" className="text-xs">{selectedSizes.length} selected</Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                                          "h-10 min-w-[40px] px-3 rounded-lg text-sm font-medium border-2 transition-all active:scale-95",
                                          isSelected 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                        )}
                                        data-testid={`size-${size}`}
                                      >
                                        {size}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Colors */}
                              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-bold text-foreground">Colors</label>
                                  {journey !== "AOP" && <Badge variant="secondary" className="text-xs">{selectedColors.length} selected</Badge>}
                                </div>
                                {journey === "AOP" ? (
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                                    <Palette className="h-5 w-5 text-primary" />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">Pattern-Derived</p>
                                      <p className="text-xs text-muted-foreground">Colors from your pattern</p>
                                    </div>
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {[
                                      { name: "White", class: "bg-white border-gray-300" },
                                      { name: "Black", class: "bg-[#1a1a1a]" },
                                      { name: "Navy", class: "bg-[#1A237E]" },
                                      { name: "Royal", class: "bg-[#0D47A1]" },
                                      { name: "Light Blue", class: "bg-[#ADD8E6]" },
                                      { name: "Sport Grey", class: "bg-[#9E9E9E]" },
                                      { name: "Dark Heather", class: "bg-[#545454]" },
                                      { name: "Charcoal", class: "bg-[#424242]" },
                                      { name: "Red", class: "bg-[#D32F2F]" },
                                      { name: "Cardinal", class: "bg-[#880E4F]" },
                                      { name: "Maroon", class: "bg-[#4A148C]" },
                                      { name: "Orange", class: "bg-[#F57C00]" },
                                      { name: "Gold", class: "bg-[#FBC02D]" },
                                      { name: "Irish Green", class: "bg-[#388E3C]" },
                                      { name: "Forest", class: "bg-[#1B5E20]" },
                                      { name: "Purple", class: "bg-[#7B1FA2]" },
                                      { name: "Light Pink", class: "bg-[#F8BBD0]" },
                                      { name: "Sand", class: "bg-[#F5F5DC]" },
                                    ].map((color) => {
                                      const isSelected = selectedColors.includes(color.name);
                                      return (
                                        <TooltipProvider key={color.name}>
                                          <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                              <button 
                                                onClick={() => {
                                                  if (isSelected) {
                                                    setSelectedColors(selectedColors.filter(c => c !== color.name));
                                                  } else {
                                                    setSelectedColors([...selectedColors, color.name]);
                                                  }
                                                }}
                                                className={cn(
                                                  "h-6 w-6 rounded-full border transition-all hover:scale-110 active:scale-95",
                                                  color.class,
                                                  isSelected ? "ring-2 ring-primary ring-offset-1" : "border-border/50"
                                                )}
                                                data-testid={`color-${color.name.replace(/\s+/g, '-').toLowerCase()}`}
                                              />
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-xs">{color.name}</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Model Options (wearable products only) */}
                            {!isNonWearableCategory(effectiveActiveCategory) && (
                              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-bold text-foreground">Model Display</label>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setUseModel(true)}
                                      className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        useModel ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                      )}
                                    >
                                      With Model
                                    </button>
                                    <button
                                      onClick={() => setUseModel(false)}
                                      className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        !useModel ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                      )}
                                    >
                                      Flat Lay
                                    </button>
                                  </div>
                                </div>
                                
                                {useModel && (
                                  <div className="grid grid-cols-4 sm:grid-cols-12 gap-1.5 mt-3">
                                    {/* Gender - 2 columns */}
                                    {[
                                      { value: "MALE", icon: User, label: "Male" },
                                      { value: "FEMALE", icon: Users, label: "Female" },
                                    ].map((option) => (
                                      <button
                                        key={option.value}
                                        onClick={() => setModelDetails({...modelDetails, sex: option.value as "MALE" | "FEMALE"})}
                                        className={cn(
                                          "flex items-center justify-center gap-1 py-2 rounded-lg border transition-all text-xs font-medium",
                                          modelDetails.sex === option.value
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
                                        )}
                                      >
                                        <option.icon className="h-3.5 w-3.5" />
                                        <span>{option.label}</span>
                                      </button>
                                    ))}

                                    {/* Ethnicity - 2 columns */}
                                    <Select value={modelDetails.ethnicity} onValueChange={(v) => setModelDetails({...modelDetails, ethnicity: v as any})}>
                                      <SelectTrigger className="h-9 text-xs col-span-2"><SelectValue placeholder="Ethnicity" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="WHITE">White</SelectItem>
                                        <SelectItem value="BLACK">Black</SelectItem>
                                        <SelectItem value="ASIAN">Asian</SelectItem>
                                        <SelectItem value="LATINO">Latino</SelectItem>
                                        <SelectItem value="MIDDLE_EASTERN">Middle Eastern</SelectItem>
                                        <SelectItem value="MIXED">Mixed</SelectItem>
                                      </SelectContent>
                                    </Select>

                                    {/* Age - 3 columns */}
                                    {[
                                      { value: "YOUNG_ADULT", icon: Smile, label: "Young" },
                                      { value: "ADULT", icon: UserCheck, label: "Adult" },
                                      { value: "MIDDLE_AGED", icon: Award, label: "Mature" },
                                    ].map((option) => (
                                      <button
                                        key={option.value}
                                        onClick={() => setModelDetails({...modelDetails, age: option.value as any})}
                                        className={cn(
                                          "flex items-center justify-center gap-1 py-2 rounded-lg border transition-all text-xs font-medium",
                                          modelDetails.age === option.value
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
                                        )}
                                      >
                                        <option.icon className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">{option.label}</span>
                                      </button>
                                    ))}

                                    {/* Body - 4 columns (hidden on small) */}
                                    {[
                                      { value: "slim", icon: PersonStanding, label: "Slim" },
                                      { value: "athletic", icon: Dumbbell, label: "Fit" },
                                      { value: "average", icon: User, label: "Avg" },
                                      { value: "plus", icon: Heart, label: "Plus" },
                                    ].map((option) => (
                                      <button
                                        key={option.value}
                                        onClick={() => setModelDetails({...modelDetails, modelSize: option.value as any})}
                                        className={cn(
                                          "hidden sm:flex items-center justify-center gap-1 py-2 rounded-lg border transition-all text-xs font-medium",
                                          modelDetails.modelSize === option.value
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
                                        )}
                                      >
                                        <option.icon className="h-3.5 w-3.5" />
                                        <span>{option.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Scene / Environment */}
                            <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Camera className="h-4 w-4 text-primary" />
                                <label className="text-sm font-bold text-foreground">Scene</label>
                              </div>
                              
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                                {[
                                  { icon: Building, label: "Urban", prompt: "A vibrant urban street scene with graffiti walls, neon lights, and natural sunlight" },
                                  { icon: Camera, label: "Studio", prompt: "A minimalist gray or white photography studio with professional soft lighting" },
                                  { icon: Trees, label: "Nature", prompt: "A beautiful outdoor park setting with lush greenery and golden hour lighting" },
                                  { icon: Coffee, label: "Cafe", prompt: "A cozy coffee shop interior with warm lighting, wood accents, and modern decor" },
                                  { icon: Dumbbell, label: "Gym", prompt: "A modern fitness gym with motivational atmosphere and athletic equipment" },
                                  { icon: Sun, label: "Beach", prompt: "A sunny beach setting with sand, ocean waves, and bright summery daylight" },
                                ].map((template, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setEnvironmentPrompt(template.prompt)}
                                    className={cn(
                                      "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all h-[60px]",
                                      environmentPrompt === template.prompt
                                        ? "bg-primary/10 border-primary"
                                        : "bg-muted/30 border-border hover:border-primary/30"
                                    )}
                                  >
                                    <template.icon className={cn("h-4 w-4", environmentPrompt === template.prompt ? "text-primary" : "text-muted-foreground")} />
                                    <span className={cn("text-[10px] font-medium", environmentPrompt === template.prompt ? "text-primary" : "text-muted-foreground")}>{template.label}</span>
                                  </button>
                                ))}
                              </div>
                              
                              <Textarea
                                value={environmentPrompt}
                                onChange={(e) => setEnvironmentPrompt(e.target.value)}
                                placeholder="Or describe a custom scene..."
                                className="h-20 text-sm resize-none"
                              />
                            </div>
                          </div>

                          {/* Footer Navigation */}
                          <div className="pt-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
                            <Button variant="ghost" onClick={handleBack} className="gap-2 min-h-[44px]" data-testid="button-back">
                              <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
                            </Button>
                            <Button
                              onClick={handleNext}
                              disabled={selectedSizes.length === 0 || (journey !== "AOP" && selectedColors.length === 0) || environmentPrompt.length <= 5}
                              className={cn(
                                "gap-2 px-6 min-h-[44px] flex-1 sm:flex-none max-w-[200px]",
                                (selectedSizes.length > 0 && (journey === "AOP" || selectedColors.length > 0) && environmentPrompt.length > 5)
                                  ? "bg-primary hover:bg-[#C2185B] text-white" 
                                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                              )}
                              data-testid="button-next"
                            >
                              Next Step <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ========== STEP 4: OUTPUT (Angles + Quality + Generate) ========== */}
                      {currentStep === "output" && (
                        <div className="h-full flex flex-col">
                          {!generatedMockups.length && !isGenerating ? (
                            <div className="flex-1 flex flex-col">
                              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                                {/* Angles Selection */}
                                <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Camera className="h-4 w-4 text-primary" />
                                      <h3 className="text-sm font-bold text-foreground">Camera Angles</h3>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => setSelectedAngles(MOCKUP_ANGLES.filter(a => a.recommended).map(a => a.id))}
                                        className="text-[10px] font-medium text-green-600 hover:underline"
                                      >
                                        Recommended
                                      </button>
                                      <span className="text-border text-[10px]">|</span>
                                      <button 
                                        onClick={() => setSelectedAngles(MOCKUP_ANGLES.map(a => a.id))}
                                        className="text-[10px] font-medium text-primary hover:underline"
                                      >
                                        All
                                      </button>
                                      <span className="text-border text-[10px]">|</span>
                                      <button 
                                        onClick={() => setSelectedAngles([])}
                                        className="text-[10px] font-medium text-muted-foreground hover:underline"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <TooltipProvider delayDuration={200}>
                                    <div className="flex flex-wrap justify-center gap-3">
                                      {MOCKUP_ANGLES.map((angle) => {
                                        const isSelected = selectedAngles.includes(angle.id);
                                        return (
                                          <Tooltip key={angle.id}>
                                            <TooltipTrigger asChild>
                                              <button
                                                onClick={() => {
                                                  if (isSelected) {
                                                    setSelectedAngles(selectedAngles.filter(id => id !== angle.id));
                                                  } else {
                                                    setSelectedAngles([...selectedAngles, angle.id]);
                                                  }
                                                }}
                                                className={cn(
                                                  "relative h-20 w-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all",
                                                  isSelected 
                                                    ? "bg-primary/10 border-primary text-primary" 
                                                    : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
                                                )}
                                                data-testid={`angle-${angle.id}`}
                                              >
                                                <angle.icon className="h-6 w-6" />
                                                <span className="text-[10px] font-medium leading-tight">{angle.name.split(' ')[0]}</span>
                                                {angle.recommended && !isSelected && (
                                                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full" />
                                                )}
                                                {isSelected && (
                                                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                                                    <Check className="h-2.5 w-2.5 text-white" />
                                                  </div>
                                                )}
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-xs">{angle.description}</TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                    </div>
                                  </TooltipProvider>
                                </div>

                                {/* Quality + Summary */}
                                <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      <Maximize2 className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-bold text-foreground">Output Quality</span>
                                    </div>
                                    <Select value={outputQuality} onValueChange={(value: OutputQuality) => setOutputQuality(value)}>
                                      <SelectTrigger className="w-[140px] h-9" data-testid="quality-select">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {OUTPUT_QUALITY_OPTIONS.map((q) => (
                                          <SelectItem key={q.id} value={q.id}>{q.name} ({q.resolution})</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Batch Summary */}
                                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 sm:p-6 border border-primary/20">
                                  <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                                    <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border">
                                      <Palette className="h-4 w-4 text-primary" />
                                      <span className="text-lg font-bold text-primary">{journey === "AOP" ? 1 : selectedColors.length}</span>
                                      <span className="text-xs text-muted-foreground">Colors</span>
                                    </div>
                                    <span className="text-lg font-bold text-muted-foreground">×</span>
                                    <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border">
                                      <Camera className="h-4 w-4 text-secondary" />
                                      <span className="text-lg font-bold text-secondary">{selectedAngles.length || 1}</span>
                                      <span className="text-xs text-muted-foreground">Angles</span>
                                    </div>
                                    <span className="text-lg font-bold text-muted-foreground">=</span>
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary rounded-lg px-3 py-2 text-white">
                                      <Sparkles className="h-4 w-4" />
                                      <span className="text-lg font-bold">{Math.max(1, selectedAngles.length * (journey === "AOP" ? 1 : selectedColors.length))}</span>
                                      <span className="text-xs">Mockups</span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-card/80 rounded-lg p-2 border">
                                      <span className="text-muted-foreground">Product:</span>
                                      <p className="font-medium truncate">{selectedProductType || "T-Shirt"}</p>
                                    </div>
                                    <div className="bg-card/80 rounded-lg p-2 border">
                                      <span className="text-muted-foreground">Style:</span>
                                      <p className="font-medium truncate">E-Commerce Clean</p>
                                    </div>
                                    <div className="bg-card/80 rounded-lg p-2 border">
                                      <span className="text-muted-foreground">Model:</span>
                                      <p className="font-medium truncate">{useModel ? `${modelDetails.sex === "MALE" ? "Male" : "Female"}` : "Flat Lay"}</p>
                                    </div>
                                    <div className="bg-card/80 rounded-lg p-2 border">
                                      <span className="text-muted-foreground">Scene:</span>
                                      <p className="font-medium truncate">{environmentPrompt?.slice(0, 15) || "Studio"}...</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Generate Button */}
                              <div className="pt-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
                                <Button variant="ghost" onClick={handleBack} className="gap-2 min-h-[44px]" data-testid="button-back">
                                  <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
                                </Button>
                                <Button
                                  onClick={handleGenerate}
                                  disabled={selectedAngles.length === 0}
                                  className={cn(
                                    "gap-2 px-6 min-h-[44px] flex-1 sm:flex-none",
                                    selectedAngles.length > 0
                                      ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white" 
                                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                  )}
                                  data-testid="button-generate"
                                >
                                  <Sparkles className="h-4 w-4" />
                                  Generate Mockups
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                              {/* Progress Bar */}
                              {isGenerating && (
                                <div className="mb-4 shrink-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-primary font-medium">{generationStage}</p>
                                    <p className="text-xs text-muted-foreground">{generationProgress}%</p>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <motion.div 
                                      className="bg-primary h-full rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${generationProgress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Generated Mockups Grid */}
                              <div className="flex-1 overflow-y-auto">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {generatedMockups.map((mockup, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/30 group cursor-pointer"
                                      onClick={() => setSelectedMockupDetails({ ...mockup, index, brandStyle: "ECOMMERCE_CLEAN" })}
                                      data-testid={`mockup-${index}`}
                                    >
                                      <img src={mockup.src} alt={`Mockup ${index + 1}`} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <Button 
                                          size="sm" 
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => { e.stopPropagation(); downloadImage(mockup.src, `mockup_${index + 1}.png`); }}
                                        >
                                          <Download className="h-4 w-4 mr-1" /> Download
                                        </Button>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                        <p className="text-[10px] text-white truncate">{mockup.color} • {mockup.angle}</p>
                                      </div>
                                    </motion.div>
                                  ))}
                                  
                                  {/* Placeholder for generating */}
                                  {isGenerating && Array.from({ length: Math.max(0, expectedMockupsCount - generatedMockups.length) }).map((_, i) => (
                                    <motion.div
                                      key={`placeholder-${i}`}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center"
                                    >
                                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                                    </motion.div>
                                  ))}
                                </div>
                              </div>

                              {/* Action Bar */}
                              {!isGenerating && generatedMockups.length > 0 && (
                                <div className="pt-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
                                  <Button variant="outline" onClick={() => setJourney(null)} data-testid="button-start-over">
                                    Start Over
                                  </Button>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={handleGenerate}
                                      data-testid="button-regenerate"
                                    >
                                      <RotateCw className="h-4 w-4 mr-1" /> Regenerate
                                    </Button>
                                    <Button
                                      onClick={downloadAllAsZip}
                                      disabled={isDownloadingZip}
                                      className="bg-primary hover:bg-primary/90 text-white"
                                      data-testid="button-download-all"
                                    >
                                      {isDownloadingZip ? (
                                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating ZIP...</>
                                      ) : (
                                        <><Archive className="h-4 w-4 mr-1" /> Download All ({generatedMockups.length})</>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
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
    </div>
  );
}
