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
  ChevronRight,
  Sun,
  Moon,
  Compass,
  Coins,
  Layers
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
import { useAuth } from "@/hooks/use-auth";

function useTheme() {
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

  return { theme, toggleTheme };
}

export function ThemeToggleIcon() {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 backdrop-blur-sm cursor-pointer hover:bg-zinc-700 transition-colors border border-white/10"
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? <Sun className="h-4 w-4 text-zinc-300" /> : <Moon className="h-4 w-4 text-zinc-300" />}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom"><p>{theme === "light" ? "Switch to dark mode" : "Switch to light mode"}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CreditsIconProps {
  credits: number;
  creditsPercentage: number;
}

function CreditsIcon({ credits, creditsPercentage }: CreditsIconProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/billing">
            <div className="relative h-10 w-10 flex items-center justify-center cursor-pointer rounded-full bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700 transition-colors border border-white/10" data-testid="button-credits">
              <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-600"
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
              <Coins className="absolute h-3 w-3 text-primary" />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom"><p>{credits} credits - Click to get more</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TopRightIcons({ credits, creditsPercentage }: { credits: number; creditsPercentage: number }) {
  return (
    <div className="fixed top-4 right-4 z-40 hidden md:flex items-center gap-2">
      <CreditsIcon credits={credits} creditsPercentage={creditsPercentage} />
      <ThemeToggleIcon />
    </div>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const { logout } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.getStats,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const credits = stats?.credits ?? 0;
  const maxCredits = 100;
  const creditsPercentage = Math.min(Math.round((credits / maxCredits) * 100), 100);

  const totalCreations = stats ? (stats.images + stats.mockups + stats.bgRemoved) : 0;

  const navigation = [
    { name: "Home", shortName: "Home", icon: Home, href: "/discover", count: null },
    { name: "Discover", shortName: "Discover", icon: Compass, href: "/discover", badge: "New" },
    { name: "Image Generator", shortName: "Image", icon: ImageIcon, href: "/image-gen", badge: "5 agents" },
    { name: "Mockup Generator", shortName: "Mockup", icon: Shirt, href: "/mockup", badge: "New" },
    { name: "Background Remover", shortName: "BG", icon: Scissors, href: "/bg-remover", count: null },
    { name: "Mood Boards", shortName: "Boards", icon: Layers, href: "/mood-boards", count: null },
    { name: "My Creations", shortName: "Creations", icon: Folder, href: "/my-creations", count: totalCreations > 0 ? totalCreations.toString() : null, dataTutorial: "my-creations-link" },
  ];

  const account = [
    { name: "Settings", shortName: "Settings", icon: Settings, href: "/settings" },
  ];

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-background border-t border-border z-50 flex items-center justify-around px-2 pb-safe">
      <Link href="/discover">
        <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/discover" ? "text-primary" : "text-muted-foreground")}>
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
          <Settings className="h-6 w-6" />
          <span className="text-[10px] mt-1">Settings</span>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      <MobileNav />
      <aside 
        className={cn(
          "relative h-screen border-r border-white/10 bg-black/60 backdrop-blur-xl transition-all duration-300 ease-in-out flex-col z-40 hidden md:flex",
          collapsed ? "w-[80px]" : "w-[280px]",
          className
        )}
      >
      {/* Header spacing */}
      <div className={cn("h-4", collapsed ? "" : "")} />

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
                  data-tutorial={(item as any).dataTutorial}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-medium transition-all cursor-pointer group relative select-none mx-auto w-[64px]",
                    isActive 
                      ? "text-white bg-white/15" 
                      : "text-white/50 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-7 w-7 flex-shrink-0 transition-all duration-200 group-hover:scale-110", 
                      isActive ? "text-white" : "text-white/50 group-hover:text-white"
                    )} 
                  />
                  <span className={cn(
                    "text-[10px] font-medium truncate max-w-full",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
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
                        data-tutorial={(item as any).dataTutorial}
                        className={cn(
                          "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group relative select-none px-3.5 py-3 text-sm",
                          isActive 
                            ? "text-white" 
                            : "text-white/50 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full" />
                        )}
                        
                        <item.icon 
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110", 
                            isActive ? "text-white" : "text-white/50 group-hover:text-white"
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
          {account.map((item) => {
            const isActive = location === item.href;
            return collapsed ? (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-medium transition-all cursor-pointer group select-none mx-auto w-[64px]",
                  isActive 
                    ? "text-white bg-white/15" 
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                )}>
                  <item.icon className={cn(
                    "h-7 w-7 flex-shrink-0 transition-all duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
                  )} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
                  )}>
                    {item.shortName}
                  </span>
                </div>
              </Link>
            ) : (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group select-none px-3.5 py-3 text-sm relative",
                  isActive 
                    ? "text-white" 
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                )}>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
                  )} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}

          {collapsed ? (
            <div 
              onClick={logout}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer group select-none mx-auto w-[64px]"
              data-testid="button-logout"
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
                className="h-7 w-7 flex-shrink-0 transition-all duration-200 group-hover:scale-110"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              <span className="text-[10px] font-medium">Logout</span>
            </div>
          ) : (
            <div 
              onClick={logout}
              className="flex items-center gap-3 rounded-lg font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer group select-none px-3.5 py-3 text-sm"
              data-testid="button-logout"
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

    </aside>
      
      <TopRightIcons credits={credits} creditsPercentage={creditsPercentage} />
    </>
  );
}
