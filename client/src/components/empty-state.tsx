import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Shirt, 
  Scissors, 
  Folder, 
  Plus,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "creations" | "mockups" | "backgrounds" | "generic";
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const EMPTY_STATE_CONFIGS = {
  creations: {
    icon: Folder,
    title: "No creations yet",
    description: "Start your creative journey by generating your first image, mockup, or removing a background.",
    actionLabel: "Create Something",
    actionHref: "/image-gen",
    gradient: "from-[#B94E30]/10 to-[#E3B436]/10",
    iconBg: "bg-[#B94E30]/10 text-[#B94E30]",
  },
  mockups: {
    icon: Shirt,
    title: "No mockups yet",
    description: "Upload your design and create stunning product mockups for your store or portfolio.",
    actionLabel: "Create Mockup",
    actionHref: "/mockup",
    gradient: "from-[#664D3F]/10 to-[#4A3830]/10",
    iconBg: "bg-[#664D3F]/10 text-[#664D3F]",
  },
  backgrounds: {
    icon: Scissors,
    title: "No images processed",
    description: "Upload an image to instantly remove its background and get clean, transparent results.",
    actionLabel: "Remove Background",
    actionHref: "/bg-remover",
    gradient: "from-[#E3B436]/10 to-[#C99C2A]/10",
    iconBg: "bg-[#E3B436]/10 text-[#B99A2C]",
  },
  generic: {
    icon: Sparkles,
    title: "Nothing here yet",
    description: "Get started by exploring our AI-powered creative tools.",
    actionLabel: "Explore Tools",
    actionHref: "/",
    gradient: "from-muted/50 to-muted/30",
    iconBg: "bg-muted text-muted-foreground",
  },
};

export function EmptyState({ 
  type, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  onAction 
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIGS[type];
  const Icon = config.icon;
  
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionLabel = actionLabel || config.actionLabel;
  const finalActionHref = actionHref || config.actionHref;

  const ActionButton = () => (
    <Button 
      className="bg-primary hover:bg-primary/90"
      onClick={onAction}
      data-testid={`button-empty-action-${type}`}
    >
      <Plus className="mr-2 h-4 w-4" />
      {finalActionLabel}
    </Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-dashed border-border bg-gradient-to-br",
        config.gradient
      )}
      data-testid={`empty-state-${type}`}
    >
      <div className={cn(
        "h-16 w-16 rounded-2xl flex items-center justify-center mb-6",
        config.iconBg
      )}>
        <Icon className="h-8 w-8" />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground text-center mb-2">
        {finalTitle}
      </h3>
      
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {finalDescription}
      </p>
      
      {onAction ? (
        <ActionButton />
      ) : (
        <Link href={finalActionHref}>
          <ActionButton />
        </Link>
      )}
    </motion.div>
  );
}

export function QuickStartCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  gradient 
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        className={cn(
          "relative p-6 rounded-xl border border-border bg-card cursor-pointer group overflow-hidden",
          "hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        )}
      >
        <div className={cn(
          "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity",
          gradient
        )} />
        
        <div className="relative z-10">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
            gradient.includes("B94E30") ? "bg-[#B94E30]/10 text-[#B94E30]" :
            gradient.includes("E3B436") ? "bg-[#E3B436]/10 text-[#B99A2C]" :
            gradient.includes("664D3F") ? "bg-[#664D3F]/10 text-[#664D3F]" :
            "bg-[#B94E30]/10 text-[#B94E30]"
          )}>
            <Icon className="h-6 w-6" />
          </div>
          
          <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {title}
          </h4>
          
          <p className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
          
          <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
