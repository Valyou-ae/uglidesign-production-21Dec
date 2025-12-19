import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Send, 
  ArrowLeft, 
  Plus, 
  Loader2,
  ThumbsUp,
  RefreshCw,
  Pencil,
  Copy,
  Share2,
  Trash2,
  X,
  Download,
  Sparkles,
  MessageCircle,
  FolderOpen,
  History,
  ChevronRight,
  CheckSquare,
  Square,
  ImagePlus,
  Upload,
  Images
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OptionChip {
  label: string;
  icon?: string;
  value: string;
  type: 'quick' | 'custom';
}

interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  options?: OptionChip[];
  imageUrl?: string;
  originalPrompt?: string;
  enhancedPrompt?: string;
  timestamp: Date;
}

const INITIAL_OPTIONS: OptionChip[] = [
  { label: 'Portrait', icon: '👤', value: 'portrait', type: 'quick' },
  { label: 'Landscape', icon: '🌄', value: 'landscape', type: 'quick' },
  { label: 'Fantasy', icon: '🐉', value: 'fantasy', type: 'quick' },
  { label: 'Abstract', icon: '🎨', value: 'abstract', type: 'quick' },
  { label: 'Architecture', icon: '🏛️', value: 'architecture', type: 'quick' },
  { label: 'Product', icon: '📦', value: 'product', type: 'quick' },
  { label: 'Describe something else', icon: '✍️', value: 'custom', type: 'custom' }
];

const STYLE_OPTIONS: OptionChip[] = [
  { label: 'Cinematic', icon: '🎬', value: 'cinematic', type: 'quick' },
  { label: 'Photorealistic', icon: '📸', value: 'realistic', type: 'quick' },
  { label: 'Artistic', icon: '🎨', value: 'artistic', type: 'quick' },
  { label: 'Anime', icon: '🎌', value: 'anime', type: 'quick' },
  { label: 'Fantasy Art', icon: '🧙', value: 'fantasy-art', type: 'quick' },
  { label: 'Describe custom style', icon: '✍️', value: 'custom', type: 'custom' }
];

const MOOD_OPTIONS: OptionChip[] = [
  { label: 'Dramatic', icon: '⚡', value: 'dramatic', type: 'quick' },
  { label: 'Peaceful', icon: '🕊️', value: 'peaceful', type: 'quick' },
  { label: 'Mysterious', icon: '🌙', value: 'mysterious', type: 'quick' },
  { label: 'Vibrant', icon: '🌈', value: 'vibrant', type: 'quick' },
  { label: 'Dark', icon: '🌑', value: 'dark', type: 'quick' },
  { label: 'Ethereal', icon: '✨', value: 'ethereal', type: 'quick' },
  { label: 'Describe mood', icon: '✍️', value: 'custom', type: 'custom' }
];

type ConversationStage = 'initial' | 'subject' | 'style' | 'mood' | 'generating' | 'post-generation';

