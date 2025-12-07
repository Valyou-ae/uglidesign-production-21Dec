import { Bell, Search, CheckCircle2, Info, Sparkles, Zap } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Image Generation Complete",
    description: "Your 'Cyberpunk City' generation is ready.",
    time: "2m ago",
    read: false,
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: 2,
    title: "New Feature Available",
    description: "Try out the new Mockup Generator tool!",
    time: "1h ago",
    read: false,
    icon: Info,
    color: "text-[#664D3F]",
    bg: "bg-[#664D3F]/10",
  },
  {
    id: 3,
    title: "Subscription Renewed",
    description: "Your Pro plan has been successfully renewed.",
    time: "1d ago",
    read: true,
    icon: CheckCircle2,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
];

export function TopBar() {
  const { user } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  
  const displayName = user?.displayName || user?.firstName || user?.username || "Creator";
  
  return (
    <header className="sticky top-0 z-30 flex h-auto min-h-[80px] md:h-20 items-center justify-between bg-background/80 backdrop-blur-md px-4 md:px-8 lg:px-10 border-b border-transparent transition-all py-4 md:py-0">
      <div className="flex flex-col justify-center animate-fade-in mr-4">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground leading-tight">
          {getGreeting()}, {displayName} <span className="animate-wave inline-block origin-bottom-right">👋</span>
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5 md:mt-0">
          Ready to create something amazing?
        </p>
      </div>

      <div className="flex items-center gap-3 md:gap-6 shrink-0">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative cursor-pointer hover:bg-sidebar-accent p-2 rounded-full transition-colors outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="font-semibold text-sm">Notifications</h4>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                Mark all as read
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="flex flex-col">
                {NOTIFICATIONS.map((notification) => (
                  <button
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                      !notification.read && "bg-muted/20"
                    )}
                  >
                    <div className={cn("mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", notification.bg)}>
                      <notification.icon className={cn("h-4 w-4", notification.color)} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={cn("text-sm font-medium leading-none", !notification.read && "font-semibold")}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground pt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs justify-center h-8">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/billing">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer" data-testid="credit-display">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">1,523</span>
                <span className="text-xs text-muted-foreground hidden lg:inline">credits</span>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>1,523 of 2,000 credits remaining</p>
          </TooltipContent>
        </Tooltip>

        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search projects, prompts..." 
            className="w-[320px] h-11 pl-10 pr-12 rounded-full bg-sidebar-accent/50 border-border/50 focus:bg-background transition-all shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-medium text-muted-foreground shadow-sm">
            <span className="text-xs">⌘</span> K
          </div>
        </div>
      </div>
    </header>
  );
}
