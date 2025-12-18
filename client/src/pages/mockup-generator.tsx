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

const DTG_STEPS: WizardStep[] = ["upload", "product", "style", "scene", "angles", "generate"];
const AOP_STEPS: WizardStep[] = ["upload", "seamless", "product", "style", "scene", "angles", "generate"];

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
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-30 h-14 w-14 rounded-full bg-card border-2 border-border shadow-lg flex items-center justify-center hover:border-[#B94E30] hover:shadow-xl transition-all group"
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
        isSelected ? "bg-[#B94E30]/20 dark:bg-[#B94E30]/40" : "bg-muted"
      )}
      style={{ backgroundColor: isSelected ? undefined : color }}
    >
      <div 
        className="h-6 w-6"
        style={{ color: isSelected ? "#B94E30" : "rgba(0,0,0,0.15)" }}
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
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  const [environmentPrompt, setEnvironmentPrompt] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>(["White"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
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
  const [outputQuality, setOutputQuality] = useState<OutputQuality>("high");
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState<boolean>(false);
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

  const aopStepsForJourney = isAlreadySeamless 
    ? (["upload", "product", "style", "scene", "angles", "generate"] as WizardStep[])
    : AOP_STEPS;
  const steps = journey === "AOP" ? aopStepsForJourney : DTG_STEPS;
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
  
  // Trigger pattern generation when entering seamless step
  useEffect(() => {
    if (currentStep === "seamless" && seamlessPhase === 'analyzing' && !isGeneratingPatterns && seamlessVariations.length === 0) {
      generatePatternVariations();
    }
  }, [currentStep, seamlessPhase, isGeneratingPatterns, seamlessVariations.length, generatePatternVariations]);

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

    const styleName = selectedStyle || "minimal";
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
        {/* Design Transfer Banner */}
        <AnimatePresence>
          {showTransferBanner && uploadedImage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sticky top-0 z-40 bg-gradient-to-r from-[#B94E30]/10 via-[#E3B436]/10 to-[#B94E30]/10 border-b border-[#B94E30]/20 backdrop-blur-sm"
            >
              <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg border-2 border-[#B94E30] overflow-hidden bg-white/10 flex-shrink-0">
                  <img src={uploadedImage} alt="Transferred design" className="h-full w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#B94E30]" />
                    <span className="font-semibold text-foreground text-sm">Design loaded from My Creations</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose a print method below to create mockups with this design</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowTransferBanner(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <Badge className="bg-primary hover:bg-[#8B3A24] text-white rounded-full px-2 py-0.5 text-[11px]">
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
                    <Camera className="h-3.5 w-3.5 text-[#664D3F]" />
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
                  className="bg-card border-2 border-border rounded-[20px] md:rounded-[24px] p-5 md:p-10 text-left cursor-pointer transition-all duration-300 hover:border-[#B94E30] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#B94E30]/15 group"
                >
                  <div className="h-10 w-10 md:h-16 md:w-16 rounded-xl bg-[#B94E30]/10 dark:bg-[#B94E30]/20 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
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
                  className="bg-card border-2 border-border rounded-[20px] md:rounded-[24px] p-5 md:p-10 text-left cursor-pointer transition-all duration-300 hover:border-secondary hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#E3B436]/15 group relative overflow-hidden"
                >
                  <Badge className="absolute top-3 right-3 md:top-6 md:right-6 bg-amber-500 text-white hover:bg-amber-600 text-[10px] md:text-[11px]">Pro</Badge>
                  <div className="h-10 w-10 md:h-16 md:w-16 rounded-xl bg-[#E3B436]/10 dark:bg-[#E3B436]/20 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform">
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
                        <div key={step} className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0">
                          <div className={cn(
                            "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                            isCompleted ? "bg-primary border-primary text-white" :
                            isCurrent ? "bg-primary border-primary text-white ring-2 sm:ring-4 ring-[#B94E30]/20" :
                            "bg-card border-border text-muted-foreground"
                          )}>
                            <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                          <span className={cn(
                            "text-[7px] sm:text-[8px] md:text-[10px] font-bold uppercase tracking-wider transition-colors text-center hidden xs:block sm:block",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                          )}>
                            {step}
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
                      {/* STEP CONTENT SWITCHER */}
                      {currentStep === "upload" && (
                        <div className="flex flex-col h-full">
                          <div className="flex flex-col items-center justify-center h-full max-w-[600px] mx-auto text-center flex-1 px-2 sm:px-0">
                          {!uploadedImage ? (
                            <div 
                              className="w-full border-2 border-dashed border-border rounded-[16px] sm:rounded-[20px] p-6 sm:p-8 md:p-16 hover:border-[#B94E30] hover:bg-[#B94E30]/10 dark:hover:bg-[#B94E30]/10 transition-all cursor-pointer group active:scale-[0.99]"
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
                              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 bg-[#B94E30]/10 dark:bg-[#B94E30]/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                                <Cloud className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
                              </div>
                              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">Drag & drop your design</h2>
                              <p className="text-sm text-muted-foreground mb-3 sm:mb-4">or tap to browse</p>
                              <Badge variant="outline" className="text-xs text-muted-foreground">PNG recommended • Max 20MB</Badge>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 w-full">
                              <div className="relative w-full aspect-square max-w-[320px] sm:max-w-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbC1vcGFjaXR5PSIwLjEiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-repeat rounded-xl border border-border overflow-hidden">
                                <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 flex justify-between items-center">
                                  <span className="text-xs text-white truncate">design_v1.png</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setUploadedImage(null)}
                                    className="text-white hover:text-white hover:bg-white/20 h-8 min-h-[44px] px-3 text-xs"
                                    data-testid="button-change-image"
                                  >
                                    Change
                                  </Button>
                                </div>
                              </div>
                              
                              {journey === "AOP" && (
                                <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors max-w-[400px] w-full min-h-[60px]">
                                  <input 
                                    type="checkbox"
                                    checked={isAlreadySeamless}
                                    onChange={(e) => setIsAlreadySeamless(e.target.checked)}
                                    className="h-5 w-5 min-w-[20px] rounded border-border text-primary focus:ring-primary"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-foreground">This design is already a seamless pattern</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Check this if your design is already tileable and ready for all-over printing</p>
                                  </div>
                                </label>
                              )}
                            </div>
                          )}
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-auto pt-4 md:pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground min-h-[44px] h-11 sm:h-10"
                                    data-testid="button-back"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={!uploadedImage}
                                    className={cn(
                                        "gap-2 px-4 sm:px-6 transition-all min-h-[44px] h-11 sm:h-10 flex-1 sm:flex-none max-w-[200px] sm:max-w-none",
                                        uploadedImage
                                            ? "bg-primary hover:bg-[#8B3A24] text-white shadow-sm hover:shadow-[#B94E30]/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                    data-testid="button-next"
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="hidden sm:flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
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
                        <div className="flex flex-col h-full animate-fade-in">
                          {/* Header */}
                          <div className="text-center mb-4 sm:mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Configure Your Product</h2>
                            <p className="text-sm text-muted-foreground">Select product, sizes, colors, and model preferences</p>
                          </div>

                          {/* Main Content - Scrollable */}
                          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-8 pb-6">
                            {/* Row 1: Category + Product Selection */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                              {/* Categories - Horizontal scrollable on mobile */}
                              <div className="lg:col-span-3">
                                <label className="text-sm font-bold text-foreground mb-2 sm:mb-3 block">Category</label>
                                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0 scrollbar-hide">
                                  {productCategories.map((cat) => {
                                    const isActive = effectiveActiveCategory === cat.name;
                                    return (
                                      <button 
                                        key={cat.name}
                                        onClick={() => {
                                          setActiveCategory(cat.name);
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
                                          "flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex-shrink-0",
                                          isActive 
                                            ? "bg-primary text-white shadow-md" 
                                            : "bg-card border border-border hover:border-[#B94E30]/50 text-muted-foreground hover:text-foreground"
                                        )}
                                        data-testid={`category-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
                                      >
                                        <cat.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                                        <span className="hidden sm:inline lg:inline">{cat.name}</span>
                                        <span className="sm:hidden lg:hidden">{cat.name.split(' ')[0]}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Products Grid - 2 cols on mobile, 3 on sm, 4 on md, 5 on lg */}
                              <div className="lg:col-span-9">
                                <label className="text-sm font-bold text-foreground mb-2 sm:mb-3 block">Product</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                                  {effectiveItems.map((item) => {
                                    const isSelected = selectedProductType === item.name;
                                    return (
                                      <div 
                                        key={item.name} 
                                        onClick={() => setSelectedProductType(item.name)}
                                        data-testid={`card-product-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                                        className={cn(
                                          "group relative border rounded-xl p-3 sm:p-4 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 sm:gap-2 min-h-[90px] active:scale-[0.98]",
                                          isSelected 
                                            ? "border-primary bg-[#B94E30]/10 dark:bg-[#B94E30]/20 shadow-sm" 
                                            : "border-border hover:border-[#B94E30]/50 bg-card"
                                        )}
                                      >
                                        <ProductThumbnail 
                                          productName={item.name} 
                                          isSelected={isSelected}
                                          color={isSelected ? undefined : (PRODUCT_COLOR_MAP[selectedColors[0]] || "#FFFFFF")}
                                        />
                                        <p className={cn("font-medium text-[10px] sm:text-xs leading-tight line-clamp-2", isSelected ? "text-[#B94E30]" : "text-foreground")}>{item.name}</p>
                                        {isSelected && (
                                          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-white flex items-center justify-center">
                                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Sizes + Colors */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                              {/* Sizes */}
                              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                  <label className="text-sm font-bold text-foreground">Product Sizes</label>
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
                                          "h-11 min-h-[44px] min-w-[44px] px-3 rounded-lg text-sm font-medium border-2 transition-all active:scale-95",
                                          isSelected 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-background border-border text-muted-foreground hover:border-[#B94E30]/50"
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
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                  <label className="text-sm font-bold text-foreground">Colors</label>
                                  {journey !== "AOP" && <Badge variant="secondary" className="text-xs">{selectedColors.length} selected</Badge>}
                                </div>
                                {journey === "AOP" ? (
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#B94E30]/10 dark:bg-[#B94E30]/20 min-h-[60px]">
                                    <Palette className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm">Pattern-Derived Colors</p>
                                      <p className="text-xs text-muted-foreground">Colors extracted from your seamless pattern</p>
                                    </div>
                                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2 sm:gap-2">
                                    {[
                                      { name: "White", class: "bg-white border-gray-300" },
                                      { name: "Black", class: "bg-black border-black" },
                                      { name: "Sport Grey", class: "bg-[#9E9E9E]" },
                                      { name: "Dark Heather", class: "bg-[#545454]" },
                                      { name: "Charcoal", class: "bg-[#424242]" },
                                      { name: "Navy", class: "bg-[#1A237E]" },
                                      { name: "Royal", class: "bg-[#0D47A1]" },
                                      { name: "Light Blue", class: "bg-[#ADD8E6]" },
                                      { name: "Red", class: "bg-[#D32F2F]" },
                                      { name: "Cardinal", class: "bg-[#880E4F]" },
                                      { name: "Maroon", class: "bg-[#4A148C]" },
                                      { name: "Orange", class: "bg-[#F57C00]" },
                                      { name: "Gold", class: "bg-[#FBC02D]" },
                                      { name: "Irish Green", class: "bg-[#388E3C]" },
                                      { name: "Forest", class: "bg-[#1B5E20]" },
                                      { name: "Purple", class: "bg-[#7B1FA2]" },
                                      { name: "Light Pink", class: "bg-[#F8BBD0]" },
                                      { name: "Sand", class: "bg-[#F5F5DC] border-gray-200" },
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
                                                  "h-9 w-9 sm:h-8 sm:w-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95",
                                                  color.class,
                                                  isSelected ? "ring-2 ring-primary ring-offset-2" : "border-transparent"
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

                            {/* Row 3: Model Options (only for wearable products) */}
                            {!isNonWearableCategory(effectiveActiveCategory) && (
                              <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                                  <label className="text-sm font-bold text-foreground">Model Options</label>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setUseModel(true)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] flex-1 sm:flex-none justify-center",
                                        useModel ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                                      )}
                                      data-testid="button-on-model"
                                    >
                                      <User className="h-4 w-4" />
                                      On Model
                                    </button>
                                    <button
                                      onClick={() => setUseModel(false)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] flex-1 sm:flex-none justify-center",
                                        !useModel ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                                      )}
                                      data-testid="button-flat-lay"
                                    >
                                      <Shirt className="h-4 w-4" />
                                      Flat Lay
                                    </button>
                                  </div>
                                </div>

                                {useModel && (
                                  <>
                                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">Sex</label>
                                      <div className="flex gap-2">
                                        {(["MALE", "FEMALE"] as Sex[]).map((sex) => (
                                          <button
                                            key={sex}
                                            onClick={() => {
                                              setModelDetails({...modelDetails, sex});
                                              setGenderAutoSelected(false);
                                            }}
                                            className={cn(
                                              "flex-1 py-2.5 min-h-[44px] rounded-lg text-sm font-medium border-2 transition-all active:scale-95",
                                              modelDetails.sex === sex
                                                ? "border-primary bg-[#B94E30]/10 text-[#B94E30]"
                                                : "border-border hover:border-[#B94E30]/50"
                                            )}
                                            data-testid={`sex-${sex.toLowerCase()}`}
                                          >
                                            {sex === "MALE" ? "Male" : "Female"}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">Age Group</label>
                                      <Select value={modelDetails.age} onValueChange={(value: AgeGroup) => setModelDetails({...modelDetails, age: value})}>
                                        <SelectTrigger className="h-11 min-h-[44px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="TEEN">Teen (13-17)</SelectItem>
                                          <SelectItem value="YOUNG_ADULT">Young Adult (18-25)</SelectItem>
                                          <SelectItem value="ADULT">Adult (26-45)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">Ethnicity</label>
                                      <Select value={modelDetails.ethnicity} onValueChange={(value: Ethnicity) => setModelDetails({...modelDetails, ethnicity: value})}>
                                        <SelectTrigger className="h-11 min-h-[44px]"><SelectValue /></SelectTrigger>
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
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-2 block">Body Size</label>
                                      <div className="flex gap-1">
                                        {(["S", "M", "L", "XL"] as ModelSize[]).map((size) => (
                                          <button
                                            key={size}
                                            onClick={() => setModelDetails({...modelDetails, modelSize: size})}
                                            className={cn(
                                              "flex-1 py-2.5 min-h-[44px] rounded-lg text-sm font-medium border-2 transition-all active:scale-95",
                                              modelDetails.modelSize === size
                                                ? "border-primary bg-primary text-white"
                                                : "border-border hover:border-[#B94E30]/50"
                                            )}
                                            data-testid={`body-size-${size}`}
                                          >
                                            {size}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Collapsible open={advancedOptionsOpen} onOpenChange={setAdvancedOptionsOpen} className="mt-4">
                                    <CollapsibleTrigger asChild>
                                      <button 
                                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                        data-testid="button-toggle-advanced-options"
                                      >
                                        {advancedOptionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        Advanced Model Options
                                        <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0.5">Optional</Badge>
                                      </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-4">
                                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                                        <div>
                                          <label className="text-xs text-muted-foreground mb-2 block">Hair Style</label>
                                          <Select 
                                            value={modelDetails.customization?.hairStyle || ""} 
                                            onValueChange={(value: HairStyle) => setModelDetails({
                                              ...modelDetails, 
                                              customization: { ...modelDetails.customization, hairStyle: value }
                                            })}
                                          >
                                            <SelectTrigger className="h-10" data-testid="select-hair-style">
                                              <SelectValue placeholder="Any" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Short">Short</SelectItem>
                                              <SelectItem value="Medium">Medium</SelectItem>
                                              <SelectItem value="Long">Long</SelectItem>
                                              <SelectItem value="Bald">Bald</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground mb-2 block">Expression</label>
                                          <Select 
                                            value={modelDetails.customization?.expression || ""} 
                                            onValueChange={(value: Expression) => setModelDetails({
                                              ...modelDetails, 
                                              customization: { ...modelDetails.customization, expression: value }
                                            })}
                                          >
                                            <SelectTrigger className="h-10" data-testid="select-expression">
                                              <SelectValue placeholder="Any" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Neutral">Neutral</SelectItem>
                                              <SelectItem value="Smiling">Smiling</SelectItem>
                                              <SelectItem value="Serious">Serious</SelectItem>
                                              <SelectItem value="Candid">Candid</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground mb-2 block">Pose Suggestion</label>
                                          <Select 
                                            value={modelDetails.customization?.poseSuggestion || ""} 
                                            onValueChange={(value: PoseSuggestion) => setModelDetails({
                                              ...modelDetails, 
                                              customization: { ...modelDetails.customization, poseSuggestion: value }
                                            })}
                                          >
                                            <SelectTrigger className="h-10" data-testid="select-pose">
                                              <SelectValue placeholder="Any" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Casual">Casual</SelectItem>
                                              <SelectItem value="Athletic">Athletic</SelectItem>
                                              <SelectItem value="Professional">Professional</SelectItem>
                                              <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground mt-2">
                                        These optional settings help personalize your model. Leave as "Any" for AI-selected defaults.
                                      </p>
                                    </CollapsibleContent>
                                  </Collapsible>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer Navigation */}
                          <div className="pt-4 sm:pt-6 border-t border-border flex items-center justify-between gap-3 shrink-0">
                            <Button variant="ghost" onClick={handleBack} className="gap-2 min-h-[44px] h-11 sm:h-10" data-testid="button-back">
                              <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
                            </Button>
                            <Button
                              onClick={handleNext}
                              disabled={!selectedProductType || selectedSizes.length === 0 || (journey !== "AOP" && selectedColors.length === 0)}
                              className={cn(
                                "gap-2 px-4 sm:px-6 min-h-[44px] h-11 sm:h-10 flex-1 sm:flex-none max-w-[200px] sm:max-w-none",
                                (selectedProductType && selectedSizes.length > 0 && (journey === "AOP" || selectedColors.length > 0))
                                  ? "bg-primary hover:bg-[#8B3A24] text-white" 
                                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                              )}
                              data-testid="button-next"
                            >
                              Next Step <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentStep === "seamless" && (
                        <div className="h-full flex flex-col overflow-hidden animate-fade-in">
                          {/* Phase 1 & 2: Loading States */}
                          {(seamlessPhase === 'analyzing' || seamlessPhase === 'generating') && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
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
                              <div className="bg-[#B94E30]/10 dark:bg-[#B94E30]/10 border border-[#B94E30]/20 dark:border-[#B94E30]/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shrink-0">
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h3 className="text-sm sm:text-base font-bold text-[#B94E30] dark:text-[#E8C9B0] mb-0.5 sm:mb-1">Pattern Lab</h3>
                                    <p className="text-[11px] sm:text-xs text-[#B94E30] dark:text-[#D4A987] leading-relaxed">
                                      We analyzed your image and generated several options. The best methods are marked with a <span className="inline-flex items-center"><Star className="h-2.5 w-2.5 mx-0.5 fill-current" /></span>. Select your favorite pattern to continue.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {/* Variations Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                                  {seamlessVariations.map((variation) => {
                                    const isSelected = selectedVariationId === variation.id;
                                    const isAi = variation.id === 'ai_enhanced';
                                    
                                    if (isAi) {
                                      const hasAIPattern = variation.url && variation.url.length > 0;
                                      
                                      // If AI pattern has been generated, show it like the other patterns
                                      if (hasAIPattern) {
                                        return (
                                          <div
                                            key={variation.id}
                                            onClick={() => setSelectedVariationId(variation.id)}
                                            className={cn(
                                              "relative aspect-square rounded-xl overflow-hidden border-4 transition-all duration-200 cursor-pointer group",
                                              isSelected 
                                                ? "border-secondary shadow-lg shadow-[#E3B436]/25 scale-105 z-10" 
                                                : "border-transparent hover:border-[#E3B436]/20 dark:hover:border-[#E3B436]/80 hover:shadow-lg"
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
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-4">
                                              <span className="text-xs font-bold text-white block truncate">{variation.name}</span>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                              <Sparkles className="h-3 w-3 fill-current" />
                                              AI
                                            </div>
                                            {isSelected && (
                                              <div className="absolute inset-0 bg-[#E3B436]/30 flex items-center justify-center backdrop-blur-[1px]">
                                                <CheckCircle2 className="h-12 w-12 text-white drop-shadow-md" />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                      
                                      // Show generate button for AI Enhanced
                                      return (
                                        <div 
                                          key={variation.id}
                                          className="relative aspect-square rounded-xl border-4 border-dashed border-[#E3B436]/30 dark:border-[#E3B436]/70 bg-gradient-to-br from-[#E3B436]/10 to-[#B94E30]/10 dark:from-[#E3B436]/20 dark:to-[#B94E30]/20 flex flex-col items-center justify-center text-center p-4 group cursor-pointer hover:border-[#E3B436]/40 dark:hover:border-secondary transition-all"
                                        >
                                          <Sparkles className="h-8 w-8 text-secondary mb-2" />
                                          <span className="text-xs font-bold text-[#664D3F] dark:text-[#E8C9B0] mb-1">{variation.name}</span>
                                          <p className="text-[10px] text-secondary dark:text-[#C99C2A] mb-3">{variation.description}</p>
                                          <Button 
                                            size="sm" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              generateAIEnhancedPattern();
                                            }}
                                            disabled={isGeneratingAIPattern}
                                            className="h-7 text-[10px] bg-secondary hover:bg-[#C99C2A] text-white gap-1.5"
                                          >
                                            {isGeneratingAIPattern ? (
                                              <>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Generating...
                                              </>
                                            ) : (
                                              <>
                                                <Sparkles className="h-3 w-3" />
                                                Generate
                                              </>
                                            )}
                                          </Button>
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
                                            ? "border-primary shadow-lg shadow-[#B94E30]/25 scale-105 z-10" 
                                            : "border-transparent hover:border-[#B94E30]/20 dark:hover:border-[#B94E30]/80 hover:shadow-lg"
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
                                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-[1px]">
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
                                      <button 
                                        onClick={() => {
                                          const selectedPattern = seamlessVariations.find(v => v.id === selectedVariationId);
                                          if (selectedPattern?.url) {
                                            downloadTexture(
                                              selectedPattern.url, 
                                              patternScale, 
                                              `seamless-${selectedVariationId}-scale${patternScale}.png`
                                            );
                                          }
                                        }}
                                        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-[#B94E30] dark:text-[#CD8B67] dark:hover:text-[#D4A987] transition-colors"
                                      >
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
                                            <Layers className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-bold text-foreground">Pattern Scale</span>
                                          </div>
                                          
                                          <Slider 
                                            value={[patternScale]}
                                            onValueChange={(val) => setPatternScale(val[0])}
                                            min={10}
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
                              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                                <div className="flex items-center justify-between gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={handleBack}
                                        className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground min-h-[44px] h-11 sm:h-10"
                                        data-testid="button-back"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline">Back</span>
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!selectedVariationId}
                                        className={cn(
                                            "gap-2 px-4 sm:px-6 transition-all min-h-[44px] h-11 sm:h-10 flex-1 sm:flex-none max-w-[200px] sm:max-w-none",
                                            selectedVariationId
                                                ? "bg-primary hover:bg-[#8B3A24] text-white shadow-sm hover:shadow-[#B94E30]/20 hover:-translate-y-0.5" 
                                                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                        )}
                                        data-testid="button-next"
                                    >
                                        Next Step
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="hidden sm:flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
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
                                   <PersonStanding className="h-4 w-4 text-primary" />
                                   <h2 className="text-sm font-bold text-foreground">Choose Camera Angles</h2>
                                 </div>
                                 
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => setSelectedAngles(MOCKUP_ANGLES.map(a => a.id))}
                                     disabled={selectedAngles.length === MOCKUP_ANGLES.length}
                                     className="text-[10px] font-medium text-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                              <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-4">
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
                                        "relative p-3 rounded-xl border-2 text-left transition-all duration-200 flex flex-col justify-between cursor-pointer min-h-[90px] sm:min-h-[100px] active:scale-[0.98]",
                                        isSelected 
                                          ? "border-primary bg-[#B94E30]/10 dark:bg-[#B94E30]/10 shadow-sm" 
                                          : "border-border bg-card hover:border-[#B94E30]/50 dark:hover:border-[#B94E30]/70"
                                      )}
                                      data-testid={`angle-${angle.id}`}
                                    >
                                      {/* Top Section */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            isSelected ? "bg-[#B94E30]/20 dark:bg-[#B94E30]/40" : "bg-muted"
                                          )}>
                                            <angle.icon className={cn(
                                              "h-4 w-4",
                                              isSelected ? "text-primary dark:text-[#CD8B67]" : "text-muted-foreground"
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
                                          isSelected ? "text-[#B94E30] dark:text-[#E8C9B0]" : "text-foreground"
                                        )}>
                                          {angle.name}
                                        </h3>
                                        <p className={cn(
                                          "text-[10px] leading-tight transition-colors line-clamp-2",
                                          isSelected ? "text-[#B94E30] dark:text-[#D4A987]" : "text-muted-foreground"
                                        )}>
                                          {angle.description}
                                        </p>
                                      </div>

                                      {/* Bottom Section */}
                                      <div className="absolute top-2 right-2">
                                        <div className={cn(
                                          "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                                          isSelected 
                                            ? "border-primary bg-primary" 
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
                                  className="flex-1 px-3 py-2 text-[10px] md:text-xs font-bold bg-[#B94E30]/10 dark:bg-[#B94E30]/20 text-[#B94E30] dark:text-[#D4A987] rounded-lg hover:bg-[#B94E30]/20 dark:hover:bg-[#B94E30]/30 transition-colors border border-[#B94E30]/10 dark:border-[#B94E30]/50"
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
                                    <span className="font-bold text-[#D4A987]">{selectedAngles.length}</span> Angles × <span className="font-bold text-[#D4A987]">{selectedColors.length}</span> Colors = <span className="font-bold text-green-400">{selectedAngles.length * selectedColors.length}</span> Mockups
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Navigation */}
                          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground min-h-[44px] h-11 sm:h-10"
                                    data-testid="button-back"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={selectedAngles.length === 0}
                                    className={cn(
                                        "gap-2 px-4 sm:px-6 transition-all min-h-[44px] h-11 sm:h-10 flex-1 sm:flex-none max-w-[200px] sm:max-w-none",
                                        selectedAngles.length > 0
                                            ? "bg-primary hover:bg-[#8B3A24] text-white shadow-sm hover:shadow-[#B94E30]/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                    data-testid="button-next"
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="hidden sm:flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
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
                              <Sparkles className="h-4 w-4 text-primary" />
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
                                      ? "bg-[#B94E30]/10 border-primary dark:bg-[#B94E30]/20 dark:border-[#B94E30] shadow-sm"
                                      : "bg-card border-border hover:bg-accent dark:hover:bg-accent/50 text-muted-foreground hover:text-foreground hover:border-[#B94E30]/50"
                                  )}
                                >
                                  <div className={cn(
                                    "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-colors",
                                    environmentPrompt === template.prompt ? "bg-[#B94E30]/20 text-primary dark:bg-[#B94E30]/40 dark:text-[#D4A987]" : "bg-muted text-muted-foreground"
                                  )}>
                                    <template.icon className="h-4 w-4 md:h-5 md:w-5" />
                                  </div>
                                  <span className={cn(
                                    "text-[10px] md:text-sm font-medium",
                                    environmentPrompt === template.prompt ? "text-[#B94E30] dark:text-[#E8C9B0]" : "text-current"
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
                              <Wand2 className="h-4 w-4 text-primary" />
                              Custom Scene
                            </h3>
                            <div className="relative flex-1 max-h-[200px] mb-2 group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#B94E30] to-[#E3B436] rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                              <Textarea
                                value={environmentPrompt}
                                onChange={(e) => setEnvironmentPrompt(e.target.value)}
                                placeholder="Describe your perfect scene (e.g., Walking down a busy Tokyo street at night...)"
                                className={cn(
                                  "relative w-full h-full min-h-[120px] p-4 rounded-xl border-2 resize-none transition-colors text-sm md:text-base bg-background/95 backdrop-blur-sm",
                                  "focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/50"
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
                          <div className="mt-auto pt-4 sm:pt-6 border-t border-border flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground min-h-[44px] h-11 sm:h-10"
                                    data-testid="button-back"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={environmentPrompt.length <= 5}
                                    className={cn(
                                        "gap-2 px-4 sm:px-6 transition-all min-h-[44px] h-11 sm:h-10 flex-1 sm:flex-none max-w-[200px] sm:max-w-none",
                                        environmentPrompt.length > 5 
                                            ? "bg-primary hover:bg-[#8B3A24] text-white shadow-sm hover:shadow-[#B94E30]/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                    data-testid="button-next"
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="hidden sm:flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
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
                          <div className="mb-4 sm:mb-8 text-center">
                            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Choose Brand Archetype</h2>
                            <p className="text-sm text-muted-foreground">Define the mood and aesthetic of your photoshoot</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {BRAND_STYLES.map((style) => {
                              const isSelected = selectedStyle === style.id;
                              return (
                                <div 
                                  key={style.id} 
                                  onClick={() => setSelectedStyle(style.id)}
                                  data-testid={`style-card-${style.id}`}
                                  className={cn(
                                    "group relative bg-card rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 hover:shadow-lg active:scale-[0.98]",
                                    isSelected 
                                      ? "border-primary ring-2 sm:ring-4 ring-[#B94E30]/20 shadow-lg" 
                                      : "border-border hover:border-[#B94E30]/50"
                                  )}
                                >
                                  <div className="p-3 sm:p-4 flex flex-col">
                                    <div className="relative w-full h-[80px] sm:h-[120px] rounded-lg overflow-hidden mb-2 sm:mb-4 bg-muted">
                                      <img 
                                        src={style.img} 
                                        alt={style.name} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                      />
                                      {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-primary rounded-full p-1 sm:p-1.5 shadow-lg">
                                          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1 sm:space-y-2">
                                      <h3 className="font-bold text-foreground text-xs sm:text-sm">{style.name}</h3>
                                      <p className="text-muted-foreground text-[10px] sm:text-xs line-clamp-2">{style.tagline}</p>
                                      
                                      <div className="flex flex-wrap gap-1 pt-1 hidden sm:flex">
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
                          <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-border flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="gap-2 pl-2 pr-4 text-muted-foreground hover:text-foreground min-h-[44px] h-11 sm:h-10"
                                    data-testid="button-back"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={!selectedStyle}
                                    className={cn(
                                        "gap-2 px-4 sm:px-6 transition-all min-h-[44px] h-11 sm:h-10 flex-1 sm:flex-none max-w-[200px] sm:max-w-none",
                                        selectedStyle
                                            ? "bg-primary hover:bg-[#8B3A24] text-white shadow-sm hover:shadow-[#B94E30]/20 hover:-translate-y-0.5" 
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                    data-testid="button-next"
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="hidden sm:flex justify-center gap-2 text-xs text-muted-foreground opacity-60">
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
                            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[700px] mx-auto px-2 sm:px-0">
                              <h2 className="text-xl sm:text-3xl font-bold mb-2">Ready to Generate Photoshoot</h2>
                              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">Review your batch configuration before generating</p>
                              
                              <div className="bg-gradient-to-br from-[#B94E30]/10 to-[#E3B436]/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full mb-4 sm:mb-6 border border-[#B94E30]/20 dark:border-[#B94E30]/80" data-testid="batch-summary-card">
                                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                                  <div className="flex items-center gap-1.5 sm:gap-2 bg-card rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 border border-border">
                                    <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                    <span className="text-lg sm:text-2xl font-bold text-primary">{journey === "AOP" ? 1 : selectedColors.length}</span>
                                    <span className="text-xs sm:text-sm text-muted-foreground">Colors</span>
                                  </div>
                                  <span className="text-lg sm:text-2xl font-bold text-muted-foreground">×</span>
                                  <div className="flex items-center gap-1.5 sm:gap-2 bg-card rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 border border-border">
                                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
                                    <span className="text-lg sm:text-2xl font-bold text-secondary">{selectedAngles.length || 1}</span>
                                    <span className="text-xs sm:text-sm text-muted-foreground">Angles</span>
                                  </div>
                                  <span className="text-lg sm:text-2xl font-bold text-muted-foreground">=</span>
                                  <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#B94E30] to-[#E3B436] rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-white">
                                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="text-lg sm:text-2xl font-bold">{Math.max(1, selectedAngles.length * (journey === "AOP" ? 1 : selectedColors.length))}</span>
                                    <span className="text-xs sm:text-sm">Mockups</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full mb-4 sm:mb-6 border border-border">
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                  <div className="text-left">
                                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</span>
                                    <p className="font-bold text-foreground text-sm sm:text-base truncate">{selectedProductType || "T-Shirt"}</p>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</span>
                                    <p className="font-bold text-foreground text-sm sm:text-base truncate">{useModel ? `${modelDetails.sex === "MALE" ? "Male" : "Female"} - ${modelDetails.ethnicity.charAt(0) + modelDetails.ethnicity.slice(1).toLowerCase().replace("_", " ")}` : "Flat Lay"}</p>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Style</span>
                                    <p className="font-bold text-foreground text-sm sm:text-base truncate">{BRAND_STYLES.find(s => s.id === selectedStyle)?.name || "Minimal"}</p>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Scene</span>
                                    <p className="font-bold text-foreground text-sm sm:text-base truncate">{environmentPrompt?.slice(0, 20) || "Studio"}...</p>
                                  </div>
                                </div>
                                
                                <div className="border-t border-border pt-4">
                                  <div className="mb-3">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colors ({journey === "AOP" ? 1 : selectedColors.length})</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {(journey === "AOP" ? ["Pattern"] : selectedColors).map((color) => (
                                        <Badge key={color} variant="outline" className="gap-1.5">
                                          <div 
                                            className="h-3 w-3 rounded-full border border-border/50" 
                                            style={{ backgroundColor: PRODUCT_COLOR_MAP[color] || "#CCCCCC" }}
                                          />
                                          {color}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Angles ({selectedAngles.length})</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {selectedAngles.map((angle) => (
                                        <Badge key={angle} variant="outline" className="capitalize">
                                          {angle.replace('-', ' ')}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full mb-4 sm:mb-6 border border-border">
                                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                  <Maximize2 className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-bold text-foreground">Output Quality</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                  {OUTPUT_QUALITY_OPTIONS.map((quality) => (
                                    <button
                                      key={quality.id}
                                      onClick={() => setOutputQuality(quality.id)}
                                      className={cn(
                                        "relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all text-left min-h-[60px] active:scale-[0.99]",
                                        outputQuality === quality.id
                                          ? "border-primary bg-[#B94E30]/10 dark:bg-[#B94E30]/20"
                                          : "border-border hover:border-[#B94E30]/50"
                                      )}
                                      data-testid={`quality-option-${quality.id}`}
                                    >
                                      {outputQuality === quality.id && (
                                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                          <CheckCircle2 className="h-5 w-5 text-primary" />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                          <span className="text-sm font-bold text-foreground">{quality.name}</span>
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {quality.resolution}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{quality.bestFor}</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        <span className="text-xs font-medium text-amber-600">{quality.credits} {quality.credits === 1 ? 'credit' : 'credits'}/image</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                                  Estimated total: {Math.max(1, selectedAngles.length * (journey === "AOP" ? 1 : selectedColors.length)) * (OUTPUT_QUALITY_OPTIONS.find(q => q.id === outputQuality)?.credits || 2)} credits for this batch
                                </p>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                                <Button 
                                  variant="outline"
                                  size="lg" 
                                  onClick={handleBack}
                                  className="flex-1 min-h-[48px] h-12 sm:h-auto"
                                  data-testid="button-back"
                                >
                                  <ChevronLeft className="mr-2 h-4 w-4" />
                                  Back
                                </Button>
                                <Button 
                                  size="lg" 
                                  onClick={handleGenerate}
                                  className="flex-[2] h-12 sm:h-14 text-base sm:text-lg rounded-[12px] bg-gradient-to-r from-[#B94E30] to-[#8B3A24] hover:brightness-110 shadow-lg shadow-[#B94E30]/20 transition-all hover:-translate-y-[1px] min-h-[48px]"
                                  data-testid="button-generate-all"
                                >
                                  <Wand2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                  Generate All ({Math.max(1, selectedAngles.length * (journey === "AOP" ? 1 : selectedColors.length))} Mockups)
                                </Button>
                              </div>
                            </div>
                          ) : isGenerating && generatedMockups.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[400px] mx-auto">
                              <div className="relative mb-8 w-full">
                                <div className="absolute inset-0 bg-[#B94E30]/20 blur-2xl rounded-full animate-pulse" />
                                <RefreshCw className="h-16 w-16 text-primary animate-spin relative z-10 mx-auto" />
                              </div>
                              
                              <h2 className="text-2xl font-bold mb-2">Generating Photoshoot...</h2>
                              <p className="text-primary font-medium mb-4">{generationStage}</p>
                              
                              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden mb-2">
                                <motion.div 
                                  className="bg-primary h-full rounded-full"
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
                                      <RefreshCw className="h-5 w-5 text-primary animate-spin" />
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
                                    className="bg-primary hover:bg-[#8B3A24] text-white flex-1 sm:flex-none"
                                    onClick={downloadAllAsZip}
                                    disabled={isGenerating || generatedMockups.length === 0 || isDownloadingZip}
                                    data-testid="button-download-zip"
                                  >
                                    {isDownloadingZip ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating ZIP...
                                      </>
                                    ) : (
                                      <>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Download All as ZIP
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Batch Progress Tracker */}
                              {batchJobs.length > 0 && (
                                <div className="bg-muted/30 border border-border rounded-xl p-4 mb-4 shrink-0" data-testid="batch-progress-tracker">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium text-foreground">Batch Progress</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-muted-foreground">{completedJobs} completed</span>
                                      </span>
                                      {failedJobsCount > 0 && (
                                        <span className="flex items-center gap-1.5">
                                          <div className="h-2 w-2 rounded-full bg-red-500" />
                                          <span className="text-red-600">{failedJobsCount} failed</span>
                                        </span>
                                      )}
                                      {pendingJobs > 0 && isGenerating && (
                                        <span className="flex items-center gap-1.5">
                                          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                          <span className="text-muted-foreground">{pendingJobs} pending</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {batchJobs.map((job) => (
                                      <div
                                        key={job.id}
                                        className={cn(
                                          "relative rounded-lg border p-2 text-center text-xs transition-all",
                                          job.status === 'completed' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                                          job.status === 'processing' && "bg-[#B94E30]/10 dark:bg-[#B94E30]/20 border-[#B94E30]/30 dark:border-[#B94E30]/70 animate-pulse",
                                          job.status === 'pending' && "bg-muted/50 border-border",
                                          job.status === 'failed' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        )}
                                        data-testid={`batch-job-${job.id}`}
                                      >
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                          {job.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                          {job.status === 'processing' && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                                          {job.status === 'pending' && <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30" />}
                                          {job.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-600" />}
                                        </div>
                                        <p className="font-medium truncate">{job.color}</p>
                                        <p className="text-muted-foreground text-[10px] truncate capitalize">{job.angle.replace('-', ' ')}</p>
                                        {job.status === 'failed' && (
                                          <button
                                            onClick={() => retryFailedJob(job.id)}
                                            className="mt-1 text-[10px] text-primary hover:underline flex items-center justify-center gap-0.5"
                                            data-testid={`retry-job-${job.id}`}
                                          >
                                            <RotateCw className="h-2.5 w-2.5" />
                                            Retry
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {failedJobsCount > 0 && !isGenerating && (
                                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                      <p className="text-xs text-red-600">
                                        {failedJobsCount} generation{failedJobsCount > 1 ? 's' : ''} failed
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={retryAllFailed}
                                        className="h-7 text-xs gap-1.5"
                                        data-testid="button-retry-all-failed"
                                      >
                                        <RotateCw className="h-3 w-3" />
                                        Retry All Failed
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

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
                                        <Info className="h-4 w-4 text-primary" />
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
                                            <Shirt className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Product</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">{selectedProductType || "T-Shirt"}</p>
                                        </div>

                                        {/* Colors */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-colors">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Palette className="h-3 w-3 text-primary" />
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
                                            <Ruler className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sizes</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">
                                            {selectedSizes.length > 0 ? selectedSizes.join(", ") : "L"}
                                          </p>
                                        </div>

                                        {/* Model */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-model">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <User className="h-3 w-3 text-primary" />
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
                                            <Sparkles className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Style</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate">
                                            {BRAND_STYLES.find(s => s.id === selectedStyle)?.name || "Minimal"}
                                          </p>
                                        </div>

                                        {/* Angles */}
                                        <div className="bg-card rounded-lg p-3 border border-border" data-testid="summary-angles">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <Camera className="h-3 w-3 text-primary" />
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

                              <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 sm:-mx-4 sm:px-4 md:mx-0 md:px-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-24 sm:pb-20">
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
                                        className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-border cursor-pointer active:scale-[0.98]"
                                        data-testid={`mockup-card-${i}`}
                                      >
                                        <img src={mockup.src} alt={`Mockup ${i + 1}`} className="w-full h-full object-cover" />
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 sm:p-4">
                                          <div className="flex items-center justify-between sm:justify-end gap-2">
                                            <Button 
                                              size="icon" 
                                              className="h-10 w-10 sm:h-8 sm:w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg min-h-[44px] sm:min-h-0"
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
                                              data-testid={`button-expand-mockup-${i}`}
                                            >
                                              <Maximize className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              className="h-10 sm:h-8 px-3 sm:px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg min-h-[44px] sm:min-h-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                downloadImage(mockup.src, `mockup_${mockup.size}_${mockup.color.replace(/\s+/g, '-')}_${mockup.angle}_${Date.now()}_${i}.png`);
                                              }}
                                              data-testid={`button-download-mockup-${i}`}
                                            >
                                              <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1.5" />
                                              Download
                                            </Button>
                                          </div>
                                        </div>

                                        <Badge className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-[10px] border-0 text-white font-normal px-2 py-0.5">
                                          {angleName}
                                        </Badge>
                                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                                          <Badge className="bg-primary/80 backdrop-blur-md text-[10px] border-0 text-white font-semibold px-2 py-0.5">
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
                                          <div className="absolute inset-0 bg-[#B94E30]/20 blur-xl rounded-full animate-pulse" />
                                          <Loader2 className="h-8 w-8 text-primary animate-spin relative z-10" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Generating...</p>
                                      </div>
                                      <div className="absolute inset-0 bg-gradient-to-t from-muted/50 to-transparent" />
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Sticky Bottom Action Bar - Mobile Only */}
                              <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-3 z-40 safe-area-pb">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline"
                                    onClick={() => setJourney(null)}
                                    disabled={isGenerating}
                                    className="flex-1 h-12 min-h-[48px]"
                                    data-testid="button-start-over-mobile"
                                  >
                                    Start Over
                                  </Button>
                                  <Button 
                                    className="flex-[2] h-12 min-h-[48px] bg-primary hover:bg-[#8B3A24] text-white"
                                    onClick={downloadAllAsZip}
                                    disabled={isGenerating || generatedMockups.length === 0 || isDownloadingZip}
                                    data-testid="button-download-all-mobile"
                                  >
                                    {isDownloadingZip ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating ZIP...
                                      </>
                                    ) : (
                                      <>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Download All ({generatedMockups.length})
                                      </>
                                    )}
                                  </Button>
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
        
        {journey && currentStep !== "generate" && (
          <AnimatePresence>
            <ProductPreview
              uploadedImage={uploadedImage}
              selectedProduct={selectedProductType}
              selectedColor={selectedColors[0] || "White"}
              isMinimized={previewMinimized}
              onToggle={() => setPreviewMinimized(!previewMinimized)}
              journey={journey}
            />
          </AnimatePresence>
        )}
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMockupDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6"
            onClick={() => setSelectedMockupDetails(null)}
            data-testid="modal-mockup-details"
          >
            <div 
              className="w-full max-w-7xl h-[95vh] sm:h-[90vh] md:h-[85vh] bg-card rounded-xl sm:rounded-2xl overflow-hidden flex flex-col md:flex-row border border-border shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Left: Image */}
              <div className="w-full h-[35vh] sm:h-[40vh] md:h-auto md:flex-1 bg-muted/20 flex items-center justify-center p-2 sm:p-4 md:p-8 relative group bg-checkerboard">
                <img 
                  src={selectedMockupDetails.src} 
                  alt={`Mockup ${selectedMockupDetails.index + 1}`} 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                  data-testid="img-mockup-fullsize"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
                   <Button 
                     size="icon" 
                     className="rounded-full bg-black/50 text-white border-0 hover:bg-black/70 h-10 w-10 sm:h-9 sm:w-9 min-h-[44px] sm:min-h-0"
                     onClick={() => setSelectedMockupDetails(null)}
                     data-testid="button-close-modal-image"
                   >
                     <X className="h-5 w-5 sm:h-4 sm:w-4" />
                   </Button>
                </div>
              </div>

              {/* Right: Details */}
              <div className="w-full md:w-[400px] bg-card border-t md:border-t-0 md:border-l border-border flex flex-col flex-1 md:flex-initial md:h-auto">
                <div className="p-3 sm:p-4 md:p-6 border-b border-border flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">Mockup Details</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedMockupDetails(null)} 
                    className="text-muted-foreground hover:text-foreground h-10 w-10 sm:h-9 sm:w-9 min-h-[44px] sm:min-h-0"
                    data-testid="button-close-modal"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-14 sm:h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border min-h-[52px] active:scale-[0.98]"
                      onClick={() => downloadImage(selectedMockupDetails.src, `mockup_${selectedMockupDetails.index + 1}_${selectedMockupDetails.color}_${selectedMockupDetails.angle.replace(/\s+/g, '_')}.png`)}
                      data-testid="button-download-mockup"
                    >
                      <Download className="h-5 w-5" />
                      <span className="text-[10px]">Download</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-14 sm:h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border min-h-[52px] active:scale-[0.98]"
                      onClick={() => toast({ title: "Copied to clipboard" })}
                    >
                      <Copy className="h-5 w-5" />
                      <span className="text-[10px]">Copy</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-14 sm:h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border min-h-[52px] active:scale-[0.98]"
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
