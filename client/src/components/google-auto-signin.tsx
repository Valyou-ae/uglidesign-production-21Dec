import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
            ux_mode?: string;
            login_hint?: string;
            hd?: string;
            prompt_parent_id?: string;
            state_cookie_domain?: string;
            intermediate_iframe_close_callback?: () => void;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getMomentType: () => string;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
            getDismissedReason: () => string;
          }) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
          storeCredential: (credential: { id: string; password: string }, callback?: () => void) => void;
          revoke: (hint: string, callback?: (response: { successful: boolean; error?: string }) => void) => void;
          renderButton: (element: HTMLElement, config: {
            type?: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
            width?: number;
          }) => void;
        };
      };
    };
  }
}

interface GoogleAutoSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GoogleAutoSignIn({ onSuccess, onError }: GoogleAutoSignInProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const initializedRef = useRef(false);
  const isAuthenticatingRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (isLoading) return;
    if (isAuthenticated) return;

    const initializeGoogleSignIn = async () => {
      try {
        const configResponse = await fetch("/api/auth/google-client-id");
        if (!configResponse.ok) {
          console.log("Google Sign-In not configured");
          return;
        }
        
        const { clientId } = await configResponse.json();
        if (!clientId) {
          console.log("Google Client ID not available");
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
          console.log("Google Identity Services not loaded");
          return;
        }

        initializedRef.current = true;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (isAuthenticatingRef.current) return;
            isAuthenticatingRef.current = true;

            try {
              console.log("Google sign-in triggered, method:", response.select_by);
              
              const authResponse = await fetch("/api/auth/google", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ credential: response.credential }),
              });

              if (authResponse.ok) {
                console.log("Google sign-in successful");
                await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
                console.log("Auth state refreshed, redirecting to discover");
                onSuccess?.();
                setTimeout(() => {
                  setLocation("/discover");
                }, 100);
              } else {
                const error = await authResponse.json();
                console.error("Google auth failed:", error);
                onError?.(error.message || "Authentication failed");
                isAuthenticatingRef.current = false;
              }
            } catch (error) {
              console.error("Google auth error:", error);
              onError?.("Authentication failed");
              isAuthenticatingRef.current = false;
            }
          },
          auto_select: true,
          cancel_on_tap_outside: false,
          context: "signin",
          itp_support: true,
          use_fedcm_for_prompt: true,
          ux_mode: "popup",
          intermediate_iframe_close_callback: () => {
            console.log("Google One Tap closed");
          },
        });

        window.google.accounts.id.prompt((notification) => {
          const momentType = notification.getMomentType?.() || "unknown";
          
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.log("One Tap not displayed:", reason);
            
            if (reason === "opt_out_or_no_session") {
              console.log("User not logged into Google or opted out");
            } else if (reason === "suppressed_by_user") {
              console.log("User previously dismissed, will retry after cooldown");
            }
          }
          
          if (notification.isSkippedMoment()) {
            const reason = notification.getSkippedReason();
            console.log("One Tap skipped:", reason);
            
            if (reason === "auto_cancel") {
              console.log("Auto-cancelled, will retry");
              setTimeout(() => {
                if (!isAuthenticatingRef.current && window.google?.accounts?.id) {
                  window.google.accounts.id.prompt();
                }
              }, 2000);
            }
          }
          
          if (notification.isDismissedMoment()) {
            console.log("One Tap dismissed:", notification.getDismissedReason());
          }
        });
      } catch (error) {
        console.error("Failed to initialize Google Sign-In:", error);
      }
    };

    initializeGoogleSignIn();

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [setLocation, onSuccess, onError, isLoading, isAuthenticated]);

  return null;
}
