import { useState, useEffect } from "react";
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Edit, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Heart, 
  Layers, 
  Grid,
  List,
  Filter,
  LogOut,
  Loader2,
  Coins,
  Gift,
  Copy,
  Check,
  Users,
  Sparkles
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { imagesApi } from "@/lib/api";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("projects");
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/user/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ["images"],
    queryFn: imagesApi.getAll,
    enabled: isAuthenticated,
  });

  const { data: referralStats, isLoading: referralLoading } = useQuery({
    queryKey: ["referral", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/referral/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch referral stats");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/referral/generate-code", { 
        method: "POST",
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to generate code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({ title: "Referral code generated!", description: "Share it with friends to earn credits." });
    },
  });

  const applyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ referralCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to apply code");
      return data;
    },
    onSuccess: (data) => {
      setApplyCode("");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["referral", "stats"] });
      toast({ title: "Success!", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const copyReferralLink = () => {
    const code = referralStats?.referralCode || user?.affiliateCode;
    if (code) {
      navigator.clipboard.writeText(`${window.location.origin}?ref=${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Please sign in to view your profile</h2>
          <Button onClick={() => setLocation("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const displayName = user.displayName || 
    (user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null) || 
    user.username;

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.username.slice(0, 2).toUpperCase();

  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const stats = statsData || { images: 0, mockups: 0, bgRemoved: 0, total: 0 };
  const totalProjects = stats.images + stats.mockups + stats.bgRemoved;

  const images = imagesData?.images || [];
  const favoriteCount = images.filter((img: any) => img.isFavorite).length;

  const projects = images.map((img: any) => ({
    id: img.id,
    image: img.imageUrl,
    title: img.prompt?.slice(0, 30) + (img.prompt?.length > 30 ? '...' : '') || 'Untitled',
    type: img.generationType === 'mockup' ? 'Mockup' : img.generationType === 'bg-removed' ? 'Background' : 'Image',
    likes: img.isFavorite ? 1 : 0,
    isFavorite: img.isFavorite
  }));

  const socialLinks = user.socialLinks || [];

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto bg-[#FAFAFA] dark:bg-[#09090B]">
        {/* Cover Image */}
        <div className="h-32 md:h-40 w-full relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ed5387] via-[#9C27B0] to-[#1A1A2E] opacity-90" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="absolute top-6 right-6 z-20 shadow-lg bg-black/20 hover:bg-red-600 backdrop-blur-md border border-white/10"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 pb-12 -mt-12 md:-mt-16 relative z-10">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 mb-8">
            <div className="relative">
              <div className="rounded-full p-1 md:p-1.5 bg-background">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={user.profileImageUrl || ""} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-[#ed5387] to-[#9C27B0] text-white" data-testid="text-user-initials">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-background rounded-full" />
            </div>
            
            <div className="flex-1 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground" data-testid="text-display-name">{displayName}</h1>
                  <p className="text-muted-foreground text-lg" data-testid="text-username">@{user.username}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" data-testid="button-share">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:shadow-lg hover:shadow-[#ed5387]/20 border-0 text-white"
                    onClick={() => setLocation("/settings")}
                    data-testid="button-edit-profile"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
              
              {user.bio && (
                <p className="mt-4 text-foreground/80 max-w-2xl leading-relaxed" data-testid="text-bio">
                  {user.bio}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {socialLinks.length > 0 && socialLinks[0]?.url && (
                  <a 
                    href={socialLinks[0].url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors"
                    data-testid="link-website"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {socialLinks[0].label || 'Website'}
                  </a>
                )}
                <div className="flex items-center gap-1.5" data-testid="text-join-date">
                  <Calendar className="h-4 w-4" />
                  Joined {joinDate}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { label: "Credits", value: (stats.credits ?? 0).toString(), icon: Coins, highlight: true },
              { label: "Images", value: (stats.images || 0).toString(), icon: ImageIcon },
              { label: "Mockups", value: (stats.mockups || 0).toString(), icon: Layers },
              { label: "Backgrounds", value: (stats.bgRemoved || 0).toString(), icon: Grid },
              { label: "Favorites", value: favoriteCount.toString(), icon: Heart },
            ].map((stat: { label: string; value: string; icon: any; highlight?: boolean }, i) => (
              <div 
                key={i} 
                className={`bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-primary/50 transition-colors group cursor-default ${
                  stat.highlight ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : 'border-border'
                }`}
                data-testid={`stat-${stat.label.toLowerCase()}`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                  stat.highlight ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                }`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stat.highlight ? 'text-primary' : 'text-foreground'}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="projects" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="projects" className="rounded-lg px-6" data-testid="tab-projects">Projects</TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg px-6" data-testid="tab-favorites">Favorites</TabsTrigger>
                <TabsTrigger value="referral" className="rounded-lg px-6" data-testid="tab-referral">Referral</TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg px-6" data-testid="tab-about">About</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Filter className="h-4 w-4" />
                </Button>
                <div className="h-4 w-px bg-border my-auto" />
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Grid className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="projects" className="mt-0">
              {imagesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                  <p className="mb-4">Start creating to see your work here!</p>
                  <Button onClick={() => setLocation("/image-gen")} data-testid="button-create-first">
                    Create Your First Image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project: any) => (
                    <motion.div 
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-pointer"
                      data-testid={`card-project-${project.id}`}
                    >
                      <img 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <div className="flex justify-between items-end">
                          <div>
                            <Badge variant="secondary" className="mb-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                              {project.type}
                            </Badge>
                            <h3 className="text-white font-bold text-lg">{project.title}</h3>
                          </div>
                          {project.isFavorite && (
                            <div className="flex items-center gap-1 text-white/90">
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              {imagesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.filter((p: any) => p.isFavorite).length === 0 ? (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                      <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                      <p>Like your creations to see them here!</p>
                    </div>
                  ) : (
                    projects.filter((p: any) => p.isFavorite).map((project: any) => (
                      <motion.div 
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group cursor-pointer"
                        data-testid={`card-favorite-${project.id}`}
                      >
                        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-muted mb-3 relative">
                          <img 
                            src={project.image} 
                            alt={project.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 right-3">
                            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                          </div>
                        </div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.type}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="referral">
              <div className="max-w-2xl space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      Your Referral Code
                    </CardTitle>
                    <CardDescription>
                      Share your code with friends. You both get 10 bonus credits when they sign up!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {referralStats?.referralCode || user?.affiliateCode ? (
                      <div className="flex gap-2">
                        <Input 
                          readOnly 
                          value={`${window.location.origin}?ref=${referralStats?.referralCode || user?.affiliateCode}`}
                          className="font-mono"
                          data-testid="input-referral-link"
                        />
                        <Button onClick={copyReferralLink} variant="outline" data-testid="button-copy-link">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => generateCodeMutation.mutate()}
                        disabled={generateCodeMutation.isPending}
                        data-testid="button-generate-code"
                      >
                        {generateCodeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate Referral Code
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-3xl font-bold" data-testid="text-referred-count">
                        {referralStats?.referredCount ?? 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Friends Referred</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Coins className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-3xl font-bold" data-testid="text-bonus-credits">
                        {referralStats?.bonusCreditsEarned ?? 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Bonus Credits Earned</p>
                    </CardContent>
                  </Card>
                </div>

                {!user?.referredBy && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Have a Referral Code?</CardTitle>
                      <CardDescription>
                        Enter a friend's referral code to get 10 bonus credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter referral code (e.g., UGLI-ABC123)"
                          value={applyCode}
                          onChange={(e) => setApplyCode(e.target.value)}
                          data-testid="input-apply-code"
                        />
                        <Button 
                          onClick={() => applyCodeMutation.mutate(applyCode)}
                          disabled={!applyCode || applyCodeMutation.isPending}
                          data-testid="button-apply-code"
                        >
                          {applyCodeMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl">
                <h3 className="text-xl font-bold mb-4">About Me</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  {user.bio ? (
                    <p data-testid="text-about-bio">{user.bio}</p>
                  ) : (
                    <p className="text-muted-foreground/60 italic">
                      No bio yet. Add one in your settings to tell others about yourself!
                    </p>
                  )}
                </div>
                
                {socialLinks.length > 0 && (
                  <>
                    <Separator className="my-8" />
                    <h3 className="text-xl font-bold mb-4">Links</h3>
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.map((link: any, i: number) => (
                        <a 
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <Badge variant="secondary" className="px-3 py-1 cursor-pointer hover:bg-primary/20">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {link.label || 'Link'}
                          </Badge>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                <Separator className="my-8" />
                
                <h3 className="text-xl font-bold mb-4">Account Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium" data-testid="text-email">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username</span>
                    <span className="font-medium">@{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">{joinDate}</span>
                  </div>
                  {user.affiliateCode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Affiliate Code</span>
                      <span className="font-medium font-mono" data-testid="text-affiliate-code">{user.affiliateCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
