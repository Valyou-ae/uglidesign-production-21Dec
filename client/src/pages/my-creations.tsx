import { useState } from "react";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Download, 
  Star, 
  Trash2, 
  FolderInput, 
  Folder, 
  ArrowUpRight, 
  Eye, 
  Pencil, 
  Copy, 
  Check,
  X,
  Wand2,
  ShoppingBag,
  Scissors,
  StretchHorizontal,
  StarOff,
  CheckSquare,
  ArrowUpDown,
  Calendar,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Mock Data for Favorites
const FAVORITES = [
  { id: "1", name: "Golden Hour Portrait", type: "image", date: "Dec 15, 2024", time: "2:30 PM", size: "2.4 MB", dimensions: "1024×1024", src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1000&auto=format&fit=crop", tags: ["Cinematic", "Premium"] },
  { id: "2", name: "Neon Cyberpunk City", type: "image", date: "Dec 14, 2024", time: "10:15 AM", size: "3.1 MB", dimensions: "1024×1024", src: "https://images.unsplash.com/photo-1580584126903-c17d41830450?q=80&w=1000&auto=format&fit=crop", tags: ["Sci-Fi", "Vibrant"] },
  { id: "3", name: "Minimalist Logo Mockup", type: "mockup", date: "Dec 12, 2024", time: "4:45 PM", size: "1.8 MB", dimensions: "2000×2000", src: "https://images.unsplash.com/photo-1507133750069-69d3cdad863a?q=80&w=1000&auto=format&fit=crop", tags: ["Clean", "Branding"] },
  { id: "4", name: "Product Transparent BG", type: "bg-removed", date: "Dec 10, 2024", time: "11:20 AM", size: "1.2 MB", dimensions: "800×800", src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop", tags: ["E-commerce"] },
  { id: "5", name: "Abstract Fluid Art", type: "image", date: "Dec 08, 2024", time: "9:00 AM", size: "4.5 MB", dimensions: "1024×1024", src: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1000&auto=format&fit=crop", tags: ["Abstract", "Colorful"] },
  { id: "6", name: "T-Shirt Design Mockup", type: "mockup", date: "Dec 05, 2024", time: "3:30 PM", size: "3.8 MB", dimensions: "2400×2400", src: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1000&auto=format&fit=crop", tags: ["Apparel", "Streetwear"] },
  { id: "7", name: "Fantasy Dragon", type: "image", date: "Dec 03, 2024", time: "1:15 PM", size: "2.9 MB", dimensions: "1024×1024", src: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop", tags: ["Fantasy", "Epic"] },
  { id: "8", name: "Headshot Portrait", type: "bg-removed", date: "Nov 28, 2024", time: "10:00 AM", size: "1.5 MB", dimensions: "1000×1000", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop", tags: ["Professional"] },
];

export default function Favorites() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("grid");
  const [sortMode, setSortMode] = useState("Date Added");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [favorites, setFavorites] = useState(FAVORITES);
  const { toast } = useToast();

  const toggleSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleBulkAction = (action: string) => {
    toast({
      title: `${action} ${selectedItems.length} items`,
      description: "This action has been performed successfully.",
      className: "bg-zinc-900 text-white border-zinc-800"
    });
    setSelectMode(false);
    setSelectedItems([]);
  };

  const filteredFavorites = favorites.filter(f => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Images" && f.type === "image") return true;
    if (activeFilter === "Mockups" && f.type === "mockup") return true;
    if (activeFilter === "BG Removed" && f.type === "bg-removed") return true;
    return false;
  }).filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "image": return { icon: Wand2, color: "#7C3AED", label: "IMAGE" };
      case "mockup": return { icon: ShoppingBag, color: "#4F46E5", label: "MOCKUP" };
      case "bg-removed": return { icon: Scissors, color: "#EC4899", label: "BG REMOVED" };
      default: return { icon: Star, color: "#71717A", label: "UNKNOWN" };
    }
  };

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#F8F8F8] dark:bg-[#0A0A0B] text-foreground">
        <div className="flex flex-col h-full p-8 md:px-10 md:py-8 overflow-y-auto">
          
          {/* PAGE HEADER */}
          <div className="flex items-start justify-between mb-8 flex-shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Folder className="h-7 w-7 text-[#7C3AED]" />
                <h1 className="text-[28px] font-bold text-[#18181B] dark:text-[#FAFAFA]">My Creations</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#71717A]">
                <span>Manage and organize all your AI-generated assets</span>
                <span className="w-1 h-1 rounded-full bg-[#71717A]" />
                <span>{favorites.length} items total</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className={cn(
                "flex items-center transition-all duration-300 bg-white dark:bg-[#1F1F25] rounded-xl border border-[#E4E4E7] dark:border-transparent overflow-hidden",
                searchOpen ? "w-[300px] border-[#E4E4E7] dark:border-[#2A2A30]" : "w-11 h-11 cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2A2A30]"
              )}>
                 {searchOpen ? (
                   <>
                     <Search className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                     <Input 
                       autoFocus
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       placeholder="Search favorites..." 
                       className="border-0 bg-transparent focus-visible:ring-0 h-10 text-sm"
                     />
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 mr-1 text-muted-foreground hover:text-foreground"
                       onClick={() => {
                         setSearchOpen(false);
                         setSearchQuery("");
                       }}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </>
                 ) : (
                   <div 
                     className="w-full h-full flex items-center justify-center"
                     onClick={() => setSearchOpen(true)}
                   >
                     <Search className="h-5 w-5 text-foreground" />
                   </div>
                 )}
              </div>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-xl text-sm font-medium hover:bg-[#F4F4F5] dark:hover:bg-[#2A2A30] transition-colors">
                    <ArrowUpDown className="h-4 w-4 text-[#71717A]" />
                    <span>{sortMode}</span>
                    <ChevronDown className="h-4 w-4 text-[#71717A]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-[#1F1F25] border-[#2A2A30] text-[#E4E4E7]">
                  {["Date Added", "Name", "Type", "Size"].map(mode => (
                    <DropdownMenuItem 
                      key={mode} 
                      onClick={() => setSortMode(mode)}
                      className="cursor-pointer hover:bg-[#2A2A30] focus:bg-[#2A2A30]"
                    >
                      {mode}
                      {sortMode === mode && <Check className="h-3.5 w-3.5 ml-auto text-[#F59E0B]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="flex p-1 bg-white dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-xl h-11 items-center">
                {[
                  { id: "grid", icon: LayoutGrid },
                  { id: "list", icon: List },
                  { id: "masonry", icon: StretchHorizontal }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setViewMode(view.id as any)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === view.id 
                        ? "bg-[#F4F4F5] dark:bg-[#2A2A30] text-foreground shadow-sm" 
                        : "text-[#71717A] hover:text-foreground"
                    )}
                  >
                    <view.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TOOLBAR SECTION */}
          <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-4 mb-6 flex items-center justify-between flex-shrink-0 shadow-sm">
            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { name: "All", icon: Star, count: 32, color: "#F59E0B" },
                { name: "Images", icon: Wand2, count: 18, color: "#7C3AED" },
                { name: "Mockups", icon: ShoppingBag, count: 10, color: "#4F46E5" },
                { name: "BG Removed", icon: Scissors, count: 4, color: "#EC4899" }
              ].map(filter => (
                <button
                  key={filter.name}
                  onClick={() => setActiveFilter(filter.name)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] font-medium transition-all flex items-center gap-2 border",
                    activeFilter === filter.name 
                      ? "bg-[#F59E0B] text-[#18181B] border-[#F59E0B]" 
                      : "bg-transparent text-[#71717A] border-[#E4E4E7] dark:border-[#2A2A30] hover:bg-[#F4F4F5] dark:hover:bg-[#1F1F25] hover:border-[#D4D4D8] dark:hover:border-[#3A3A40]"
                  )}
                >
                  <filter.icon className={cn("h-3.5 w-3.5", activeFilter !== filter.name && `text-[${filter.color}]`)} />
                  {filter.name}
                  <span className={cn("ml-0.5 opacity-70", activeFilter === filter.name ? "text-[#18181B]" : "")}>
                    ({filter.count})
                  </span>
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedItems([]);
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-[10px] border text-sm font-medium transition-all",
                  selectMode 
                    ? "bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B]" 
                    : "bg-white dark:bg-[#1F1F25] border-[#E4E4E7] dark:border-[#2A2A30] text-[#71717A] hover:border-[#D4D4D8] dark:hover:border-[#3A3A40]"
                )}
              >
                <CheckSquare className="h-4.5 w-4.5" />
                {selectMode ? "Cancel" : "Select"}
              </button>
              
              {!selectMode && (
                <div className="h-6 w-px bg-[#E4E4E7] dark:bg-[#2A2A30]" />
              )}
              
              {/* Additional actions when NOT in select mode could go here */}
            </div>
          </div>

          {/* BULK SELECTION BAR */}
          <AnimatePresence>
            {selectMode && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -20, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, y: 0, marginBottom: 20 }}
                exit={{ height: 0, opacity: 0, y: -20, marginBottom: 0 }}
                className="sticky top-0 z-50 flex-shrink-0"
              >
                <div className="bg-[#18181B] border border-[#2A2A30] rounded-xl p-3 px-5 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-4">
                    <CheckSquare className="h-4.5 w-4.5 text-[#F59E0B]" />
                    <span className="text-sm font-semibold text-[#FAFAFA]">{selectedItems.length} items selected</span>
                    <div className="w-1 h-1 rounded-full bg-[#52525B]" />
                    <button 
                      onClick={() => setSelectedItems(favorites.map(f => f.id))}
                      className="text-[13px] text-[#7C3AED] hover:underline transition-colors"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={() => setSelectedItems([])}
                      className="text-[13px] text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={selectedItems.length === 0}
                      onClick={() => handleBulkAction("Download")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#2A2A30] hover:bg-[#3A3A40] text-[#E4E4E7] text-[13px] font-medium rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4" /> Download All
                    </button>
                    <button 
                      disabled={selectedItems.length === 0}
                      onClick={() => handleBulkAction("Move")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#2A2A30] hover:bg-[#3A3A40] text-[#E4E4E7] text-[13px] font-medium rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FolderInput className="h-4 w-4" /> Move to Folder
                    </button>
                    <button 
                      disabled={selectedItems.length === 0}
                      onClick={() => handleBulkAction("Duplicate")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#2A2A30] hover:bg-[#3A3A40] text-[#E4E4E7] text-[13px] font-medium rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Copy className="h-4 w-4" /> Duplicate
                    </button>
                    <button 
                      disabled={selectedItems.length === 0}
                      onClick={() => handleBulkAction("Unfavorite")}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#2A2A30] hover:bg-[#2A2A30]/80 text-[#DC2626] border border-[#DC2626]/30 text-[13px] font-medium rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <StarOff className="h-4 w-4" /> Unfavorite
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAVORITES CONTENT */}
          <div className="flex-1 pb-10">
            {filteredFavorites.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                  <Star className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No favorites found</h3>
                <p className="text-muted-foreground max-w-sm">
                  Try adjusting your filters or add some items to your favorites to see them here.
                </p>
              </div>
            ) : viewMode === "list" ? (
               /* LIST VIEW */
              <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[40px_80px_2fr_1fr_1fr_1fr_100px] gap-4 px-6 py-3.5 bg-[#F9FAFB] dark:bg-[#1A1A1F] border-b border-[#E4E4E7] dark:border-[#1F1F23] text-[11px] font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase tracking-wider items-center">
                  <div>{selectMode && <div className="w-5" />}</div>
                  <div>Preview</div>
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">Name <ArrowUpDown className="h-3 w-3" /></div>
                  <div className="cursor-pointer hover:text-foreground">Type</div>
                  <div className="cursor-pointer hover:text-foreground">Date Added</div>
                  <div>Size</div>
                  <div className="text-right">Actions</div>
                </div>

                {/* Rows */}
                {filteredFavorites.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => selectMode && toggleSelection(item.id)}
                    className={cn(
                      "grid grid-cols-[40px_80px_2fr_1fr_1fr_1fr_100px] gap-4 px-6 py-3 border-b border-[#E4E4E7] dark:border-[#1F1F23] items-center hover:bg-[#F9FAFB] dark:hover:bg-[#1A1A1F] transition-colors cursor-pointer group last:border-0",
                      selectedItems.includes(item.id) && "bg-[#F59E0B]/5 dark:bg-[#F59E0B]/10"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center justify-center">
                      {selectMode && (
                        <div className={cn(
                          "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                          selectedItems.includes(item.id)
                            ? "bg-[#F59E0B] border-[#F59E0B]"
                            : "bg-transparent border-[#52525B] hover:border-[#F59E0B]"
                        )}>
                          {selectedItems.includes(item.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="h-14 w-14 rounded-lg bg-[#0A0A0B] overflow-hidden">
                      <img src={item.src} className="w-full h-full object-cover" alt="" />
                    </div>

                    {/* Name */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA] truncate">{item.name}</span>
                      <span className="text-xs text-[#71717A] truncate max-w-[300px]">A creative generation with specific prompts...</span>
                    </div>

                    {/* Type */}
                    <div>
                      <Badge variant="outline" className={cn("bg-transparent font-medium text-[10px] uppercase", 
                        item.type === "image" && "text-[#7C3AED] border-[#7C3AED]/30",
                        item.type === "mockup" && "text-[#4F46E5] border-[#4F46E5]/30",
                        item.type === "bg-removed" && "text-[#EC4899] border-[#EC4899]/30"
                      )}>
                        {item.type.replace("-", " ")}
                      </Badge>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-[#E4E4E7]">{item.date}</span>
                      <span className="text-[11px] text-[#71717A]">{item.time}</span>
                    </div>

                    {/* Size */}
                    <div className="text-sm text-[#71717A] font-mono">{item.size}</div>

                    {/* Actions */}
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-[#71717A]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1F1F25] border-[#2A2A30] text-[#E4E4E7]">
                          <DropdownMenuItem className="hover:bg-[#2A2A30] cursor-pointer"><ArrowUpRight className="h-4 w-4 mr-2" /> Open</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-[#2A2A30] cursor-pointer"><Eye className="h-4 w-4 mr-2" /> Quick View</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-[#2A2A30] cursor-pointer"><Download className="h-4 w-4 mr-2" /> Download</DropdownMenuItem>
                          <DropdownMenuItem className="text-[#F59E0B] hover:bg-[#2A2A30] cursor-pointer"><StarOff className="h-4 w-4 mr-2" /> Unfavorite</DropdownMenuItem>
                          <DropdownMenuItem className="text-[#DC2626] hover:bg-[#2A2A30] cursor-pointer"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID / MASONRY VIEW */
              <div className={cn(
                "grid gap-5",
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 space-y-5 block" // Simple masonry using columns
              )}>
                {filteredFavorites.map((item) => {
                  const typeConfig = getTypeConfig(item.type);
                  const TypeIcon = typeConfig.icon;

                  return (
                    <motion.div
                      layoutId={item.id}
                      key={item.id}
                      onClick={() => selectMode && toggleSelection(item.id)}
                      className={cn(
                        "group relative bg-white dark:bg-[#111113] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-250",
                        viewMode === "masonry" && "mb-5 break-inside-avoid",
                        selectMode && selectedItems.includes(item.id) 
                          ? "border-[#F59E0B] ring-4 ring-[#F59E0B]/15" 
                          : "border-[#E4E4E7] dark:border-[#1F1F23] hover:border-[#2A2A30] hover:-translate-y-1.5 hover:shadow-2xl dark:hover:shadow-black/40"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-[#0A0A0B] relative overflow-hidden">
                        <img 
                          src={item.src} 
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        
                        {/* Permanent Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                        {/* Type Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
                          <TypeIcon className="h-3.5 w-3.5" style={{ color: typeConfig.color }} />
                          <span className="text-[11px] font-bold text-white uppercase">{typeConfig.label}</span>
                        </div>

                        {/* Favorite Star (Always Visible) */}
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-2 rounded-full hover:scale-110 transition-transform cursor-pointer group/star">
                          <Star className="h-5 w-5 text-[#F59E0B] fill-[#F59E0B] group-hover/star:text-[#F59E0B]" />
                        </div>

                        {/* Selection Checkbox (In Select Mode) */}
                        {selectMode && (
                          <div className="absolute top-3 left-3 z-20">
                            <div className={cn(
                              "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all backdrop-blur-md",
                              selectedItems.includes(item.id)
                                ? "bg-[#F59E0B] border-[#F59E0B]"
                                : "bg-black/50 border-[#52525B] hover:border-[#F59E0B]"
                            )}>
                              {selectedItems.includes(item.id) && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                          </div>
                        )}

                        {/* Hover Actions Overlay */}
                        <div className={cn(
                          "absolute inset-0 bg-black/70 backdrop-blur-[4px] opacity-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-200",
                          !selectMode && "group-hover:opacity-100"
                        )}>
                          <Button className="bg-white text-[#18181B] hover:bg-white/90 font-semibold h-10 px-5 rounded-xl">
                            <ArrowUpRight className="h-4 w-4 mr-2" /> Open
                          </Button>
                          
                          <div className="flex gap-2">
                            {[
                              { icon: Download, label: "Download" },
                              { icon: Copy, label: "Duplicate" },
                              { icon: Pencil, label: "Edit" },
                              { icon: Trash2, label: "Delete" }
                            ].map((action, i) => (
                              <div key={i} className="h-10 w-10 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer">
                                <action.icon className="h-5 w-5 text-white" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="p-4 bg-white dark:bg-[#111113]">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA] truncate pr-2 group-hover:text-[#F59E0B] transition-colors">
                            {item.name}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-6 w-6 flex items-center justify-center text-[#52525B] hover:text-[#A1A1AA] transition-colors">
                                <MoreVertical className="h-4.5 w-4.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1F1F25] border-[#2A2A30] text-[#E4E4E7] min-w-[180px] p-1.5">
                              <DropdownMenuItem className="hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><ArrowUpRight className="h-4 w-4 mr-2.5" /> Open</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><Eye className="h-4 w-4 mr-2.5" /> Quick View</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><Pencil className="h-4 w-4 mr-2.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#2A2A30] my-1" />
                              <DropdownMenuItem className="hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><Copy className="h-4 w-4 mr-2.5" /> Duplicate</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><FolderInput className="h-4 w-4 mr-2.5" /> Move to Folder</DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><Download className="h-4 w-4 mr-2.5" /> Download</DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#2A2A30] my-1" />
                              <DropdownMenuItem className="text-[#F59E0B] hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><StarOff className="h-4 w-4 mr-2.5" /> Unfavorite</DropdownMenuItem>
                              <DropdownMenuItem className="text-[#DC2626] hover:bg-[#2A2A30] rounded-lg cursor-pointer py-2.5"><Trash2 className="h-4 w-4 mr-2.5" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                          <div className="flex items-center text-xs text-[#71717A]">
                            <Calendar className="h-3 w-3 mr-1" />
                            {item.date}
                          </div>
                          <span className="text-[#71717A]">·</span>
                          <div className="flex items-center text-xs text-[#71717A]">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.time}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 rounded-md bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] text-[11px] text-[#71717A]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
