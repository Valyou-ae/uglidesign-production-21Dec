import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Sparkles, Lock, ExternalLink, Heart, RefreshCw, Eye, Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SharedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  username?: string;
  createdAt: string;
  galleryImageId?: string;
  likeCount?: number;
  viewCount?: number;
  remixCount?: number;
  likedByViewer?: boolean;
}

export default function ShareImage() {
  const [, params] = useRoute("/share/:id");
  const [, setLocation] = useLocation();
  const imageId = params?.id;
  const [image, setImage] = useState<SharedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/${imageId}` : '';
  const shareText = image?.prompt ? `Check out this AI-generated image: "${image.prompt.slice(0, 100)}${image.prompt.length > 100 ? '...' : ''}"` : 'Check out this AI-generated image!';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast({ title: "Link Copied!", description: "Share link copied to clipboard" });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    async function fetchImage() {
      if (!imageId) return;
      
      try {
        const response = await fetch(`/api/images/share/${imageId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("This image is private or doesn't exist.");
          } else {
            setError("Failed to load image.");
          }
          return;
        }
        const data = await response.json();
        setImage(data.image);
        setLikeCount(data.image.likeCount || 0);
        setLiked(data.image.likedByViewer || false);
      } catch (err) {
        setError("Failed to load image.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchImage();
  }, [imageId]);

  const handleDownload = async () => {
    if (!image) return;
    
    try {
      toast({ title: "Downloading...", description: "Preparing your image" });
      
      // Handle base64 images differently from URL images
      if (image.imageUrl.startsWith('data:')) {
        // For base64 images, create a link directly
        const a = document.createElement("a");
        a.href = image.imageUrl;
        a.download = `ugli-${image.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // For URL images, fetch and create blob
        const response = await fetch(image.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ugli-${image.id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      toast({ title: "Downloaded!", description: "Image saved to your device" });
    } catch (err) {
      toast({ variant: "destructive", title: "Download failed", description: "Please try again" });
    }
  };

  const handleLike = async () => {
    if (!image?.galleryImageId) {
      toast({ title: "Like feature", description: "Sign in to like images" });
      return;
    }
    
    try {
      const response = await fetch(`/api/gallery/${image.galleryImageId}/like`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
      } else {
        toast({ title: "Sign in to like", description: "Create an account to like images" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not like image" });
    }
  };

  const handleRemix = async () => {
    if (!image?.prompt) {
      toast({ title: "No prompt available", description: "This image doesn't have a prompt to remix" });
      return;
    }
    // Track remix
    try {
      await fetch(`/api/images/${image.id}/remix`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      // Ignore tracking errors
    }
    // Navigate to image generator with prompt in URL
    const encodedPrompt = encodeURIComponent(image.prompt);
    setLocation(`/image-gen?remix=${encodedPrompt}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Image Not Available</h1>
          <p className="text-muted-foreground max-w-md">
            {error || "This image might be private or has been removed."}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2" data-testid="button-go-home">
            <ArrowLeft className="w-4 h-4" />
            Go to UGLI
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-bold text-xl text-[#ed5387]">UGLI</span>
            </Button>
          </Link>
          <Link href="/image-gen">
            <Button className="gap-2 bg-[#ed5387] hover:bg-[#A04228] text-white" data-testid="button-create-own">
              <Sparkles className="w-4 h-4" />
              Create Your Own
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-2 gap-8"
        >
          {/* Image Display */}
          <div className="relative rounded-2xl overflow-hidden bg-muted/20 border border-border">
            <img
              src={image.imageUrl}
              alt={image.prompt || "AI Generated Image"}
              className="w-full h-auto object-contain"
              data-testid="img-shared-image"
            />
          </div>

          {/* Image Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-image-title">
                AI Generated Image
              </h1>
              {image.username && (
                <p className="text-sm text-muted-foreground" data-testid="text-creator">
                  Created by <span className="font-medium text-foreground">@{image.username}</span>
                </p>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Prompt
              </label>
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-sm text-foreground leading-relaxed" data-testid="text-prompt">
                  {image.prompt || "No prompt available"}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {image.style && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Style</span>
                  <span className="text-xs font-medium text-foreground capitalize">{image.style}</span>
                </div>
              )}
              {image.aspectRatio && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Aspect Ratio</span>
                  <span className="text-xs font-medium text-foreground">{image.aspectRatio}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-xs font-medium text-foreground">
                  {new Date(image.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Social Stats */}
            <div className="flex items-center gap-6 py-3 px-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">{image.viewCount || 0}</span>
                <span className="text-xs">views</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">{likeCount}</span>
                <span className="text-xs">likes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">{image.remixCount || 0}</span>
                <span className="text-xs">remixes</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="gap-2"
                data-testid="button-download-shared"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                onClick={handleLike}
                variant="outline"
                className={cn("gap-2", liked && "bg-red-50 border-red-200 text-red-600 hover:bg-red-100")}
                data-testid="button-like-shared"
              >
                <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                {likeCount > 0 ? likeCount : "Like"}
              </Button>
              <Button
                onClick={handleRemix}
                variant="outline"
                className="gap-2"
                data-testid="button-remix-shared"
              >
                <RefreshCw className="w-4 h-4" />
                Remix
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-quick-share">
                    <Share2 className="w-4 h-4" />
                    Quick Share
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="grid gap-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-10"
                      onClick={handleShareTwitter}
                      data-testid="button-share-twitter"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Share on X
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-10"
                      onClick={handleShareFacebook}
                      data-testid="button-share-facebook"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Share on Facebook
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-10"
                      onClick={handleShareWhatsApp}
                      data-testid="button-share-whatsapp"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Share on WhatsApp
                    </Button>
                    <div className="border-t border-border my-1" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-10"
                      onClick={handleCopyLink}
                      data-testid="button-copy-share-link"
                    >
                      {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {linkCopied ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Try UGLI Button - Full Width */}
            <Link href="/image-gen">
              <Button className="w-full gap-2 bg-[#ed5387] hover:bg-[#A04228] text-white" data-testid="button-try-ugli">
                <Sparkles className="w-4 h-4" />
                Try UGLI for Free!
              </Button>
            </Link>

            {/* CTA Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#ed5387]/10 to-[#9C27B0]/10 border border-[#ed5387]/20">
              <h3 className="font-bold text-foreground mb-2">Generate Your Own AI Images</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create stunning AI-generated images with UGLI. Fast, powerful, and free to try.
              </p>
              <Link href="/">
                <Button variant="link" className="p-0 h-auto text-[#ed5387] gap-1" data-testid="link-learn-more">
                  Learn more <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
