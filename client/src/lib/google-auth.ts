type CredentialCallback = (response: { credential: string; select_by?: string }) => void;

interface GoogleAuthState {
  initialized: boolean;
  initializing: boolean;
  clientId: string | null;
  credentialCallbacks: Set<CredentialCallback>;
  priorityCallback: CredentialCallback | null;
  readyPromise: Promise<boolean> | null;
}

const state: GoogleAuthState = {
  initialized: false,
  initializing: false,
  clientId: null,
  credentialCallbacks: new Set(),
  priorityCallback: null,
  readyPromise: null,
};

async function waitForGoogleLib(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(true);
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
    }
  });
}

export async function initializeGoogleAuth(): Promise<boolean> {
  if (state.initialized) return true;
  if (state.readyPromise) return state.readyPromise;

  state.readyPromise = (async () => {
    if (state.initializing) {
      while (state.initializing && !state.initialized) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return state.initialized;
    }

    state.initializing = true;

    try {
      const configResponse = await fetch("/api/auth/google-client-id");
      if (!configResponse.ok) {
        console.log("Google Sign-In not configured");
        state.readyPromise = null;
        return false;
      }

      const { clientId } = await configResponse.json();
      if (!clientId) {
        console.log("Google Client ID not available");
        state.readyPromise = null;
        return false;
      }

      state.clientId = clientId;

      const googleReady = await waitForGoogleLib();
      if (!googleReady) {
        console.log("Google Identity Services not loaded");
        state.readyPromise = null;
        return false;
      }

      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (state.priorityCallback) {
            try {
              state.priorityCallback(response);
            } catch (e) {
              console.error("Error in priority callback:", e);
            }
            return;
          }
          
          state.credentialCallbacks.forEach(cb => {
            try {
              cb(response);
            } catch (e) {
              console.error("Error in credential callback:", e);
            }
          });
        },
        auto_select: true,
        cancel_on_tap_outside: false,
        context: "signin",
        itp_support: true,
        use_fedcm_for_prompt: false,
        ux_mode: "popup",
        intermediate_iframe_close_callback: () => {
          console.log("Google One Tap closed");
        },
      });

      state.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize Google Sign-In:", error);
      state.readyPromise = null;
      return false;
    } finally {
      state.initializing = false;
    }
  })();

  return state.readyPromise;
}

export function registerCredentialCallback(callback: CredentialCallback): () => void {
  state.credentialCallbacks.add(callback);
  return () => {
    state.credentialCallbacks.delete(callback);
  };
}

export function setPriorityCallback(callback: CredentialCallback | null): () => void {
  state.priorityCallback = callback;
  return () => {
    if (state.priorityCallback === callback) {
      state.priorityCallback = null;
    }
  };
}

export function showOneTapPrompt(callback?: (notification: {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getMomentType: () => string;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
}) => void): void {
  if (state.initialized && window.google?.accounts?.id) {
    window.google.accounts.id.prompt(callback);
  }
}

export function renderGoogleButton(
  element: HTMLElement,
  config?: {
    type?: string;
    theme?: string;
    size?: string;
    text?: string;
    shape?: string;
    logo_alignment?: string;
    width?: number;
  }
): void {
  if (state.initialized && window.google?.accounts?.id) {
    window.google.accounts.id.renderButton(element, {
      type: config?.type ?? "standard",
      theme: config?.theme ?? "filled_black",
      size: config?.size ?? "large",
      text: config?.text ?? "continue_with",
      shape: config?.shape ?? "rectangular",
      logo_alignment: config?.logo_alignment ?? "left",
      width: config?.width ?? 300,
    });
  }
}

export function cancelOneTap(): void {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.cancel();
  }
}

export function isGoogleAuthReady(): boolean {
  return state.initialized;
}
