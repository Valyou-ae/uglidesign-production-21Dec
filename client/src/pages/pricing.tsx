import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Check, ArrowRight, Zap, Mail, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 20,
    features: ["20 credits/month", "Basic generation", "Standard quality", "Community access"],
  },
  {
    id: "basic",
    name: "Basic",
    price: 9,
    credits: 100,
    features: ["100 credits/month", "HD exports", "Background remover", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    credits: 500,
    popular: true,
    features: ["500 credits/month", "4K exports", "All tools", "Priority queue", "Commercial license", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    credits: "Unlimited",
    features: ["Unlimited credits", "Custom integrations", "Dedicated manager", "SLA guarantee"],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState("pro");
  
  const currentPlan = user?.planTier || "free";

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch("/api/stripe/checkout-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create checkout session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubscribe = () => {
    if (selectedPlan === "enterprise") {
      navigate("/help");
      return;
    }
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    if (selectedPlan === currentPlan) return;
    if (selectedPlan === "free") {
      navigate("/billing");
      return;
    }
    checkoutMutation.mutate(selectedPlan);
  };

  const activePlan = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="min-h-full flex flex-col lg:flex-row">
          
          <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-lg"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B94E30]/10 text-[#B94E30] text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Pricing
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                Pick the plan that
                <br />
                <span className="text-[#B94E30]">works for you</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-10">
                Simple pricing with no hidden fees. Start free and upgrade when you're ready.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10">
                {PLANS.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      "relative p-4 rounded-2xl text-left transition-all border-2",
                      selectedPlan === plan.id
                        ? "border-[#B94E30] bg-[#B94E30]/5"
                        : "border-border hover:border-[#B94E30]/30 bg-card"
                    )}
                    data-testid={`plan-option-${plan.id}`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 right-3 px-2 py-0.5 bg-[#E3B436] text-[#664D3F] text-[10px] font-bold rounded-full">
                        POPULAR
                      </span>
                    )}
                    {currentPlan === plan.id && (
                      <span className="absolute -top-2 left-3 px-2 py-0.5 bg-[#664D3F] text-white text-[10px] font-bold rounded-full">
                        CURRENT
                      </span>
                    )}
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={cn(
                        "text-2xl font-bold",
                        selectedPlan === plan.id ? "text-[#B94E30]" : "text-foreground"
                      )}>
                        {typeof plan.price === "number" ? `$${plan.price}` : plan.price}
                      </span>
                      {typeof plan.price === "number" && (
                        <span className="text-sm text-muted-foreground">/mo</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-foreground">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {typeof plan.credits === "number" ? `${plan.credits} credits` : plan.credits}
                    </div>
                  </motion.button>
                ))}
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={selectedPlan === currentPlan || checkoutMutation.isPending}
                size="lg"
                className="w-full h-14 text-base font-semibold rounded-xl bg-[#B94E30] hover:bg-[#B94E30]/90 text-white"
                data-testid="button-subscribe"
              >
                {!user ? "Sign Up" : selectedPlan === currentPlan ? "Current Plan" : selectedPlan === "enterprise" ? "Contact Us" : "Subscribe"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Cancel anytime. No questions asked.
              </p>
            </motion.div>
          </div>

          <div className="flex-1 bg-gradient-to-br from-[#B94E30] via-[#a04528] to-[#664D3F] flex flex-col justify-center px-8 py-16 lg:px-16">
            <motion.div
              key={selectedPlan}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white">{activePlan.name}</h2>
                    <p className="text-white/70">
                      {typeof activePlan.credits === "number" 
                        ? `${activePlan.credits} credits per month` 
                        : "Unlimited usage"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-[#E3B436]">
                      {typeof activePlan.price === "number" ? `$${activePlan.price}` : "Custom"}
                    </div>
                    {typeof activePlan.price === "number" && (
                      <div className="text-white/60 text-sm">per month</div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-white/20 mb-6" />

                <div className="space-y-4">
                  <p className="text-white/80 text-sm font-medium uppercase tracking-wide">What's included</p>
                  {activePlan.features.map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="h-6 w-6 rounded-full bg-[#E3B436] flex items-center justify-center flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-[#664D3F]" />
                      </div>
                      <span className="text-white">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-white/60 text-sm mb-4">Need more credits?</p>
                <Link href={user ? "/billing" : "/api/login"}>
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                    data-testid="button-buy-credits"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Buy Credit Packs
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center gap-6 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

        <div className="bg-card border-t border-border px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is ready to help you find the perfect plan for your needs.
            </p>
            <Link href="/help">
              <Button variant="outline" className="rounded-xl" data-testid="button-contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
