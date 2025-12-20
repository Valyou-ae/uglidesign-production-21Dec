import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard,
  Users,
  Briefcase,
  Contact2,
  DollarSign,
  BarChart3,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  name: string;
  icon: React.ElementType;
  href: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { name: "Users", icon: Users, href: "/admin/users" },
  { 
    name: "CRM", 
    icon: Briefcase, 
    href: "/admin/crm",
    children: [
      { name: "Contacts", icon: Contact2, href: "/admin/crm/contacts" },
      { name: "Deals", icon: DollarSign, href: "/admin/crm/deals" },
    ]
  },
  { name: "Analytics", icon: BarChart3, href: "/admin/analytics" },
];

interface SidebarContentProps {
  collapsed: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavClick?: () => void;
}

function SidebarContent({ collapsed, onCollapsedChange, onNavClick }: SidebarContentProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(["CRM"]);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  };

  const displayName = user?.displayName || user?.firstName || user?.username || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {onCollapsedChange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute -right-3 top-8 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent text-muted-foreground z-50 hidden lg:flex"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      )}

      <div className={cn("flex items-center gap-3 px-4 py-6 h-[88px]", collapsed ? "justify-center px-2" : "")}>
        <div className="h-10 w-10 min-w-[40px] rounded-xl bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center shadow-lg shadow-[#ed5387]/20">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden animate-fade-in whitespace-nowrap">
            <span className="font-bold text-sidebar-foreground text-lg">Admin Panel</span>
            <span className="text-[11px] text-muted-foreground font-medium">Management</span>
          </div>
        )}
      </div>

      <div className={cn(
        "mx-3 mb-6 p-2 rounded-xl flex items-center gap-3 overflow-hidden",
        collapsed ? "justify-center bg-transparent" : "bg-sidebar-accent/50 border border-sidebar-border/50"
      )}>
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-[#ed5387] to-[#9C27B0] rounded-full opacity-70" />
          <Avatar className="h-9 w-9 border-2 border-sidebar relative">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden animate-fade-in">
            <p className="text-sm font-semibold truncate text-sidebar-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">Administrator</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3">
        {!collapsed && (
          <div className="mb-2 px-3 text-[11px] font-bold text-muted-foreground tracking-widest animate-fade-in">
            ADMINISTRATION
          </div>
        )}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openMenus.includes(item.name);
            
            if (hasChildren) {
              return (
                <Collapsible 
                  key={item.name} 
                  open={isOpen && !collapsed} 
                  onOpenChange={() => !collapsed && toggleMenu(item.name)}
                >
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CollapsibleTrigger asChild>
                          <div
                            className={cn(
                              "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group relative select-none",
                              collapsed ? "justify-center w-10 h-10 mx-auto p-0" : "px-3.5 py-3 text-sm",
                              active 
                                ? "text-primary bg-primary/5" 
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                          >
                            {active && !collapsed && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
                            )}
                            
                            <item.icon 
                              className={cn(
                                "h-5 w-5 flex-shrink-0", 
                                active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                              )} 
                            />
                            
                            {!collapsed && (
                              <>
                                <span className="flex-1 truncate">{item.name}</span>
                                <ChevronDown 
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    isOpen && "rotate-180"
                                  )} 
                                />
                              </>
                            )}
                          </div>
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      {collapsed && <TooltipContent side="right"><p>{item.name}</p></TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>
                  
                  <CollapsibleContent className="space-y-1 pt-1">
                    {item.children?.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <TooltipProvider key={child.name} delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={child.href} onClick={onNavClick}>
                                <div
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group relative select-none ml-4",
                                    collapsed ? "justify-center w-10 h-10 mx-auto p-0" : "px-3.5 py-2.5 text-sm",
                                    childActive 
                                      ? "text-primary bg-primary/5" 
                                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                  )}
                                  data-testid={`link-admin-${child.name.toLowerCase()}`}
                                >
                                  <child.icon 
                                    className={cn(
                                      "h-4 w-4 flex-shrink-0", 
                                      childActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                                    )} 
                                  />
                                  
                                  {!collapsed && <span className="truncate">{child.name}</span>}
                                </div>
                              </Link>
                            </TooltipTrigger>
                            {collapsed && <TooltipContent side="right"><p>{child.name}</p></TooltipContent>}
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }
            
            return (
              <TooltipProvider key={item.name} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href} onClick={onNavClick}>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg font-medium transition-all cursor-pointer group relative select-none",
                          collapsed ? "justify-center w-10 h-10 mx-auto p-0" : "px-3.5 py-3 text-sm",
                          active 
                            ? "text-primary bg-primary/5" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                        data-testid={`link-admin-${item.name.toLowerCase()}`}
                      >
                        {active && !collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
                        )}
                        
                        <item.icon 
                          className={cn(
                            "h-5 w-5 flex-shrink-0", 
                            active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                          )} 
                        />
                        
                        {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
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

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/home" onClick={onNavClick}>
                <div className={cn(
                  "flex items-center gap-3 rounded-lg font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer select-none",
                  collapsed ? "justify-center w-10 h-10 mx-auto p-0" : "px-3.5 py-3 text-sm"
                )}
                data-testid="link-back-to-app"
                >
                  <ArrowLeft className="h-5 w-5 text-sidebar-foreground/50 flex-shrink-0" />
                  {!collapsed && <span>Back to App</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right"><p>Back to App</p></TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className={cn("pt-4 mt-auto px-3 pb-6", collapsed ? "flex flex-col items-center" : "")}>
        <div className={cn(
          "p-4 rounded-xl bg-gradient-to-br from-[#ed5387]/10 to-[#9C27B0]/10 border border-[#ed5387]/20",
          collapsed && "p-2"
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Admin Mode</p>
                <p className="text-xs text-muted-foreground">Full access enabled</p>
              </div>
            </div>
          ) : (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ed5387] to-[#9C27B0] flex items-center justify-center cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Admin Mode Active</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <aside 
      className={cn(
        "relative h-screen border-r bg-sidebar transition-all duration-300 ease-in-out flex-col z-40 hidden md:flex",
        collapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
    >
      <SidebarContent 
        collapsed={collapsed} 
        onCollapsedChange={setCollapsed}
      />
    </aside>
  );
}

export function MobileAdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Admin Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent collapsed={false} onNavClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
