import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import logo from "@assets/background_removed_image__LcvHHcLTd23zHU05GadTg_1764458169732.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (email === "team@ugli.design" && password === "ugli@design") {
        setIsLoading(false);
        setLocation("/home");
      } else {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Invalid credentials",
          description: "Please check your email and password.",
        });
      }
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
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
              Where Ideas <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Come to Life
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed">
              AI-powered creative studio for images, product mockups, and background removal. Ugly name. Gorgeous results.
            </p>
          </motion.div>

          {/* Testimonials / Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex gap-4 items-center mt-8"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-12 rounded-full border-2 border-[#0A0A0B] bg-zinc-800 overflow-hidden">
                  <img 
                    src={`https://i.pravatar.cc/150?img=${i + 10}`} 
                    alt="User" 
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-zinc-400">Trusted by 10,000+ creators</p>
            </div>
          </motion.div>
        </div>

        {/* Abstract floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl opacity-20 blur-2xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 blur-3xl animate-float-delayed" />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-[440px] space-y-8">
          
          <div className="text-center lg:text-left">
            <img src={logo} alt="Logo" className="h-12 lg:hidden mx-auto mb-6 object-contain" />
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="grid gap-6">
            {/* Social Login Buttons */}
            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline" 
                className="h-12 rounded-xl border-input bg-background hover:bg-accent hover:text-accent-foreground w-full opacity-50 cursor-not-allowed"
                disabled={true}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google (Disabled)
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleLogin} className="grid gap-4">
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
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password">
                    <span className="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">
                      Forgot password?
                    </span>
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl pr-10"
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

              <div className="flex items-center space-x-2 my-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                >
                  Remember me for 30 days
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading} 
                className="h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:brightness-110 text-white font-bold shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-[1px]"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup">
              <span className="font-semibold text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline">
                Sign up for free
              </span>
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-6 w-full text-center text-xs text-muted-foreground flex gap-6 justify-center">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
          <a href="#" className="hover:text-foreground">Help Center</a>
        </div>
      </div>
    </div>
  );
}
