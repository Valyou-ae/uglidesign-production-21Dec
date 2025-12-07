import { useState } from "react";
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
  Filter
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("projects");

  const projects = [
    { id: 1, image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", title: "Abstract Waves", type: "Image", likes: 124 },
    { id: 2, image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop", title: "Neon City", type: "Image", likes: 89 },
    { id: 3, image: "https://images.unsplash.com/photo-1633596683562-4a47eb4983c5?q=80&w=1000&auto=format&fit=crop", title: "T-Shirt Mockup", type: "Mockup", likes: 56 },
    { id: 4, image: "https://images.unsplash.com/photo-1620641788421-7f1c3333298d?q=80&w=1000&auto=format&fit=crop", title: "Glass Planet", type: "Image", likes: 210 },
    { id: 5, image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop", title: "Retro Car", type: "Image", likes: 145 },
    { id: 6, image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1000&auto=format&fit=crop", title: "Cyber Samurai", type: "Image", likes: 302 },
  ];

  const collections = [
    { id: 1, title: "Cyberpunk Aesthetics", count: 12, image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop" },
    { id: 2, title: "Minimalist Mockups", count: 8, image: "https://images.unsplash.com/photo-1633596683562-4a47eb4983c5?q=80&w=1000&auto=format&fit=crop" },
    { id: 3, title: "Abstract Textures", count: 24, image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" },
  ];

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto bg-[#FAFAFA] dark:bg-[#09090B]">
        {/* Cover Image */}
        <div className="h-64 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#B94E30] via-[#E3B436] to-[#664D3F] opacity-90" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="absolute top-6 right-6 z-20 shadow-lg bg-black/20 hover:bg-red-600 backdrop-blur-md border border-white/10"
            onClick={() => window.location.href = '/login'}
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
              className="h-4 w-4 mr-2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Sign Out
          </Button>
        </div>

        <div className="max-w-6xl mx-auto w-full px-6 pb-12 -mt-20 relative z-10">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
            <div className="relative">
              <div className="rounded-full p-1.5 bg-background">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="text-4xl">JD</AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-background rounded-full" />
            </div>
            
            <div className="flex-1 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">John Doe</h1>
                  <p className="text-muted-foreground text-lg">@johndoe</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-[#B94E30] to-[#8B3A24] hover:shadow-lg hover:shadow-[#B94E30]/20 border-0 text-white">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
              
              <p className="mt-4 text-foreground/80 max-w-2xl leading-relaxed">
                Digital artist and prompt engineer. Passionate about exploring the boundaries of AI-generated art. 
                Building the future of visual storytelling one prompt at a time. 🎨✨
              </p>
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  San Francisco, CA
                </div>
                <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
                  <LinkIcon className="h-4 w-4" />
                  johndoe.design
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Joined March 2024
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Projects", value: "124", icon: ImageIcon },
              { label: "Likes Received", value: "8.5k", icon: Heart },
              { label: "Collections", value: "12", icon: Layers },
              { label: "Following", value: "248", icon: Grid },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-primary/50 transition-colors group cursor-default">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="projects" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="projects" className="rounded-lg px-6">Projects</TabsTrigger>
                <TabsTrigger value="collections" className="rounded-lg px-6">Collections</TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg px-6">About</TabsTrigger>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div 
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-pointer"
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
                        <div className="flex items-center gap-1 text-white/90">
                          <Heart className="h-4 w-4 fill-white/90" />
                          <span className="text-sm font-medium">{project.likes}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add New Project Card */}
                <div className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer min-h-[240px]">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MoreHorizontal className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Load More</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="collections" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <motion.div 
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-muted mb-3 relative">
                      <img 
                        src={collection.image} 
                        alt={collection.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" className="rounded-full">View Collection</Button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{collection.title}</h3>
                    <p className="text-sm text-muted-foreground">{collection.count} items</p>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl">
                <h3 className="text-xl font-bold mb-4">About Me</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Hello! I'm John, a passionate digital artist based in San Francisco. I've been working with AI generation tools since the early days of GANs and have evolved my workflow to incorporate the latest diffusion models.
                  </p>
                  <p>
                    My work focuses on the intersection of organic textures and cyberpunk aesthetics. I love creating prompts that challenge the AI to blend contrasting styles into cohesive visual narratives.
                  </p>
                  <p>
                    When I'm not generating art, I'm usually hiking in the Bay Area or experimenting with 3D printing. Feel free to reach out if you want to collaborate on a project!
                  </p>
                </div>
                
                <Separator className="my-8" />
                
                <h3 className="text-xl font-bold mb-4">Skills & Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {["Midjourney", "Stable Diffusion", "DALL-E 3", "Photoshop", "Blender", "Prompt Engineering", "Character Design", "Environment Art"].map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
