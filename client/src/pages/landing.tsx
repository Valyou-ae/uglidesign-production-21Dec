import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useAnimationControls } from "framer-motion";
import { useLoginPopup } from "@/components/login-popup";
import { 
  Sparkles, 
  Shirt, 
  Scissors, 
  ArrowRight, 
  Check, 
  Star,
  Zap,
  Play,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Loader2,
  Heart,
  Wand2,
  Eye,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { galleryApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type AspectRatio = "1:1" | "16:9" | "4:5" | "3:4";

interface SampleImage {
  id: string;
  aspectRatio: AspectRatio;
  image: string;
  prompt: string;
  isGenerated?: boolean;
  isGalleryImage?: boolean;
  views?: number;
  likes?: number;
  uses?: number;
}

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "sample-1",
    aspectRatio: "1:1",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
    prompt: "Luxury watch product shot"
  },
  {
    id: "sample-2", 
    aspectRatio: "16:9",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop",
    prompt: "Mountain landscape at sunset"
  },
  {
    id: "sample-3",
    aspectRatio: "4:5",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
    prompt: "Portrait photography"
  },
  {
    id: "sample-4",
    aspectRatio: "1:1",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
    prompt: "Gourmet food photography"
  },
  {
    id: "sample-5",
    aspectRatio: "16:9",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
    prompt: "Starry night sky over mountains"
  },
  {
    id: "sample-6",
    aspectRatio: "3:4",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
    prompt: "Fashion portrait"
  }
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Image Generation",
    description: "Create stunning visuals from text descriptions with our advanced AI models.",
    gradient: "from-[#ed5387] to-[#C2185B]",
  },
  {
    icon: Shirt,
    title: "Product Mockups",
    description: "Generate professional mockups for 50+ products. Perfect for e-commerce.",
    gradient: "from-[#1A1A2E] to-[#4A3830]",
  },
  {
    icon: Scissors,
    title: "Background Removal",
    description: "Remove backgrounds instantly with AI precision. Get transparent results.",
    gradient: "from-[#9C27B0] to-[#7B1FA2]",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "E-commerce Owner",
    content: "UGLI saved me hours of work. The mockup generator is incredible - my product photos look professional now.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Graphic Designer",
    content: "The AI image generation is on another level. I use it daily for client projects and concept art.",
    avatar: "MJ",
  },
  {
    name: "Emily Rodriguez",
    role: "Content Creator",
    content: "Background removal is instant and accurate. No more tedious editing in Photoshop!",
    avatar: "ER",
  },
];

const PRICING = [
  {
    name: "Free",
    price: 0,
    credits: 100,
    features: ["100 credits/month", "Basic image generation", "Standard quality"],
  },
  {
    name: "Pro",
    price: 29,
    credits: 2000,
    popular: true,
    features: ["2,000 credits/month", "All AI generators", "HD exports", "Priority support"],
  },
  {
    name: "Business",
    price: 79,
    credits: 10000,
    features: ["10,000 credits/month", "API access", "Team collaboration", "Dedicated support"],
  },
];

const FAQ = [
  {
    question: "What are credits and how do they work?",
    answer: "Credits are used each time you generate an image, create a mockup, or remove a background. Each action costs a specific number of credits based on complexity.",
  },
  {
    question: "Can I try UGLI for free?",
    answer: "Yes! Our Free plan gives you 100 credits per month to try all our features. No credit card required.",
  },
  {
    question: "What file formats do you support?",
    answer: "We support PNG, JPEG, and WebP for both input and output. Transparent backgrounds export as PNG.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 7-day money-back guarantee on all paid plans. If you're not satisfied, contact support for a full refund.",
  },
];

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { openLoginPopup } = useLoginPopup();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center shadow-lg shadow-[#ed5387]/20">
              <div className="h-4 w-4 bg-white/20 rounded-md backdrop-blur-sm" />
            </div>
            <span className="font-bold text-xl text-foreground">UGLI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <Button 
              variant="ghost" 
              className="hidden sm:inline-flex" 
              onClick={() => openLoginPopup()}
              data-testid="button-login"
            >
              Log in
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90" 
              onClick={() => openLoginPopup()}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            <nav className="flex flex-col gap-2">
              <a href="#features" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Features</a>
              <a href="#pricing" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Pricing</a>
              <a href="#testimonials" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Testimonials</a>
              <a href="#faq" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">FAQ</a>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}

interface HeroProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  hasUsedFreeGeneration: boolean;
  error: string | null;
  onGenerate: () => void;
  onLogin: () => void;
}

