import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Upload, 
  ChevronDown, 
  Zap, 
  Brain, 
  Palette, 
  Sliders, 
  Type, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Download, 
  Share2, 
  RefreshCw, 
  Eraser, 
  ZoomIn, 
  X, 
  Search,
  BookOpen,
  Wand2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Import generated images
import preview1 from "@assets/generated_images/abstract_creative_digital_art_of_a_beach_sunset_with_geometric_overlays.png"; // Placeholder until generation completes
import preview2 from "@assets/generated_images/minimalist_logo_design_sketch_with_geometric_shapes.png";
import preview3 from "@assets/generated_images/cyberpunk_neon_cityscape_with_futuristic_purple_and_blue_tones.png";
import preview4 from "@assets/generated_images/vintage_polaroid_photo_effect_with_warm_tones.png";

// Constants
const STYLES = [
  { id: "auto", name: "Auto ✨" },
  { id: "photo", name: "Photorealistic 📸" },
  { id: "cinematic", name: "Cinematic 🎬" },
  { id: "anime", name: "Anime/Manga 🎌" },
  { id: "oil", name: "Oil Painting 🖼️" },
  { id: "watercolor", name: "Watercolor 🎨" },
  { id: "digital", name: "Digital Art 💻" },
  { id: "minimalist", name: "Minimalist ⚪" },
  { id: "retrowave", name: "Retrowave 🌆" },
  { id: "fantasy", name: "Dark Fantasy ⚔️" },
  { id: "popart", name: "Pop Art 🎪" },
  { id: "isometric", name: "Isometric 3D 📦" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", icon: "⬜" },
  { id: "16:9", label: "16:9", icon: "🖼️" },
  { id: "9:16", label: "9:16", icon: "📱" },
  { id: "4:3", label: "4:3", icon: "🖥️" },
  { id: "3:4", label: "3:4", icon: "📄" },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("auto");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [quality, setQuality] = useState("standard");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [variations, setVariations] = useState([2]); // Using slider value array
  const [isRefinerOn, setIsRefinerOn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState({
    sentinel: "idle",
    architect: "idle",
    synthesizer: "idle",
    refiner: "idle",
    analyst: "idle"
  });
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Mock generation process
  const handleGenerate = () => {
    if (!prompt) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    setSelectedImageIndex(null);
    setGenerationStage(1);

    // Simulate agents working
    setAgentStatuses(prev => ({ ...prev, sentinel: "working" }));
    
    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, sentinel: "done", architect: "working" }));
      setGenerationStage(2);
    }, 1500);

    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, architect: "done", synthesizer: "working" }));
      setGenerationStage(3);
    }, 3000);

    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, synthesizer: "done", refiner: "working" }));
      setGenerationStage(4);
    }, 6000);

    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, refiner: "done", analyst: "working" }));
      setGenerationStage(5);
    }, 7500);

    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, analyst: "done" }));
      setIsGenerating(false);
      setGeneratedImages([preview1, preview2, preview3, preview4]);
      toast({
        title: "Generation Complete",
        description: "Your images are ready!",
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400",
      });
    }, 9000);
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-8 lg:p-10 max-w-[1600px] mx-auto min-h-full flex flex-col">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center text-[13px] text-muted-foreground mb-2">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span>Image Generator</span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Image Generator</h1>
            </div>
            <p className="text-[15px] text-muted-foreground ml-[52px]">
              Create stunning AI images with 5 intelligent agents
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 flex-1">
            
            {/* LEFT COLUMN: INPUT & CONTROLS */}
            <div className="w-full lg:w-[55%] flex flex-col gap-6">
              
              {/* Main Prompt Input Card */}
              <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
                <div className="relative">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your image... e.g., 'A neon-lit coffee shop sign saying OPEN 24/7 in a rainy Tokyo alley'"
                    className="min-h-[140px] text-base bg-muted/30 border-input resize-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-4 pr-16"
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-muted-foreground font-medium">
                    {prompt.length} / 2000
                  </div>
                </div>

                <div className="mt-4 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">
                    <Upload className="h-5 w-5" />
                    <span>Drop reference image or click to upload</span>
                  </div>
                </div>
              </div>

              {/* Quick Style Selector */}
              <div>
                <label className="text-[13px] font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">Style Preset</label>
                <div className="flex overflow-x-auto pb-2 gap-2.5 no-scrollbar mask-linear-fade">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "flex-shrink-0 px-4 py-2.5 rounded-full border text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                        selectedStyle === style.id
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                          : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings Accordion */}
              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="bg-muted/30 border border-border rounded-[14px] overflow-hidden"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors text-sm font-medium">
                  <span>Advanced Settings</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAdvancedOpen ? "rotate-180" : "")} />
                </CollapsibleTrigger>
                
                <CollapsibleContent className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6 animate-accordion-down">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Quality</label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger className="w-full rounded-xl bg-card border-input shadow-sm h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">⚡ Draft (Fast)</SelectItem>
                          <SelectItem value="standard">✨ Standard (Balanced)</SelectItem>
                          <SelectItem value="premium">💎 Premium (High Res)</SelectItem>
                          <SelectItem value="ultra">🔮 Ultra (Extreme Detail)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Aspect Ratio</label>
                      <div className="flex gap-2">
                        {ASPECT_RATIOS.map((ratio) => (
                          <button
                            key={ratio.id}
                            onClick={() => setAspectRatio(ratio.id)}
                            className={cn(
                              "flex-1 flex flex-col items-center justify-center py-2 rounded-lg border text-[10px] font-medium transition-all gap-1",
                              aspectRatio === ratio.id
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-card border-input text-muted-foreground hover:border-primary/30"
                            )}
                          >
                            <span className="text-lg">{ratio.icon}</span>
                            {ratio.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium flex justify-between">
                        <span>Variations</span>
                        <span>{variations[0]}</span>
                      </label>
                      <div className="pt-2 px-1">
                        <Slider
                          value={variations}
                          onValueChange={setVariations}
                          max={4}
                          min={1}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-xs font-medium text-foreground block">Master Refiner</label>
                          <p className="text-[10px] text-muted-foreground">Enhance output quality</p>
                        </div>
                        <Switch checked={isRefinerOn} onCheckedChange={setIsRefinerOn} />
                      </div>
                      
                      {isRefinerOn && (
                        <Select defaultValue="cinematic">
                          <SelectTrigger className="w-full h-8 text-xs rounded-lg bg-card">
                            <SelectValue placeholder="Refiner Preset" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cinematic">Cinematic</SelectItem>
                            <SelectItem value="sharp">Sharp Detail</SelectItem>
                            <SelectItem value="soft">Soft Glow</SelectItem>
                            <SelectItem value="vibrant">Vibrant</SelectItem>
                            <SelectItem value="moody">Moody</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* AI Enhancement Options */}
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-input bg-card text-xs font-medium hover:border-primary hover:text-primary transition-colors">
                  <Brain className="h-3.5 w-3.5" />
                  AI Curation
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-input bg-card text-xs font-medium hover:border-primary hover:text-primary transition-colors">
                  <Check className="h-3.5 w-3.5" />
                  Auto Optimize
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-input bg-card text-xs font-medium hover:border-primary hover:text-primary transition-colors">
                  <BookOpen className="h-3.5 w-3.5" />
                  Knowledge Base
                </button>
              </div>

              {/* Generate Button */}
              <div className="mt-auto">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={cn(
                    "w-full h-14 rounded-[14px] text-base font-bold shadow-lg transition-all duration-300",
                    isGenerating 
                      ? "bg-primary cursor-wait" 
                      : "bg-gradient-to-r from-purple-600 to-purple-700 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-purple-500/25"
                  )}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Generate Image
                    </div>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-sans text-[10px]">⌘</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-sans text-[10px]">Enter</kbd> to generate
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: AGENTS & OUTPUT */}
            <div className="w-full lg:w-[45%] flex flex-col gap-6 min-h-[600px]">
              
              {/* AI Agents Status Panel */}
              <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    🤖 AI Agents Pipeline
                  </h3>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                    5 agents
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 relative">
                  {/* Progress Line logic would go here ideally, simplified for mockup */}
                  
                  <AgentCard 
                    name="Text Sentinel" 
                    icon={Type} 
                    status={agentStatuses.sentinel} 
                    message={agentStatuses.sentinel === 'working' ? "Analyzing text..." : agentStatuses.sentinel === 'done' ? "Found: 'OPEN 24/7'" : "Ready to check spelling"} 
                  />
                  <AgentCard 
                    name="Style Architect" 
                    icon={Palette} 
                    status={agentStatuses.architect}
                    message={agentStatuses.architect === 'working' ? "Applying cinematic style..." : agentStatuses.architect === 'done' ? "Style applied" : "Ready to enhance style"}
                  />
                  <AgentCard 
                    name="Visual Synthesizer" 
                    icon={ImageIcon} 
                    status={agentStatuses.synthesizer}
                    message={agentStatuses.synthesizer === 'working' ? "Creating image..." : agentStatuses.synthesizer === 'done' ? "Base image created" : "Ready to generate"}
                  />
                  <AgentCard 
                    name="Master Refiner" 
                    icon={Sliders} 
                    status={agentStatuses.refiner}
                    message={agentStatuses.refiner === 'working' ? "Enhancing details..." : agentStatuses.refiner === 'done' ? "Details refined" : "Ready to refine"}
                  />
                  <div className="col-span-2">
                    <AgentCard 
                      name="Quality Analyst" 
                      icon={Brain} 
                      status={agentStatuses.analyst}
                      message={agentStatuses.analyst === 'working' ? "Analyzing quality..." : agentStatuses.analyst === 'done' ? "Quality Score: 9.2/10" : "Ready to learn"}
                      fullWidth
                    />
                  </div>
                </div>
              </div>

              {/* Output Preview Area */}
              <div className="flex-1 bg-card border border-border rounded-[20px] overflow-hidden flex flex-col relative min-h-[400px]">
                
                {isGenerating ? (
                  <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative mb-6">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 animate-spin opacity-20 absolute inset-0 blur-xl" />
                      <div className="h-20 w-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent animate-pulse">
                      Creating your masterpiece...
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      Stage {generationStage}/5: {
                        generationStage === 1 ? "Text Sentinel analyzing..." :
                        generationStage === 2 ? "Style Architect designing..." :
                        generationStage === 3 ? "Visual Synthesizer rendering..." :
                        generationStage === 4 ? "Master Refiner polishing..." :
                        "Quality Analyst checking..."
                      }
                    </p>
                  </div>
                ) : generatedImages.length > 0 ? (
                  selectedImageIndex !== null ? (
                    // Single Image View
                    <div className="flex-1 flex flex-col relative group">
                      <div className="flex-1 p-6 flex items-center justify-center bg-muted/10">
                        <img 
                          src={generatedImages[selectedImageIndex]} 
                          alt="Generated Art" 
                          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-border"
                        />
                        <button 
                          onClick={() => setSelectedImageIndex(null)}
                          className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="p-4 bg-card border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Rate result:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} className="text-yellow-400 hover:scale-110 transition-transform">
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            AI Quality Score: 8.5/10
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Grid View
                    <div className="flex-1 p-6 grid grid-cols-2 gap-4 overflow-y-auto">
                      {generatedImages.map((img, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-border hover:border-primary transition-all hover:shadow-lg"
                          onClick={() => setSelectedImageIndex(idx)}
                        >
                          <img src={img} alt={`Variation ${idx + 1}`} className="h-full w-full object-cover" />
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                            <div className="flex gap-2">
                              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black">
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black">
                                <Type className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black">
                                <Eraser className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white border-0 rounded-full px-4 shadow-lg">
                              <Zap className="h-3 w-3 mr-1.5" />
                              Enhance
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  // Empty State
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/50 m-4 rounded-xl bg-muted/10">
                    <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mb-4 shadow-inner">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Generated artwork will appear here</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Enter a detailed prompt in the input panel and click Generate to see the magic happen.
                    </p>
                  </div>
                )}

                {/* Action Bar */}
                {(generatedImages.length > 0) && (
                  <div className="bg-muted/30 border-t border-border p-4 flex items-center justify-between backdrop-blur-sm">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-9 rounded-full bg-card border-border hover:bg-muted">
                        <Type className="h-3.5 w-3.5 mr-2" />
                        Edit Text
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 rounded-full bg-card border-border hover:bg-muted">
                        <Eraser className="h-3.5 w-3.5 mr-2" />
                        Change BG
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-card border-border hover:bg-muted">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-card border-border hover:bg-muted">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="h-9 rounded-full bg-primary hover:bg-primary/90 text-white border-0">
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}

              </div>
              
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AgentCard({ name, icon: Icon, status, message, fullWidth }: any) {
  const statusConfig = {
    idle: { color: "border-l-zinc-400 dark:border-l-zinc-600", text: "text-muted-foreground", bg: "bg-muted/30" },
    working: { color: "border-l-purple-500", text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/10" },
    done: { color: "border-l-green-500", text: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/10" },
    error: { color: "border-l-red-500", text: "text-red-600", bg: "bg-red-50" }
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className={cn(
      "rounded-xl p-3 border border-border transition-all duration-300 border-l-[3px]",
      currentStatus.color,
      currentStatus.bg,
      fullWidth && "w-full"
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cn("h-4 w-4", currentStatus.text, status === 'working' && "animate-pulse")} />
        <span className="text-sm font-semibold text-foreground">{name}</span>
      </div>
      <p className="text-xs text-muted-foreground font-medium pl-6 truncate">
        {message}
      </p>
    </div>
  );
}
