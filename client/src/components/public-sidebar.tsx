import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Image as ImageIcon, 
  Shirt, 
  Scissors, 
  Folder, 
  Star, 
  HelpCircle,
  ChevronRight,
  Sun,
  Moon,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface PublicSidebarProps {
  className?: string;
}

export function PublicSidebar({ className }: PublicSidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  const navigation: Array<{ name: string; shortName: string; icon: typeof Home; href: string; count?: string | null; badge?: string }> = [
    { name: "Home", shortName: "Home", icon: Home, href: "/" },
    { name: "Discover", shortName: "Discover", icon: Compass, href: "/discover", badge: "New" },
    { name: "Image Generator", shortName: "Image", icon: ImageIcon, href: "/image-gen", badge: "5 agents" },
    { name: "Mockup Generator", shortName: "Mockup", icon: Shirt, href: "/mockup", badge: "New" },
    { name: "Background Remover", shortName: "BG", icon: Scissors, href: "/bg-remover" },
    { name: "My Creations", shortName: "Creations", icon: Folder, href: "/my-creations" },
  ];

  const extras = [
    { name: "Affiliate Program", shortName: "Affiliate", icon: Star, href: "/affiliate" },
    { name: "Help & Support", shortName: "Help", icon: HelpCircle, href: "/help" },
  ];

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
      <Link href="/login">
        <div className="flex flex-col items-center justify-center p-2 cursor-pointer text-primary">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#B94E30] to-[#E3B436] flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">Go</span>
          </div>
          <span className="text-[10px] mt-1">Login</span>
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
      <div className={cn("flex items-center gap-3 px-4 py-6 h-[88px]", collapsed ? "justify-center px-2" : "")}>
        <div className="h-10 w-10 min-w-[40px] rounded-xl bg-gradient-to-br from-[#B94E30] to-[#E3B436] flex items-center justify-center shadow-lg shadow-[#B94E30]/20">
          <div className="h-5 w-5 bg-white/20 rounded-md backdrop-blur-sm" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden animate-fade-in whitespace-nowrap">
            <span className="font-bold text-sidebar-foreground text-lg">AI Studio</span>
            <span className="text-[11px] text-muted-foreground font-medium">Create with AI</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3">
        {!collapsed && <div className="mb-2 px-3 text-[11px] font-bold text-muted-foreground tracking-widest animate-fade-in">EXPLORE</div>}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const isDiscover = item.name === "Discover";
            
            return collapsed ? (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-medium transition-all cursor-pointer group relative select-none mx-auto w-[64px]",
                    isActive 
                      ? "text-primary bg-primary/15" 
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-7 w-7 flex-shrink-0 transition-all duration-200 group-hover:scale-110", 
                      isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    )} 
                  />
                  <span className={cn(
                    "text-[10px] font-medium truncate max-w-full",
                    isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-white"
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

        <div className="my-6 mx-2 h-px bg-sidebar-border/60" />

        <nav className="space-y-1">
          {extras.map((item) => (
            collapsed ? (
              <Link key={item.name} href={item.href}>
                <div className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white transition-all cursor-pointer group select-none mx-auto w-[64px]">
                  <item.icon className="h-7 w-7 text-sidebar-foreground/50 flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  <span className="text-[10px] font-medium text-sidebar-foreground/50 group-hover:text-white">
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
        </nav>
      </div>

      <div className={cn("pt-4 mt-auto px-3 pb-6", collapsed ? "flex flex-col items-center gap-3" : "")}>
        {!collapsed && (
          <Link href="/login">
            <Button className="w-full mb-4 bg-gradient-to-r from-[#B94E30] to-[#E3B436] hover:from-[#A34329] hover:to-[#D4A52F] text-white font-semibold">
              Get Started
            </Button>
          </Link>
        )}
        {collapsed && (
          <Link href="/login">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#B94E30] to-[#E3B436] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </Link>
        )}
        <ThemeToggle collapsed={collapsed} />
      </div>
    </aside>
    </>
  );
}