function Hero({ prompt, setPrompt, isGenerating, hasUsedFreeGeneration, error, onGenerate, onLogin }: HeroProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating && prompt.trim()) {
      onGenerate();
    }
  };

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ed5387]/5 via-transparent to-[#9C27B0]/5" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#ed5387]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#9C27B0]/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            A User Curated Image Journey
          </span>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Create Stunning Visuals with{" "}
            <span className="text-gradient-brand bg-gradient-to-r from-[#ed5387] to-[#9C27B0] bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            Tools
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Generate images, create product mockups, and remove backgrounds in seconds. 
            Professional results without the professional learning curve.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8 text-base" data-testid="button-hero-cta">
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" data-testid="button-watch-demo">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. 100 free credits to start.
          </p>

          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-2">
              <input
                type="text"
                placeholder="Describe the image you want to create..."
                className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                data-testid="input-guest-prompt"
              />
              <Button 
                className="bg-primary hover:bg-primary/90 h-12 px-6"
                onClick={onGenerate}
                disabled={isGenerating || !prompt.trim()}
                data-testid="button-guest-generate"
              >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                {isGenerating ? "Creating..." : "Try Free"}
              </Button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-destructive" data-testid="text-generation-error">
                {error}
              </p>
            )}
            {hasUsedFreeGeneration && !error && (
              <p className="mt-3 text-sm text-muted-foreground">
                You've used your free generation.{" "}
                <button onClick={onLogin} className="text-primary underline" data-testid="button-login-after-generation">
                  Login
                </button>{" "}
                for unlimited access!
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface ImageScrollerProps {
  generatedImage?: { imageData: string; mimeType: string } | null;
  onLogin: () => void;
}

function ImageScroller({ generatedImage, onLogin }: ImageScrollerProps) {
  const [displayImages, setDisplayImages] = useState<SampleImage[]>(SAMPLE_IMAGES);
  const [isPaused, setIsPaused] = useState(false);
  const controls = useAnimationControls();
  const { toast } = useToast();

  const handleCopyPrompt = async (prompt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt);
    toast({ title: "Prompt copied!", description: "The prompt has been copied to your clipboard." });
  };

  const handleRemix = async (prompt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt);
    toast({ title: "Prompt copied!", description: "Go to Image Creation to create your own variant." });
  };

  useEffect(() => {
    galleryApi.getAll()
      .then(result => {
        if (result.images && result.images.length > 0) {
          const galleryImages: SampleImage[] = result.images.slice(0, 12).map((img: any) => ({
            id: String(img.id),
            aspectRatio: (img.aspectRatio || "1:1") as AspectRatio,
            image: img.imageUrl,
            prompt: img.prompt || "AI Generated",
            isGalleryImage: true,
            views: img.viewCount || 0,
            likes: img.likeCount || 0,
            uses: img.useCount || 0
          }));
          const merged = [...galleryImages, ...SAMPLE_IMAGES.slice(0, Math.max(0, 6 - galleryImages.length))];
          setDisplayImages(merged.length > 0 ? merged : SAMPLE_IMAGES);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (generatedImage) {
      setDisplayImages(prev => {
        const newImages = [...prev];
        const idx = newImages.findIndex(img => img.aspectRatio === "1:1");
        if (idx !== -1) {
          newImages[idx] = {
            ...newImages[idx],
            id: "generated",
            image: `data:${generatedImage.mimeType};base64,${generatedImage.imageData}`,
            prompt: "Your AI Creation ✨",
            isGenerated: true
          };
        }
        return newImages;
      });
    }
  }, [generatedImage]);

  useEffect(() => {
    if (isPaused) {
      controls.stop();
    } else {
      controls.start({
        x: [0, -1600],
        transition: {
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear"
          }
        }
      });
    }
  }, [isPaused, controls]);

  const aspectClasses: Record<AspectRatio, string> = {
    "1:1": "w-64 h-64",
    "16:9": "w-80 h-[180px]",
    "4:5": "w-52 h-[260px]",
    "3:4": "w-48 h-64"
  };

  return (
    <section className="py-12 overflow-hidden">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-medium text-muted-foreground">
          See what's possible with UGLI
        </h3>
      </div>
      
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div 
          className="flex gap-4 px-4"
          animate={controls}
          style={{ width: "fit-content" }}
        >
          {[...displayImages, ...displayImages].map((item, index) => (
            <motion.div
              key={`${item.id}-${index}`}
              className={cn(
                "relative flex-shrink-0 rounded-2xl overflow-hidden border border-border group cursor-pointer",
                aspectClasses[item.aspectRatio] || "w-64 h-64",
                item.isGenerated && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              data-testid={`image-scroller-item-${index}`}
            >
              <img 
                src={item.image}
                alt={item.prompt}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-medium truncate">{item.prompt}</p>
                  {item.isGenerated && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-primary/80 rounded-full text-[10px] text-white">
                      <Sparkles className="h-3 w-3" />
                      Your Creation
                    </span>
                  )}
                  {item.isGalleryImage && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-white/80">
                        <Eye className="h-3 w-3" />
                        {formatCount(item.views || 0)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-white/80">
                        <Heart className="h-3 w-3" />
                        {formatCount(item.likes || 0)}
                      </span>
                      <button
                        onClick={(e) => handleRemix(item.prompt, e)}
                        className="flex items-center gap-1 text-[10px] text-white/80 hover:text-primary transition-colors"
                        title="Remix - Create your own variant"
                        data-testid={`button-remix-${item.id}`}
                      >
                        <Wand2 className="h-3 w-3" />
                        {formatCount(item.uses || 0)}
                      </button>
                      <button
                        onClick={(e) => handleCopyPrompt(item.prompt, e)}
                        className="flex items-center gap-1 text-[10px] text-white/80 hover:text-primary transition-colors"
                        title="Copy prompt"
                        data-testid={`button-copy-${item.id}`}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {item.isGenerated && (
                <motion.div 
                  className="absolute inset-0 bg-primary/20 pointer-events-none"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: 3 }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
        
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

interface GeneratedImageCTAProps {
  onLogin: () => void;
}

function GeneratedImageCTA({ onLogin }: GeneratedImageCTAProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-xl mx-auto text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <Button onClick={onLogin} className="bg-primary hover:bg-primary/90" data-testid="button-save-image">
            <Heart className="h-4 w-4 mr-2" />
            Save Your Image
          </Button>
          <Button onClick={onLogin} variant="outline" data-testid="button-generate-more">
            <Wand2 className="h-4 w-4 mr-2" />
            Generate More
          </Button>
        </div>
        
        <p className="text-muted-foreground text-sm">
          ✨ Your first AI creation is in the gallery above!{" "}
          <button onClick={onLogin} className="text-primary underline" data-testid="button-create-account">
            Create an account
          </button>{" "}
          for unlimited generations.
        </p>
      </div>
    </motion.section>
  );
}

function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Create
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful AI tools that make professional design accessible to everyone.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group"
            >
              <div className={cn(
                "h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                feature.gradient
              )}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative rounded-2xl border p-6",
                plan.popular 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-border bg-card"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/signup">
                <Button 
                  className={cn(
                    "w-full",
                    plan.popular ? "bg-primary hover:bg-primary/90" : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Loved by Creators
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users are saying about UGLI.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#9C27B0] text-[#9C27B0]" />
                ))}
              </div>
              <p className="text-foreground mb-4">"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
        </motion.div>
        
        <div className="space-y-4">
          {FAQ.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground">{item.question}</span>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  openIndex === index && "rotate-180"
                )} />
              </button>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <p className="text-muted-foreground">{item.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#ed5387] to-[#C2185B] rounded-3xl p-10 sm:p-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Creating?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of creators using UGLI to bring their ideas to life.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-[#ed5387] hover:bg-white/90 h-12 px-8" data-testid="button-cta-final">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center">
              <div className="h-3 w-3 bg-white/20 rounded-sm" />
            </div>
            <span className="font-bold text-foreground">UGLI</span>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
            <Link href="/help" className="text-muted-foreground hover:text-foreground">Support</Link>
            <Link href="/help" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/help" className="text-muted-foreground hover:text-foreground">Terms</Link>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            © 2025 UGLI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ imageData: string; mimeType: string } | null>(null);
  const [hasUsedFreeGeneration, setHasUsedFreeGeneration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openLoginPopup } = useLoginPopup();

  const guestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ugli_guest_id");
    if (stored) {
      guestIdRef.current = stored;
      const hasGenerated = localStorage.getItem("ugli_guest_generated");
      if (hasGenerated) setHasUsedFreeGeneration(true);
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem("ugli_guest_id", newId);
      guestIdRef.current = newId;
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/guest/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, guestId: guestIdRef.current }),
      });

      if (response.status === 403) {
        setHasUsedFreeGeneration(true);
        localStorage.setItem("ugli_guest_generated", "true");
        setError("You've already used your free generation. Login for more!");
        return;
      }

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data = await response.json();
      setGeneratedImage({ imageData: data.imageData, mimeType: data.mimeType });
      localStorage.setItem("ugli_guest_generated", "true");
      setHasUsedFreeGeneration(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main>
        <Hero
          prompt={prompt}
          setPrompt={setPrompt}
          isGenerating={isGenerating}
          hasUsedFreeGeneration={hasUsedFreeGeneration}
          error={error}
          onGenerate={handleGenerate}
          onLogin={openLoginPopup}
        />
        <ImageScroller generatedImage={generatedImage} onLogin={openLoginPopup} />
        {generatedImage && (
          <GeneratedImageCTA onLogin={openLoginPopup} />
        )}
        <Features />
        <Pricing />
        <Testimonials />
        <FAQSection />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
