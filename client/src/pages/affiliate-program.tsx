import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Copy, 
  DollarSign, 
  Gift, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  BarChart3, 
  Wallet,
  Globe,
  Share2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAffiliate } from "@/hooks/use-affiliate";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AffiliateProgram() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  
  const { user } = useAuth();
  const { totalEarnings, activeReferrals, withdraw, isWithdrawing } = useAffiliate();
  
  const affiliateCode = user?.affiliateCode || "testuser-demo";
  const affiliateLink = `https://aistudio.com/ref/${affiliateCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Your affiliate link has been copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount.",
      });
      return;
    }
    
    if (amount > totalEarnings) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You cannot withdraw more than your available earnings.",
      });
      return;
    }
    
    try {
      await withdraw({
        amount,
        bankName,
        accountNumber,
        accountName,
        routingNumber,
      });
      
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setRoutingNumber("");
      
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been submitted successfully. Funds will be deposited within 3-5 business days.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request.",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Affiliate Program</h1>
              <p className="text-muted-foreground mt-1">Earn 20% recurring commission for every referral</p>
            </div>
            
            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg shadow-green-600/20">
                  <Wallet className="h-4 w-4" />
                  Withdraw Earnings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Withdraw Earnings</DialogTitle>
                  <DialogDescription>
                    Enter your bank account details to receive your payments.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Withdrawal Amount ($)</Label>
                    <Input 
                      id="withdraw-amount" 
                      placeholder="100.00" 
                      type="number"
                      step="0.01"
                      min="1"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      required 
                      data-testid="input-withdraw-amount"
                    />
                    <p className="text-xs text-muted-foreground">Available: ${totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Account Holder Name</Label>
                    <Input 
                      id="account-name" 
                      placeholder="John Doe" 
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      required 
                      data-testid="input-account-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input 
                      id="bank-name" 
                      placeholder="Chase Bank" 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required 
                      data-testid="input-bank-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="routing">Routing Number</Label>
                      <Input 
                        id="routing" 
                        placeholder="123456789" 
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        data-testid="input-routing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account">Account Number</Label>
                      <Input 
                        id="account" 
                        placeholder="000123456789" 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required 
                        data-testid="input-account"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isWithdrawing} data-testid="button-withdraw-submit">
                        {isWithdrawing ? "Submitting..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 md:p-12 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-lg">
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm">Partner Program</Badge>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Earn 20% Commission on All Referrals
                </h2>
                <p className="text-indigo-100 text-lg">
                  Join our affiliate program and start earning recurring revenue. Share your unique link and get paid when people subscribe.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">Recurring Revenue</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">30-Day Cookie</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">Monthly Payouts</span>
                  </div>
                </div>
              </div>
              
              <Card className="w-full md:max-w-sm bg-white/10 border-white/20 backdrop-blur-md shadow-2xl text-white">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Your Affiliate Link</CardTitle>
                  <CardDescription className="text-indigo-200">Share this link to start earning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        readOnly 
                        value={affiliateLink} 
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/50 pr-10 focus-visible:ring-offset-0 focus-visible:ring-white/30"
                      />
                      <Globe className="absolute right-3 top-3 h-4 w-4 text-indigo-200" />
                    </div>
                    <Button onClick={handleCopy} size="icon" className="bg-white text-indigo-600 hover:bg-white/90 shrink-0">
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 gap-2">
                      <Share2 className="h-4 w-4" /> Twitter
                    </Button>
                    <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 gap-2">
                      <Share2 className="h-4 w-4" /> LinkedIn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-earnings">${totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">20%</span> commission rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-referrals">{activeReferrals}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">Lifetime</span> referrals
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8%</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="text-muted-foreground">1,240 total clicks</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$342.00</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next payout on Dec 15
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="referrals">Referrals</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                  <TabsTrigger value="assets">Marketing Assets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>How it works</CardTitle>
                      <CardDescription>Three simple steps to start earning</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold">1</div>
                        <div>
                          <h3 className="font-semibold">Share your link</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Copy your unique referral link and share it on social media, your blog, or directly with friends.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 font-bold">2</div>
                        <div>
                          <h3 className="font-semibold">They subscribe</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            When someone clicks your link, we plant a 30-day cookie. If they sign up for a paid plan within that time, you get credit.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-green-600 dark:text-green-400 font-bold">3</div>
                        <div>
                          <h3 className="font-semibold">You get paid</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Earn 20% of their subscription fee every month for as long as they remain a customer. Payouts are processed monthly.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your latest referral clicks and signups</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { action: "New Signup", user: "alex.m***@gmail.com", date: "2 hours ago", amount: "+$12.00" },
                          { action: "Link Click", user: "From Twitter", date: "5 hours ago", amount: null },
                          { action: "Link Click", user: "From LinkedIn", date: "8 hours ago", amount: null },
                          { action: "Recurring Payment", user: "sarah.j***@company.com", date: "Yesterday", amount: "+$24.00" },
                          { action: "New Signup", user: "mike.t***@studio.io", date: "2 days ago", amount: "+$48.00" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${item.amount ? 'bg-green-500' : 'bg-blue-500'}`} />
                              <div>
                                <p className="text-sm font-medium">{item.action}</p>
                                <p className="text-xs text-muted-foreground">{item.user} • {item.date}</p>
                              </div>
                            </div>
                            {item.amount && (
                              <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {item.amount}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="referrals">
                  <Card>
                    <CardHeader>
                      <CardTitle>Referral History</CardTitle>
                      <CardDescription>List of all users you've referred</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        Detailed referral table would go here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="payouts">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payout History</CardTitle>
                      <CardDescription>Past withdrawals and earnings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        Payout history table would go here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assets">
                  <Card>
                    <CardHeader>
                      <CardTitle>Marketing Assets</CardTitle>
                      <CardDescription>Banners and logos to help you promote</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-dashed border-border">
                          Banner 1 (1200x600)
                        </div>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-dashed border-border">
                          Banner 2 (1080x1080)
                        </div>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-dashed border-border">
                          Logo Pack
                        </div>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-dashed border-border">
                          Email Templates
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Starter Plan ($15/mo)</span>
                    <span className="font-bold text-green-600">$3.00/mo</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[20%]" />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm">Pro Plan ($45/mo)</span>
                    <span className="font-bold text-green-600">$9.00/mo</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[20%]" />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm">Team Plan ($99/mo)</span>
                    <span className="font-bold text-green-600">$19.80/mo</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[20%]" />
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    * Commissions are paid out monthly for as long as the user remains subscribed.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Have questions about the affiliate program? Contact our partner support team.
                  </p>
                  <Button variant="outline" className="w-full">Contact Partner Support</Button>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}