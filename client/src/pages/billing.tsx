import { useState, useEffect } from "react";
import { 
  Download, 
  ChevronRight, 
  Check,
  CreditCard,
  X,
  Loader2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useLocation, Link } from "wouter";

interface StripeProduct {
  product_id: string;
  product_name: string;
  product_description: string | null;
  product_active: boolean;
  product_metadata: Record<string, string> | null;
  price_id: string;
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string } | null;
  price_active: boolean;
  price_metadata: Record<string, string> | null;
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

export default function Billing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeModal, setActiveModal] = useState<"plan" | "credits" | "payment" | "cancel" | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [selectedCreditPackage, setSelectedCreditPackage] = useState("1000");

  const searchParams = new URLSearchParams(window.location.search);
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Payment successful!", description: "Your subscription is now active." });
      window.history.replaceState({}, '', '/billing');
    }
    if (isCanceled) {
      toast({ title: "Payment canceled", description: "No charges were made.", variant: "destructive" });
      window.history.replaceState({}, '', '/billing');
    }
  }, [isSuccess, isCanceled, toast]);

  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.getStats,
    staleTime: 1000 * 60 * 5,
  });

  const { data: subscriptionData, isLoading: subLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["stripe", "subscription"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/subscription-status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get subscription status");
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: StripeProduct[] }>({
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
    onError: () => {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create portal session");
      }
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
  const hasSubscription = subscriptionData?.hasSubscription || false;
  const subscription = subscriptionData?.subscription;

  const planDetails = {
    free: { name: "Free", price: 0, credits: 100 },
    pro: { name: "Pro", price: 29, credits: 2000 },
    business: { name: "Business", price: 79, credits: 10000 },
  };

  const activePlan = planDetails[currentPlan as keyof typeof planDetails] || planDetails.free;

  const creditUsage = {
    total: activePlan.credits,
    used: stats?.total ?? 0,
    breakdown: {
      images: stats?.images ?? 0,
      mockups: stats?.mockups ?? 0,
      bg: stats?.bgRemoved ?? 0
    }
  };

  const products = productsData?.products || [];
  
  const subscriptionProducts = products.filter(p => p.recurring);
  const oneTimeProducts = products.filter(p => !p.recurring);

  const getRenewalDate = () => {
    if (subscription?.current_period_end) {
      return new Date(subscription.current_period_end * 1000).toLocaleDateString();
    }
    return hasSubscription ? "Active" : "N/A";
  };

  const handleCloseModal = () => setActiveModal(null);

  const handleSubscribe = (priceId: string) => {
    checkoutMutation.mutate({ priceId, mode: 'subscription' });
  };

  const handleBuyCredits = (priceId: string) => {
    checkoutMutation.mutate({ priceId, mode: 'payment' });
  };

  const handleManageSubscription = () => {
    portalMutation.mutate();
  };

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto bg-[#FAFAFA] dark:bg-[#09090B] text-[#18181B] dark:text-[#FAFAFA]">
        <div className="flex justify-center w-full min-h-full">
          <div className="w-full max-w-[680px] px-10 py-12">
            
            {/* HEADER */}
            <div className="mb-12">
              <h1 className="text-[32px] font-semibold tracking-[-0.5px] text-[#18181B] dark:text-[#FAFAFA] leading-[1.2]">
                Billing
              </h1>
              <p className="text-[15px] text-[#52525B] mt-2">
                Manage your subscription and payment
              </p>
            </div>

            {/* SECTION 1: CURRENT PLAN */}
            <div className="mb-10">
              <h2 className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px] mb-4">
                Plan
              </h2>
              
              <div className="flex justify-between items-start pb-6 border-b border-[#F0F0F0] dark:border-[#1A1A1A]">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                      {subLoading ? "Loading..." : activePlan.name}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#52525B]" />
                    <span className="text-sm text-[#52525B]">
                      {subscription?.status === 'active' ? 'Active' : hasSubscription ? subscription?.status : 'Free'}
                    </span>
                  </div>
                  <p className="text-sm text-[#71717A] mt-1">
                    {activePlan.credits.toLocaleString()} credits per month
                  </p>
                  <p className="text-[13px] text-[#52525B] mt-3">
                    {hasSubscription ? `Renews ${getRenewalDate()}` : 'No active subscription'}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-[28px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                      ${activePlan.price}
                    </span>
                    <span className="text-base text-[#52525B]">/mo</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 mt-2">
                    <button 
                      onClick={() => setActiveModal("plan")}
                      className="text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] underline decoration-transparent hover:decoration-current transition-all"
                      data-testid="button-change-plan"
                    >
                      {hasSubscription ? 'Manage plan' : 'Upgrade plan'}
                    </button>
                    <Link href="/pricing">
                      <span className="text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] underline decoration-transparent hover:decoration-current transition-all cursor-pointer" data-testid="link-view-pricing">
                        View pricing
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CREDITS */}
            <div className="mb-10">
              <h2 className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px] mb-4">
                Credits
              </h2>
              
              <div className="pb-6 border-b border-[#F0F0F0] dark:border-[#1A1A1A]">
                <div className="flex justify-between items-baseline mb-4">
                  <div>
                    <span className="text-[32px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                      {creditUsage.used.toLocaleString()}
                    </span>
                    <span className="text-base text-[#52525B] ml-2">
                      of {creditUsage.total.toLocaleString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveModal("credits")}
                    className="text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] underline decoration-transparent hover:decoration-current transition-all"
                    data-testid="button-buy-credits"
                  >
                    Buy credits
                  </button>
                </div>

                <div className="h-1 w-full bg-[#E5E5E5] dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${Math.min((creditUsage.used / creditUsage.total) * 100, 100)}%` }}
                  />
                </div>

                <div className="flex gap-6 mt-4">
                  <span className="text-[13px] text-[#52525B]">
                    Images {creditUsage.breakdown.images}
                  </span>
                  <span className="text-[13px] text-[#52525B]">
                    Mockups {creditUsage.breakdown.mockups}
                  </span>
                  <span className="text-[13px] text-[#52525B]">
                    BG {creditUsage.breakdown.bg}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: PAYMENT */}
            <div className="mb-10">
              <h2 className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px] mb-4">
                Payment method
              </h2>
              
              <div className="flex justify-between items-center pb-6 border-b border-[#F0F0F0] dark:border-[#1A1A1A]">
                {hasSubscription ? (
                  <>
                    <div>
                      <div className="text-base text-[#18181B] dark:text-[#FAFAFA] flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Managed via Stripe</span>
                      </div>
                      <p className="text-[13px] text-[#52525B] mt-0.5">
                        Click update to manage payment methods
                      </p>
                    </div>
                    
                    <button 
                      onClick={handleManageSubscription}
                      disabled={portalMutation.isPending}
                      className="text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] underline decoration-transparent hover:decoration-current transition-all flex items-center gap-1"
                      data-testid="button-update-payment"
                    >
                      {portalMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>Update <ExternalLink className="h-3 w-3" /></>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-[#71717A]">
                    <p className="text-sm">No payment method on file</p>
                    <p className="text-xs mt-1">Subscribe to a plan to add payment method</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: BILLING HISTORY */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px]">
                  History
                </h2>
                {hasSubscription && (
                  <button 
                    onClick={handleManageSubscription}
                    disabled={portalMutation.isPending}
                    className="text-xs text-[#52525B] hover:text-[#18181B] dark:hover:text-[#FAFAFA] underline decoration-transparent hover:decoration-current transition-all flex items-center gap-1"
                  >
                    View invoices <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="space-y-0">
                {hasSubscription ? (
                  <p className="text-sm text-[#71717A] py-3">
                    View and download invoices in the Stripe customer portal
                  </p>
                ) : (
                  <p className="text-sm text-[#71717A] py-3">No billing history yet</p>
                )}
              </div>
            </div>

            {/* SECTION 5: DANGER ZONE */}
            {hasSubscription && (
              <div className="mt-16 pt-6 border-t border-[#F0F0F0] dark:border-[#1A1A1A]">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#71717A]">
                    Cancel subscription
                  </span>
                  <button 
                    onClick={handleManageSubscription}
                    disabled={portalMutation.isPending}
                    className="text-[13px] text-[#DC2626] underline decoration-transparent hover:decoration-current transition-all"
                    data-testid="button-cancel-subscription"
                  >
                    Manage in Stripe
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* MODALS */}
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="absolute inset-0 bg-black/80 backdrop-blur-[1px]"
              />
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  "relative w-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#1A1A1A] rounded-xl p-8 shadow-2xl",
                  activeModal === "plan" && "max-w-[440px]",
                  activeModal === "credits" && "max-w-[400px]",
                  activeModal === "payment" && "max-w-[380px]",
                  activeModal === "cancel" && "max-w-[400px]"
                )}
              >
                {/* Change Plan Modal */}
                {activeModal === "plan" && (
                  <>
                    <h3 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                      {hasSubscription ? 'Manage plan' : 'Choose a plan'}
                    </h3>
                    
                    {productsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#52525B]" />
                      </div>
                    ) : subscriptionProducts.length > 0 ? (
                      <div className="mt-6 space-y-0">
                        {subscriptionProducts.map((product) => (
                          <div 
                            key={product.price_id}
                            onClick={() => setSelectedPriceId(product.price_id)}
                            className="flex justify-between items-center py-4 border-b border-[#E5E5E5] dark:border-[#1A1A1A] cursor-pointer group transition-colors"
                          >
                            <div>
                              <div className="text-[15px] text-[#18181B] dark:text-[#FAFAFA] font-medium">
                                {product.product_name}
                              </div>
                              <div className="text-[13px] text-[#52525B]">
                                {product.product_description || 'Premium features'}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-[15px] text-[#18181B] dark:text-[#FAFAFA]">
                                ${((product.unit_amount || 0) / 100).toFixed(2)}/{product.recurring?.interval || 'mo'}
                              </div>
                              <div className={cn(
                                "h-4 w-4 rounded-full border flex items-center justify-center",
                                selectedPriceId === product.price_id
                                  ? "border-[#18181B] dark:border-[#FAFAFA]" 
                                  : "border-[#D4D4D8] dark:border-[#3F3F46]"
                              )}>
                                {selectedPriceId === product.price_id && (
                                  <div className="h-2 w-2 rounded-full bg-[#18181B] dark:bg-[#FAFAFA]" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-6 py-8 text-center">
                        <p className="text-[#71717A]">No subscription plans available yet.</p>
                        <p className="text-sm text-[#52525B] mt-2">Plans will appear here once configured in Stripe.</p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-8">
                      <button 
                        onClick={handleCloseModal}
                        className="px-5 py-3 text-[14px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors"
                      >
                        Cancel
                      </button>
                      {subscriptionProducts.length > 0 && (
                        <button 
                          onClick={() => {
                            if (selectedPriceId) {
                              handleSubscribe(selectedPriceId);
                            }
                          }}
                          disabled={!selectedPriceId || checkoutMutation.isPending}
                          className="flex-1 bg-[#18181B] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] rounded-lg px-5 py-3 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {checkoutMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Subscribe'
                          )}
                        </button>
                      )}
                    </div>

                    {hasSubscription && (
                      <button 
                        onClick={handleManageSubscription}
                        disabled={portalMutation.isPending}
                        className="w-full mt-4 text-[13px] text-[#52525B] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors flex items-center justify-center gap-1"
                      >
                        Or manage existing subscription in Stripe <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </>
                )}

                {/* Buy Credits Modal */}
                {activeModal === "credits" && (
                  <>
                    <h3 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Buy credits</h3>
                    
                    {productsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#52525B]" />
                      </div>
                    ) : oneTimeProducts.length > 0 ? (
                      <div className="mt-4 space-y-0">
                        {oneTimeProducts.map((product) => (
                          <div 
                            key={product.price_id}
                            onClick={() => setSelectedPriceId(product.price_id)}
                            className="flex justify-between items-center py-3.5 border-b border-[#E5E5E5] dark:border-[#1A1A1A] cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[14px] transition-colors",
                                selectedPriceId === product.price_id ? "text-[#18181B] dark:text-[#FAFAFA]" : "text-[#71717A] group-hover:text-[#18181B] dark:group-hover:text-[#FAFAFA]"
                              )}>
                                {product.product_name} — ${((product.unit_amount || 0) / 100).toFixed(2)}
                              </span>
                            </div>
                            {selectedPriceId === product.price_id && (
                              <Check className="h-4 w-4 text-[#18181B] dark:text-[#FAFAFA]" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 py-8 text-center">
                        <p className="text-[#71717A]">No credit packages available yet.</p>
                        <p className="text-sm text-[#52525B] mt-2">Credit packages will appear here once configured in Stripe.</p>
                      </div>
                    )}

                    {oneTimeProducts.length > 0 && (
                      <button 
                        onClick={() => {
                          if (selectedPriceId) {
                            handleBuyCredits(selectedPriceId);
                          }
                        }}
                        disabled={!selectedPriceId || checkoutMutation.isPending}
                        className="w-full mt-6 bg-[#18181B] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] rounded-lg px-4 py-3.5 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {checkoutMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Purchase'
                        )}
                      </button>
                    )}

                    <button 
                      onClick={handleCloseModal}
                      className="w-full mt-3 text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
