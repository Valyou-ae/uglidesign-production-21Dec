import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/minimal-modern-wordmark-logo-text-ugli-i_7VuJ3CXPRueyRNWmv9BnCw_YaTvFRB9TpS_XzP-6PzYkA-removebg-preview_1764450493822.png";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure both passwords are the same.",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Account created!",
        description: "Welcome to AI Creative Studio.",
      });
      setLocation("/home");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#0A0A0B]">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-pink-600/20 rounded-full blur-[120px]" />
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
              Start your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                creative journey
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed">
              Create an account today and get access to powerful AI tools for generating images, mockups, and designs.
            </p>
          </motion.div>

          {/* Features List */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-4 mt-4"
          >
            {[
              "Access to 5+ AI Generation Models",
              "Unlimited Background Removal",
              "Professional Mockup Library",
              "Cloud Storage for Projects"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                {feature}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Abstract floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl opacity-20 blur-2xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 blur-3xl animate-float-delayed" />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-background relative overflow-y-auto">
        <div className="w-full max-w-[440px] space-y-6 md:space-y-8 py-4 md:py-8">
          
          <div className="text-center lg:text-left">
            <img src={logo} alt="Logo" className="h-10 md:h-12 lg:hidden mx-auto mb-4 md:mb-6 object-contain" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Enter your details to get started for free
            </p>
          </div>

          <div className="grid gap-4 md:gap-6">
            <form onSubmit={handleSignup} className="grid gap-3 md:gap-4">
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    type="text"
                    autoComplete="name"
                    disabled={isLoading}
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 h-10 md:h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5 md:gap-2">
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
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-10 md:h-11 rounded-xl"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 h-10 md:h-11 rounded-xl pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 h-10 md:h-11 rounded-xl pr-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="h-10 md:h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:brightness-110 text-white font-bold shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-[1px] mt-2"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="font-semibold text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                Sign in
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
