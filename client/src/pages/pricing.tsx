import { useState } from "react";
import { Link } from "wouter";
import { Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  price: number;
  priceYearly: number;
  credits: number;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
}

const PLANS: PricingPlan[] = [
  {
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
      { text: "API access", included: false },
    ],
    cta: "Get Started Free",
  },
  {
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
      { text: "API access", included: false },
    ],
    cta: "Start Starter",
  },
  {
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
      { text: "API access", included: false },
    ],
    cta: "Start Pro",
  },
  {
    name: "Enterprise",
    description: "For teams and agencies",
    price: -1,
    priceYearly: -1,
    credits: -1,
    features: [
      { text: "Unlimited credits", included: true },
      { text: "All Pro features", included: true },
      { text: "Priority queue", included: true },
      { text: "API access", included: true },
      { text: "Custom branding", included: true },
      { text: "Team collaboration", included: true },
      { text: "Dedicated support", included: true },
      { text: "SLA guarantee", included: true },
    ],
    cta: "Contact Us",
  },
];

const CREDIT_PACKAGES = [
  { credits: 500, price: 19, perCredit: 0.038 },
  { credits: 1000, price: 35, perCredit: 0.035, popular: true },
  { credits: 2500, price: 79, perCredit: 0.032 },
  { credits: 5000, price: 149, perCredit: 0.030 },
];

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-2xl border p-6 flex flex-col",
                  plan.popular 
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                    : "border-border bg-card"
                )}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  {plan.price === -1 ? (
                    <>
                      <div className="text-4xl font-bold text-foreground">
                        Custom
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact us for pricing
                      </p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                  className={cn(
                    "w-full",
                    plan.popular 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  )}
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            ))}
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
              Contact our team for custom enterprise solutions or any questions about our plans.
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
