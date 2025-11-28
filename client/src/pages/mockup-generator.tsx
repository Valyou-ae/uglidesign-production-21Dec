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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
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
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

// Import sample mood images
import moodMinimal from "@assets/generated_images/mood_image_for_minimalist_luxury_style.png";
import moodUrban from "@assets/generated_images/mood_image_for_urban_street_style.png";
import moodNatural from "@assets/generated_images/mood_image_for_natural_organic_style.png";
import moodBold from "@assets/generated_images/mood_image_for_bold_vibrant_style.png";

// Types
type JourneyType = "DTG" | "AOP" | null;
type WizardStep = 
  | "upload" 
  | "seamless" 
  | "product" 
  | "platform" 
  | "style" 
  | "scene" 
  | "colors" 
  | "angles" 
  | "generate";

const DTG_STEPS: WizardStep[] = ["upload", "product", "platform", "style", "scene", "colors", "angles", "generate"];
const AOP_STEPS: WizardStep[] = ["upload", "seamless", "product", "platform", "style", "scene", "colors", "angles", "generate"];

export default function MockupGenerator() {
  const [journey, setJourney] = useState<JourneyType>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMockups, setGeneratedMockups] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = journey === "AOP" ? AOP_STEPS : DTG_STEPS;
  const currentStep = steps[currentStepIndex];

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStage("Initializing engine...");

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    const stages = [
      { pct: 10, text: "Analyzing product geometry..." },
      { pct: 30, text: "Mapping textures..." },
      { pct: 50, text: "Calculating lighting & shadows..." },
      { pct: 75, text: "Rendering 12 angles..." },
      { pct: 90, text: "Applying post-processing..." },
      { pct: 100, text: "Finalizing..." }
    ];

    let currentStage = 0;

    intervalRef.current = setInterval(() => {
      if (currentStage >= stages.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsGenerating(false);
        setGeneratedMockups([
          moodMinimal, // Placeholder results
          moodUrban,
          moodNatural,
          moodBold
        ]);
        toast({
          title: "Mockups Generated!",
          description: "Your professional product photos are ready.",
          className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400",
        });
        return;
      }

      setGenerationProgress(stages[currentStage].pct);
      setGenerationStage(stages[currentStage].text);
      currentStage++;
    }, 600); // Slightly faster simulation
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto relative flex flex-col">
        {/* State 1: Journey Selection */}
        {!journey ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="max-w-[800px] w-full text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Mockup Generator</h1>
              <p className="text-lg text-muted-foreground mb-12">Choose your print method to get started</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DTG Card */}
                <div 
                  onClick={() => handleJourneySelect("DTG")}
                  className="bg-card border-2 border-border rounded-[24px] p-10 text-left cursor-pointer transition-all duration-300 hover:border-indigo-600 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/15 group"
                >
                  <div className="h-16 w-16 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shirt className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Direct-to-Garment (DTG)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    For designs placed on a specific area of a product, like a logo on the chest of a t-shirt or a graphic on a tote bag.
                  </p>
                  <span className="text-sm font-bold text-indigo-600 group-hover:underline flex items-center">
                    Choose DTG <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                </div>

                {/* AOP Card */}
                <div 
                  onClick={() => handleJourneySelect("AOP")}
                  className="bg-card border-2 border-border rounded-[24px] p-10 text-left cursor-pointer transition-all duration-300 hover:border-purple-600 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/15 group relative overflow-hidden"
                >
                  <Badge className="absolute top-6 right-6 bg-amber-500 text-white hover:bg-amber-600 text-[11px]">Pro</Badge>
                  <div className="h-16 w-16 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Grid className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">All-Over Print (AOP)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    For seamless patterns that cover the entire surface of a product, like leggings, backpacks, or custom-cut apparel.
                  </p>
                  <span className="text-sm font-bold text-purple-600 group-hover:underline flex items-center">
                    Choose AOP <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // State 2: Step-by-Step Wizard
          <div className="flex-1 flex flex-col h-full">
            {/* Top Progress Bar */}
            <div className="bg-card border-b border-border px-10 py-6">
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
                      platform: Building,
                      style: Sparkles,
                      scene: MapPin,
                      colors: Palette,
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
                          "text-[10px] font-bold uppercase tracking-wider transition-colors",
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
            <div className="flex-1 p-6 lg:p-10 overflow-hidden flex flex-col">
              <div className="flex-1 bg-card border border-border rounded-[20px] shadow-sm overflow-hidden flex flex-col relative max-w-[1400px] mx-auto w-full">
                
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
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
                        <div className="flex flex-col items-center justify-center h-full max-w-[600px] mx-auto text-center">
                          {!uploadedImage ? (
                            <div 
                              className="w-full border-2 border-dashed border-border rounded-[20px] p-16 hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileUpload}
                              />
                              <div className="h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Cloud className="h-10 w-10 text-indigo-600" />
                              </div>
                              <h2 className="text-2xl font-bold text-foreground mb-2">Drag & drop your design</h2>
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
                      )}

                      {currentStep === "product" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                          {/* Categories */}
                          <div className="lg:col-span-3 border-r border-border pr-6 space-y-6">
                            <div className="space-y-1">
                              {["Men's Clothing", "Women's Clothing", "Kids' Clothing", "Accessories", "Home & Living"].map((cat, i) => (
                                <button 
                                  key={cat}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    i === 0 ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                            <div className="space-y-1 pl-2 border-l-2 border-border ml-2">
                              {["T-shirts", "Long Sleeves", "Sweatshirts", "Hoodies", "Tank Tops"].map(sub => (
                                <button key={sub} className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                  {sub}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Product Grid */}
                          <div className="lg:col-span-6">
                            <h3 className="text-lg font-bold mb-4">Choose Product</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="group relative border border-border rounded-xl p-4 cursor-pointer hover:border-indigo-600 hover:shadow-lg transition-all">
                                  <div className="aspect-[3/4] bg-muted rounded-lg mb-3 relative overflow-hidden">
                                    {/* Placeholder for product image */}
                                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  </div>
                                  <p className="font-bold text-sm">Classic Tee</p>
                                  <p className="text-xs text-muted-foreground">Gildan 5000</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Model Config */}
                          <div className="lg:col-span-3 border-l border-border pl-6">
                            <h3 className="text-lg font-bold mb-4">Configure Model</h3>
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Gender</label>
                                <div className="flex flex-wrap gap-2">
                                  {["Female", "Male", "Non-Binary"].map(opt => (
                                    <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                                      {opt}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Ethnicity</label>
                                <div className="flex flex-wrap gap-2">
                                  {["White", "Black", "Asian", "Hispanic", "Diverse"].map(opt => (
                                    <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                                      {opt}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Placeholder for other steps to keep code concise */}
                      {["platform", "seamless", "scene", "colors", "angles"].includes(currentStep) && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Wand2 className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h2 className="text-2xl font-bold mb-2">Step: {currentStep}</h2>
                          <p className="text-muted-foreground">This step content would be fully implemented here.</p>
                        </div>
                      )}

                      {currentStep === "style" && (
                        <div>
                          <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold mb-2">Choose Brand Archetype</h2>
                            <p className="text-muted-foreground">Define the mood and aesthetic of your photoshoot</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                              { name: "Minimalist Luxury", img: moodMinimal, desc: "Clean, high-end, subtle" },
                              { name: "Urban Street", img: moodUrban, desc: "Gritty, authentic, street" },
                              { name: "Natural Organic", img: moodNatural, desc: "Earthy, sustainable" },
                              { name: "Bold & Vibrant", img: moodBold, desc: "Colorful, energetic" },
                              { name: "Dark & Moody", img: moodUrban, desc: "Dramatic, high contrast" }, // Reusing placeholder
                              { name: "Vintage Retro", img: moodMinimal, desc: "Nostalgic, classic" },   // Reusing placeholder
                              { name: "Tech Modern", img: moodBold, desc: "Sleek, futuristic" },        // Reusing placeholder
                              { name: "Bohemian", img: moodNatural, desc: "Free-spirited, artistic" },  // Reusing placeholder
                            ].map((style, i) => (
                              <div key={i} className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-600 transition-all">
                                <img src={style.img} alt={style.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                                  <h3 className="text-white font-bold text-lg">{style.name}</h3>
                                  <p className="text-white/70 text-xs">{style.desc}</p>
                                </div>
                              </div>
                            ))}
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
                                  <span className="text-sm font-medium text-muted-foreground">Selected Product</span>
                                  <span className="font-bold">Men's Classic Tee</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                                  <span className="text-sm font-medium text-muted-foreground">Style</span>
                                  <span className="font-bold">Urban Street</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-muted-foreground">Total Output</span>
                                  <Badge className="bg-indigo-600">12 Mockups</Badge>
                                </div>
                              </div>

                              <Button 
                                size="lg" 
                                onClick={handleGenerate}
                                className="h-14 px-10 text-lg rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-1"
                              >
                                <Wand2 className="mr-2 h-5 w-5" />
                                Generate 12 Mockups
                              </Button>
                            </div>
                          ) : isGenerating ? (
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
                              <p className="text-xs text-muted-foreground">{generationProgress}% complete</p>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col h-full">
                              <div className="flex items-center justify-between mb-6">
                                <div>
                                  <h2 className="text-2xl font-bold">12 Mockups Ready</h2>
                                  <p className="text-sm text-muted-foreground">Seed: 82739103</p>
                                </div>
                                <div className="flex gap-3">
                                  <Button variant="outline">Start Over</Button>
                                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download ZIP
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pb-10">
                                {generatedMockups.map((img, i) => (
                                  <div key={i} className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-border cursor-pointer">
                                    <img src={img} alt="Mockup" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                        <Maximize className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <Badge className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-[10px] border-0">
                                      Front View
                                    </Badge>
                                  </div>
                                ))}
                                {/* Repeat for demo grid effect */}
                                {generatedMockups.map((img, i) => (
                                  <div key={`dup-${i}`} className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-border cursor-pointer">
                                    <img src={img} alt="Mockup" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                        <Maximize className="h-4 w-4" />
                                      </Button>
                                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <Badge className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-[10px] border-0">
                                      Side View
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* FOOTER NAVIGATION */}
                <div className="bg-muted/30 border-t border-border p-4 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      onClick={handleBack}
                      disabled={currentStepIndex === 0 && !journey}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">
                      Press <kbd className="px-1 rounded bg-muted border border-border">Esc</kbd> to go back
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">
                      Press <kbd className="px-1 rounded bg-muted border border-border">Enter</kbd> for next
                    </span>
                    {currentStep !== "generate" && (
                      <Button 
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                        disabled={currentStep === "upload" && !uploadedImage}
                      >
                        Next Step
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
