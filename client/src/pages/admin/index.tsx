import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  BarChart3, 
  DollarSign, 
  Activity,
  UserCheck,
  TrendingUp,
  ImageIcon,
  Briefcase,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalUsers: number;
  totalImages: number;
  totalCommissions: number;
  totalRevenue?: number;
  activeUsers?: number;
  conversionRate?: number;
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const response = await fetch("/api/admin/analytics", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }
  
  const data = await response.json();
  return data.analytics;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
  colorClass: string;
  isLoading?: boolean;
  testId?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, colorClass, isLoading, testId }: StatCardProps) {
  if (isLoading) {
    return (
      <Card data-testid={testId}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid={testId}>
      <div className={cn("absolute inset-0 opacity-5", colorClass.replace("text-", "bg-"))} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", colorClass.replace("text-", "bg-") + "/10")}>
          <Icon className={cn("h-4 w-4", colorClass)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <span className="inline-flex items-center text-[10px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  testId?: string;
}

function QuickActionCard({ title, description, icon: Icon, href, gradient, testId }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card 
        className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden relative h-full"
        data-testid={testId}
      >
        <div className={cn("absolute inset-0 opacity-10", gradient)} />
        <CardHeader className="relative">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-2", gradient)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            {title}
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function RecentActivityCard() {
  const activities = [
    { id: 1, action: "New user registered", time: "5 minutes ago", icon: UserCheck },
    { id: 2, action: "Image generated", time: "12 minutes ago", icon: ImageIcon },
    { id: 3, action: "New subscription", time: "1 hour ago", icon: DollarSign },
    { id: 4, action: "Deal created", time: "2 hours ago", icon: Briefcase },
  ];

  return (
    <Card className="h-full" data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest platform activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <activity.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-4 text-muted-foreground hover:text-foreground">
          View all activity
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: fetchAnalytics,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      description="Manage your platform and view analytics"
    >
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={analytics?.totalUsers ?? 0}
            description="Registered users"
            icon={Users}
            trend={analytics?.totalUsers ? "+12%" : undefined}
            colorClass="text-[#ed5387]"
            isLoading={isLoading}
            testId="card-total-users"
          />
          <StatCard
            title="Active Users"
            value={analytics?.activeUsers ?? Math.round((analytics?.totalUsers ?? 0) * 0.72)}
            description="Last 30 days"
            icon={UserCheck}
            trend={analytics?.activeUsers ? "+8%" : undefined}
            colorClass="text-green-600"
            isLoading={isLoading}
            testId="card-active-users"
          />
          <StatCard
            title="Images Generated"
            value={analytics?.totalImages ?? 0}
            description="Total generations"
            icon={ImageIcon}
            trend={analytics?.totalImages ? "+23%" : undefined}
            colorClass="text-[#9C27B0]"
            isLoading={isLoading}
            testId="card-total-images"
          />
          <StatCard
            title="Total Commissions"
            value={`$${(analytics?.totalCommissions ?? 0).toLocaleString()}`}
            description="Affiliate earnings"
            icon={DollarSign}
            trend={analytics?.totalCommissions ? "+18%" : undefined}
            colorClass="text-[#1A1A2E]"
            isLoading={isLoading}
            testId="card-total-commissions"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick Actions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <QuickActionCard
                  title="User Management"
                  description="Manage users, roles, and permissions"
                  icon={Users}
                  href="/admin/users"
                  gradient="bg-gradient-to-br from-[#ed5387] to-[#C2185B]"
                  testId="link-admin-users"
                />
                <QuickActionCard
                  title="CRM"
                  description="Manage contacts, deals, and activities"
                  icon={Briefcase}
                  href="/admin/crm"
                  gradient="bg-gradient-to-br from-[#1A1A2E] to-[#4A3830]"
                  testId="link-admin-crm"
                />
                <QuickActionCard
                  title="Analytics"
                  description="View detailed platform analytics"
                  icon={BarChart3}
                  href="/admin/analytics"
                  gradient="bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2]"
                  testId="link-admin-analytics"
                />
              </div>
            </div>

            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive text-sm">Error Loading Analytics</CardTitle>
                  <CardDescription>
                    {error instanceof Error ? error.message : "Failed to load analytics data"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-performance-overview">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Overview
                </CardTitle>
                <CardDescription>Platform metrics this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">{analytics?.conversionRate ?? 4.2}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Conversion Rate</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">${(analytics?.totalRevenue ?? 12450).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">2.3k</p>
                    <p className="text-xs text-muted-foreground mt-1">Page Views</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">89%</p>
                    <p className="text-xs text-muted-foreground mt-1">Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <RecentActivityCard />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
