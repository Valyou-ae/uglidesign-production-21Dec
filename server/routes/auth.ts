import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { authRateLimiter } from "../rateLimiter";
import { verifyGoogleToken } from "../googleAuth";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export function registerAuthRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  app.get("/api/auth/user", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
          profileImageUrl: user.profileImageUrl,
          socialLinks: user.socialLinks || [],
          affiliateCode: user.affiliateCode,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      logger.error("Error fetching user", error, { source: "auth" });
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
          profileImageUrl: user.profileImageUrl,
          socialLinks: user.socialLinks || [],
          affiliateCode: user.affiliateCode,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== GOOGLE AUTH ROUTES ==============

  app.get("/api/auth/google-client-id", async (_req: Request, res: Response) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(404).json({ message: "Google Sign-In not configured" });
      }
      res.json({ clientId });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/google", authRateLimiter, async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ message: "Missing credential" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ message: "Google Sign-In not configured" });
      }

      // Securely verify the JWT token with RSA-256 signature verification
      const payload = await verifyGoogleToken(credential, clientId);

      if (!payload) {
        return res.status(401).json({ message: "Invalid or expired Google token" });
      }

      const { email, name, picture, sub: googleId } = payload;

      if (!email) {
        return res.status(400).json({ message: "Email not provided by Google" });
      }

      // Helper function to retry database operations on DNS failures
      const retryDbOperation = async <T>(operation: () => Promise<T>, maxRetries = 5): Promise<T> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error: unknown) {
            const err = error as { message?: string; code?: string };
            const isDnsError = err?.message?.includes('EAI_AGAIN') ||
                               err?.message?.includes('ENOTFOUND') ||
                               err?.code === 'EAI_AGAIN' ||
                               err?.message?.includes('helium');
            if (isDnsError && attempt < maxRetries) {
              const delay = attempt * 1000;
              logger.info(`DNS error on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms...`, { source: "auth" });
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw error;
          }
        }
        throw new Error('Max retries exceeded');
      };

      // Check if user exists by email (with retry)
      let user = await retryDbOperation(() => storage.getUserByEmail(email));

      if (!user) {
        // Create new user using upsertUser for full field support (with retry)
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);
        user = await retryDbOperation(() => storage.upsertUser({
          id: googleId,
          email,
          username,
          displayName: name || username,
          profileImageUrl: picture || null,
          role: 'user',
        }));
      } else {
        // Update existing user's profile image and display name from Google if not set
        const updates: Record<string, string | null> = {};

        // Check if user has a custom uploaded profile image (local path)
        const hasCustomUpload = user.profileImageUrl?.startsWith('/attached_assets/');

        // Update Google profile picture only if user doesn't have one, or if they're using a Google URL (not custom upload)
        if (picture && !hasCustomUpload && user.profileImageUrl !== picture) {
          updates.profileImageUrl = picture;
        }

        if (name && !user.displayName) {
          updates.displayName = name;
        }

        if (Object.keys(updates).length > 0) {
          user = await retryDbOperation(() => storage.updateUserProfile(user!.id, updates)) || user;
        }
      }

      // Set up passport session using req.login()
      const userSession = {
        claims: {
          sub: user.id,
          email: user.email,
          name: user.displayName,
        },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
      };

      await new Promise<void>((resolve, reject) => {
        (req as AuthenticatedRequest & { login: Function }).login(userSession, (err: Error | null) => {
          if (err) {
            logger.error("Login error", err, { source: "auth" });
            reject(err);
          } else {
            resolve();
          }
        });
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        }
      });
    } catch (error: unknown) {
      logger.error("Google auth error", error, { source: "auth" });
      const err = error as { message?: string; stack?: string };
      const errorMessage = err?.message || "Unknown error";
      res.status(500).json({
        message: "Authentication failed",
        detail: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
      });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest & { session?: { destroy: (cb: (err?: Error) => void) => void } };
    if (authReq.session) {
      authReq.session.destroy((err) => {
        if (err) {
          logger.error("Session destroy error", err, { source: "auth" });
        }
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax"
        });
        res.json({ success: true });
      });
    } else {
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax"
      });
      res.json({ success: true });
    }
  });
}