function OptionChips({ 
  options, 
  onSelect, 
  disabled 
}: { 
  options: OptionChip[]; 
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const handleChipClick = (option: OptionChip) => {
    if (disabled) return;
    if (option.type === 'custom') {
      setShowCustomInput(true);
    } else {
      setSelectedChip(option.value);
      onSelect(option.value);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelect(customValue);
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  if (showCustomInput) {
    return (
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
          placeholder="Type your response..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
          data-testid="input-custom-response"
        />
        <Button size="sm" onClick={handleCustomSubmit} disabled={!customValue.trim()} data-testid="button-submit-custom">
          Send
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowCustomInput(false)} data-testid="button-cancel-custom">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleChipClick(option)}
          disabled={disabled || selectedChip !== null}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50",
            option.type === 'custom' && "border-dashed",
            selectedChip === option.value && "bg-primary border-primary",
            (disabled || selectedChip !== null) && "opacity-50 cursor-not-allowed"
          )}
          data-testid={`chip-option-${option.value}`}
        >
          {option.icon && <span>{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function AgentMessage({ 
  message, 
  onOptionSelect,
  isLatest 
}: { 
  message: ChatMessageType; 
  onOptionSelect: (value: string) => void;
  isLatest: boolean;
}) {
  return (
    <div className="flex gap-3 animate-fade-in" data-testid={`message-agent-${message.id}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          {message.imageUrl && (
            <div className="mt-4 relative group">
              <img 
                src={message.imageUrl} 
                alt="Generated" 
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                data-testid={`img-generated-${message.id}`}
              />
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="h-8 w-8" data-testid="button-download-image">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {message.enhancedPrompt && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                View enhanced prompt
              </summary>
              <p className="mt-2 p-2 bg-white/5 rounded text-muted-foreground">{message.enhancedPrompt}</p>
            </details>
          )}
          
          {message.options && message.options.length > 0 && isLatest && (
            <OptionChips options={message.options} onSelect={onOptionSelect} />
          )}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 block">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessageType }) {
  return (
    <div className="flex gap-3 justify-end animate-fade-in" data-testid={`message-user-${message.id}`}>
      <div className="max-w-[80%]">
        <div className="bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-none p-4">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 block text-right">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-medium">U</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

interface ChatSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function ChatHistorySidebar({ 
  sessions, 
  currentSessionId, 
  onSelectSession,
  onRenameSession,
  onDeleteSessions,
  isLoading
}: { 
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSessions: (sessionIds: string[]) => void;
  isLoading: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartEdit = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    if (selectionMode) return;
    setEditingId(session.id);
    setEditName(session.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameSession(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditName('');
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelection = (sessionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await onDeleteSessions(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectionMode(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <aside className="w-72 border-l border-white/10 bg-background/50 flex flex-col h-full" data-testid="sidebar-chat-history">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Chat History</h2>
          </div>
          {sessions.length > 0 && (
            <button
              onClick={toggleSelectionMode}
              className={cn(
                "p-1.5 rounded-md transition-colors text-xs font-medium",
                selectionMode 
                  ? "bg-primary/20 text-primary hover:bg-primary/30" 
                  : "hover:bg-white/10 text-muted-foreground"
              )}
              data-testid="button-toggle-select"
            >
              {selectionMode ? "Cancel" : "Select"}
            </button>
          )}
        </div>
        {selectionMode && sessions.length > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <button
              onClick={selectAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              data-testid="button-select-all"
            >
              {selectedIds.size === sessions.length ? (
                <CheckSquare className="h-3.5 w-3.5" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              {selectedIds.size === sessions.length ? "Deselect All" : "Select All"}
            </button>
            <Button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || isDeleting}
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              data-testid="button-delete-selected"
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No previous chats
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelection(session.id);
                  } else if (editingId !== session.id) {
                    onSelectSession(session.id);
                  }
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors group cursor-pointer",
                  "hover:bg-white/5",
                  currentSessionId === session.id && !selectionMode && "bg-primary/10 border border-primary/20",
                  selectionMode && selectedIds.has(session.id) && "bg-destructive/10 border border-destructive/30"
                )}
                data-testid={`session-item-${session.id}`}
              >
                <div className="flex items-start gap-2">
                  {selectionMode && (
                    <Checkbox
                      checked={selectedIds.has(session.id)}
                      onCheckedChange={() => toggleSelection(session.id)}
                      className="mt-0.5 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                      data-testid={`checkbox-session-${session.id}`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSaveEdit}
                        autoFocus
                        className="w-full px-2 py-1 text-sm bg-white/10 border border-primary/50 rounded focus:outline-none"
                        data-testid={`input-rename-${session.id}`}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate flex-1">
                          {session.name}
                        </span>
                        {!selectionMode && (
                          <button
                            onClick={(e) => handleStartEdit(e, session)}
                            className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-rename-${session.id}`}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

export default function ChatStudio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<ConversationStage>('initial');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<{
    url: string;
    prompt: string;
    enhancedPrompt?: string;
  } | null>(null);
  const [attachedImage, setAttachedImage] = useState<{
    file: File;
    preview: string;
    base64?: string;
    isLoading?: boolean;
  } | null>(null);
  const [showCreationsPicker, setShowCreationsPicker] = useState(false);
  
  const { data: userImages } = useQuery({
    queryKey: ["/api/images"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/images?limit=50");
      return res.json();
    },
    enabled: showCreationsPicker
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/chat/sessions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/chat/sessions");
      return res.json();
    },
    enabled: !!user
  });
  
  const loadSession = async (selectedSessionId: string) => {
    try {
      const res = await apiRequest("GET", `/api/chat/sessions/${selectedSessionId}`);
      const data = await res.json();
      
      if (data.session) {
        setSessionId(data.session.id);
        setProjectId(data.session.projectId);
        setProjectName(data.session.name);
        
        const loadedMessages: ChatMessageType[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          options: msg.options,
          imageUrl: msg.imageUrl || undefined,
          originalPrompt: msg.originalPrompt,
          enhancedPrompt: msg.enhancedPrompt,
          timestamp: new Date(msg.createdAt)
        }));
        
        if (loadedMessages.length === 0) {
          const greeting: ChatMessageType = {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI creative assistant. What would you like to create today?",
            options: INITIAL_OPTIONS,
            timestamp: new Date()
          };
          setMessages([greeting]);
          setLastGeneratedImage(null);
        } else {
          setMessages(loadedMessages);
          // Restore last generated image from loaded messages
          const lastImageMsg = [...loadedMessages].reverse().find(m => m.imageUrl);
          if (lastImageMsg) {
            setLastGeneratedImage({
              url: lastImageMsg.imageUrl!,
              prompt: lastImageMsg.originalPrompt || lastImageMsg.enhancedPrompt || 'Generated image',
              enhancedPrompt: lastImageMsg.enhancedPrompt
            });
          } else {
            setLastGeneratedImage(null);
          }
        }
        
        setStage('initial');
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const createSessionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/chat/sessions", { name, createProject: true });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      if (data.projectId) {
        setProjectId(data.projectId);
        setProjectName(data.session.name);
      }
      setLastGeneratedImage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
    }
  });

  const saveMessageMutation = useMutation({
    mutationFn: async ({ role, content, options, imageId, enhancedPrompt }: { 
      role: string; 
      content: string; 
      options?: OptionChip[];
      imageId?: string;
      enhancedPrompt?: string;
    }) => {
      if (!sessionId) return;
      const res = await apiRequest("POST", `/api/chat/sessions/${sessionId}/messages`, {
        role, content, options, imageId, enhancedPrompt
      });
      return res.json();
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      // First generate the image
      const genRes = await apiRequest("POST", "/api/generate/single", {
        prompt,
        stylePreset: selectedStyle || "cinematic",
        aspectRatio: "1:1",
        isPublic: false
      });
      const genData = await genRes.json();
      
      if (!genRes.ok) {
        throw new Error(genData.message || "Image generation failed");
      }
      
      if (!genData.success || !genData.image) {
        throw new Error(genData.message || "No image was generated");
      }
      
      // Convert base64 to data URL
      const imageUrl = `data:${genData.image.mimeType};base64,${genData.image.data}`;
      
      // Save the image to the database
      const saveRes = await apiRequest("POST", "/api/images", {
        imageUrl,
        prompt,
        style: selectedStyle || "cinematic",
        aspectRatio: "1:1",
        generationType: "image",
        isFavorite: false,
        isPublic: false
      });
      const savedData = await saveRes.json();
      
      if (!saveRes.ok) {
        console.error("Failed to save image:", savedData.message);
      }
      
      return {
        imageUrl,
        imageId: savedData.image?.id,
        enhancedPrompt: genData.enhancedPrompt
      };
    }
  });

  useEffect(() => {
    // Don't auto-create sessions on page load - wait until first message
    const greeting: ChatMessageType = {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI creative assistant. What would you like to create today?",
      options: INITIAL_OPTIONS,
      timestamp: new Date()
    };
    setMessages([greeting]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addUserMessage = (content: string) => {
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    saveMessageMutation.mutate({ role: 'user', content });
    return userMessage;
  };

  const addAgentMessage = (content: string, options?: OptionChip[], imageUrl?: string, originalPrompt?: string, enhancedPrompt?: string, imageId?: string) => {
    const agentMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      options,
      imageUrl,
      originalPrompt,
      enhancedPrompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
    saveMessageMutation.mutate({ role: 'assistant', content, options, imageId, originalPrompt, enhancedPrompt });
    return agentMessage;
  };

  const processUserInput = async (content: string, imageBase64?: string | null) => {
    setIsLoading(true);
    
    let currentSessionId = sessionId;
    
    // Create session on first message if it doesn't exist
    if (!currentSessionId) {
      try {
        const res = await apiRequest("POST", "/api/chat/sessions", { 
          name: `Creative Session ${new Date().toLocaleDateString()}`, 
          createProject: true 
        });
        const data = await res.json();
        currentSessionId = data.session.id;
        setSessionId(data.session.id);
        if (data.projectId) {
          setProjectId(data.projectId);
          setProjectName(data.session.name);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      } catch (error) {
        console.error("Failed to create session:", error);
        addAgentMessage(
          "I couldn't set up your session. Please try again.",
          INITIAL_OPTIONS
        );
        setIsLoading(false);
        return;
      }
    }
    
    addUserMessage(content);

    const isFirstMessage = stage === 'initial' && !selectedSubject;
    
    // Generate smart name only on first message and lock it
    if (isFirstMessage) {
      apiRequest("POST", `/api/chat/sessions/${currentSessionId}/generate-name`, { firstMessage: content })
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setProjectName(data.name);
            queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
          }
        })
        .catch(err => console.error("Failed to generate smart name:", err));
    }
    
    try {
      const chatMessages = messages
        .filter(m => m.id !== '1')
        .map(m => ({ role: m.role, content: m.content }));
      chatMessages.push({ role: 'user' as const, content });
      
      const res = await apiRequest("POST", `/api/chat/sessions/${currentSessionId}/chat`, {
        messages: chatMessages,
        context: { 
          subject: selectedSubject, 
          style: selectedStyle, 
          mood: selectedMood,
          lastImage: lastGeneratedImage
        },
        attachedImage: imageBase64 || null
      });
      const aiResponse = await res.json();
      
      if (aiResponse.shouldGenerateImage && aiResponse.imagePrompt) {
        addAgentMessage("Creating your image...");
        
        try {
          const result = await generateImageMutation.mutateAsync(aiResponse.imagePrompt);
          
          setLastGeneratedImage({
            url: result.imageUrl,
            prompt: aiResponse.imagePrompt,
            enhancedPrompt: result.enhancedPrompt
          });
          
          setStage('post-generation');
          const postGenOptions: OptionChip[] = [
            { label: 'Create Variation', icon: '🔄', value: 'variation', type: 'quick' },
            { label: 'Different Style', icon: '🎨', value: 'new-style', type: 'quick' },
            { label: 'New Subject', icon: '➕', value: 'new', type: 'quick' },
            { label: "I'm Done", icon: '✓', value: 'done', type: 'quick' }
          ];
          
          addAgentMessage(
            aiResponse.message || "Here's your image! What would you like to do next?",
            postGenOptions,
            result.imageUrl,
            aiResponse.imagePrompt,
            result.enhancedPrompt || aiResponse.imagePrompt,
            result.imageId
          );
          queryClient.invalidateQueries({ queryKey: ["/api/images"] });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          addAgentMessage(
            `I couldn't generate the image: ${errorMessage}. Would you like to try something different?`
          );
        }
      } else {
        const options: OptionChip[] | undefined = aiResponse.suggestedOptions?.map(
          (opt: { label: string; icon: string; value: string }) => ({
            ...opt,
            type: 'quick' as const
          })
        );
        
        addAgentMessage(aiResponse.message, options);
        
        if (stage === 'initial' && !selectedSubject && content) {
          setSelectedSubject(content);
        } else if (selectedSubject && !selectedStyle) {
          setSelectedStyle(content);
        } else if (selectedSubject && selectedStyle && !selectedMood) {
          setSelectedMood(content);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      addAgentMessage(
        "I'm having trouble connecting. What would you like to create?",
        INITIAL_OPTIONS
      );
    }

    setIsLoading(false);
  };

  const handleSend = () => {
    if (input.trim() && !isLoading && !attachedImage?.isLoading) {
      const imageBase64 = attachedImage?.base64 || null;
      processUserInput(input.trim(), imageBase64);
      setInput('');
      setAttachedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const canSend = Boolean(input.trim() && !isLoading && !attachedImage?.isLoading);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        handleSend();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setAttachedImage({ file, preview, isLoading: true });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAttachedImage({ file, preview, base64, isLoading: false });
      };
      reader.onerror = () => {
        console.error("Failed to read file");
        URL.revokeObjectURL(preview);
        setAttachedImage(null);
      };
      reader.onabort = () => {
        URL.revokeObjectURL(preview);
        setAttachedImage(null);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = () => {
    if (attachedImage?.preview) {
      URL.revokeObjectURL(attachedImage.preview);
    }
    setAttachedImage(null);
  };

  const handleSelectFromCreations = async (imageUrl: string) => {
    setShowCreationsPicker(false);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'creation.png', { type: blob.type });
      const preview = URL.createObjectURL(blob);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage({
          file,
          preview,
          base64: reader.result as string,
          isLoading: false
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to load image from creations:", error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Chat Studio</h1>
              <p className="text-xs text-muted-foreground">AI-powered creative assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {projectName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">{projectName}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              data-testid="button-new-chat"
              onClick={() => {
                setMessages([]);
                setSessionId(null);
                setProjectId(null);
                setProjectName(null);
                setStage('initial');
                setSelectedSubject('');
                setSelectedStyle('');
                setSelectedMood('');
                const chatName = `Creative Session ${new Date().toLocaleDateString()}`;
                createSessionMutation.mutate(chatName);
                const greeting: ChatMessageType = {
                  id: '1',
                  role: 'assistant',
                  content: "Hi! I'm your AI creative assistant. What would you like to create today?",
                  options: INITIAL_OPTIONS,
                  timestamp: new Date()
                };
                setMessages([greeting]);
              }}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              message.role === 'assistant' ? (
                <AgentMessage 
                  key={message.id} 
                  message={message} 
                  onOptionSelect={processUserInput}
                  isLatest={index === messages.length - 1}
                />
              ) : (
                <UserMessage key={message.id} message={message} />
              )
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-white/10 bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto space-y-3">
            {attachedImage && (
              <div className="flex items-start gap-2">
                <div className="relative group">
                  <img 
                    src={attachedImage.preview} 
                    alt="Attached image" 
                    className="h-20 w-20 object-cover rounded-lg border border-white/10"
                    data-testid="img-attachment-preview"
                  />
                  <button
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid="button-remove-attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground mt-2">
                  Image attached - describe what you'd like to do with it
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                data-testid="input-file-upload"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isLoading}
                    className="h-12 w-12 shrink-0"
                    data-testid="button-attach-image"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="menu-upload-from-device"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload from device
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowCreationsPicker(true)}
                    data-testid="menu-pick-from-creations"
                  >
                    <Images className="h-4 w-4 mr-2" />
                    Pick from creations
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachedImage ? "Describe what you'd like to do with this image..." : "Type your message or select an option above..."}
                disabled={isLoading}
                className="min-h-[48px] max-h-[120px] resize-none bg-white/5 border-white/10"
                rows={1}
                data-testid="input-chat-message"
              />
              <Button 
                onClick={handleSend} 
                disabled={!canSend}
                className="h-12 w-12 shrink-0"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {showHistory && (
        <ChatHistorySidebar
          sessions={sessionsData?.sessions || []}
          currentSessionId={sessionId}
          onSelectSession={loadSession}
          onRenameSession={async (id, newName) => {
            try {
              await apiRequest("PATCH", `/api/chat/sessions/${id}`, { name: newName });
              queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
              if (id === sessionId) {
                setProjectName(newName);
              }
            } catch (err) {
              console.error("Failed to rename session:", err);
            }
          }}
          onDeleteSessions={async (sessionIds) => {
            try {
              await Promise.all(
                sessionIds.map(id => apiRequest("DELETE", `/api/chat/sessions/${id}`))
              );
              queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
              if (sessionId && sessionIds.includes(sessionId)) {
                setSessionId(null);
                setProjectId(null);
                setProjectName(null);
                setMessages([{
                  id: '1',
                  role: 'assistant',
                  content: "Hi! I'm your AI creative assistant. What would you like to create today?",
                  options: INITIAL_OPTIONS,
                  timestamp: new Date()
                }]);
                setStage('initial');
              }
            } catch (err) {
              console.error("Failed to delete sessions:", err);
            }
          }}
          isLoading={sessionsLoading}
        />
      )}
      
      <Dialog open={showCreationsPicker} onOpenChange={setShowCreationsPicker}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pick from your creations</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {userImages?.images && userImages.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 p-1">
                {userImages.images.map((image: any) => (
                  <button
                    key={image.id}
                    onClick={() => handleSelectFromCreations(image.imageUrl)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
                    data-testid={`creation-picker-${image.id}`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.prompt || "Creation"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Select</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Images className="h-12 w-12 mb-2 opacity-50" />
                <p>No creations yet</p>
                <p className="text-sm">Generate some images first!</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
