import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/minimal-modern-wordmark-logo-text-ugli-i_7VuJ3CXPRueyRNWmv9BnCw_YaTvFRB9TpS_XzP-6PzYkA-removebg-preview_1764450493822.png";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Reset link sent",
        description: "Check your email for instructions to reset your password.",
      });
      // Redirect to login after success
      setTimeout(() => setLocation("/login"), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#0A0A0B]">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#B94E30]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#E3B436]/20 rounded-full blur-[120px]" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-[500px] p-12 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img src={logo} alt="Logo" className="h-24 mb-8 object-contain drop-shadow-2xl" />
            
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Recovery made <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B94E30] to-[#E3B436]">
                simple & secure
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed">
              Don't worry, it happens to the best of us. We'll help you get back to creating in no time.
            </p>
          </motion.div>
        </div>

        {/* Abstract floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-[#E3B436] to-[#C99C2A] rounded-2xl opacity-20 blur-2xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-[#B94E30] to-[#8B3A24] rounded-full opacity-20 blur-3xl animate-float-delayed" />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-[440px] space-y-8">
          
          <div className="text-center lg:text-left">
            <img src={logo} alt="Logo" className="h-12 lg:hidden mx-auto mb-6 object-contain" />
            <Link href="/login">
              <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary mb-4 group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Button>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
            <p className="text-muted-foreground mt-2">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={handleReset} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="h-11 rounded-xl bg-gradient-to-r from-[#B94E30] to-[#8B3A24] hover:brightness-110 text-white font-bold shadow-lg shadow-[#B94E30]/20 transition-all hover:-translate-y-[1px]"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login">
              <span className="font-semibold text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                Sign in
              </span>
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-6 w-full text-center text-xs text-muted-foreground flex gap-6 justify-center">
          <Link href="/help" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/help" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/help" className="hover:text-foreground">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
