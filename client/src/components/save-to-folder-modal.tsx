import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Folder, Plus, Check, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { foldersApi, type ImageFolder } from "@/lib/api";
import { cn } from "@/lib/utils";

const FOLDER_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
];

interface SaveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderId: string | null) => void;
  imageId?: string;
}

export function SaveToFolderModal({
  isOpen,
  onClose,
  onSave,
  imageId,
}: SaveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [createError, setCreateError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: foldersData, isLoading } = useQuery({
    queryKey: ["folders"],
    queryFn: foldersApi.getAll,
    enabled: isOpen,
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      foldersApi.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setSelectedFolderId(result.folder.id);
      setIsCreating(false);
      setNewFolderName("");
      setNewFolderColor(FOLDER_COLORS[0]);
      setCreateError(null);
    },
    onError: (error: Error) => {
      setCreateError(error.message || "Failed to create folder");
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate({
        name: newFolderName.trim(),
        color: newFolderColor,
      });
    }
  };

  const handleSave = () => {
    onSave(selectedFolderId);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedFolderId(null);
      setIsCreating(false);
      setNewFolderName("");
    }
  }, [isOpen]);

  const folders = foldersData?.folders || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Save to Folder
          </DialogTitle>
          <DialogDescription>
            Choose a folder to organize your image, or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                      selectedFolderId === null
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                    data-testid="button-folder-none"
                  >
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium">No folder</span>
                    {selectedFolderId === null && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>

                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                        selectedFolderId === folder.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                      data-testid={`button-folder-${folder.id}`}
                    >
                      <div
                        className="h-8 w-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: folder.color || "#6366f1" }}
                      >
                        <Folder className="h-4 w-4 text-white" />
                      </div>
                      <span className="flex-1 font-medium">{folder.name}</span>
                      {selectedFolderId === folder.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {isCreating ? (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => {
                      setNewFolderName(e.target.value);
                      setCreateError(null);
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                      if (e.key === "Escape") setIsCreating(false);
                    }}
                    data-testid="input-new-folder-name"
                  />
                  <div className="flex gap-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewFolderColor(color)}
                        className={cn(
                          "h-6 w-6 rounded-full transition-transform",
                          newFolderColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                        style={{ backgroundColor: color }}
                        data-testid={`button-color-${color}`}
                      />
                    ))}
                  </div>
                  {createError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {createError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false);
                        setCreateError(null);
                      }}
                      data-testid="button-cancel-create-folder"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || createFolderMutation.isPending}
                      data-testid="button-confirm-create-folder"
                    >
                      {createFolderMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCreating(true)}
                  data-testid="button-new-folder"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-save">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-to-folder">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
