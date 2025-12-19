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
  ChevronRight
} from "lucide-react";

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
  isLoading
}: { 
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
}) {
  return (
    <aside className="w-72 border-l border-white/10 bg-background/50 flex flex-col h-full" data-testid="sidebar-chat-history">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Chat History</h2>
        </div>
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
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors group",
                  "hover:bg-white/5",
                  currentSessionId === session.id && "bg-primary/10 border border-primary/20"
                )}
                data-testid={`session-item-${session.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate flex-1">
                    {session.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
              </button>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
          imageUrl: msg.imageId ? undefined : undefined,
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
        } else {
          setMessages(loadedMessages);
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
    if (user && !sessionId) {
      const chatName = `Creative Session ${new Date().toLocaleDateString()}`;
      createSessionMutation.mutate(chatName);
    }
    
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

  const addAgentMessage = (content: string, options?: OptionChip[], imageUrl?: string, enhancedPrompt?: string, imageId?: string) => {
    const agentMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      options,
      imageUrl,
      enhancedPrompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
    saveMessageMutation.mutate({ role: 'assistant', content, options, imageId, enhancedPrompt });
    return agentMessage;
  };

  const processUserInput = async (content: string) => {
    addUserMessage(content);
    setIsLoading(true);

    if (!sessionId) {
      addAgentMessage(
        "Setting up your session... Please try again in a moment.",
        INITIAL_OPTIONS
      );
      setIsLoading(false);
      return;
    }

    const isFirstMessage = stage === 'initial' && !selectedSubject;
    
    if (isFirstMessage) {
      apiRequest("POST", `/api/chat/sessions/${sessionId}/generate-name`, { firstMessage: content })
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
      
      const res = await apiRequest("POST", `/api/chat/sessions/${sessionId}/chat`, {
        messages: chatMessages,
        context: { subject: selectedSubject, style: selectedStyle, mood: selectedMood }
      });
      const aiResponse = await res.json();
      
      if (aiResponse.shouldGenerateImage && aiResponse.imagePrompt) {
        addAgentMessage("Creating your image...");
        
        try {
          const result = await generateImageMutation.mutateAsync(aiResponse.imagePrompt);
          
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
    if (input.trim() && !isLoading) {
      processUserInput(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
            {projectId && (
              <Link href={`/projects/${projectId}`}>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="button-view-project">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">{projectName || "View Project"}</span>
                </Button>
              </Link>
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
          <div className="max-w-3xl mx-auto flex gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message or select an option above..."
              disabled={isLoading}
              className="min-h-[48px] max-h-[120px] resize-none bg-white/5 border-white/10"
              rows={1}
              data-testid="input-chat-message"
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
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
      </main>
      
      {showHistory && (
        <ChatHistorySidebar
          sessions={sessionsData?.sessions || []}
          currentSessionId={sessionId}
          onSelectSession={loadSession}
          isLoading={sessionsLoading}
        />
      )}
    </div>
  );
}
