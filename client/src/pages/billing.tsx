import { useState } from "react";
import { 
  Download, 
  ChevronRight, 
  Check,
  CreditCard,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";

export default function Billing() {
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<"plan" | "credits" | "payment" | "cancel" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("Business");
  const [selectedCreditPackage, setSelectedCreditPackage] = useState("1000");

  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.getStats,
    staleTime: 1000 * 60 * 5,
  });

  const currentPlan = {
    name: "Free",
    price: 0,
    credits: 100,
    renewalDate: "Demo Mode",
    status: "Demo"
  };

  const creditUsage = {
    total: currentPlan.credits,
    used: stats?.total ?? 0,
    breakdown: {
      images: stats?.images ?? 0,
      mockups: stats?.mockups ?? 0,
      bg: stats?.bgRemoved ?? 0
    }
  };

  const paymentMethod: { last4: string; expiry: string } | null = null;

  const invoices: { id: number; desc: string; date: string; amount: string }[] = [];

  const handleCloseModal = () => setActiveModal(null);

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
                      {currentPlan.name}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#52525B]" />
                    <span className="text-sm text-[#52525B]">{currentPlan.status}</span>
                  </div>
                  <p className="text-sm text-[#71717A] mt-1">
                    {currentPlan.credits.toLocaleString()} credits per month
                  </p>
                  <p className="text-[13px] text-[#52525B] mt-3">
                    Renews {currentPlan.renewalDate}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-[28px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                      ${currentPlan.price}
                    </span>
                    <span className="text-base text-[#52525B]">/mo</span>
                  </div>
                  <button 
                    onClick={() => setActiveModal("plan")}
                    className="text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] mt-2 underline decoration-transparent hover:decoration-current transition-all"
                  >
                    Change plan
                  </button>
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
                  >
                    Buy credits
                  </button>
                </div>

                <div className="h-1 w-full bg-[#E5E5E5] dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${(creditUsage.used / creditUsage.total) * 100}%` }}
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
                {paymentMethod ? (
                  <>
                    <div>
                      <div className="text-base text-[#18181B] dark:text-[#FAFAFA] flex items-center gap-2">
                        <span>•••• {paymentMethod.last4}</span>
                      </div>
                      <p className="text-[13px] text-[#52525B] mt-0.5">
                        Expires {paymentMethod.expiry}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setActiveModal("payment")}
                      className="text-[13px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] underline decoration-transparent hover:decoration-current transition-all"
                    >
                      Update
                    </button>
                  </>
                ) : (
                  <div className="text-[#71717A]">
                    <p className="text-sm">No payment method on file</p>
                    <p className="text-xs mt-1">Currently using free plan</p>
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
                <button className="text-xs text-[#52525B] hover:text-[#18181B] dark:hover:text-[#FAFAFA] underline decoration-transparent hover:decoration-current transition-all">
                  Download all
                </button>
              </div>

              <div className="space-y-0">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center py-3 group">
                      <div className="flex items-center">
                        <span className="text-[14px] text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#FAFAFA] transition-colors">
                          {invoice.desc}
                        </span>
                        <span className="text-[13px] text-[#52525B] ml-4">
                          {invoice.date}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-[14px] text-[#A1A1AA] group-hover:text-[#18181B] dark:group-hover:text-[#FAFAFA] transition-colors">
                          {invoice.amount}
                        </span>
                        <button className="ml-4 text-[#52525B] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors p-1">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#71717A] py-3">No billing history yet</p>
                )}
              </div>
            </div>

            {/* SECTION 5: DANGER ZONE */}
            <div className="mt-16 pt-6 border-t border-[#F0F0F0] dark:border-[#1A1A1A]">
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-[#71717A]">
                  Cancel subscription
                </span>
                <button 
                  onClick={() => setActiveModal("cancel")}
                  className="text-[13px] text-[#DC2626] underline decoration-transparent hover:decoration-current transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

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
                  activeModal === "plan" && "max-w-[400px]",
                  activeModal === "credits" && "max-w-[360px]",
                  activeModal === "payment" && "max-w-[380px]",
                  activeModal === "cancel" && "max-w-[400px]"
                )}
              >
                {/* Change Plan Modal */}
                {activeModal === "plan" && (
                  <>
                    <h3 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Change plan</h3>
                    
                    <div className="mt-6 space-y-0">
                      {[
                        { name: "Free", credits: "100 credits", price: "$0" },
                        { name: "Pro", credits: "2,000 credits", price: "$29", disabled: true },
                        { name: "Business", credits: "10,000 credits", price: "$79" }
                      ].map((plan) => (
                        <div 
                          key={plan.name}
                          onClick={() => !plan.disabled && setSelectedPlan(plan.name)}
                          className={cn(
                            "flex justify-between items-center py-4 border-b border-[#E5E5E5] dark:border-[#1A1A1A] cursor-pointer group transition-colors",
                            plan.disabled && "opacity-50 cursor-default"
                          )}
                        >
                          <div>
                            <div className="text-[15px] text-[#18181B] dark:text-[#FAFAFA] font-medium">{plan.name}</div>
                            <div className="text-[13px] text-[#52525B]">{plan.credits}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-[15px] text-[#18181B] dark:text-[#FAFAFA]">{plan.price}</div>
                            <div className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center",
                              selectedPlan === plan.name && !plan.disabled
                                ? "border-[#18181B] dark:border-[#FAFAFA]" 
                                : "border-[#D4D4D8] dark:border-[#3F3F46]"
                            )}>
                              {selectedPlan === plan.name && !plan.disabled && (
                                <div className="h-2 w-2 rounded-full bg-[#18181B] dark:bg-[#FAFAFA]" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button 
                        onClick={handleCloseModal}
                        className="px-5 py-3 text-[14px] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          toast({ title: "Plan updated", description: `Switched to ${selectedPlan} plan.` });
                          handleCloseModal();
                        }}
                        className="flex-1 bg-[#18181B] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] rounded-lg px-5 py-3 text-[14px] font-medium hover:opacity-90 transition-opacity"
                      >
                        Confirm
                      </button>
                    </div>
                  </>
                )}

                {/* Buy Credits Modal */}
                {activeModal === "credits" && (
                  <>
                    <h3 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Buy credits</h3>
                    
                    <div className="mt-4 space-y-0">
                      {[
                        { id: "500", label: "500 credits", price: 19 },
                        { id: "1000", label: "1,000 credits", price: 35 },
                        { id: "2500", label: "2,500 credits", price: 79 }
                      ].map((pkg) => (
                        <div 
                          key={pkg.id}
                          onClick={() => setSelectedCreditPackage(pkg.id)}
                          className="flex justify-between items-center py-3.5 border-b border-[#E5E5E5] dark:border-[#1A1A1A] cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[14px] transition-colors",
                              selectedCreditPackage === pkg.id ? "text-[#18181B] dark:text-[#FAFAFA]" : "text-[#71717A] group-hover:text-[#18181B] dark:group-hover:text-[#FAFAFA]"
                            )}>
                              {pkg.label} — ${pkg.price}
                            </span>
                          </div>
                          {selectedCreditPackage === pkg.id && (
                            <Check className="h-4 w-4 text-[#18181B] dark:text-[#FAFAFA]" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-between items-baseline">
                      <span className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA]">Total: $35</span>
                    </div>

                    <button 
                      onClick={() => {
                        toast({ title: "Credits purchased", description: "1,000 credits added to your account." });
                        handleCloseModal();
                      }}
                      className="w-full mt-4 bg-[#18181B] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] rounded-lg px-4 py-3.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
                    >
                      Purchase
                    </button>
                  </>
                )}

                {/* Update Payment Modal */}
                {activeModal === "payment" && (
                  <>
                    <h3 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Update payment</h3>
                    
                    <div className="mt-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px]">Card number</label>
                        <input 
                          type="text" 
                          placeholder="•••• •••• •••• ••••" 
                          className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#2A2A30] py-3 text-[14px] text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-primary transition-colors placeholder:text-[#52525B]"
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px]">Expiry</label>
                          <input 
                            type="text" 
                            placeholder="MM / YY" 
                            className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#2A2A30] py-3 text-[14px] text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-primary transition-colors placeholder:text-[#52525B]"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px]">CVC</label>
                          <input 
                            type="text" 
                            placeholder="123" 
                            className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#2A2A30] py-3 text-[14px] text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-primary transition-colors placeholder:text-[#52525B]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-[1px]">Name on card</label>
                        <input 
                          type="text" 
                          placeholder="John Doe" 
                          className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#2A2A30] py-3 text-[14px] text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-primary transition-colors placeholder:text-[#52525B]"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        toast({ title: "Payment updated", description: "Your payment method has been updated." });
                        handleCloseModal();
                      }}
                      className="w-full mt-8 bg-[#18181B] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] rounded-lg px-4 py-3.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
                    >
                      Save
                    </button>
                  </>
                )}

                {/* Cancel Subscription Modal */}
                {activeModal === "cancel" && (
                  <>
                    <h3 className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">Cancel subscription</h3>
                    
                    <p className="mt-4 text-[14px] text-[#71717A] leading-[1.6]">
                      Your Pro plan will remain active until Jan 15, 2025. After that, you'll be downgraded to Free.
                    </p>

                    <div className="flex gap-3 mt-8">
                      <button 
                        onClick={() => {
                          toast({ title: "Subscription cancelled", description: "We're sorry to see you go.", variant: "destructive" });
                          handleCloseModal();
                        }}
                        className="px-5 py-3 text-[14px] text-[#DC2626] hover:opacity-80 transition-opacity"
                      >
                        Cancel anyway
                      </button>
                      <button 
                        onClick={handleCloseModal}
                        className="flex-1 bg-[#18181B] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] rounded-lg px-5 py-3 text-[14px] font-medium hover:opacity-90 transition-opacity"
                      >
                        Keep subscription
                      </button>
                    </div>
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
