import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import logo from "@assets/background_removed_image__LcvHHcLTd23zHU05GadTg_1764458169732.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/home");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0A0A0B]">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#B94E30]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#E3B436]/20 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-[500px] p-12 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img src={logo} alt="Logo" className="h-24 mb-8 object-contain drop-shadow-2xl" />
            
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Where Ideas <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B94E30] to-[#E3B436]">
                Come to Life
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed">
              AI-powered creative studio for images, product mockups, and background removal. Ugly name. Gorgeous results.
            </p>
          </motion.div>

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

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-[#E3B436] to-[#C99C2A] rounded-2xl opacity-20 blur-2xl animate-float" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-[#B94E30] to-[#8B3A24] rounded-full opacity-20 blur-3xl animate-float-delayed" />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-[440px] space-y-8">
          
          <div className="text-center lg:text-left">
            <img src={logo} alt="Logo" className="h-12 lg:hidden mx-auto mb-6 object-contain" />
            <h2 className="text-3xl font-bold tracking-tight">Welcome</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to access your creative studio
            </p>
          </div>

          <div className="grid gap-6">
            <Button 
              onClick={handleLogin}
              className="h-14 rounded-xl bg-gradient-to-r from-[#B94E30] to-[#8B3A24] hover:brightness-110 text-white font-bold shadow-lg shadow-[#B94E30]/20 transition-all hover:-translate-y-[1px] text-lg"
              data-testid="button-login"
            >
              <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
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
              Continue with Google
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="/help" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/help" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to UGLI?{" "}
            <button 
              onClick={handleLogin}
              className="font-semibold text-primary hover:text-primary/80 cursor-pointer underline-offset-4 hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>

        <div className="absolute bottom-6 w-full text-center text-xs text-muted-foreground flex gap-6 justify-center">
          <Link href="/help" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/help" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/help" className="hover:text-foreground">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
