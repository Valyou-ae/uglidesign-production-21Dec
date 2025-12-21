import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  Image as ImageIcon, 
  Shirt, 
  Scissors, 
  Star, 
  Settings, 
  ChevronRight,
  Sun,
  Moon,
  Compass,
  Coins,
  Layers,
  User,
  LogIn,
  CreditCard,
  Sparkles,
  Palette,
  MessageCircle
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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const { user, isLoading, logout } = useAuth();
  const { openLoginPopup } = useLoginPopup();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.getStats,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!user, // Only fetch stats when user is authenticated
  });

  const credits = stats?.credits ?? 0;
  const maxCredits = 100;
  const creditsPercentage = Math.min(Math.round((credits / maxCredits) * 100), 100);

  const totalCreations = stats ? (stats.images + stats.mockups + stats.bgRemoved) : 0;

  type NavItem = {
    name: string;
    shortName: string;
    icon: typeof Home;
    href: string;
    count?: string | null;
    badge?: string;
    dataTutorial?: string;
  };

  const publicNavigation: NavItem[] = [
    { name: "Home", shortName: "Home", icon: Home, href: "/" },
    { name: "Discover", shortName: "Discover", icon: Compass, href: "/discover", badge: "New" },
    { name: "Image Generator", shortName: "Image", icon: ImageIcon, href: "/image-gen", badge: "5 agents" },
    { name: "Style Transfer", shortName: "Style", icon: Palette, href: "/style-transfer", badge: "New" },
    { name: "Mockup Generator", shortName: "Mockup", icon: Shirt, href: "/mockup", badge: "New" },
    { name: "Background Remover", shortName: "BG", icon: Scissors, href: "/bg-remover" },
  ];

  const privateNavigation: NavItem[] = [
    { name: "Chat Studio", shortName: "Chat", icon: MessageCircle, href: "/chat-studio", badge: "New" },
    { name: "My Creations", shortName: "Creations", icon: Layers, href: "/my-creations", count: totalCreations > 0 ? totalCreations.toString() : undefined, dataTutorial: "my-creations-link" },
  ];

  const navigation: NavItem[] = user ? [...publicNavigation, ...privateNavigation] : publicNavigation;

  const account = [
    { name: "Settings", shortName: "Settings", icon: Settings, href: "/settings" },
  ];

  const guestNavigation = [
    { name: "Pricing", shortName: "Pricing", icon: Sparkles, href: "/pricing" },
  ];

  // Mobile Bottom Navigation - shows different items based on auth state
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
      {user ? (
        <>
          <Link href="/my-creations">
            <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/my-creations" ? "text-primary" : "text-muted-foreground")}>
              <Layers className="h-6 w-6" />
              <span className="text-[10px] mt-1">Creations</span>
            </div>
          </Link>
          <Link href="/settings">
            <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/settings" ? "text-primary" : "text-muted-foreground")}>
              <Settings className="h-6 w-6" />
              <span className="text-[10px] mt-1">Settings</span>
            </div>
          </Link>
        </>
      ) : (
        <>
          <Link href="/mockup">
            <div className={cn("flex flex-col items-center justify-center p-2 cursor-pointer", location === "/mockup" ? "text-primary" : "text-muted-foreground")}>
              <Shirt className="h-6 w-6" />
              <span className="text-[10px] mt-1">Mockup</span>
            </div>
          </Link>
          <div 
            onClick={() => openLoginPopup()}
            className="flex flex-col items-center justify-center p-2 cursor-pointer text-muted-foreground hover:text-primary"
            data-testid="button-login-mobile"
          >
            <LogIn className="h-6 w-6" />
            <span className="text-[10px] mt-1">Login</span>
          </div>
        </>
      )}
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

        {/* Account section - show for all users */}
        <Separator className="my-6 bg-sidebar-border/60" />

        {user && !collapsed && <div className="mb-2 px-3 text-[11px] font-bold text-muted-foreground tracking-widest animate-fade-in">ACCOUNT</div>}
        
        {(user || isLoading) ? (
          <>
            <nav className="space-y-1">
              {isLoading ? (
                collapsed ? (
                  <div className="flex flex-col items-center justify-center gap-1 py-2 px-2 mx-auto w-[52px]">
                    <div className="h-5 w-5 rounded-full bg-zinc-700/50 animate-pulse" />
                    <div className="h-2 w-8 bg-zinc-700/50 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <div className="h-7 w-7 rounded-full bg-zinc-700/50 animate-pulse" />
                    <div className="h-3 w-16 bg-zinc-700/50 rounded animate-pulse" />
                  </div>
                )
              ) : user ? (
                <Link href="/profile">
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
              ) : null}
              
              {/* Credits/Token display - below Profile */}
              {user && (collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/billing">
                    <div className="flex flex-col items-center justify-center py-2 px-2 mx-auto w-[52px] cursor-pointer">
                      <div className="relative h-6 w-6 flex items-center justify-center">
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
                        <Coins className="absolute h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-[9px] font-medium text-white/50 mt-1">{credits}</span>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right"><p>{credits} credits available</p></TooltipContent>
              </Tooltip>
              </TooltipProvider>
              ) : (
                <Link href="/billing">
                  <div className="flex items-center gap-3 rounded-lg font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer group select-none px-3.5 py-3 text-sm">
                    <div className="relative h-5 w-5 flex items-center justify-center">
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
                      <Coins className="absolute h-2 w-2 text-primary" />
                    </div>
                    <span>{credits} credits</span>
                  </div>
                </Link>
              ))}
              
              {user && account.map((item) => {
            const isActive = location === item.href;
            return collapsed ? (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium transition-all cursor-pointer group select-none mx-auto w-[52px]",
                  isActive 
                    ? "text-white bg-white/15" 
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
                  )} />
                  <span className={cn(
                    "text-[9px] font-medium",
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
            </nav>
          </>
        ) : null}

        {/* Guest navigation - Pricing for non-logged-in users */}
        {!user && !isLoading && (
          <nav className="space-y-1">
            {guestNavigation.map((item) => {
              const isActive = location === item.href;
              return collapsed ? (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium transition-all cursor-pointer group select-none mx-auto w-[52px]",
                    isActive 
                      ? "text-white bg-white/15" 
                      : "text-white/50 hover:bg-white/10 hover:text-white"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110",
                      isActive ? "text-white" : "text-white/50 group-hover:text-white"
                    )} />
                    <span className={cn(
                      "text-[9px] font-medium",
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
          </nav>
        )}

        {/* Theme Toggle - inside account section for collapsed state (logged-in users only) */}
        {user && collapsed && (
          <div className="flex flex-col items-center justify-center py-2 px-2 mx-auto w-[52px]">
            <ThemeToggle collapsed={collapsed} />
          </div>
        )}
      </div>

      {/* Footer - Theme Toggle for logged-in, Login + Theme for non-logged-in */}
      <div className={cn("mt-auto pb-6", collapsed ? "px-3 flex flex-col items-center pt-2 space-y-2" : "px-3 pt-4 space-y-2")}>
        {/* Login button for non-logged-in users - at bottom */}
        {!user && !isLoading && (
          collapsed ? (
            <div
              onClick={() => openLoginPopup()}
              className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium transition-all cursor-pointer group select-none mx-auto w-[52px] text-white/50 hover:bg-white/10 hover:text-white"
              data-testid="button-login-sidebar"
            >
              <LogIn className="h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 text-white/50 group-hover:text-white" />
              <span className="text-[9px] font-medium text-white/50 group-hover:text-white">
                Login
              </span>
            </div>
          ) : (
            <div
              onClick={() => openLoginPopup()}
              className="flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group select-none px-3.5 py-3 text-sm text-white/50 hover:bg-white/10 hover:text-white"
              data-testid="button-login-sidebar"
            >
              <LogIn className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 text-white/50 group-hover:text-white" />
              <span>Login</span>
            </div>
          )
        )}
        {/* Theme toggle - for non-logged-in users at bottom, for logged-in expanded view */}
        {(!user || !collapsed) && <ThemeToggle collapsed={collapsed} />}
      </div>
    </aside>
    </>
  );
}
