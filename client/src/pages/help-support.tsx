import { useState } from "react";
import { 
  Search, 
  BookOpen, 
  Zap, 
  MessageCircle, 
  FileText, 
  ArrowRight, 
  Rocket, 
  Wand2, 
  ShoppingBag, 
  Scissors, 
  CreditCard, 
  Shield, 
  Code, 
  AlertCircle, 
  TrendingUp, 
  ChevronRight, 
  Clock, 
  PlayCircle, 
  Eye, 
  HelpCircle, 
  ChevronDown,
  BrainCircuit,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Types & Data ---

type Article = {
  id: string;
  title: string;
  category: string;
  time: string;
  updated: string;
  content: React.ReactNode;
};

type Category = {
  id: string;
  icon: any;
  color: string;
  title: string;
  desc: string;
  articleIds: string[];
};

const ARTICLES: Record<string, Article> = {
  "prompt-guide": {
    id: "prompt-guide",
    title: "How to write effective prompts for image generation",
    category: "Image Generation",
    time: "5 min",
    updated: "2 days ago",
    content: (
      <div className="space-y-6 text-[#18181B] dark:text-[#FAFAFA]">
        <p className="text-lg leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
          Mastering the art of prompt engineering is key to unlocking the full potential of Ugli's image generation. 
          This guide covers the structure of a perfect prompt and tips for consistent results.
        </p>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">The Anatomy of a Perfect Prompt</h3>
          <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            A well-structured prompt typically follows this formula:
          </p>
          <div className="bg-[#F4F4F5] dark:bg-[#1A1A1F] p-4 rounded-xl border border-[#E4E4E7] dark:border-[#2A2A30] font-mono text-sm">
            [Subject] + [Action/Context] + [Art Style] + [Lighting/Mood] + [Technical Specs]
          </div>
          <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            <strong>Example:</strong> "A futuristic cyberpunk city street (Subject) at night with rain (Context), synthwave style (Art Style), neon lighting (Lighting), 8k resolution, highly detailed (Technical Specs)."
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Key Elements</h3>
          <ul className="space-y-3 list-disc pl-5 text-[#71717A] dark:text-[#A1A1AA]">
            <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Subject:</strong> Be specific. Instead of "dog", try "Golden Retriever puppy".</li>
            <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Medium:</strong> Specify if you want a photo, oil painting, 3D render, or sketch.</li>
            <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Style:</strong> Reference specific artists (e.g., "in the style of Van Gogh") or movements ("Art Deco").</li>
            <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Lighting:</strong> Keywords like "cinematic lighting", "golden hour", or "studio lighting" make a huge difference.</li>
          </ul>
        </div>

        <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-6">
          <h4 className="text-[#7C3AED] font-semibold mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" /> Pro Tip
          </h4>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Use the <strong>Style Architect</strong> agent to automatically enhance your simple prompts. 
            Just type "cat sitting on a wall" and let the agent expand it into a detailed description.
          </p>
        </div>
      </div>
    )
  },
  "ai-agents": {
    id: "ai-agents",
    title: "Understanding the 5 AI agents",
    category: "AI Agents",
    time: "8 min",
    updated: "1 week ago",
    content: (
      <div className="space-y-6 text-[#18181B] dark:text-[#FAFAFA]">
        <p className="text-lg leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
          Ugli uses a unique multi-agent system where five specialized AI models work together to create your image. 
          Here's exactly what each one does.
        </p>

        <div className="grid gap-6">
          {[
            { name: "Text Sentinel", role: "The Guardian", desc: "Checks for spelling errors, forbidden content, and ambiguity in your prompt before generation begins." },
            { name: "Style Architect", role: "The Designer", desc: "Enhances your prompt with stylistic keywords, lighting descriptors, and artistic references to improve aesthetic quality." },
            { name: "Visual Synthesizer", role: "The Artist", desc: "The core diffusion model that actually generates the initial image based on the enhanced prompt." },
            { name: "Master Refiner", role: "The Polisher", desc: "Upscales the image, fixes artifacts, corrects faces/hands, and sharpens details." },
            { name: "Quality Analyst", role: "The Critic", desc: "Scores the final result against aesthetic standards and learns from your feedback (likes/dislikes)." }
          ].map((agent, i) => (
            <div key={i} className="border border-[#E4E4E7] dark:border-[#2A2A30] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#18181B] dark:text-[#FAFAFA]">{agent.name}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-[#F4F4F5] dark:bg-[#1F1F25] rounded-full text-[#71717A]">{agent.role}</span>
              </div>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">{agent.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "credits-guide": {
    id: "credits-guide",
    title: "How credits work and how to get more",
    category: "Billing & Credits",
    time: "3 min",
    updated: "1 month ago",
    content: (
      <div className="space-y-6 text-[#18181B] dark:text-[#FAFAFA]">
        <p className="text-lg leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
          Credits are the currency of Ugli. Every generation costs a certain amount of credits based on quality and settings.
        </p>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Cost Breakdown</h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-3 bg-[#F4F4F5] dark:bg-[#1A1A1F] rounded-lg">
              <span>Standard Image Generation</span>
              <span className="font-mono font-semibold">1 Credit</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-[#F4F4F5] dark:bg-[#1A1A1F] rounded-lg">
              <span>High Quality (Upscaled)</span>
              <span className="font-mono font-semibold">2 Credits</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-[#F4F4F5] dark:bg-[#1A1A1F] rounded-lg">
              <span>Background Removal</span>
              <span className="font-mono font-semibold">0.5 Credits</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-[#F4F4F5] dark:bg-[#1A1A1F] rounded-lg">
              <span>Mockup Generation</span>
              <span className="font-mono font-semibold">1 Credit</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  "seamless-patterns": {
    id: "seamless-patterns",
    title: "Creating seamless patterns for All-Over Print",
    category: "Mockup Generator",
    time: "6 min",
    updated: "3 days ago",
    content: (
      <div className="space-y-6 text-[#18181B] dark:text-[#FAFAFA]">
        <p className="text-lg leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
          Seamless patterns are perfect for print-on-demand products like t-shirts, leggings, and phone cases. 
          Here is how to create them using Ugli.
        </p>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Step 1: Enable Tiling</h3>
          <p className="text-[#71717A] dark:text-[#A1A1AA]">
            In the Image Generator settings, toggle the <strong>"Seamless Tile"</strong> option. 
            This ensures the edges of your image match perfectly when repeated.
          </p>
        </div>
        <div className="space-y-4">
           <h3 className="text-xl font-semibold">Step 2: Prompting for Patterns</h3>
           <p className="text-[#71717A] dark:text-[#A1A1AA]">
             Use keywords like "repeat pattern", "wallpaper design", "textile print", or "wrapping paper". 
             Avoid focusing on a single central subject.
           </p>
           <div className="bg-[#F4F4F5] dark:bg-[#1A1A1F] p-4 rounded-xl border border-[#E4E4E7] dark:border-[#2A2A30] font-mono text-sm">
             "Floral watercolor pattern, pastel colors, white background, repeat pattern, seamless --tile"
           </div>
        </div>
      </div>
    )
  },
  "troubleshoot-failed": {
    id: "troubleshoot-failed",
    title: "Troubleshooting failed generations",
    category: "Troubleshooting",
    time: "4 min",
    updated: "5 days ago",
    content: (
      <div className="space-y-6 text-[#18181B] dark:text-[#FAFAFA]">
        <p className="text-lg leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
          Sometimes generations fail. Here are the most common reasons and how to fix them.
        </p>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-[#DC2626]/10 flex items-center justify-center shrink-0 text-[#DC2626]">1</div>
            <div>
              <h4 className="font-semibold mb-1">NSFW Filter Triggered</h4>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Our safety system blocks content that violates our content policy. Try rephrasing your prompt to be more neutral.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-[#DC2626]/10 flex items-center justify-center shrink-0 text-[#DC2626]">2</div>
            <div>
              <h4 className="font-semibold mb-1">Server Overload</h4>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">During peak times, requests may time out. Wait a minute and try again.</p>
            </div>
          </div>
           <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-[#DC2626]/10 flex items-center justify-center shrink-0 text-[#DC2626]">3</div>
            <div>
              <h4 className="font-semibold mb-1">Insufficient Credits</h4>
              <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Check your balance in the top right corner. You may need to top up.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  "bg-removal-tips": {
    id: "bg-removal-tips",
    title: "Best practices for background removal",
    category: "Background Removal",
    time: "4 min",
    updated: "2 weeks ago",
    content: (
      <div className="space-y-6 text-[#18181B] dark:text-[#FAFAFA]">
        <p className="text-lg leading-relaxed text-[#71717A] dark:text-[#A1A1AA]">
          Get the cleanest cutouts with these tips for our AI background remover.
        </p>
        <ul className="space-y-4 list-disc pl-5 text-[#71717A] dark:text-[#A1A1AA]">
          <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Contrast is Key:</strong> The subject should stand out clearly from the background. A white subject on a white wall is hard to separate.</li>
          <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Focus:</strong> Ensure the subject is in sharp focus. Blurry edges make it difficult for the AI to define the boundary.</li>
          <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Lighting:</strong> Good lighting helps. Avoid harsh shadows that might be interpreted as part of the object.</li>
          <li><strong className="text-[#18181B] dark:text-[#FAFAFA]">Hair & Fur:</strong> Our AI is trained to handle fine details like hair, but high contrast backgrounds work best for these complex edges.</li>
        </ul>
      </div>
    )
  },
  "getting-started-1": {
    id: "getting-started-1",
    title: "Quick Start Guide: Your First Generation",
    category: "Getting Started",
    time: "3 min",
    updated: "1 month ago",
    content: "Follow these simple steps to generate your first image..."
  },
  "api-intro": {
    id: "api-intro",
    title: "Introduction to the Ugli API",
    category: "API & Integrations",
    time: "10 min",
    updated: "1 week ago",
    content: "Learn how to integrate Ugli's generation capabilities into your own applications..."
  }
};

const CATEGORIES: Category[] = [
  { id: "getting-started", icon: Rocket, color: "#7C3AED", title: "Getting Started", desc: "Learn the basics and set up your account", articleIds: ["getting-started-1"] },
  { id: "image-gen", icon: Wand2, color: "#7C3AED", title: "Image Generation", desc: "Create stunning AI-generated images", articleIds: ["prompt-guide"] },
  { id: "mockup", icon: ShoppingBag, color: "#4F46E5", title: "Mockup Generator", desc: "Create product mockups for your designs", articleIds: ["seamless-patterns"] },
  { id: "bg-remover", icon: Scissors, color: "#EC4899", title: "Background Removal", desc: "Remove and replace image backgrounds", articleIds: ["bg-removal-tips"] },
  { id: "ai-agents", icon: BrainCircuit, color: "#10B981", title: "AI Agents", desc: "Understand the 5 AI agents and how they work", articleIds: ["ai-agents"] },
  { id: "billing", icon: CreditCard, color: "#F59E0B", title: "Billing & Credits", desc: "Manage subscriptions, payments, and credits", articleIds: ["credits-guide"] },
  { id: "account", icon: Shield, color: "#3B82F6", title: "Account & Security", desc: "Secure your account and manage settings", articleIds: [] },
  { id: "api", icon: Code, color: "#8B5CF6", title: "API & Integrations", desc: "Connect apps and use our API", articleIds: ["api-intro"] },
  { id: "troubleshooting", icon: AlertCircle, color: "#DC2626", title: "Troubleshooting", desc: "Fix common issues and errors", articleIds: ["troubleshoot-failed"] },
];

// --- Component ---

export default function HelpSupport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [view, setView] = useState<"home" | "category" | "article">("home");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category);
    setView("category");
    window.scrollTo(0, 0);
  };

  const handleArticleClick = (articleId: string) => {
    const article = ARTICLES[articleId];
    if (article) {
      setActiveArticle(article);
      setView("article");
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (view === "article" && activeCategory) {
      setView("category");
    } else {
      setView("home");
      setActiveCategory(null);
    }
    window.scrollTo(0, 0);
  };

  // Mock data for category view if no articles are explicitly defined
  const getCategoryArticles = (cat: Category) => {
    // Get explicitly linked articles
    const linked = cat.articleIds.map(id => ARTICLES[id]).filter(Boolean);
    
    // If empty (for mockup purposes), generate some dummy ones
    if (linked.length === 0) {
       return [
         { id: "dummy-1", title: `Introduction to ${cat.title}`, category: cat.title, time: "3 min", updated: "1 week ago", content: "Placeholder content." },
         { id: "dummy-2", title: `Advanced ${cat.title} Techniques`, category: cat.title, time: "7 min", updated: "2 weeks ago", content: "Placeholder content." },
         { id: "dummy-3", title: `Common Questions about ${cat.title}`, category: cat.title, time: "5 min", updated: "1 month ago", content: "Placeholder content." },
       ];
    }
    
    // Add dummy ones if list is short to make it look full
    if (linked.length < 3) {
       linked.push({ id: "dummy-1", title: `More about ${cat.title}`, category: cat.title, time: "4 min", updated: "1 month ago", content: "Placeholder content." } as Article);
       linked.push({ id: "dummy-2", title: `${cat.title} FAQs`, category: cat.title, time: "5 min", updated: "2 weeks ago", content: "Placeholder content." } as Article);
    }
    
    return linked;
  };

  const popularArticlesList = [
    ARTICLES["prompt-guide"],
    ARTICLES["ai-agents"],
    ARTICLES["credits-guide"],
    ARTICLES["seamless-patterns"],
    ARTICLES["troubleshoot-failed"],
    ARTICLES["bg-removal-tips"],
  ];

  const videos = [
    { title: "Mastering Prompt Writing", duration: "5:23", views: "4.5K views", thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" },
    { title: "Using Style Presets Effectively", duration: "3:12", views: "2.8K views", thumbnail: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop" },
    { title: "Complete Mockup Workflow", duration: "8:45", views: "3.1K views", thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e0b7a9?q=80&w=1000&auto=format&fit=crop" },
    { title: "Understanding AI Agents", duration: "6:30", views: "5.2K views", thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop" },
  ];

  const faqs = [
    { 
      q: "How many credits do I get with each plan?", 
      a: "The Free plan includes 100 credits per month. The Pro plan includes 2,000 credits per month. Business plans include 10,000 credits per month. You can also purchase additional credit packs anytime from the Billing page." 
    },
    { 
      q: "What's the difference between quality levels?", 
      a: "Draft is fastest and good for quick previews. Standard offers balanced quality and speed. Premium provides maximum quality with more detail. Ultra is our highest quality with extreme detail, best for final outputs." 
    },
    { 
      q: "How do the 5 AI agents work together?", 
      a: "Each agent has a specific role: Text Sentinel checks spelling and text, Style Architect enhances your prompt with style keywords, Visual Synthesizer generates the image, Master Refiner improves quality, and Quality Analyst scores and learns from your feedback." 
    },
    { 
      q: "Can I use generated images commercially?", 
      a: "Yes, all images generated on paid plans can be used commercially. Free plan users have limited commercial rights. See our Terms of Service for full details." 
    },
  ];

  // --- Render Views ---

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {/* CATEGORIES SECTION */}
      <div className="px-12 py-12 max-w-[1200px] mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Browse by Category</h2>
          <p className="text-sm text-[#71717A] mt-1">Find answers organized by topic</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleCategoryClick(cat)}
              className="group relative bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-7 cursor-pointer hover:border-[#D4D4D8] dark:hover:border-[#2A2A30] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300"
            >
              <div className="absolute top-6 right-6 opacity-0 transform translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <ArrowRight className="h-4 w-4 text-[#71717A] dark:text-[#52525B]" />
              </div>

              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${cat.color}15` }}
              >
                <cat.icon className="h-6 w-6" style={{ color: cat.color }} />
              </div>
              
              <h3 className="text-[17px] font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1.5">{cat.title}</h3>
              <p className="text-sm text-[#71717A] leading-relaxed mb-3">{cat.desc}</p>
              <span className="text-xs text-[#71717A] dark:text-[#52525B] font-medium">
                 {getCategoryArticles(cat).length} articles
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* POPULAR ARTICLES */}
      <div className="px-12 pb-12 max-w-[1200px] mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-[22px] w-[22px] text-[#F59E0B]" />
            <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Popular Articles</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
          {popularArticlesList.map((article, i) => (
            <div 
              key={i}
              onClick={() => handleArticleClick(article.id)}
              className="flex items-center justify-between p-5 border-b border-[#E4E4E7] dark:border-[#1F1F23] last:border-0 hover:bg-[#F9FAFB] dark:hover:bg-[#1A1A1F] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4 flex-1">
                <FileText className="h-5 w-5 text-[#71717A] dark:text-[#52525B] flex-shrink-0" />
                <div>
                  <h4 className="text-[15px] font-medium text-[#18181B] dark:text-[#FAFAFA] group-hover:text-[#7C3AED] transition-colors">
                    {article.title}
                  </h4>
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-[#F4F4F5] dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] text-[11px] text-[#71717A]">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#52525B]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{article.time}</span>
                </div>
                <ChevronRight className="h-[18px] w-[18px] text-[#D4D4D8] dark:text-[#3A3A40] group-hover:text-[#71717A] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIDEO TUTORIALS */}
      <div className="px-12 pb-12 max-w-[1200px] mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <PlayCircle className="h-[22px] w-[22px] text-[#7C3AED]" />
            <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Video Tutorials</h2>
          </div>
          <button className="text-sm font-medium text-[#7C3AED] hover:underline">
            View all videos
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {videos.map((video, i) => (
            <div 
              key={i}
              className="group bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-xl overflow-hidden cursor-pointer hover:border-[#D4D4D8] dark:hover:border-[#2A2A30] hover:-translate-y-1 transition-all duration-200"
            >
              <div className="aspect-video bg-[#1A1A1F] relative overflow-hidden">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                  <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white">
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA] line-clamp-2 mb-1.5 group-hover:text-[#7C3AED] transition-colors">
                  {video.title}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#52525B]">
                  <Eye className="h-3 w-3" />
                  <span>{video.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="px-12 pb-20 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="h-[22px] w-[22px] text-[#7C3AED]" />
          <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Frequently Asked Questions</h2>
        </div>

        <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl overflow-hidden">
          {faqs.map((faq, i) => (
            <div 
              key={i}
              className="border-b border-[#E4E4E7] dark:border-[#1F1F23] last:border-0"
            >
              <button
                onClick={() => toggleFaq(i)}
                className={cn(
                  "w-full flex items-center justify-between p-6 text-left transition-colors",
                  openFaq === i ? "bg-[#F9FAFB] dark:bg-[#1A1A1F]" : "hover:bg-[#F9FAFB] dark:hover:bg-[#1A1A1F]"
                )}
              >
                <span className="text-[15px] font-medium text-[#18181B] dark:text-[#FAFAFA] pr-8">{faq.q}</span>
                <ChevronDown className={cn("h-5 w-5 text-[#71717A] dark:text-[#52525B] transition-transform duration-200", openFaq === i ? "rotate-180" : "")} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-[#F9FAFB] dark:bg-[#1A1A1F] overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0 text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-[90%]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderCategory = () => {
    if (!activeCategory) return null;
    const articles = getCategoryArticles(activeCategory);

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="px-12 py-12 max-w-[1200px] mx-auto w-full"
      >
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Help Center
        </button>

        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#E4E4E7] dark:border-[#1F1F23]">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${activeCategory.color}15` }}
          >
            <activeCategory.icon className="h-8 w-8" style={{ color: activeCategory.color }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#18181B] dark:text-[#FAFAFA] mb-2">{activeCategory.title}</h1>
            <p className="text-[#71717A]">{activeCategory.desc}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {articles.map((article, i) => (
            <div 
              key={i}
              onClick={() => handleArticleClick(article.id)}
              className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-xl p-6 cursor-pointer hover:border-[#7C3AED] hover:shadow-md transition-all group"
            >
              <h3 className="text-lg font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-2 group-hover:text-[#7C3AED] transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#71717A]">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {article.time}
                </span>
                <span>Updated {article.updated}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderArticle = () => {
    if (!activeArticle) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="px-12 py-12 max-w-[900px] mx-auto w-full"
      >
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {activeCategory ? `Back to ${activeCategory.title}` : "Back to Help Center"}
          </button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>

        <article className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-8 md:p-12 shadow-sm">
          <div className="mb-8 border-b border-[#E4E4E7] dark:border-[#1F1F23] pb-8">
            <div className="flex items-center gap-2 text-sm text-[#7C3AED] font-medium mb-4">
              <span>{activeArticle.category}</span>
              <span className="text-[#E4E4E7] dark:text-[#2A2A30]">•</span>
              <span className="text-[#71717A]">{activeArticle.time} read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#18181B] dark:text-[#FAFAFA] mb-4 leading-tight">
              {activeArticle.title}
            </h1>
            <p className="text-sm text-[#71717A]">
              Last updated {activeArticle.updated}
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            {typeof activeArticle.content === 'string' 
              ? <p>{activeArticle.content}</p> 
              : activeArticle.content
            }
          </div>

          <div className="mt-12 pt-8 border-t border-[#E4E4E7] dark:border-[#1F1F23]">
            <h3 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-4 text-center">
              Was this article helpful?
            </h3>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="gap-2 min-w-[100px]">
                <ThumbsUp className="h-4 w-4" /> Yes
              </Button>
              <Button variant="outline" className="gap-2 min-w-[100px]">
                <ThumbsDown className="h-4 w-4" /> No
              </Button>
            </div>
          </div>
        </article>
      </motion.div>
    );
  };

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      {/* Main Sidebar */}
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA]">
        
        {/* HERO SECTION (Always visible, but smaller when in article/category view maybe? No, keep simple) */}
        {view === "home" && (
          <div className="relative bg-gradient-to-b from-[#E4E4E7] to-[#F8F8F8] dark:from-[#111113] dark:to-[#0A0A0B] pt-[60px] pb-12 px-12 text-center border-b border-[#E4E4E7] dark:border-[#1F1F23]">
            {/* Decorative background elements could go here */}
            <div className="max-w-2xl mx-auto relative z-10">
              <h1 className="text-4xl font-bold text-[#18181B] dark:text-[#FAFAFA] tracking-tight mb-3">
                How can we help?
              </h1>
              <p className="text-base text-[#71717A] mb-8">
                Search our knowledge base or browse categories below
              </p>

              {/* Search Bar */}
              <div className="max-w-[560px] mx-auto relative group">
                <div className="flex items-center bg-white dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-2xl p-1 transition-all duration-200 focus-within:border-[#7C3AED] focus-within:ring-4 focus-within:ring-[#7C3AED]/15 shadow-sm">
                  <Search className="h-[22px] w-[22px] text-[#71717A] dark:text-[#52525B] ml-4 flex-shrink-0" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for help articles, tutorials, FAQs..."
                    className="flex-1 bg-transparent border-none p-3 text-base text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#52525B] focus:outline-none focus:ring-0"
                  />
                  <div className="hidden sm:flex items-center px-2 mr-2 bg-[#F4F4F5] dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-md py-1">
                    <span className="text-[11px] font-mono text-[#71717A] dark:text-[#52525B]">Cmd + K</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap justify-center gap-6 mt-6">
                {[
                  { icon: BookOpen, label: "Getting Started" },
                  { icon: Zap, label: "Quick Tips" },
                  { icon: MessageCircle, label: "Contact Us" },
                  { icon: FileText, label: "API Docs" }
                ].map((link, i) => (
                  <button key={i} className="flex items-center gap-1.5 text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors group">
                    <link.icon className="h-3.5 w-3.5" />
                    <span className="group-hover:underline decoration-transparent group-hover:decoration-current transition-all">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "home" && renderHome()}
        {view === "category" && renderCategory()}
        {view === "article" && renderArticle()}

      </main>
    </div>
  );
}
