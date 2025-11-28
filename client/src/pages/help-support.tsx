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
  BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";

export default function HelpSupport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const categories = [
    { icon: Rocket, color: "#7C3AED", title: "Getting Started", desc: "Learn the basics and set up your account", count: "8 articles" },
    { icon: Wand2, color: "#7C3AED", title: "Image Generation", desc: "Create stunning AI-generated images", count: "15 articles" },
    { icon: ShoppingBag, color: "#4F46E5", title: "Mockup Generator", desc: "Create product mockups for your designs", count: "12 articles" },
    { icon: Scissors, color: "#EC4899", title: "Background Removal", desc: "Remove and replace image backgrounds", count: "6 articles" },
    { icon: BrainCircuit, color: "#10B981", title: "AI Agents", desc: "Understand the 5 AI agents and how they work", count: "10 articles" },
    { icon: CreditCard, color: "#F59E0B", title: "Billing & Credits", desc: "Manage subscriptions, payments, and credits", count: "9 articles" },
    { icon: Shield, color: "#3B82F6", title: "Account & Security", desc: "Secure your account and manage settings", count: "7 articles" },
    { icon: Code, color: "#8B5CF6", title: "API & Integrations", desc: "Connect apps and use our API", count: "14 articles" },
    { icon: AlertCircle, color: "#DC2626", title: "Troubleshooting", desc: "Fix common issues and errors", count: "11 articles" },
  ];

  const popularArticles = [
    { title: "How to write effective prompts for image generation", category: "Image Generation", time: "5 min" },
    { title: "Understanding the 5 AI agents", category: "AI Agents", time: "8 min" },
    { title: "How credits work and how to get more", category: "Billing", time: "3 min" },
    { title: "Creating seamless patterns for All-Over Print", category: "Mockups", time: "6 min" },
    { title: "Troubleshooting failed generations", category: "Troubleshooting", time: "4 min" },
    { title: "Best practices for background removal", category: "Background Removal", time: "4 min" },
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

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      {/* Main Sidebar */}
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA]">
        
        {/* HERO SECTION */}
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

        {/* CATEGORIES SECTION */}
        <div className="px-12 py-12 max-w-[1200px] mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Browse by Category</h2>
            <p className="text-sm text-[#71717A] mt-1">Find answers organized by topic</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
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
                <span className="text-xs text-[#71717A] dark:text-[#52525B] font-medium">{cat.count}</span>
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
            <button className="flex items-center gap-1 text-sm font-medium text-[#7C3AED] hover:underline">
              View all <ArrowRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
            {popularArticles.map((article, i) => (
              <div 
                key={i}
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

      </main>
    </div>
  );
}
