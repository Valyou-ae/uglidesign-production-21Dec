import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Image as ImageIcon, 
  Shirt, 
  Scissors, 
  Folder, 
  Star, 
  Settings, 
  CreditCard, 
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  // Mock theme toggle for now, usually this would be from next-themes or similar
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  if (collapsed) {
    return (
      <div 
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 cursor-pointer mx-auto hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
      >
        {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </div>
    );
  }

  return (
    <div 
      onClick={toggleTheme}
      className="flex h-9 w-full items-center rounded-full bg-zinc-200 dark:bg-zinc-800 p-1 cursor-pointer relative"
    >
      <div 
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-zinc-600 shadow-sm transition-all duration-300 ease-out",
          theme === "light" ? "left-1" : "left-[calc(50%)]"
        )}
      />
      <div className="flex-1 flex justify-center items-center z-10 text-zinc-600 dark:text-zinc-400">
        <Sun className="h-4 w-4" />
      </div>
      <div className="flex-1 flex justify-center items-center z-10 text-zinc-600 dark:text-zinc-400">
        <Moon className="h-4 w-4" />
      </div>
    </div>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: "Home", icon: Home, href: "/", count: null },
    { name: "Discover", icon: Compass, href: "/discover", badge: "New" },
    { name: "Image Generator", icon: ImageIcon, href: "/image-gen", badge: "5 agents" },
    { name: "Mockup Generator", icon: Shirt, href: "/mockup", badge: "New" },
    { name: "Background Remover", icon: Scissors, href: "/bg-remover", count: null },
    { name: "My Creations", icon: Star, href: "/my-creations", count: "32" },
  ];

  const account = [
    { name: "Settings", icon: Settings, href: "/settings" },
    { name: "Billing", icon: CreditCard, href: "/billing" },
    { name: "Help & Support", icon: HelpCircle, href: "/help" },
  ];

  const handleLogout = () => {
    // Mock logout
    window.location.href = "/login";
  };

  return (
    <aside 
      className={cn(
        "relative h-screen border-r bg-sidebar transition-all duration-300 ease-in-out flex flex-col z-40",
        collapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
    >
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent text-muted-foreground z-50 hidden lg:flex"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Header / Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-6 h-[88px]", collapsed ? "justify-center px-2" : "")}>
        <div className="h-10 w-10 min-w-[40px] rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <div className="h-5 w-5 bg-white/20 rounded-md backdrop-blur-sm" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden animate-fade-in whitespace-nowrap">
            <span className="font-bold text-sidebar-foreground text-lg">AI Studio</span>
            <span className="text-[11px] text-muted-foreground font-medium">Pro Plan</span>
          </div>
        )}
      </div>

      {/* User Profile */}
      <Link href="/profile">
        <div className={cn(
          "mx-3 mb-6 p-2 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent transition-colors group overflow-hidden",
          collapsed ? "justify-center bg-transparent" : "bg-sidebar-accent/50 border border-sidebar-border/50"
        )}>
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" />
            <Avatar className="h-9 w-9 border-2 border-sidebar relative">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden animate-fade-in">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john@example.com</p>
            </div>
          )}
          {!collapsed && <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />}
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3">
        {!collapsed && <div className="mb-2 px-3 text-[11px] font-bold text-muted-foreground tracking-widest animate-fade-in">WORKSPACE</div>}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const isDiscover = item.name === "Discover";
            
            return (
              <TooltipProvider key={item.name} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group relative select-none",
                          collapsed ? "justify-center w-10 h-10 mx-auto p-0" : "px-3.5 py-3 text-sm",
                          isActive 
                            ? "text-primary bg-primary/5" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          // Special styling for Discover when active
                          isActive && isDiscover && "bg-gradient-to-r from-[#7C3AED]/15 to-[#EC4899]/15 text-[#FAFAFA] border-l-[3px] border-l-transparent border-image-[linear-gradient(180deg,#7C3AED,#EC4899)] border-image-slice-1"
                        )}
                        style={isActive && isDiscover ? { borderImageSource: 'linear-gradient(180deg, #7C3AED, #EC4899)', borderImageSlice: 1, borderLeftWidth: '3px', borderStyle: 'solid', borderTop: 'none', borderRight: 'none', borderBottom: 'none' } : {}}
                      >
                        {isActive && !collapsed && !isDiscover && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
                        )}
                        
                        <item.icon 
                          className={cn(
                            "h-5 w-5 flex-shrink-0", 
                            isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
                            isDiscover && isActive && "text-[#7C3AED]" // Fallback or gradient if possible via style
                          )} 
                          style={isDiscover && isActive ? { color: '#7C3AED' } : {}}
                        />
                        
                        {!collapsed && (
                          <>
                            <span className={cn("flex-1 truncate", isDiscover && isActive && "font-semibold")}>{item.name}</span>
                            {item.badge && (
                              <span className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                                isDiscover 
                                  ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white"
                                  : "bg-primary/10 text-primary"
                              )}>
                                {item.badge}
                              </span>
                            )}
                            {item.count && (
                              <span className="text-xs text-muted-foreground group-hover:text-sidebar-foreground">
                                {item.count}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {collapsed && <TooltipContent side="right"><p>{item.name}</p></TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>

        <Separator className="my-6 bg-sidebar-border/60" />

        {!collapsed && <div className="mb-2 px-3 text-[11px] font-bold text-muted-foreground tracking-widest animate-fade-in">ACCOUNT</div>}
        <nav className="space-y-1">
          {account.map((item) => (
            <TooltipProvider key={item.name} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 rounded-lg font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer select-none",
                      collapsed ? "justify-center w-10 h-10 mx-auto p-0" : "px-3.5 py-3 text-sm"
                    )}>
                      <item.icon className="h-5 w-5 text-sidebar-foreground/50 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right"><p>{item.name}</p></TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          ))}

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center gap-3 rounded-lg font-medium text-red-500/70 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 transition-colors cursor-pointer select-none",
                    collapsed ? "justify-center w-10 h-10 mx-auto p-0" : "px-3.5 py-3 text-sm"
                  )}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-5 w-5 flex-shrink-0"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                  {!collapsed && <span>Logout</span>}
                </div>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right"><p>Logout</p></TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </nav>
      </div>

      {/* Footer */}
      <div className={cn("pt-4 mt-auto px-3 pb-6", collapsed ? "flex flex-col items-center" : "")}>
        {!collapsed ? (
          <div className="flex items-center gap-4 mb-4 px-2 animate-fade-in">
            <div className="relative h-12 w-12 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-sidebar-accent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-primary drop-shadow-md"
                  strokeDasharray="76, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-sidebar-foreground">76%</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-sidebar-foreground">1.5k</span>
                <span className="text-[10px] text-muted-foreground">/ 2k</span>
              </div>
              <Button size="sm" className="h-7 text-[10px] rounded-full w-full mt-1 bg-primary hover:bg-primary/90 text-white border-0">
                Upgrade
              </Button>
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative h-10 w-10 mb-4 flex items-center justify-center cursor-pointer">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-sidebar-accent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-primary"
                      strokeDasharray="76, 100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[9px] font-bold text-sidebar-foreground">76%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right"><p>1,523 / 2,000 credits</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <ThemeToggle collapsed={collapsed} />
      </div>
    </aside>
  );
}
