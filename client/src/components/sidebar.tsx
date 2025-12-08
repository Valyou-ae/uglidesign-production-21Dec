import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Sun,
  Moon,
  Compass,
  Coins
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
import { userApi } from "@/lib/api";

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
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
  const [collapsed, setCollapsed] = useState(true);

  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.getStats,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const credits = stats?.credits ?? 0;
  const maxCredits = 100;
  const creditsPercentage = Math.min(Math.round((credits / maxCredits) * 100), 100);

  const navigation = [
    { name: "Home", shortName: "Home", icon: Home, href: "/", count: null },
    { name: "Discover", shortName: "Discover", icon: Compass, href: "/discover", badge: "New" },
    { name: "Image Generator", shortName: "Image", icon: ImageIcon, href: "/image-gen", badge: "5 agents" },
    { name: "Mockup Generator", shortName: "Mockup", icon: Shirt, href: "/mockup", badge: "New" },
    { name: "Background Remover", shortName: "BG", icon: Scissors, href: "/bg-remover", count: null },
    { name: "My Creations", shortName: "Creations", icon: Folder, href: "/my-creations", count: "8" },
  ];

  const account = [
    { name: "Settings", shortName: "Settings", icon: Settings, href: "/settings" },
    { name: "Billing", shortName: "Billing", icon: CreditCard, href: "/billing" },
    { name: "Affiliate Program", shortName: "Affiliate", icon: Star, href: "/affiliate" },
    { name: "Help & Support", shortName: "Help", icon: HelpCircle, href: "/help" },
  ];

  const handleLogout = () => {
    // Mock logout
    window.location.href = "/login";
  };

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-background border-t border-border z-50 flex items-center justify-around px-2 pb-safe">
      <Link href="/">
        <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/" ? "text-primary" : "text-muted-foreground")}>
          <Home className="h-6 w-6" />
          <span className="text-[10px] mt-1">Home</span>
        </div>
      </Link>
      <Link href="/discover">
        <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/discover" ? "text-primary" : "text-muted-foreground")}>
          <Compass className="h-6 w-6" />
          <span className="text-[10px] mt-1">Discover</span>
        </div>
      </Link>
      <Link href="/image-gen">
        <div className="flex flex-col items-center justify-center -mt-6 cursor-pointer">
           <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#B94E30] to-[#E3B436] flex items-center justify-center shadow-lg shadow-[#B94E30]/30 border-4 border-background">
             <ImageIcon className="h-6 w-6 text-white" />
           </div>
           <span className="text-[10px] mt-1 font-medium text-foreground">Create</span>
        </div>
      </Link>
      <Link href="/my-creations">
        <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/my-creations" ? "text-primary" : "text-muted-foreground")}>
          <Folder className="h-6 w-6" />
          <span className="text-[10px] mt-1">Creations</span>
        </div>
      </Link>
      <Link href="/settings">
        <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/settings" ? "text-primary" : "text-muted-foreground")}>
          <Avatar className="h-6 w-6 border border-border">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <span className="text-[10px] mt-1">Profile</span>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      <MobileNav />
      <aside 
        className={cn(
          "relative h-screen border-r bg-sidebar transition-all duration-300 ease-in-out flex-col z-40 hidden md:flex",
          collapsed ? "w-[80px]" : "w-[280px]",
          className
        )}
      >
      {/* Header / Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-6 h-[88px]", collapsed ? "justify-center px-2" : "")}>
        <div className="h-10 w-10 min-w-[40px] rounded-xl bg-gradient-to-br from-[#B94E30] to-[#E3B436] flex items-center justify-center shadow-lg shadow-[#B94E30]/20">
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
            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#B94E30] to-[#E3B436] rounded-full opacity-70 group-hover:opacity-100 transition-opacity" />
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
            
            return collapsed ? (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl font-medium transition-all cursor-pointer group relative select-none mx-1",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-6 w-6 flex-shrink-0 transition-transform duration-200 group-hover:scale-125", 
                      isActive ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                    )} 
                  />
                  <span className={cn(
                    "text-[9px] font-medium truncate max-w-full",
                    isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                  )}>
                    {item.shortName}
                  </span>
                </div>
              </Link>
            ) : (
              <TooltipProvider key={item.name} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group relative select-none px-3.5 py-3 text-sm",
                          isActive 
                            ? "text-primary bg-primary/5" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
                        )}
                        
                        <item.icon 
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110", 
                            isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                          )} 
                        />
                        
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                            isDiscover 
                              ? "bg-gradient-to-r from-[#B94E30] to-[#E3B436] text-white"
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
                      </div>
                    </Link>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>

        <Separator className="my-6 bg-sidebar-border/60" />

        {!collapsed && <div className="mb-2 px-3 text-[11px] font-bold text-muted-foreground tracking-widest animate-fade-in">ACCOUNT</div>}
        <nav className="space-y-1">
          {account.map((item) => (
            collapsed ? (
              <Link key={item.name} href={item.href}>
                <div className="flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all cursor-pointer group select-none mx-1">
                  <item.icon className="h-6 w-6 text-sidebar-foreground/60 flex-shrink-0 transition-transform duration-200 group-hover:scale-125 group-hover:text-sidebar-foreground" />
                  <span className="text-[9px] font-medium text-sidebar-foreground/50 group-hover:text-sidebar-foreground">
                    {item.shortName}
                  </span>
                </div>
              </Link>
            ) : (
              <Link key={item.name} href={item.href}>
                <div className="flex items-center gap-3 rounded-lg font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer group select-none px-3.5 py-3 text-sm">
                  <item.icon className="h-5 w-5 text-sidebar-foreground/50 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
              </Link>
            )
          ))}

          {collapsed ? (
            <div 
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl font-medium text-red-500/70 hover:bg-red-900/10 hover:text-red-500 transition-all cursor-pointer group select-none mx-1"
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
                className="h-6 w-6 flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              <span className="text-[9px] font-medium">Logout</span>
            </div>
          ) : (
            <div 
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg font-medium text-red-500/70 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 transition-colors cursor-pointer group select-none px-3.5 py-3 text-sm"
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
                className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              <span>Logout</span>
            </div>
          )}
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
                  strokeDasharray={`${creditsPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <Coins className="absolute h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-sidebar-foreground">{credits}</span>
                <span className="text-[10px] text-muted-foreground">credits</span>
              </div>
              <Link href="/billing">
                <Button size="sm" className="h-7 text-[10px] rounded-full w-full mt-1 bg-primary hover:bg-primary/90 text-white border-0">
                  Get More
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/billing">
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
                        strokeDasharray={`${creditsPercentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <Coins className="absolute h-3.5 w-3.5 text-primary" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{credits} credits available</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <ThemeToggle collapsed={collapsed} />
      </div>
    </aside>
    </>
  );
}
