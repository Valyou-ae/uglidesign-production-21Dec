import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Image as ImageIcon, 
  Shirt, 
  Scissors, 
  Sun,
  Moon,
  Compass,
  User,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPopup } from "@/components/login-popup";

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
        className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 cursor-pointer mx-auto hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
      >
        {theme === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openLoginPopup } = useLoginPopup();

  const navigation: Array<{ name: string; shortName: string; icon: typeof Home; href: string; count?: string | null; badge?: string }> = [
    { name: "Home", shortName: "Home", icon: Home, href: "/" },
    { name: "Discover", shortName: "Discover", icon: Compass, href: "/discover", badge: "New" },
    { name: "Image Generator", shortName: "Image", icon: ImageIcon, href: "/image-gen", badge: "5 agents" },
    { name: "Mockup Generator", shortName: "Mockup", icon: Shirt, href: "/mockup", badge: "New" },
    { name: "Background Remover", shortName: "BG", icon: Scissors, href: "/bg-remover" },
  ];

  const accountNav = [
    { name: "Settings", shortName: "Settings", icon: Settings, href: "/settings" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
           <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center shadow-lg shadow-[#ed5387]/30 border-4 border-background">
             <ImageIcon className="h-6 w-6 text-white" />
           </div>
           <span className="text-[10px] mt-1 font-medium text-foreground">Create</span>
        </div>
      </Link>
      <Link href="/settings">
        <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/settings" ? "text-primary" : "text-muted-foreground")}>
          <Settings className="h-6 w-6" />
          <span className="text-[10px] mt-1">Settings</span>
        </div>
      </Link>
      <button
        onClick={() => openLoginPopup()}
        className="flex flex-col items-center justify-center p-2 cursor-pointer text-primary"
        data-testid="button-mobile-login"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">Go</span>
        </div>
        <span className="text-[10px] mt-1">Login</span>
      </button>
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
      <div className="h-4" />

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
                              ? "bg-gradient-to-r from-[#ed5387] to-[#9C27B0] text-white"
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
      </div>

      <div className="my-4 mx-2 h-px bg-sidebar-border/60" />
      
      {!collapsed && <div className="mb-2 px-6 text-[11px] font-bold text-muted-foreground tracking-widest">ACCOUNT</div>}
      <nav className="space-y-1 px-3" data-testid="nav-account">
        {isLoading ? (
          collapsed ? (
            <div className="flex flex-col items-center justify-center gap-1 py-2 px-2 mx-auto w-[52px]">
              <div className="h-5 w-5 rounded-full bg-zinc-700/50 animate-pulse" />
              <div className="h-2 w-8 bg-zinc-700/50 rounded animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3.5 py-3">
              <div className="h-5 w-5 rounded-full bg-zinc-700/50 animate-pulse" />
              <div className="h-3 w-16 bg-zinc-700/50 rounded animate-pulse" />
            </div>
          )
        ) : isAuthenticated && user ? (
          <Link href="/profile" data-testid="link-user-profile">
            {collapsed ? (
              <div className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium transition-all cursor-pointer group select-none mx-auto w-[52px]",
                location === "/profile" 
                  ? "text-white bg-white/15" 
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              )}>
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.displayName || "User"} 
                    className="h-5 w-5 rounded-full object-cover border border-white/30 group-hover:border-white/60 transition-all"
                    data-testid="img-user-avatar-sidebar"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center border border-white/30 group-hover:border-white/60 transition-all">
                    <span className="text-[8px] font-semibold text-white/80">
                      {getInitials(user.displayName || user.email || "U")}
                    </span>
                  </div>
                )}
                <span className={cn(
                  "text-[9px] font-medium",
                  location === "/profile" ? "text-white" : "text-white/50 group-hover:text-white"
                )}>
                  Profile
                </span>
              </div>
            ) : (
              <div className={cn(
                "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group select-none px-3.5 py-3 text-sm relative",
                location === "/profile" 
                  ? "text-white" 
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              )}>
                {location === "/profile" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full" />
                )}
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.displayName || "User"} 
                    className="h-5 w-5 rounded-full object-cover border border-white/30 group-hover:border-white/60 transition-all"
                    data-testid="img-user-avatar-sidebar"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center border border-white/30 group-hover:border-white/60 transition-all">
                    <span className="text-[8px] font-semibold text-white/80">
                      {getInitials(user.displayName || user.email || "U")}
                    </span>
                  </div>
                )}
                <span>Profile</span>
              </div>
            )}
          </Link>
        ) : (
          collapsed ? (
            <button
              onClick={() => openLoginPopup()}
              className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer group select-none mx-auto w-[52px]"
              data-testid="button-login-sidebar"
            >
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="h-3 w-3 text-white" />
              </div>
              <span className="text-[9px] font-medium">Login</span>
            </button>
          ) : (
            <button
              onClick={() => openLoginPopup()}
              className="flex items-center gap-3 rounded-lg font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer group select-none px-3.5 py-3 text-sm w-full"
              data-testid="button-login-sidebar"
            >
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="h-3 w-3 text-white" />
              </div>
              <span>Sign In</span>
            </button>
          )
        )}
        {isAuthenticated && accountNav.map((item) => {
              const isActive = location === item.href;
              return collapsed ? (
                <Link key={item.name} href={item.href} data-testid={`link-${item.shortName.toLowerCase()}`}>
                  <div className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium transition-all cursor-pointer group relative select-none mx-auto w-[52px]",
                    isActive 
                      ? "text-white bg-white/15" 
                      : "text-white/50 hover:bg-white/10 hover:text-white"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110", 
                      isActive ? "text-white" : "text-white/50 group-hover:text-white"
                    )} />
                    <span className={cn(
                      "text-[9px] font-medium truncate max-w-full",
                      isActive ? "text-white" : "text-white/50 group-hover:text-white"
                    )}>
                      {item.shortName}
                    </span>
                  </div>
                </Link>
              ) : (
                <Link key={item.name} href={item.href} data-testid={`link-${item.shortName.toLowerCase()}`}>
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
                    <span className="flex-1 truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
      </nav>

      {/* Theme Toggle at bottom */}
      <div className={cn("mt-auto px-3 pb-6", collapsed ? "pt-2 flex flex-col items-center" : "pt-4")}>
        {collapsed ? (
          <div className="flex flex-col items-center justify-center py-2 px-2 mx-auto w-[52px]">
            <ThemeToggle collapsed={collapsed} />
          </div>
        ) : (
          <ThemeToggle collapsed={collapsed} />
        )}
      </div>
    </aside>
    </>
  );
}
