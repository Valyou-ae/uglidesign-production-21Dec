import { useState, useEffect, useRef, createContext, useContext, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import ugliLogo from "@assets/Ugli_Logo_(1)_1766145410500.png";
import {
  initializeGoogleAuth,
  setPriorityCallback,
  renderGoogleButton,
} from "@/lib/google-auth";

interface LoginPopupContextType {
  isOpen: boolean;
  openLoginPopup: (returnTo?: string) => void;
  closeLoginPopup: () => void;
  returnTo: string | null;
}

const LoginPopupContext = createContext<LoginPopupContextType | null>(null);

export function useLoginPopup() {
  const context = useContext(LoginPopupContext);
  if (!context) {
    throw new Error("useLoginPopup must be used within a LoginPopupProvider");
  }
  return context;
}

interface LoginPopupProviderProps {
  children: ReactNode;
}

export function LoginPopupProvider({ children }: LoginPopupProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const openLoginPopup = useCallback((destination?: string) => {
    setReturnTo(destination || null);
    setIsOpen(true);
  }, []);
  
  const closeLoginPopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <LoginPopupContext.Provider value={{ isOpen, openLoginPopup, closeLoginPopup, returnTo }}>
      {children}
      <LoginPopupDialog isOpen={isOpen} onClose={closeLoginPopup} returnTo={returnTo} />
    </LoginPopupContext.Provider>
  );
}

interface LoginPopupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  returnTo: string | null;
}

function LoginPopupDialog({ isOpen, onClose, returnTo }: LoginPopupDialogProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setEmailSent(false);
      setError(null);
      setGoogleButtonReady(false);
      return;
    }

    let unregister: (() => void) | null = null;

    const initializeGoogleButton = async () => {
      try {
        const ready = await initializeGoogleAuth();
        if (!ready) {
          setError("Google Sign-In not available");
          return;
        }

        const handleCredential = async (response: { credential: string }) => {
          setIsLoading(true);
          setError(null);

          try {
            const authResponse = await fetch("/api/auth/google", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({ credential: response.credential }),
            });

            if (authResponse.ok) {
              await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
              onClose();
              setTimeout(() => {
                setLocation(returnTo || "/discover");
              }, 100);
            } else {
              const errorData = await authResponse.json();
              setError(errorData.message || "Authentication failed");
            }
          } catch (err) {
            setError("Authentication failed. Please try again.");
          } finally {
            setIsLoading(false);
          }
        };

        unregister = setPriorityCallback(handleCredential);

        if (googleButtonRef.current) {
          renderGoogleButton(googleButtonRef.current, {
            type: "standard",
            theme: "filled_black",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 300,
          });
          setGoogleButtonReady(true);
        }
      } catch (err) {
        setError("Failed to initialize Google Sign-In");
      }
    };

    const timeoutId = setTimeout(initializeGoogleButton, 100);

    return () => {
      clearTimeout(timeoutId);
      if (unregister) unregister();
    };
  }, [isOpen, onClose, queryClient, setLocation, returnTo]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsEmailLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to send login link");
      }
    } catch (err) {
      setError("Failed to send login link. Please try again.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[420px] p-0 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#333]/50 overflow-hidden rounded-2xl shadow-2xl"
        data-testid="login-popup"
        aria-describedby="login-dialog-description"
      >
        <VisuallyHidden>
          <DialogTitle>Sign in to UGLI</DialogTitle>
          <DialogDescription id="login-dialog-description">
            Sign in with Google or email to access your account
          </DialogDescription>
        </VisuallyHidden>
        
        <div className="p-8 flex flex-col">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={ugliLogo} alt="UGLI" className="h-14 object-contain" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-center text-sm mb-8">
            Sign in to create stunning AI-powered images
          </p>

          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#ed5387]/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-[#ed5387]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Check your email</h3>
              <p className="text-gray-400 text-sm">
                We've sent a login link to <span className="text-white font-medium">{email}</span>
              </p>
              <Button
                variant="ghost"
                onClick={() => setEmailSent(false)}
                className="text-[#ed5387] hover:text-[#ed5387]/80 hover:bg-[#ed5387]/10"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Google Button Container */}
              <div className="flex justify-center min-h-[48px]">
                {/* Fallback button shown until Google renders its button */}
                {!googleButtonReady && (
                  <Button
                    disabled={isLoading}
                    className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-xl shadow-sm transition-all hover:shadow-md"
                    data-testid="button-google-signin-fallback"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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
                    )}
                    Continue with Google
                  </Button>
                )}
                {/* Google button renders here */}
                <div 
                  ref={googleButtonRef} 
                  className={googleButtonReady ? "flex justify-center" : "hidden"}
                  data-testid="google-signin-button"
                />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#333]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#151515] text-gray-500 text-xs uppercase tracking-wider">or continue with email</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailLoading}
                    className="pl-12 h-12 bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 rounded-xl focus:border-[#ed5387] focus:ring-1 focus:ring-[#ed5387] transition-all"
                    data-testid="input-email"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isEmailLoading || !email.trim()}
                  className="w-full h-12 bg-gradient-to-r from-[#ed5387] to-[#D4623A] hover:from-[#A84529] hover:to-[#C4522A] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ed5387]/20"
                  data-testid="button-email-continue"
                >
                  {isEmailLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Send Login Link"
                  )}
                </Button>
              </form>

              {error && (
                <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 px-4 rounded-lg" data-testid="login-error">
                  {error}
                </p>
              )}

              {/* Terms */}
              <p className="text-xs text-center text-gray-500 pt-2">
                By continuing, you agree to our{" "}
                <a href="/help" className="text-[#ed5387] hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/help" className="text-[#ed5387] hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
