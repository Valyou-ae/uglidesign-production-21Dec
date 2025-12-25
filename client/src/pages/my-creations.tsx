import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  LayoutGrid, 
  List, 
  MoreVertical, 
  MoreHorizontal,
  Download, 
  Star, 
  Trash2, 
  FolderInput, 
  Folder,
  FolderPlus, 
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
  Loader2,
  Share2,
  Shirt,
  Palette,
  Rocket,
  History as HistoryIcon
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
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useImages } from "@/hooks/use-images";
import { CalendarHistoryModal } from "@/components/calendar-history-modal";
import { transferImageToTool } from "@/lib/image-transfer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { foldersApi, type ImageFolder } from "@/lib/api";
import { SaveToFolderModal } from "@/components/save-to-folder-modal";


type ItemType = {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  size: string;
  dimensions: string;
  aspectRatio: string;
  src: string;
  tags: string[];
  favorite: boolean;
  isPublic: boolean;
  folderId: string | null;
  prompt: string;
  style: string;
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<ItemType | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [imageVersions, setImageVersions] = useState<Array<{id: string; imageUrl: string; versionNumber: number; editPrompt: string}>>([]);
  const [rootImageId, setRootImageId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch folders
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: foldersApi.getAll,
  });
  const folders = foldersData?.folders || [];
  
  // Fetch images from backend API
  const { images: dbImages, isLoading, toggleFavorite: apiToggleFavorite, deleteImage: apiDeleteImage, setVisibility: apiSetVisibility, hasNextPage, fetchNextPage, isFetchingNextPage, total } = useImages();

  const items: ItemType[] = useMemo(() => {
    const getDimensionsFromRatio = (ratio: string | null | undefined): string => {
      if (!ratio) return "1024 × 1024";
      const parts = ratio.split(":").map(Number);
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return "1024 × 1024";
      const [w, h] = parts;
      const maxSize = 1024;
      if (w >= h) {
        return `${maxSize} × ${Math.round((maxSize * h) / w)}`;
      } else {
        return `${Math.round((maxSize * w) / h)} × ${maxSize}`;
      }
    };
    
    return dbImages.map((img: any) => ({
      id: img.id,
      name: img.prompt?.slice(0, 30) || "Generated Image",
      type: img.generationType || "image",
      date: new Date(img.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: new Date(img.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      size: img.fileSize ? `${(img.fileSize / 1024).toFixed(1)} KB` : "—",
      dimensions: getDimensionsFromRatio(img.aspectRatio),
      src: img.imageUrl,
      tags: [img.style || "Generated"],
      favorite: img.isFavorite || false,
      isPublic: img.isPublic || false,
      aspectRatio: img.aspectRatio || "1:1",
      folderId: img.folderId || null,
      prompt: img.prompt || "",
      style: img.style || "Generated",
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

  const toggleVisibility = async (id: string, currentIsPublic: boolean) => {
    const newIsPublic = !currentIsPublic;
    // Optimistic update for selectedItem
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => prev ? { ...prev, isPublic: newIsPublic } : null);
    }
    
    try {
      // Use the hook's setVisibility which invalidates the query cache
      await apiSetVisibility({ id, isPublic: newIsPublic });
      toast({ 
        title: newIsPublic ? "Image is now Public" : "Image is now Private", 
        description: newIsPublic ? "This image will appear in the public gallery." : "This image is only visible to you." 
      });
    } catch (error) {
      // Rollback on error
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(prev => prev ? { ...prev, isPublic: currentIsPublic } : null);
      }
      toast({ variant: "destructive", title: "Failed", description: "Could not update visibility." });
    }
  };

  // Open item popup and fetch versions
  const openItemPopup = async (item: ItemType) => {
    setSelectedItem(item);
    setRootImageId(item.id);
    setCurrentVersionId(item.id);
    setImageVersions([]);
    setEditPrompt("");
    
    // Fetch versions for this item
    try {
      const response = await fetch(`/api/images/${item.id}/versions`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setImageVersions(data.versions.map((v: any) => ({
          id: v.id,
          imageUrl: `/api/images/${v.id}/image`,
          versionNumber: v.versionNumber ?? 0,
          editPrompt: v.editPrompt || "Original",
        })));
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    }
  };

  // Close item popup
  const closeItemPopup = () => {
    setSelectedItem(null);
    setRootImageId(null);
    setCurrentVersionId(null);
    setImageVersions([]);
    setEditPrompt("");
  };

  // Fetch image versions (helper for refreshing after edit)
  const fetchImageVersions = async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}/versions`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setImageVersions(data.versions.map((v: any) => ({
          id: v.id,
          imageUrl: `/api/images/${v.id}/image`,
          versionNumber: v.versionNumber ?? 0,
          editPrompt: v.editPrompt || "Original",
        })));
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    }
  };

  // Handle AI edit
  const handleEditImage = async () => {
    if (!currentVersionId || !editPrompt.trim() || !rootImageId) return;
    
    setIsEditing(true);
    try {
      const response = await fetch("/api/image-editor/edit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: currentVersionId,
          prompt: editPrompt.trim(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Edit failed");
      }
      
      const data = await response.json();
      toast({ title: "Edit Complete", description: "Your image has been edited!" });
      setEditPrompt("");
      
      // Refresh versions using root image ID
      await fetchImageVersions(rootImageId);
      
      // Update current version to the new edit
      if (data.imageId) {
        setCurrentVersionId(data.imageId);
        setSelectedItem(prev => prev ? {
          ...prev,
          src: `/api/images/${data.imageId}/image`,
        } : null);
      }
      
      // Invalidate images query
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Edit Failed",
        description: error.message || "Could not edit the image",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Select a version (doesn't change rootImageId, only currentVersionId)
  const selectImageVersion = (version: { id: string; imageUrl: string }) => {
    setCurrentVersionId(version.id);
    if (selectedItem) {
      setSelectedItem({
        ...selectedItem,
        src: version.imageUrl,
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

      // Create a promise that loads the image and converts to PNG blob
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, 'image/png');
          } catch (e) {
            reject(e);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob
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
      openItemPopup(item);
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
      toast({ title: "Coming Soon", description: "Duplicate feature is coming soon." });
      return;
    }

    if (action === "Copy") {
      copyImageToClipboard(item.src);
      return;
    }

    if (action === "Favorite" || action === "Unfavorite") {
      toggleFavorite(item.id);
      return;
    }

    if (action === "Move") {
      setItemToMove(item);
      setShowFolderModal(true);
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

  const handleBulkAction = async (action: string) => {
    if (action === "Move" || action === "Duplicate") {
      toast({ title: "Coming Soon", description: `Bulk ${action.toLowerCase()} feature is coming soon.` });
      setSelectMode(false);
      setSelectedItems([]);
      return;
    }

    if (action === "Download") {
      toast({ title: "Downloading", description: `Starting download of ${selectedItems.length} images...` });
      for (const itemId of selectedItems) {
        const item = items.find(i => i.id === itemId);
        if (item) {
          await downloadImage(item.src, `${item.name.replace(/\s+/g, '_').toLowerCase()}.jpg`);
        }
      }
      setSelectMode(false);
      setSelectedItems([]);
      return;
    }

    if (action === "Unfavorite" || action === "Favorite") {
      for (const itemId of selectedItems) {
        await apiToggleFavorite(itemId);
      }
      toast({ title: "Updated", description: `${selectedItems.length} items updated.` });
      setSelectMode(false);
      setSelectedItems([]);
      return;
    }

    if (action === "Delete") {
      for (const itemId of selectedItems) {
        if (!itemId.startsWith("mock-")) {
          await apiDeleteImage(itemId);
        }
      }
      toast({ title: "Deleted", description: `${selectedItems.length} items deleted.` });
      setSelectMode(false);
      setSelectedItems([]);
      return;
    }

    toast({
      title: `${action} ${selectedItems.length} items`,
      description: "This action has been performed successfully.",
      className: "bg-zinc-900 text-white border-zinc-800"
    });
    setSelectMode(false);
    setSelectedItems([]);
  };

  const filteredItems = items.filter(item => {
    // First apply folder filter if active
    if (activeFolderId && item.folderId !== activeFolderId) return false;
    
    if (activeFilter === "All") return true;
    if (activeFilter === "My Favourites" && item.favorite) return true;
    if (activeFilter === "My Favourites" && !item.favorite) return false;
    if (activeFilter === "Images" && item.type === "image") return true;
    if (activeFilter === "Mockups" && item.type === "mockup") return true;
    if (activeFilter === "BG Removed" && item.type === "bg-removed") return true;
    if (activeFilter === "Folders") return true; // Show all when in Folders view
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
                className="h-10 w-10 bg-white dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#2A2A30] text-[#71717A] hover:text-[#ed5387]"
                data-testid="button-calendar-history"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {[
                { name: "All", count: items.length },
                { name: "Folders", count: folders.length },
                { name: "My Favourites", count: items.filter(i => i.favorite).length },
                { name: "Images", count: items.filter(i => i.type === "image").length },
                { name: "Mockups", count: items.filter(i => i.type === "mockup").length },
              ].map(filter => (
                <button
                  key={filter.name}
                  onClick={() => {
                    setActiveFilter(filter.name);
                    if (filter.name !== "Folders") {
                      setActiveFolderId(null);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap flex-shrink-0",
                    activeFilter === filter.name 
                      ? "bg-[#F59E0B] text-[#18181B] border-[#F59E0B]" 
                      : "bg-white dark:bg-[#1F1F25] text-[#71717A] border-[#E4E4E7] dark:border-[#2A2A30]"
                  )}
                  data-testid={`filter-${filter.name.toLowerCase().replace(/\s+/g, '-')}`}
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
              
              <button
                onClick={() => setShowFolderModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex-shrink-0 bg-white dark:bg-[#1F1F25] border-[#E4E4E7] dark:border-[#2A2A30] text-white hover:border-[#F59E0B] hover:text-[#F59E0B]"
                data-testid="button-new-folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                New Folder
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

          {/* FOLDERS SECTION - when Folders filter is active */}
          {activeFilter === "Folders" && !activeFolderId && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Your Folders</h2>
              </div>
              {isLoadingFolders ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : folders.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-center bg-card border border-border rounded-xl">
                  <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No folders yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create folders to organize your images. Use the Save button on any image to create a folder.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {folders.map((folder: ImageFolder) => {
                    const folderImages = items.filter(item => item.folderId === folder.id);
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setActiveFolderId(folder.id)}
                        className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all text-left"
                        data-testid={`folder-card-${folder.id}`}
                      >
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${folder.color || '#6366f1'}20` }}
                        >
                          <Folder className="h-6 w-6" style={{ color: folder.color || '#6366f1' }} />
                        </div>
                        <h3 className="font-semibold text-foreground truncate mb-1">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground">{folderImages.length} images</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE FOLDER HEADER */}
          {activeFolderId && (
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setActiveFolderId(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
                Clear folder filter
              </button>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" style={{ color: folders.find(f => f.id === activeFolderId)?.color || '#6366f1' }} />
                <span className="font-medium text-foreground">
                  {folders.find(f => f.id === activeFolderId)?.name || 'Folder'}
                </span>
              </div>
            </div>
          )}

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
                    onClick={() => selectMode ? toggleSelection(item.id) : openItemPopup(item)}
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
                          <DropdownMenuItem onClick={() => handleAction("Download", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Download className="h-4 w-4 mr-2" /> Download</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Copy", item)} className="hover:bg-[#2A2A30] cursor-pointer"><ClipboardCopy className="h-4 w-4 mr-2" /> Copy to Clipboard</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Duplicate", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Move", item)} className="hover:bg-[#2A2A30] cursor-pointer"><FolderInput className="h-4 w-4 mr-2" /> Move to Folder</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#2A2A30]" />
                          <DropdownMenuItem 
                            onClick={() => {
                              const route = transferImageToTool(item, "mockup");
                              setLocation(route);
                            }} 
                            className="hover:bg-[#2A2A30] cursor-pointer"
                          >
                            <Shirt className="h-4 w-4 mr-2" /> Use in Mockup Creator
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const route = transferImageToTool(item, "bg-remover");
                              setLocation(route);
                            }} 
                            className="hover:bg-[#2A2A30] cursor-pointer"
                          >
                            <Scissors className="h-4 w-4 mr-2" /> Remove Background
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const route = transferImageToTool(item, "style-transfer");
                              setLocation(route);
                            }} 
                            className="hover:bg-[#2A2A30] cursor-pointer"
                          >
                            <Palette className="h-4 w-4 mr-2" /> Apply Style Transfer
                          </DropdownMenuItem>
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
                      onClick={() => selectMode ? toggleSelection(item.id) : openItemPopup(item)}
                      className={cn(
                        "break-inside-avoid mb-3 relative group rounded-xl overflow-hidden cursor-pointer bg-card border border-border transition-all duration-200",
                        !selectMode && "hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]",
                        selectMode && selectedItems.includes(item.id) 
                          ? "border-[#F59E0B] ring-4 ring-[#F59E0B]/15" 
                          : ""
                      )}
                    >
                      {/* Image Container - Dynamic aspect ratio */}
                      <div className={cn(
                        "w-full relative overflow-hidden bg-muted/20",
                        item.aspectRatio === "9:16" && "aspect-[9/16]",
                        item.aspectRatio === "16:9" && "aspect-[16/9]",
                        item.aspectRatio === "4:5" && "aspect-[4/5]",
                        item.aspectRatio === "3:4" && "aspect-[3/4]",
                        item.aspectRatio === "1:1" && "aspect-square",
                        !item.aspectRatio && "aspect-square"
                      )}>
                        <img 
                          src={item.src} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        
                        {/* Selection Checkbox (Top Left) - Only shown in select mode */}
                        {selectMode && (
                          <div className="absolute top-3 left-3 z-10">
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-lg">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1F1F25] border-[#2A2A30] text-[#E4E4E7]">
                                  <DropdownMenuItem onClick={() => handleAction("Open", item)} className="hover:bg-[#2A2A30] cursor-pointer"><ArrowUpRight className="h-4 w-4 mr-2" /> Open</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction("Copy", item)} className="hover:bg-[#2A2A30] cursor-pointer"><ClipboardCopy className="h-4 w-4 mr-2" /> Copy to Clipboard</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction("Duplicate", item)} className="hover:bg-[#2A2A30] cursor-pointer"><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction("Move", item)} className="hover:bg-[#2A2A30] cursor-pointer"><FolderInput className="h-4 w-4 mr-2" /> Move to Folder</DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#2A2A30]" />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const route = transferImageToTool(item, "mockup");
                                      setLocation(route);
                                    }} 
                                    className="hover:bg-[#2A2A30] cursor-pointer"
                                  >
                                    <Shirt className="h-4 w-4 mr-2" /> Use in Mockup Creator
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const route = transferImageToTool(item, "bg-remover");
                                      setLocation(route);
                                    }} 
                                    className="hover:bg-[#2A2A30] cursor-pointer"
                                  >
                                    <Scissors className="h-4 w-4 mr-2" /> Remove Background
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const route = transferImageToTool(item, "style-transfer");
                                      setLocation(route);
                                    }} 
                                    className="hover:bg-[#2A2A30] cursor-pointer"
                                  >
                                    <Palette className="h-4 w-4 mr-2" /> Apply Style Transfer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                  className="bg-[#ed5387] hover:bg-[#9A3E25] text-white px-8 py-2"
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
            onClick={() => closeItemPopup()}
          >
            <div 
              className="bg-card rounded-2xl overflow-hidden flex flex-col md:flex-row border border-border shadow-2xl w-full max-w-6xl max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Left: Image */}
              <div className="md:flex-1 bg-black/60 flex items-center justify-center p-4 md:p-6 relative group overflow-hidden">
                <img 
                  src={selectedItem.src} 
                  alt={selectedItem.name} 
                  className="max-w-full max-h-[40vh] md:max-h-[80vh] object-contain rounded-lg" 
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
                  <Button variant="ghost" size="icon" onClick={() => closeItemPopup()} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                  {/* Prompt - at top */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prompt</label>
                    <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed border border-border relative group">
                      {selectedItem.prompt || "No prompt available"}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                           navigator.clipboard.writeText(selectedItem.prompt);
                           toast({ title: "Copied" });
                        }}
                        data-testid="button-copy-prompt"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Edit Image Section - prominent styling */}
                  <div className="space-y-2 bg-gradient-to-br from-[#ed5387]/10 to-[#ed5387]/5 rounded-lg p-3 border border-[#ed5387]/20">
                    <label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-[#ed5387]" />
                      Edit with UGLI AI
                    </label>
                    <div className="relative w-full">
                      <Input
                        placeholder="Remove background, change color to blue..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleEditImage();
                          }
                        }}
                        disabled={isEditing}
                        className="w-full h-11 text-sm bg-background/80 border-border pr-12"
                        data-testid="input-edit-prompt-creations"
                      />
                      <button
                        onClick={handleEditImage}
                        disabled={!editPrompt.trim() || isEditing}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#ed5387] hover:bg-[#d64375] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="button-apply-edit-creations"
                      >
                        {isEditing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Rocket className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Describe what you want to change using natural language
                    </p>
                  </div>

                  {/* Version History - horizontal row with arrows */}
                  {imageVersions.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <HistoryIcon className="h-3 w-3" />
                        Version History ({imageVersions.length})
                      </label>
                      <div className="relative">
                        {/* Left arrow */}
                        {imageVersions.length > 5 && (
                          <button 
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const container = e.currentTarget.parentElement?.querySelector('.version-scroll-container');
                              if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Thumbnails row */}
                        <div className="version-scroll-container flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {imageVersions.map((version, index) => (
                            <button
                              key={version.id}
                              onClick={() => selectImageVersion(version)}
                              className={cn(
                                "relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all hover:opacity-100",
                                currentVersionId === version.id 
                                  ? "border-[#ed5387] ring-2 ring-[#ed5387]/30" 
                                  : "border-border opacity-70 hover:border-muted-foreground"
                              )}
                              data-testid={`version-thumbnail-creations-${index}`}
                            >
                              <img 
                                src={version.imageUrl} 
                                alt={`Version ${version.versionNumber}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white text-center py-0.5">
                                {version.versionNumber === 0 ? "Orig" : `v${version.versionNumber}`}
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Right arrow */}
                        {imageVersions.length > 5 && (
                          <button 
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const container = e.currentTarget.parentElement?.querySelector('.version-scroll-container');
                              if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Selected version info below thumbnails */}
                      {(() => {
                        const selectedVersion = imageVersions.find(v => v.id === currentVersionId);
                        if (!selectedVersion) return null;
                        return (
                          <div className="bg-muted/30 rounded-md p-2 border border-border">
                            <div className="text-[11px] font-medium text-foreground">
                              {selectedVersion.versionNumber === 0 ? "Original" : `Version ${selectedVersion.versionNumber}`}
                              <span className="font-normal text-muted-foreground ml-2">
                                {selectedVersion.editPrompt || (selectedVersion.versionNumber === 0 ? "Original creation" : "Edited version")}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Actions - 6 buttons in a row */}
                  <div className="grid grid-cols-6 gap-1.5">
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-12 gap-0.5 bg-muted/30 hover:bg-muted text-foreground rounded-lg border border-border"
                      onClick={() => {
                        if (rootImageId) {
                          const rootItem = items.find(i => i.id === rootImageId);
                          if (rootItem) handleAction("Move", rootItem);
                        }
                      }}
                      data-testid="button-folder-detail"
                    >
                      <FolderInput className="h-4 w-4" />
                      <span className="text-[9px]">Folder</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-12 gap-0.5 bg-muted/30 hover:bg-muted text-foreground rounded-lg border border-border"
                      onClick={() => copyImageToClipboard(selectedItem.src)}
                      data-testid="button-copy-detail"
                    >
                      <ClipboardCopy className="h-4 w-4" />
                      <span className="text-[9px]">Copy</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-12 gap-0.5 bg-muted/30 hover:bg-muted text-foreground rounded-lg border border-border"
                      onClick={() => handleAction("Duplicate", selectedItem)}
                      data-testid="button-vary-detail"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-[9px]">Vary</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-12 gap-0.5 bg-muted/30 hover:bg-muted text-foreground rounded-lg border border-border"
                      onClick={() => {
                        const route = transferImageToTool(selectedItem, "mockup");
                        setLocation(route);
                      }}
                      data-testid="button-use-mockup-creations"
                    >
                      <Shirt className="h-4 w-4" />
                      <span className="text-[9px]">Mockup</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-12 gap-0.5 bg-muted/30 hover:bg-muted text-foreground rounded-lg border border-border"
                      onClick={() => {
                        const route = transferImageToTool(selectedItem, "style-transfer");
                        setLocation(route);
                      }}
                      data-testid="button-style-transfer-creations"
                    >
                      <Palette className="h-4 w-4" />
                      <span className="text-[9px]">Style</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex flex-col h-12 gap-0.5 bg-muted/30 hover:bg-muted text-foreground rounded-lg border border-border"
                      onClick={() => {
                        const route = transferImageToTool(selectedItem, "bg-remover");
                        setLocation(route);
                      }}
                      data-testid="button-remove-bg-creations"
                    >
                      <Scissors className="h-4 w-4" />
                      <span className="text-[9px]">Remove BG</span>
                    </Button>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex justify-between py-1.5 border-b border-border">
                      <span className="text-xs text-muted-foreground">Style</span>
                      <span className="text-xs font-medium text-foreground capitalize">{selectedItem.style}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border">
                      <span className="text-xs text-muted-foreground">Dimensions</span>
                      <span className="text-xs font-medium text-foreground">{selectedItem.dimensions}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border">
                      <span className="text-xs text-muted-foreground">Ratio</span>
                      <span className="text-xs font-medium text-foreground">{selectedItem.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border">
                      <span className="text-xs text-muted-foreground">Date Created</span>
                      <span className="text-xs font-medium text-foreground">{selectedItem.date} at {selectedItem.time}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border">
                      <span className="text-xs text-muted-foreground">Visibility</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {selectedItem.isPublic ? "Public" : "Private"}
                        </span>
                        <Switch
                          checked={selectedItem.isPublic}
                          onCheckedChange={() => toggleVisibility(selectedItem.id, selectedItem.isPublic)}
                          data-testid="switch-visibility-creations"
                          className="data-[state=checked]:bg-[#ed5387] scale-75"
                        />
                      </div>
                    </div>
                    {selectedItem.isPublic && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-muted-foreground">Share</span>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5 cursor-pointer"
                                data-testid="button-quick-share-creations"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                                Quick Share
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 z-[200]" align="end" sideOffset={5}>
                              <div className="grid gap-1">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start gap-3 h-10"
                                  onClick={() => {
                                    const shareUrl = `${window.location.origin}/share/${selectedItem.id}`;
                                    const shareText = `Check out this AI-generated image!`;
                                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=550,height=420');
                                  }}
                                  data-testid="button-share-twitter-creations"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                  Share on X
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start gap-3 h-10"
                                  onClick={() => {
                                    const shareUrl = `${window.location.origin}/share/${selectedItem.id}`;
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=550,height=420');
                                  }}
                                  data-testid="button-share-facebook-creations"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                  </svg>
                                  Share on Facebook
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start gap-3 h-10"
                                  onClick={() => {
                                    const shareUrl = `${window.location.origin}/share/${selectedItem.id}`;
                                    const shareText = `Check out this AI-generated image!`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
                                  }}
                                  data-testid="button-share-whatsapp-creations"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  Share on WhatsApp
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 cursor-pointer"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/share/${selectedItem.id}`;
                              navigator.clipboard.writeText(shareUrl);
                              setLinkCopied(true);
                              toast({ title: "Link Copied!", description: "Share link copied to clipboard" });
                              setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            data-testid="button-copy-share-link"
                          >
                            {linkCopied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                            {linkCopied ? "Copied!" : "Copy Link"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Actions - Download, Favorite, Delete */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 gap-1.5"
                      onClick={() => handleAction("Download", selectedItem)}
                      data-testid="button-download-detail"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 gap-1.5",
                        selectedItem.favorite && "text-yellow-500 border-yellow-500/30"
                      )}
                      onClick={() => rootImageId && toggleFavorite(rootImageId)}
                      data-testid="button-like-detail"
                    >
                      <Star className={cn("h-3.5 w-3.5", selectedItem.favorite && "fill-current")} />
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => {
                        if (rootImageId) {
                          const rootItem = items.find(i => i.id === rootImageId);
                          if (rootItem) handleAction("Delete", rootItem);
                        }
                      }}
                      data-testid="button-delete-detail"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

      <SaveToFolderModal
        isOpen={showFolderModal}
        onClose={() => {
          setShowFolderModal(false);
          setItemToMove(null);
        }}
        onSave={async (folderId) => {
          if (itemToMove && folderId) {
            try {
              await foldersApi.moveImage(itemToMove.id, folderId);
              queryClient.invalidateQueries({ queryKey: ["images"] });
              queryClient.invalidateQueries({ queryKey: ["folders"] });
              if (selectedItem && selectedItem.id === itemToMove.id) {
                setSelectedItem(prev => prev ? { ...prev, folderId } : null);
              }
              toast({ 
                title: "Moved to Folder", 
                description: "Image has been moved to the folder." 
              });
            } catch (error) {
              toast({ 
                variant: "destructive", 
                title: "Move Failed", 
                description: "Could not move image to folder." 
              });
            }
          }
          setShowFolderModal(false);
          setItemToMove(null);
        }}
        imageId={itemToMove?.id}
      />
    </div>
  );
}
