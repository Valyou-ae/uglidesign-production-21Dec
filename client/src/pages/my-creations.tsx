import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  MoreHorizontal,
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
  Maximize2, 
  RefreshCw,
  Calendar,
  Clock,
  ClipboardCopy,
  Loader2
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useImages } from "@/hooks/use-images";
import { CalendarHistoryModal } from "@/components/calendar-history-modal";


type ItemType = {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  size: string;
  dimensions: string;
  src: string;
  tags: string[];
  favorite: boolean;
};

import { useLocation } from "wouter";

export default function MyCreations() {
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("grid");
  const [sortMode, setSortMode] = useState("Date Added");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch images from backend API
  const { images: dbImages, isLoading, toggleFavorite: apiToggleFavorite, deleteImage: apiDeleteImage, hasNextPage, fetchNextPage, isFetchingNextPage, total } = useImages();

  const items: ItemType[] = useMemo(() => {
    return dbImages.map((img: any) => ({
      id: img.id,
      name: img.prompt?.slice(0, 30) || "Generated Image",
      type: img.generationType || "image",
      date: new Date(img.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: new Date(img.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      size: "—",
      dimensions: img.aspectRatio || "1024×1024",
      src: img.imageUrl,
      tags: [img.style || "Generated"],
      favorite: img.isFavorite || false,
    }));
  }, [dbImages]);

  const toggleSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await apiToggleFavorite(id);
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorite status",
      });
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      toast({
        title: "Download Started",
        description: "Preparing your download...",
      });

      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "Download Complete",
        description: "Image saved to your device.",
      });
    } catch (error) {
      console.error("Download failed:", error);
      
      // Fallback for simple download if fetch fails (e.g. CORS)
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "If download didn't start, check your popup blocker.",
      });
    }
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

  const handleAction = (action: string, item: ItemType) => {
    if (action === "Open") {
      setSelectedItem(item);
      return;
    }

    if (action === "Download") {
      downloadImage(item.src, `${item.name.replace(/\s+/g, '_').toLowerCase()}.jpg`);
      return;
    }

    if (action === "Edit") {
      if (item.type === "image") setLocation("/image-gen");
      else if (item.type === "mockup") setLocation("/mockup");
      else if (item.type === "bg-removed") setLocation("/bg-remover");
      else setLocation("/image-gen");
      return;
    }

    if (action === "Delete") {
      setItemToDelete(item.id);
      setDeleteDialogOpen(true);
      return;
    }

    if (action === "Duplicate") {
      toast({ title: "Item Duplicated", description: `${item.name} has been duplicated.` });
      return;
    }

    if (action === "Copy") {
      copyImageToClipboard(item.src);
      return;
    }

    toast({
      title: `${action} Item`,
      description: `Performed ${action} on ${item.name}`,
    });
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      // For mock items, just close dialog
      if (itemToDelete.startsWith("mock-")) {
        toast({ title: "Cannot Delete", description: "Demo items cannot be deleted." });
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        return;
      }
      
      // For real items, call the API
      try {
        await apiDeleteImage(itemToDelete);
        toast({ title: "Item Deleted", description: "The item has been permanently deleted." });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete item." });
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
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

  const filteredItems = items.filter(item => {
    if (activeFilter === "All") return true;
    if (activeFilter === "My Favourites" && item.favorite) return true;
    if (activeFilter === "My Favourites" && !item.favorite) return false;
    if (activeFilter === "Images" && item.type === "image") return true;
    if (activeFilter === "Mockups" && item.type === "mockup") return true;
    if (activeFilter === "BG Removed" && item.type === "bg-removed") return true;
    return false;
  }).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortMode === "Date Added") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortMode === "Name") {
      return a.name.localeCompare(b.name);
    }
    if (sortMode === "Type") {
      return a.type.localeCompare(b.type);
    }
    if (sortMode === "Size") {
      return parseFloat(b.size) - parseFloat(a.size);
    }
    return 0;
  });

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
        <div className="flex flex-col h-full p-8 md:px-10 md:py-8 overflow-y-auto pb-24 md:pb-8">
          
          {/* PAGE HEADER & CONTROLS - COMPACT MOBILE */}
          <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-6 w-6 text-[#7C3AED]" />
                <h1 className="text-xl font-bold text-[#18181B] dark:text-[#FAFAFA]">My Creations</h1>
                <span className="text-xs text-[#71717A] ml-1 bg-[#F4F4F5] dark:bg-[#1F1F25] px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
            </div>

            {/* Controls Row - Unified */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
              {/* Search */}
              <div className={cn(
                "flex items-center bg-white dark:bg-[#1F1F25] rounded-lg border border-[#E4E4E7] dark:border-transparent overflow-hidden h-10",
                searchOpen ? "border-[#E4E4E7] dark:border-[#2A2A30]" : ""
              )}>
                 <Search className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                 <Input 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search..." 
                   className="border-0 bg-transparent focus-visible:ring-0 h-full text-sm min-w-0"
                 />
                 {searchQuery && (
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 mr-1 text-muted-foreground hover:text-foreground"
                     onClick={() => setSearchQuery("")}
                   >
                     <X className="h-3.5 w-3.5" />
                   </Button>
                 )}
              </div>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-1.5 h-10 px-3 bg-white dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-lg text-sm font-medium hover:bg-[#F4F4F5] dark:hover:bg-[#2A2A30] transition-colors whitespace-nowrap">
                    <ArrowUpDown className="h-4 w-4 text-[#71717A]" />
                    <span className="hidden sm:inline">{sortMode}</span>
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
              <div className="flex p-1 bg-white dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-lg h-10 items-center">
                {[
                  { id: "grid", icon: LayoutGrid },
                  { id: "list", icon: List },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setViewMode(view.id as any)}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === view.id 
                        ? "bg-[#F4F4F5] dark:bg-[#2A2A30] text-foreground shadow-sm" 
                        : "text-[#71717A] hover:text-foreground"
                    )}
                  >
                    <view.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>

              {/* Calendar Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarOpen(true)}
                className="h-10 w-10 bg-white dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#2A2A30] text-[#71717A] hover:text-[#B94E30]"
                data-testid="button-calendar-history"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {[
                { name: "All", count: items.length },
                { name: "My Favourites", count: items.filter(i => i.favorite).length },
                { name: "Images", count: items.filter(i => i.type === "image").length },
                { name: "Mockups", count: items.filter(i => i.type === "mockup").length },
              ].map(filter => (
                <button
                  key={filter.name}
                  onClick={() => setActiveFilter(filter.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap flex-shrink-0",
                    activeFilter === filter.name 
                      ? "bg-[#F59E0B] text-[#18181B] border-[#F59E0B]" 
                      : "bg-white dark:bg-[#1F1F25] text-[#71717A] border-[#E4E4E7] dark:border-[#2A2A30]"
                  )}
                >
                  {filter.name}
                  <span className={cn("opacity-70", activeFilter === filter.name ? "text-[#18181B]" : "")}>
                    {filter.count}
                  </span>
                </button>
              ))}
              
              <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />
              
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedItems([]);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex-shrink-0",
                  selectMode 
                    ? "bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B]" 
                    : "bg-white dark:bg-[#1F1F25] border-[#E4E4E7] dark:border-[#2A2A30] text-[#71717A]"
                )}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {selectMode ? "Cancel" : "Select"}
              </button>
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
                      onClick={() => setSelectedItems(items.map(f => f.id))}
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
            {isLoading ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
                {[200, 280, 180, 240, 160, 220, 300, 190].map((height, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-card border border-border animate-pulse break-inside-avoid mb-3">
                    <div className="bg-muted/50" style={{ height: `${height}px` }} />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-muted/50 rounded w-3/4" />
                      <div className="h-3 bg-muted/30 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                  <Star className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No items found</h3>
                <p className="text-muted-foreground max-w-sm">
                  Try adjusting your filters or add some items to your list to see them here.
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
                {filteredItems.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => selectMode ? toggleSelection(item.id) : setSelectedItem(item)}
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
                          <DropdownMenuItem onClick={() => handleAction("Open", item)} className="hover:bg-[#2A2A30] cursor-pointer"><ArrowUpRight className="h-4 w-4 mr-2" /> Open</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Edit", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Download", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Download className="h-4 w-4 mr-2" /> Download</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Copy", item)} className="hover:bg-[#2A2A30] cursor-pointer"><ClipboardCopy className="h-4 w-4 mr-2" /> Copy to Clipboard</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Duplicate", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Unfavorite", item)} className="text-[#F59E0B] hover:bg-[#2A2A30] cursor-pointer"><StarOff className="h-4 w-4 mr-2" /> Unfavorite</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Delete", item)} className="text-[#DC2626] hover:bg-[#2A2A30] cursor-pointer"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* MASONRY VIEW - CSS Columns for natural aspect ratios */
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
                {filteredItems.map((item) => {
                  const typeConfig = getTypeConfig(item.type);
                  const TypeIcon = typeConfig.icon;

                  return (
                    <motion.div
                      layoutId={item.id}
                      key={item.id}
                      onClick={() => selectMode ? toggleSelection(item.id) : setSelectedItem(item)}
                      className={cn(
                        "break-inside-avoid mb-3 relative group rounded-xl overflow-hidden cursor-pointer bg-card border border-border transition-all duration-200",
                        !selectMode && "hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]",
                        selectMode && selectedItems.includes(item.id) 
                          ? "border-[#F59E0B] ring-4 ring-[#F59E0B]/15" 
                          : ""
                      )}
                    >
                      {/* Image Container - Natural aspect ratio */}
                      <div className="w-full relative overflow-hidden bg-muted/20">
                        <img 
                          src={item.src} 
                          alt={item.name}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                        
                        {/* Type Badge (Top Left) */}
                        <div className="absolute top-3 left-3 z-10">
                           {selectMode ? (
                            <div className={cn(
                              "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all backdrop-blur-md",
                              selectedItems.includes(item.id)
                                ? "bg-[#F59E0B] border-[#F59E0B]"
                                : "bg-black/50 border-[#52525B] hover:border-[#F59E0B]"
                            )}>
                              {selectedItems.includes(item.id) && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                           ) : (
                            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
                              <TypeIcon className="h-3.5 w-3.5" style={{ color: typeConfig.color }} />
                              <span className="text-[11px] font-bold text-white uppercase">{typeConfig.label}</span>
                            </div>
                           )}
                        </div>

                        {/* Overlay (Matches Image Generator) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-5">
                          <p className="text-white text-sm line-clamp-2 mb-4 font-medium leading-relaxed">{item.name}</p>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              className="h-8 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction("Download", item);
                              }}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Download
                            </Button>
                            <Button 
                              size="icon" 
                              className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction("Copy", item);
                              }}
                              data-testid={`button-copy-${item.id}`}
                            >
                              <ClipboardCopy className="h-3.5 w-3.5" />
                            </Button>
                            <div className="flex items-center gap-1 ml-auto">
                              <Button 
                                size="icon" 
                                className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                              >
                                <Star className={cn("h-3.5 w-3.5", item.favorite && "fill-yellow-400 text-yellow-400")} />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1F1F25] border-[#2A2A30] text-[#E4E4E7]">
                                  <DropdownMenuItem onClick={() => handleAction("Open", item)} className="hover:bg-[#2A2A30] cursor-pointer"><ArrowUpRight className="h-4 w-4 mr-2" /> Open</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction("Edit", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction("Copy", item)} className="hover:bg-[#2A2A30] cursor-pointer"><ClipboardCopy className="h-4 w-4 mr-2" /> Copy to Clipboard</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction("Duplicate", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction("Move", item)} className="hover:bg-[#2A2A30] cursor-pointer"><FolderInput className="h-4 w-4 mr-2" /> Move to Folder</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <Button 
                                size="icon" 
                                className="h-8 w-8 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border-0 backdrop-blur-md rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction("Delete", item);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {hasNextPage && !isLoading && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="bg-[#B94E30] hover:bg-[#9A3E25] text-white px-8 py-2"
                  data-testid="button-load-more"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${items.length} of ${total})`
                  )}
                </Button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectedItem(null)}
          >
            <div 
              className="w-full max-w-7xl h-[90vh] md:h-[85vh] bg-card rounded-2xl overflow-hidden flex flex-col md:flex-row border border-border shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Left: Image */}
              <div className="w-full h-[40vh] md:h-auto md:flex-1 bg-muted/20 flex items-center justify-center p-4 md:p-8 relative group bg-checkerboard">
                <img 
                  src={selectedItem.src} 
                  alt={selectedItem.name} 
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
                  <h3 className="font-bold text-foreground">Creation Details</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
                  {/* Actions */}
                  <div className="grid grid-cols-5 gap-2">
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                      onClick={() => handleAction("Download", selectedItem)}
                    >
                      <Download className="h-5 w-5" />
                      <span className="text-[10px]">Save</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                      onClick={() => handleAction("Copy", selectedItem)}
                      data-testid="button-copy-detail"
                    >
                      <ClipboardCopy className="h-5 w-5" />
                      <span className="text-[10px]">Copy</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                      onClick={() => handleAction("Duplicate", selectedItem)}
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span className="text-[10px]">Vary</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-16 gap-1 bg-muted/30 hover:bg-muted text-foreground rounded-xl border border-border"
                      onClick={() => handleAction("Edit", selectedItem)}
                    >
                      <Pencil className="h-5 w-5" />
                      <span className="text-[10px]">Edit</span>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className={cn(
                        "flex flex-col h-16 gap-1 rounded-xl border border-border",
                        selectedItem.favorite 
                          ? "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100" 
                          : "bg-muted/30 hover:bg-muted text-foreground"
                      )}
                      onClick={() => toggleFavorite(selectedItem.id)}
                    >
                      <Star className={cn("h-5 w-5", selectedItem.favorite && "fill-current")} />
                      <span className="text-[10px]">Like</span>
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</label>
                    <div className="bg-muted/30 rounded-xl p-4 text-sm text-foreground font-medium border border-border relative group">
                      {selectedItem.name}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                           navigator.clipboard.writeText(selectedItem.name);
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
                      <span className="text-xs text-muted-foreground">Type</span>
                      <Badge variant="outline" className="uppercase">{selectedItem.type.replace("-", " ")}</Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Dimensions</span>
                      <span className="text-xs font-medium text-foreground">{selectedItem.dimensions}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Size</span>
                      <span className="text-xs font-medium text-foreground font-mono">{selectedItem.size}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Date Created</span>
                      <span className="text-xs font-medium text-foreground">{selectedItem.date} at {selectedItem.time}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map(tag => (
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#18181B] border-[#2A2A30] text-[#FAFAFA]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#A1A1AA]">
              This action cannot be undone. This will permanently delete this item from your creations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#2A2A30] text-[#FAFAFA] hover:bg-[#2A2A30] hover:text-[#FAFAFA]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white border-0">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CalendarHistoryModal open={calendarOpen} onOpenChange={setCalendarOpen} />
    </div>
  );
}
