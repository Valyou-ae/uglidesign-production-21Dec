import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/Ugli_Logo_(1)_1766145410500.png";

export default function ResetPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const params = new URLSearchParams(searchString);
  const token = params.get('token');
  const email = params.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token, email]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        toast({
          title: "Password reset successful",
          description: data.message,
        });
      } else {
        setError(data.message || "Failed to reset password");
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to reset password",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0A0A0B]">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#ed5387]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#9C27B0]/20 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-[500px] p-12 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img src={logo} alt="Logo" className="h-24 mb-8 object-contain drop-shadow-2xl" />
            
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Create a new <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ed5387] to-[#9C27B0]">
                secure password
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed">
              Choose a strong password to keep your account safe and secure.
            </p>
          </motion.div>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2] rounded-2xl opacity-20 blur-2xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-[#ed5387] to-[#C2185B] rounded-full opacity-20 blur-3xl animate-float-delayed" />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-[440px] space-y-8">
          
          <div className="text-center lg:text-left">
            <img src={logo} alt="Logo" className="h-12 lg:hidden mx-auto mb-6 object-contain" />
            <Link href="/">
              <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary mb-4 group" data-testid="link-back-to-home">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Button>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">Set New Password</h2>
            <p className="text-muted-foreground mt-2">
              {isSuccess 
                ? "Your password has been updated" 
                : "Enter your new password below"}
            </p>
          </div>

          {error && !isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Reset Failed</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>

              <Link href="/forgot-password">
                <Button className="w-full" data-testid="button-request-new-link">
                  Request New Reset Link
                </Button>
              </Link>
            </motion.div>
          ) : isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Password Updated!</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
              </div>

              <Button 
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:brightness-110 text-white font-bold"
                onClick={() => setLocation("/")}
                data-testid="button-go-to-home"
              >
                Go to Home
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              <form onSubmit={handleReset} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      placeholder="Enter new password"
                      type="password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                      required
                      minLength={6}
                      data-testid="input-password"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      placeholder="Confirm new password"
                      type="password"
                      autoComplete="new-password"
                      disabled={isLoading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                      required
                      minLength={6}
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || !token || !email} 
                  className="h-11 rounded-xl bg-gradient-to-r from-[#ed5387] to-[#C2185B] hover:brightness-110 text-white font-bold shadow-lg shadow-[#ed5387]/20 transition-all hover:-translate-y-[1px]"
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Reset Password <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/">
              <span className="font-semibold text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                Go to Home
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
