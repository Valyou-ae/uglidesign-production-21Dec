import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Check, Sparkles, ArrowRight, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceYearly: number;
  credits: number;
  popular?: boolean;
  features: PlanFeature[];
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
  } | null;
  plan: string;
}

interface StripeProduct {
  product_id: string;
  product_name: string;
  product_description: string | null;
  price_id: string;
  unit_amount: number | null;
  recurring: { interval: string } | null;
}

const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out UGLI",
    price: 0,
    priceYearly: 0,
    credits: 50,
    features: [
      { text: "50 credits/month", included: true },
      { text: "Basic image generation", included: true },
      { text: "Standard quality", included: true },
      { text: "Community support", included: true },
      { text: "Background remover", included: false },
      { text: "Mockup generator", included: false },
      { text: "Priority queue", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For hobbyists and creators",
    price: 9,
    priceYearly: 90,
    credits: 500,
    features: [
      { text: "500 credits/month", included: true },
      { text: "All AI generators", included: true },
      { text: "HD quality exports", included: true },
      { text: "Background remover", included: true },
      { text: "Email support", included: true },
      { text: "Mockup generator", included: false },
      { text: "Priority queue", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For creators and small businesses",
    price: 29,
    priceYearly: 290,
    credits: 2000,
    popular: true,
    features: [
      { text: "2,000 credits/month", included: true },
      { text: "All AI generators", included: true },
      { text: "HD quality exports", included: true },
      { text: "Background remover", included: true },
      { text: "Mockup generator", included: true },
      { text: "Priority support", included: true },
      { text: "Priority queue", included: true },
    ],
  },
];

const PLAN_ORDER = ["free", "starter", "pro"];

const CREDIT_PACKAGES = [
  { credits: 500, price: 19, perCredit: 0.038 },
  { credits: 1000, price: 35, perCredit: 0.035, popular: true },
  { credits: 2500, price: 79, perCredit: 0.032 },
  { credits: 5000, price: 149, perCredit: 0.030 },
];

export default function Pricing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const { data: subscriptionData } = useQuery<SubscriptionStatus>({
    queryKey: ["stripe", "subscription"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/subscription-status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get subscription status");
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: productsData } = useQuery<{ products: StripeProduct[] }>({
    queryKey: ["stripe", "products"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/products", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get products");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, mode }: { priceId: string; mode: 'subscription' | 'payment' }) => {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId, mode }),
      });
      if (!res.ok) throw new Error("Failed to create checkout session");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const currentPlan = subscriptionData?.plan || "free";
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan.toLowerCase());

  const products = productsData?.products || [];
  const stripePriceMap: Record<string, { monthly?: string; yearly?: string }> = {};
  
  const normalizePlanName = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('starter')) return 'starter';
    if (lower.includes('pro')) return 'pro';
    return lower.replace(/\s*(plan|ugli)\s*/gi, '').trim();
  };
  
  products
    .filter(p => p.recurring && !p.product_name.toLowerCase().includes('enterprise'))
    .forEach(product => {
      const planId = normalizePlanName(product.product_name);
      if (!stripePriceMap[planId]) {
        stripePriceMap[planId] = {};
      }
      if (product.recurring?.interval === 'month') {
        stripePriceMap[planId].monthly = product.price_id;
      } else if (product.recurring?.interval === 'year') {
        stripePriceMap[planId].yearly = product.price_id;
      }
    });

  const getPlanStatus = (planId: string) => {
    const planIndex = PLAN_ORDER.indexOf(planId);
    if (planId === currentPlan.toLowerCase()) {
      return "current";
    } else if (planIndex > currentPlanIndex) {
      return "upgrade";
    } else {
      return "downgrade";
    }
  };

  const getButtonText = (plan: PricingPlan) => {
    const status = getPlanStatus(plan.id);
    if (status === "current") return "Current Plan";
    if (status === "upgrade") return "Upgrade";
    if (plan.id === "free") return "Current Plan";
    return "Downgrade";
  };

  const handlePlanClick = (plan: PricingPlan) => {
    const status = getPlanStatus(plan.id);
    if (status === "current" || plan.id === "free") return;

    const priceId = billingPeriod === "monthly" 
      ? stripePriceMap[plan.id]?.monthly 
      : stripePriceMap[plan.id]?.yearly;

    if (priceId) {
      checkoutMutation.mutate({ priceId, mode: 'subscription' });
    } else {
      toast({ 
        title: "Plan not available", 
        description: "This plan is not currently available. Please try again later.",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your creative needs. All plans include access to our AI-powered tools.
            </p>
            
            <div className="inline-flex items-center gap-2 mt-8 p-1 bg-muted rounded-full">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all",
                  billingPeriod === "monthly" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="button-monthly"
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  billingPeriod === "yearly" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="button-yearly"
              >
                Yearly
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Save 17%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {PLANS.map((plan, index) => {
              const status = getPlanStatus(plan.id);
              const isCurrentPlan = status === "current";
              const buttonText = getButtonText(plan);
              const priceId = billingPeriod === "monthly" 
                ? stripePriceMap[plan.id]?.monthly 
                : stripePriceMap[plan.id]?.yearly;
              const hasPriceAvailable = plan.id === "free" || !!priceId;
              const isDisabled = isCurrentPlan || plan.id === "free" || !hasPriceAvailable;

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative rounded-2xl border p-6 flex flex-col",
                    plan.popular 
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                      : "border-border bg-card",
                    isCurrentPlan && "ring-2 ring-primary"
                  )}
                  data-testid={`card-plan-${plan.name.toLowerCase()}`}
                >
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
                        <Check className="h-3 w-3" />
                        Current Plan
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        ${billingPeriod === "monthly" ? plan.price : plan.priceYearly}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingPeriod === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.credits.toLocaleString()} credits included
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          feature.included 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className={cn(
                          "text-sm",
                          feature.included ? "text-foreground" : "text-muted-foreground line-through"
                        )}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handlePlanClick(plan)}
                    disabled={isDisabled || checkoutMutation.isPending}
                    className={cn(
                      "w-full",
                      isCurrentPlan 
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : plan.popular 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                          : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    )}
                    data-testid={`button-select-${plan.name.toLowerCase()}`}
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {buttonText}
                        {!isDisabled && <ArrowRight className="ml-2 h-4 w-4" />}
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Need More Credits?</h2>
                <p className="text-sm text-muted-foreground">Purchase additional credits anytime</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <div 
                  key={pkg.credits}
                  className={cn(
                    "relative rounded-xl border p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md",
                    pkg.popular ? "border-primary bg-primary/5" : "border-border"
                  )}
                  data-testid={`card-credits-${pkg.credits}`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      Best Value
                    </span>
                  )}
                  <div className="text-2xl font-bold text-foreground">
                    {pkg.credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">credits</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-xl font-semibold text-foreground">${pkg.price}</span>
                    <span className="text-xs text-muted-foreground">
                      (${pkg.perCredit.toFixed(3)}/credit)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Questions? We're here to help.
            </h3>
            <p className="text-muted-foreground mb-4">
              Contact our team for any questions about our plans.
            </p>
            <Link href="/help">
              <Button variant="outline" data-testid="button-contact-support">
                Contact Support
              </Button>
            </Link>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
