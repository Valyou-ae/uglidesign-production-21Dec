import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  FolderKanban, 
  ArrowLeft, 
  Trash2, 
  Edit2, 
  GripVertical,
  Image as ImageIcon,
  MoreHorizontal,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MoodBoard, MoodBoardItem, GeneratedImage } from "@shared/schema";

interface BoardItemWithImage extends MoodBoardItem {
  image: GeneratedImage;
}

interface MoodBoardWithItems {
  board: MoodBoard;
  items: BoardItemWithImage[];
}

const moodBoardApi = {
  getBoards: async (): Promise<MoodBoard[]> => {
    const res = await fetch("/api/mood-boards", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch mood boards");
    const data = await res.json();
    return data.boards;
  },
  createBoard: async (data: { name: string; description?: string }): Promise<MoodBoard> => {
    const res = await fetch("/api/mood-boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create mood board");
    const result = await res.json();
    return result.board;
  },
  getBoard: async (id: string): Promise<MoodBoardWithItems> => {
    const res = await fetch(`/api/mood-boards/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch mood board");
    return res.json();
  },
  updateBoard: async (id: string, data: { name?: string; description?: string }): Promise<MoodBoard> => {
    const res = await fetch(`/api/mood-boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update mood board");
    const result = await res.json();
    return result.board;
  },
  deleteBoard: async (id: string): Promise<void> => {
    const res = await fetch(`/api/mood-boards/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete mood board");
  },
  addItem: async (boardId: string, data: { imageId: string; positionX: number; positionY: number }): Promise<MoodBoardItem> => {
    const res = await fetch(`/api/mood-boards/${boardId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add item to board");
    const result = await res.json();
    return result.item;
  },
  updateItem: async (boardId: string, itemId: string, data: { positionX?: number; positionY?: number; width?: number; height?: number; zIndex?: number }): Promise<MoodBoardItem> => {
    const res = await fetch(`/api/mood-boards/${boardId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update board item");
    const result = await res.json();
    return result.item;
  },
  removeItem: async (boardId: string, itemId: string): Promise<void> => {
    const res = await fetch(`/api/mood-boards/${boardId}/items/${itemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to remove item from board");
  },
};

const imagesApi = {
  getImages: async (): Promise<GeneratedImage[]> => {
    const res = await fetch("/api/images", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch images");
    const data = await res.json();
    return data.images;
  },
};

function BoardsGrid({ onSelectBoard }: { onSelectBoard: (id: string) => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["mood-boards"],
    queryFn: moodBoardApi.getBoards,
  });

  const createBoardMutation = useMutation({
    mutationFn: moodBoardApi.createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood-boards"] });
      setShowCreateModal(false);
      setNewBoardName("");
      setNewBoardDescription("");
      toast({ title: "Project created!" });
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: moodBoardApi.deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood-boards"] });
      toast({ title: "Project deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
  });

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    createBoardMutation.mutate({ name: newBoardName, description: newBoardDescription });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your images into visual collections
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-[#ed5387] to-[#9C27B0] text-white hover:opacity-90"
          data-testid="button-create-board"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start organizing your images
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#ed5387] to-[#9C27B0] text-white"
              data-testid="button-create-first-board"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
              onClick={() => onSelectBoard(board.id)}
              data-testid={`card-board-${board.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg truncate flex-1">{board.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBoardMutation.mutate(board.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-28 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                </div>
                {board.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {board.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="My Inspiration Project"
                className="mt-1"
                data-testid="input-board-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="What's this project about?"
                className="mt-1"
                data-testid="input-board-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBoard}
              disabled={createBoardMutation.isPending}
              className="bg-gradient-to-r from-[#ed5387] to-[#9C27B0] text-white"
              data-testid="button-confirm-create"
            >
              {createBoardMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoardCanvas({ boardId, onBack }: { boardId: string; onBack: () => void }) {
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: boardData, isLoading } = useQuery({
    queryKey: ["mood-board", boardId],
    queryFn: () => moodBoardApi.getBoard(boardId),
  });

  const { data: images = [] } = useQuery({
    queryKey: ["images"],
    queryFn: imagesApi.getImages,
  });

  const addItemMutation = useMutation({
    mutationFn: (data: { imageId: string; positionX: number; positionY: number }) =>
      moodBoardApi.addItem(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood-board", boardId] });
    },
    onError: () => {
      toast({ title: "Failed to add image", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: { positionX?: number; positionY?: number } }) =>
      moodBoardApi.updateItem(boardId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood-board", boardId] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => moodBoardApi.removeItem(boardId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood-board", boardId] });
      toast({ title: "Image removed from project" });
    },
  });

  const handleDragStart = useCallback((e: React.DragEvent, imageId: string, isCanvasItem: boolean = false, itemId?: string) => {
    e.dataTransfer.setData("imageId", imageId);
    e.dataTransfer.setData("isCanvasItem", String(isCanvasItem));
    if (itemId) {
      e.dataTransfer.setData("itemId", itemId);
      setDraggingItem(itemId);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const imageId = e.dataTransfer.getData("imageId");
    const isCanvasItem = e.dataTransfer.getData("isCanvasItem") === "true";
    const itemId = e.dataTransfer.getData("itemId");
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    let positionX = e.clientX - rect.left;
    let positionY = e.clientY - rect.top;

    if (isCanvasItem && itemId) {
      positionX -= dragOffset.x;
      positionY -= dragOffset.y;
      updateItemMutation.mutate({ itemId, data: { positionX: Math.max(0, positionX), positionY: Math.max(0, positionY) } });
    } else if (imageId) {
      addItemMutation.mutate({ imageId, positionX, positionY });
    }
    
    setDraggingItem(null);
  }, [dragOffset, addItemMutation, updateItemMutation]);

  const availableImages = images.filter(
    (img) => !boardData?.items.some((item) => item.imageId === img.id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold">{boardData.board.name}</h1>
          {boardData.board.description && (
            <p className="text-sm text-muted-foreground">{boardData.board.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-64 flex-shrink-0 border rounded-xl p-4 bg-card">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Your Images
          </h3>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2 pr-2">
              {availableImages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No images available. Generate some images first!
                </p>
              ) : (
                availableImages.map((image) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image.id)}
                    className="cursor-grab active:cursor-grabbing"
                    data-testid={`draggable-image-${image.id}`}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors bg-muted">
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex-1 border-2 border-dashed rounded-xl bg-muted/30 relative overflow-hidden"
          data-testid="board-canvas"
        >
          {boardData.items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Drag images here to add them to your project
                </p>
              </div>
            </div>
          )}

          {boardData.items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.imageId, true, item.id)}
              style={{
                position: "absolute",
                left: item.positionX,
                top: item.positionY,
                width: item.width,
                height: item.height,
                zIndex: item.zIndex,
              }}
              className={cn(
                "group cursor-grab active:cursor-grabbing rounded-lg overflow-hidden shadow-lg border-2 border-transparent hover:border-primary transition-all",
                draggingItem === item.id && "opacity-50"
              )}
              data-testid={`board-item-${item.id}`}
            >
              <img
                src={item.image.imageUrl}
                alt={item.image.prompt}
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 bg-black/50 rounded">
                  <GripVertical className="h-4 w-4 text-white" />
                </div>
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItemMutation.mutate(item.id);
                }}
                data-testid={`button-remove-item-${item.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MoodBoard() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
          {selectedBoardId ? (
            <BoardCanvas boardId={selectedBoardId} onBack={() => setSelectedBoardId(null)} />
          ) : (
            <BoardsGrid onSelectBoard={setSelectedBoardId} />
          )}
        </main>
      </div>
    </div>
  );
}
