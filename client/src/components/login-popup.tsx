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
import logo from "@assets/background_removed_image__LcvHHcLTd23zHU05GadTg_1764458169732.png";
import heroImage from "@assets/generated_images/futuristic_cyberpunk_city_street_at_night_with_neon_lights_and_rain.png";

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
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      setEmail("");
      setEmailSent(false);
      setError(null);
      return;
    }

    const initializeGoogleButton = async () => {
      if (initializedRef.current) return;

      try {
        const configResponse = await fetch("/api/auth/google-client-id");
        if (!configResponse.ok) {
          setError("Google Sign-In not configured");
          return;
        }

        const { clientId } = await configResponse.json();
        if (!clientId) {
          setError("Google Client ID not available");
          return;
        }

        const waitForGoogle = () => {
          return new Promise<void>((resolve) => {
            if (window.google?.accounts?.id) {
              resolve();
            } else {
              const checkInterval = setInterval(() => {
                if (window.google?.accounts?.id) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 50);

              setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
              }, 5000);
            }
          });
        };

        await waitForGoogle();

        if (!window.google?.accounts?.id) {
          setError("Google services not available");
          return;
        }

        initializedRef.current = true;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
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
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          ux_mode: "popup",
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "filled_black",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 300,
          });
        }
      } catch (err) {
        setError("Failed to initialize Google Sign-In");
      }
    };

    const timeoutId = setTimeout(initializeGoogleButton, 100);

    return () => {
      clearTimeout(timeoutId);
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
        className="sm:max-w-[800px] p-0 bg-[#1a1a1a] border-[#333] overflow-hidden"
        data-testid="login-popup"
        aria-describedby="login-dialog-description"
      >
        <VisuallyHidden>
          <DialogTitle>Sign in to UGLI</DialogTitle>
          <DialogDescription id="login-dialog-description">
            Sign in with Google or email to access your account
          </DialogDescription>
        </VisuallyHidden>
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* Left Side - Login Form */}
          <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex justify-center lg:justify-start mb-8">
              <img src={logo} alt="UGLI" className="h-12 object-contain" />
            </div>

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-bold text-white text-center lg:text-left mb-2">
              Welcome to UGLI
            </h2>
            <p className="text-gray-400 text-center lg:text-left mb-8">
              Create stunning AI-powered images and mockups
            </p>

            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#B94E30]/20 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-[#B94E30]" />
                </div>
                <h3 className="text-lg font-semibold text-white">Check your email</h3>
                <p className="text-gray-400 text-sm">
                  We've sent a login link to <span className="text-white">{email}</span>
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setEmailSent(false)}
                  className="text-[#B94E30] hover:text-[#B94E30]/80"
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Google Button */}
                <div 
                  ref={googleButtonRef} 
                  className="flex justify-center"
                  data-testid="google-signin-button"
                >
                  {!initializedRef.current && (
                    <Button
                      disabled={isLoading}
                      className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-medium rounded-lg"
                      data-testid="button-google-signin"
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
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#1a1a1a] text-gray-500">or</span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isEmailLoading}
                        className="pl-10 h-12 bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:border-[#B94E30] focus:ring-[#B94E30]"
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isEmailLoading || !email.trim()}
                    className="w-full h-12 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
                    data-testid="button-email-continue"
                  >
                    {isEmailLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>

                {error && (
                  <p className="text-sm text-red-500 text-center" data-testid="login-error">
                    {error}
                  </p>
                )}

                {/* Terms */}
                <p className="text-xs text-center text-gray-500 pt-4">
                  By proceeding, you agree to our{" "}
                  <a href="/help" className="text-[#B94E30] hover:underline">
                    Terms of use
                  </a>{" "}
                  Read our{" "}
                  <a href="/help" className="text-[#B94E30] hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Hero Image */}
          <div className="hidden lg:block w-[350px] relative">
            <img
              src={heroImage}
              alt="Creative artwork"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#1a1a1a]/50" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
