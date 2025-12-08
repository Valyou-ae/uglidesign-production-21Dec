import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import logo from "@assets/background_removed_image__LcvHHcLTd23zHU05GadTg_1764458169732.png";

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

  const openLoginPopup = (destination?: string) => {
    setReturnTo(destination || null);
    setIsOpen(true);
  };
  
  const closeLoginPopup = () => {
    setIsOpen(false);
  };

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
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
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
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
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

  const handleManualGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-background border-border" data-testid="login-popup">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="UGLI" className="h-16 object-contain" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Sign in to continue
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Create stunning AI-powered images and mockups
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="flex justify-center" ref={googleButtonRef} data-testid="google-signin-button">
            {!initializedRef.current && (
              <Button
                onClick={handleManualGoogleSignIn}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium"
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

          {error && (
            <p className="text-sm text-red-500 text-center" data-testid="login-error">
              {error}
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground pt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

