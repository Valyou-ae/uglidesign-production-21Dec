import { ReactNode } from "react";
import { AdminSidebar, MobileAdminSidebar } from "@/components/admin-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title = "Admin Dashboard", description }: AdminLayoutProps) {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.firstName || user?.username || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden" data-testid="admin-layout">
      <AdminSidebar />
      
      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="max-w-[1600px] mx-auto">
          <header className="sticky top-0 z-30 flex h-auto min-h-[80px] md:h-20 items-center justify-between bg-background/80 backdrop-blur-md px-4 md:px-8 lg:px-10 border-b border-border/50 py-4 md:py-0">
            <div className="flex items-center gap-4">
              <MobileAdminSidebar />
              <div className="flex flex-col justify-center animate-fade-in">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground leading-tight" data-testid="text-admin-title">
                    {title}
                  </h1>
                  <Badge 
                    variant="outline" 
                    className="hidden sm:inline-flex bg-gradient-to-r from-[#ed5387]/10 to-[#9C27B0]/10 text-[#ed5387] border-[#ed5387]/30"
                  >
                    Admin
                  </Badge>
                </div>
                {description && (
                  <p className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5 md:mt-0">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-sidebar-accent/50 border border-sidebar-border/50">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-[#ed5387] to-[#9C27B0] rounded-full opacity-70" />
                  <Avatar className="h-8 w-8 border-2 border-background relative">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-col hidden lg:flex">
                  <span className="text-sm font-semibold text-foreground">{displayName}</span>
                  <span className="text-[10px] text-muted-foreground">Administrator</span>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 lg:p-10 animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
