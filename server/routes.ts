import type { Express } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import sharp from "sharp";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  authRateLimiter, 
  passwordResetLimiter, 
  generationRateLimiter, 
  guestGenerationLimiter,
  adminRateLimiter 
} from "./rateLimiter";
import {
  insertImageSchema,
  insertWithdrawalSchema,
  withdrawalRequestSchema,
  updateProfileSchema,
  insertContactSchema,
  insertDealSchema,
  insertActivitySchema,
  insertPromptFavoriteSchema,
  insertMoodBoardSchema,
  insertMoodBoardItemSchema,
  guestGenerations,
  uuidSchema,
  promptSchema,
  guestGenerationSchema,
  createMoodBoardSchema,
  updateRoleSchema,
  insertImageFolderSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { getFromCache, CACHE_TTL, invalidateCache } from "./cache";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check endpoints for load balancer and Kubernetes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', async (_req, res) => {
    try {
      // Test database connectivity
      await db.execute(sql`SELECT 1`);
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: { database: 'ok' }
      });
    } catch (error) {
      res.status(503).json({
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        checks: { database: 'failed' }
      });
    }
  });

  // Gemini API key stats endpoint for monitoring (admin-only)
  app.get('/api/admin/gemini-stats', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { keyManager } = await import('./services/gemini');
      const stats = keyManager.getStats();

      res.json({
        ...stats,
        timestamp: new Date().toISOString(),
        estimatedCapacity: {
          // Image generation is limited by IPM (images per minute), not RPM
          paidTier1_IPM: stats.availableKeys * 10,      // ~10 images/min per key
          paidTier1_RPM: stats.availableKeys * 1000,    // ~1000 requests/min per key
          tier2_IPM: stats.availableKeys * 50,          // Estimated higher IPM
          enterprise_IPM: stats.availableKeys * 500,    // Custom enterprise limits
        }
      });
    } catch (error) {
      console.error("Gemini stats error:", error);
      res.status(500).json({ message: "Failed to get Gemini stats" });
    }
  });

  // Serve attached_assets folder for user-uploaded images
  app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

  await setupAuth(app);

  const isTestMode = process.env.TEST_MODE === "true";
  const TEST_USER_ID = "86375c89-623d-4e4f-b05b-056bc1663bf5";

  // Credit costs for different operations
  const CREDIT_COSTS = {
    DRAFT_GENERATION: 0,
    FINAL_GENERATION: 2,
    SINGLE_GENERATION: 1,
    MOCKUP_GENERATION: 3,
    BG_REMOVAL_STANDARD: 1,
    BG_REMOVAL_HIGH: 2,
    BG_REMOVAL_ULTRA: 4,
  } as const;

  // Helper to safely parse and validate pagination parameters
  const parsePagination = (query: { limit?: string; offset?: string; page?: string }, defaults: { limit: number; maxLimit: number }) => {
    const limit = Math.min(Math.max(1, parseInt(query.limit as string) || defaults.limit), defaults.maxLimit);
    let offset = 0;
    if (query.page) {
      const page = Math.max(1, parseInt(query.page as string) || 1);
      offset = (page - 1) * limit;
    } else if (query.offset) {
      offset = Math.max(0, parseInt(query.offset as string) || 0);
    }
    // Cap offset to prevent excessive values
    offset = Math.min(offset, 100000);
    return { limit, offset };
  };

  // Helper to check and deduct credits
  const checkAndDeductCredits = async (
    userId: string, 
    cost: number,
    operationType: string
  ): Promise<{ success: boolean; credits?: number; error?: string }> => {
    if (cost === 0) {
      return { success: true };
    }
    
    const currentCredits = await storage.getUserCredits(userId);
    
    if (currentCredits < cost) {
      return { 
        success: false, 
        credits: currentCredits,
        error: `Insufficient credits. You need ${cost} credits for ${operationType}, but only have ${currentCredits}.`
      };
    }
    
    const updatedUser = await storage.deductCredits(userId, cost);
    return { 
      success: true, 
      credits: updatedUser?.credits ?? currentCredits - cost 
    };
  };

  // Safe error message sanitizer - prevents leaking sensitive info
  const getSafeErrorMessage = (error: unknown, fallback: string = "An error occurred"): string => {
    if (!(error instanceof Error)) {
      return fallback;
    }
    
    const message = error.message;
    
    const sensitivePatterns = [
      /at\s+\S+\s+\(/i,
      /\/[\w\/]+\.\w+/,
      /password|secret|key|token/i,
      /database|sql|query/i,
      /eai_again|enotfound|econnrefused/i,
      /helium|neon/i,
      /internal server/i,
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(message)) {
        console.error("Sanitized error (sensitive pattern detected):", message);
        return fallback;
      }
    }
    
    const safePatterns = [
      /insufficient credits/i,
      /invalid.*input/i,
      /not found/i,
      /unauthorized/i,
      /too many requests/i,
      /generation failed/i,
      /image.*required/i,
      /prompt.*required/i,
    ];
    
    for (const pattern of safePatterns) {
      if (pattern.test(message)) {
        return message;
      }
    }
    
    if (message.length < 100 && !/[\/\\]/.test(message)) {
      return message;
    }
    
    return fallback;
  };

  const requireAuth = (req: any, res: any, next: any) => {
    if (isTestMode) {
      req.user = req.user || { claims: { sub: TEST_USER_ID } };
      return next();
    }
    return isAuthenticated(req, res, next);
  };

  const getUserId = (req: any): string => {
    if (isTestMode) {
      return TEST_USER_ID;
    }
    return req.user?.claims?.sub;
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    requireAuth(req, res, async () => {
      try {
        const userId = getUserId(req);
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (user.role !== 'admin') {
          return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }
        
        next();
      } catch (error) {
        console.error("Admin auth error:", error);
        res.status(500).json({ message: "Authentication error" });
      }
    });
  };

  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    requireAuth(req, res, async () => {
      try {
        const userId = getUserId(req);
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (user.role !== 'super_admin') {
          return res.status(403).json({ message: "Access denied. Super Admin privileges required." });
        }
        
        next();
      } catch (error) {
        console.error("Super Admin auth error:", error);
        res.status(500).json({ message: "Authentication error" });
      }
    });
  };

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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

  app.get("/api/auth/google-client-id", async (_req, res) => {
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

  app.post("/api/auth/google", authRateLimiter, async (req: any, res) => {
    try {
      const { credential } = req.body;
      
      if (!credential) {
        return res.status(400).json({ message: "Missing credential" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ message: "Google Sign-In not configured" });
      }

      // Decode and verify the JWT token
      const parts = credential.split('.');
      if (parts.length !== 3) {
        return res.status(400).json({ message: "Invalid token format" });
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      
      // Verify the token is for our client
      if (payload.aud !== clientId) {
        return res.status(401).json({ message: "Invalid token audience" });
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return res.status(401).json({ message: "Token expired" });
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
          } catch (error: any) {
            const isDnsError = error?.message?.includes('EAI_AGAIN') || 
                               error?.message?.includes('ENOTFOUND') ||
                               error?.code === 'EAI_AGAIN' ||
                               error?.message?.includes('helium');
            if (isDnsError && attempt < maxRetries) {
              const delay = attempt * 1000; // 1s, 2s, 3s, 4s delays
              console.log(`DNS error on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms...`);
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
        const updates: any = {};
        
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
        req.login(userSession, (err: any) => {
          if (err) {
            console.error("Login error:", err);
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
    } catch (error: any) {
      console.error("Google auth error:", error);
      const errorMessage = error?.message || "Unknown error";
      res.status(500).json({ 
        message: "Authentication failed", 
        detail: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
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

  // ============== USER/PROFILE ROUTES ==============

  app.patch("/api/user/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profileData = updateProfileSchema.parse(req.body);

      const user = await storage.updateUserProfile(userId, profileData);

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
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Profile photo upload endpoint (accepts base64 encoded image)
  app.post("/api/user/profile/photo", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { photo, fileName, mimeType } = req.body;
      
      if (!photo || !fileName) {
        return res.status(400).json({ message: "No photo data provided" });
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
        return res.status(400).json({ message: "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed." });
      }
      
      // Extract base64 data (remove data URL prefix if present)
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const fileData = Buffer.from(base64Data, 'base64');
      
      // Validate file size (2MB limit)
      if (fileData.length > 2 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large. Maximum size is 2MB." });
      }
      
      // Generate unique filename
      const fs = await import('fs/promises');
      const extension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `profile_${userId}_${Date.now()}.${extension}`;
      const uploadDir = path.resolve(process.cwd(), 'attached_assets', 'profile_photos');
      
      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Save file
      const filePath = path.join(uploadDir, uniqueFileName);
      await fs.writeFile(filePath, fileData);
      
      // Generate URL
      const profileImageUrl = `/attached_assets/profile_photos/${uniqueFileName}`;
      
      // Update user profile
      const user = await storage.updateUserProfile(userId, { profileImageUrl });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        profileImageUrl,
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
      console.error("Profile photo upload error:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Remove profile photo endpoint
  app.delete("/api/user/profile/photo", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Update user profile to remove photo
      const user = await storage.updateUserProfile(userId, { profileImageUrl: null });
      
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
      console.error("Profile photo removal error:", error);
      res.status(500).json({ message: "Failed to remove profile photo" });
    }
  });

  // ============== USER STATS ROUTES ==============

  app.get("/api/user/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      const credits = await storage.getUserCredits(userId);
      res.json({ ...stats, credits });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/user/credits", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const credits = await storage.getUserCredits(userId);
      res.json({ credits });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== STRIPE BILLING ROUTES ==============

  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Stripe config error:", error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  app.get("/api/stripe/products", requireAuth, async (_req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      let products = await stripeService.listProductsWithPrices(true);
      
      if (products.length === 0) {
        await stripeService.syncProductsFromStripe();
        products = await stripeService.listProductsWithPrices(true);
      }
      
      res.json({ products });
    } catch (error) {
      console.error("Stripe products error:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.post("/api/stripe/sync-products", requireAdmin, async (_req, res) => {
    try {
      const { stripeService } = await import("./stripeService");
      const result = await stripeService.syncProductsFromStripe();
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Stripe sync error:", error);
      res.status(500).json({ message: "Failed to sync products" });
    }
  });

  app.post("/api/stripe/create-checkout-session", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { priceId, mode } = req.body;

      if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
        return res.status(400).json({ message: "Valid Price ID is required (must start with 'price_')" });
      }

      const validModes = ['subscription', 'payment'];
      const checkoutMode = validModes.includes(mode) ? mode : 'subscription';

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { stripeService } = await import("./stripeService");
      
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || '', userId);
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/billing?success=true`,
        `${baseUrl}/billing?canceled=true`,
        checkoutMode as 'subscription' | 'payment'
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/create-portal-session", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found. Please subscribe first." });
      }

      const { stripeService } = await import("./stripeService");

      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/billing`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe portal error:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.get("/api/stripe/subscription-status", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeCustomerId) {
        return res.json({ 
          hasSubscription: false,
          subscription: null,
          plan: 'free'
        });
      }

      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        if (user.stripeSubscriptionId) {
          await storage.updateStripeSubscriptionId(userId, null);
        }
        return res.json({ 
          hasSubscription: false,
          subscription: null,
          plan: 'free'
        });
      }

      const subscription = subscriptions.data[0];
      
      if (user.stripeSubscriptionId !== subscription.id) {
        await storage.updateStripeSubscriptionId(userId, subscription.id);
      }

      const planName = subscription.items.data[0]?.price?.product;
      let plan = 'pro';
      if (typeof planName === 'object' && planName !== null && 'name' in planName) {
        plan = (planName.name as string).toLowerCase().includes('business') ? 'business' : 'pro';
      }

      res.json({ 
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: (subscription as any).current_period_end,
          current_period_start: (subscription as any).current_period_start,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        plan
      });
    } catch (error) {
      console.error("Stripe subscription status error:", error);
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // ============== IMAGE ROUTES ==============

  app.post("/api/images", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Auto-assign default folder if no folderId provided
      let folderId = req.body.folderId;
      if (!folderId) {
        const defaultFolder = await storage.getOrCreateDefaultFolder(userId);
        folderId = defaultFolder.id;
      }
      
      const imageData = insertImageSchema.parse({
        ...req.body,
        userId,
        folderId,
      });

      const image = await storage.createImage(imageData);
      
      // Only save to gallery for discover page if image is public
      if (imageData.isPublic) {
        const user = await storage.getUser(userId);
        await storage.createGalleryImage({
          sourceImageId: image.id,
          title: imageData.prompt?.slice(0, 100) || "AI Generated Image",
          imageUrl: imageData.imageUrl,
          creator: user?.displayName || user?.username || "UGLI User",
          category: "ai-generated",
          aspectRatio: imageData.aspectRatio || "1:1",
          prompt: imageData.prompt || "",
        });
      }
      
      // Invalidate gallery cache so new image appears immediately
      await invalidateCache('gallery:images');
      
      res.json({ image });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { limit, offset } = parsePagination(req.query, { limit: 20, maxLimit: 100 });
      const { images, total } = await storage.getImagesByUserId(userId, limit, offset);
      
      // Return images with URL paths instead of full base64 for faster loading
      const optimizedImages = images.map(img => ({
        ...img,
        imageUrl: `/api/images/${img.id}/image`
      }));
      
      res.json({ images: optimizedImages, total, limit, offset, hasMore: offset + images.length < total });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Serve actual image data by ID (lazy loading for performance)
  // Supports both authenticated users and guests via session
  app.get("/api/images/:id/image", async (req: any, res) => {
    try {
      // Get userId from authenticated user (claims.sub) OR guestId from session
      const userId = req.user?.claims?.sub || (req.session as any)?.guestId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const image = await storage.getImageById(req.params.id, userId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Handle base64 data URLs
      const imageUrl = image.imageUrl;
      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          res.set({
            'Content-Type': mimeType,
            'Content-Length': buffer.length,
            'Cache-Control': 'private, max-age=31536000, immutable'
          });
          return res.send(buffer);
        }
      }
      
      // For regular URLs, redirect
      res.redirect(imageUrl);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/favorite", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const image = await storage.toggleImageFavorite(req.params.id, userId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ image });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/images/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const success = await storage.deleteImage(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ message: "Image deleted" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/visibility", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ message: "isPublic must be a boolean" });
      }
      const image = await storage.setImageVisibility(req.params.id, userId, isPublic);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      // Invalidate gallery cache to reflect visibility change
      await invalidateCache('gallery:images');
      res.json({ image });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/public", async (req: any, res) => {
    try {
      const { limit } = parsePagination(req.query, { limit: 50, maxLimit: 100 });
      const images = await storage.getPublicImages(limit);
      res.json({ images });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/share/:id", async (req: any, res) => {
    try {
      const image = await storage.getPublicImageById(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found or is private" });
      }
      // Get gallery image ID for like functionality
      const galleryImage = await storage.getGalleryImageBySourceId(req.params.id);
      const likeCount = galleryImage?.likeCount || 0;
      const viewCount = galleryImage?.viewCount || 0;
      const remixCount = galleryImage?.useCount || 0;
      
      // Check if current user has liked this image (if logged in)
      let likedByViewer = false;
      const userId = req.user?.claims?.sub || req.session?.passport?.user?.id;
      if (userId && galleryImage?.id) {
        likedByViewer = await storage.hasUserLikedImage(String(galleryImage.id), userId);
      }
      
      // Increment view count asynchronously
      if (galleryImage?.id) {
        storage.incrementGalleryImageView(String(galleryImage.id)).catch(() => {});
      }
      
      res.json({ 
        image: {
          ...image,
          galleryImageId: galleryImage?.id ? String(galleryImage.id) : null,
          likeCount,
          viewCount: viewCount + 1, // Include the current view
          remixCount,
          likedByViewer
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Track remix when user clicks remix button
  app.post("/api/images/:id/remix", async (req: any, res) => {
    try {
      const galleryImage = await storage.getGalleryImageBySourceId(req.params.id);
      if (galleryImage?.id) {
        await storage.incrementGalleryImageUse(String(galleryImage.id));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/calendar", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const counts = await storage.getImageCountsByMonth(userId, year, month);
      res.json({ counts });
    } catch (error) {
      console.error("Calendar data error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/by-date", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const dateStr = req.query.date as string;
      
      if (!dateStr) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);
      
      const images = await storage.getImagesByDateRange(userId, startDate, endDate);
      res.json({ images });
    } catch (error) {
      console.error("Images by date error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== IMAGE FOLDERS ROUTES ==============

  app.get("/api/folders/default", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const folder = await storage.getOrCreateDefaultFolder(userId);
      res.json({ folder });
    } catch (error) {
      console.error("Get default folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/folders", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const folders = await storage.getFoldersByUser(userId);
      res.json({ folders });
    } catch (error) {
      console.error("Get folders error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/folders", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = insertImageFolderSchema.parse({ ...req.body, userId });
      const folder = await storage.createFolder(data);
      res.json({ folder });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      console.error("Create folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/folders/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { name, color } = req.body;
      
      const folder = await storage.updateFolder(id, userId, { name, color });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      res.json({ folder });
    } catch (error) {
      console.error("Update folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/folders/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      await storage.deleteFolder(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/folder", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { folderId } = req.body;
      
      const image = await storage.moveImageToFolder(id, userId, folderId || null);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ image });
    } catch (error) {
      console.error("Move image to folder error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== GALLERY ROUTES ==============

  app.get("/api/gallery", async (req: any, res) => {
    try {
      // Cache gallery images for 5 minutes to reduce DB load
      const images = await getFromCache(
        'gallery:images',
        CACHE_TTL.GALLERY_IMAGES,
        () => storage.getGalleryImages()
      );
      const userId = req.user?.claims?.sub;

      let likedImageIds: string[] = [];
      if (userId) {
        likedImageIds = await storage.getUserLikedImages(userId);
      }

      const imagesWithLikeStatus = images.map(img => ({
        ...img,
        thumbnailUrl: `/api/gallery/${img.id}/thumbnail`,
        isLiked: likedImageIds.includes(img.id)
      }));

      res.json({ images: imagesWithLikeStatus });
    } catch (error) {
      console.error("Gallery error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/gallery/:imageId/like", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { imageId } = req.params;
      
      const result = await storage.likeGalleryImage(imageId, userId);
      invalidateCache('gallery:images');
      res.json(result);
    } catch (error) {
      console.error("Like error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/gallery/:imageId/view", generationRateLimiter, async (req: any, res) => {
    try {
      const { imageId } = req.params;
      
      const image = await storage.incrementGalleryImageView(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      invalidateCache('gallery:images');
      res.json({ viewCount: image.viewCount });
    } catch (error) {
      console.error("View tracking error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/gallery/:imageId/use", requireAuth, async (req: any, res) => {
    try {
      const { imageId } = req.params;
      
      const image = await storage.incrementGalleryImageUse(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      invalidateCache('gallery:images');
      res.json({ useCount: image.useCount });
    } catch (error) {
      console.error("Use tracking error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/gallery/:imageId", async (req: any, res) => {
    try {
      const { imageId } = req.params;
      
      // Try to get from cache first, fall back to direct query
      const cachedImages = await getFromCache(
        'gallery:images',
        CACHE_TTL.GALLERY_IMAGES,
        () => storage.getGalleryImages()
      );
      
      let image = cachedImages.find(img => img.id === imageId);
      if (!image) {
        // If not in cache, try direct query (for newly added images)
        image = await storage.getGalleryImageById(imageId);
      }
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      const userId = req.user?.claims?.sub;
      let isLiked = false;
      if (userId) {
        isLiked = await storage.hasUserLikedImage(imageId, userId);
      }
      
      res.json({ ...image, isLiked });
    } catch (error) {
      console.error("Gallery image error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Serve optimized thumbnail for gallery images (faster loading)
  app.get("/api/gallery/:imageId/thumbnail", async (req: any, res) => {
    try {
      const { imageId } = req.params;
      const width = Math.min(parseInt(req.query.w as string) || 400, 800);
      
      const image = await storage.getGalleryImageById(imageId);
      if (!image || !image.imageUrl) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Handle base64 images
      if (image.imageUrl.startsWith('data:image/')) {
        const base64Data = image.imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const thumbnail = await sharp(buffer)
          .resize(width, undefined, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 75 })
          .toBuffer();
        
        res.set({
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=604800', // Cache for 1 week
        });
        return res.send(thumbnail);
      }
      
      // For URL-based images, redirect
      res.redirect(image.imageUrl);
    } catch (error) {
      console.error("Thumbnail error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== DAILY INSPIRATION ROUTES ==============

  app.get("/api/inspirations", async (req: any, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const inspirations = await storage.getDailyInspirations(limit);
      res.json({ inspirations });
    } catch (error) {
      console.error("Inspirations error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/inspirations/today", async (_req, res) => {
    try {
      const inspiration = await storage.getTodaysInspiration();
      if (!inspiration) {
        return res.status(404).json({ message: "No inspiration available today" });
      }
      res.json(inspiration);
    } catch (error) {
      console.error("Today's inspiration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/inspirations/featured", async (req: any, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      const inspirations = await storage.getFeaturedInspirations(limit);
      res.json({ inspirations });
    } catch (error) {
      console.error("Featured inspirations error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/prompts/recommendations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { analyzeUserProfile, generatePersonalizedPrompts } = await import("./services/profileAnalyzer");
      
      const analysis = await analyzeUserProfile(userId);
      const recommendations = await generatePersonalizedPrompts(analysis);
      
      res.json({ recommendations, analysis: { profileCompleteness: analysis.profileCompleteness } });
    } catch (error) {
      console.error("Personalized prompts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== STYLE TRANSFER ROUTES ==============

  app.get("/api/style-transfer/presets", async (_req, res) => {
    try {
      const { getStylePresets, getStylePresetsByCategory } = await import("./services/styleTransfer");
      const presets = getStylePresets();
      const byCategory = getStylePresetsByCategory();
      res.json({ presets, byCategory });
    } catch (error) {
      console.error("Style presets error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/style-transfer/preset", generationRateLimiter, async (req: any, res) => {
    try {
      const { contentImage, presetId, options } = req.body;

      if (!contentImage || !presetId) {
        return res.status(400).json({ message: "Content image and preset ID are required" });
      }

      const { transferStyleFromPreset } = await import("./services/styleTransfer");

      const styleOptions = {
        styleStrength: options?.styleStrength ?? 0.7,
        preserveContent: options?.preserveContent ?? 0.6,
        outputQuality: options?.outputQuality ?? "high"
      };

      const result = await transferStyleFromPreset(contentImage, presetId, styleOptions);

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Style transfer failed" });
      }

      res.json({ 
        success: true, 
        image: `data:image/png;base64,${result.imageBase64}` 
      });
    } catch (error) {
      console.error("Style transfer preset error:", error);
      res.status(500).json({ message: "Style transfer failed" });
    }
  });

  app.post("/api/style-transfer/custom", generationRateLimiter, async (req: any, res) => {
    try {
      const { contentImage, styleImage, options } = req.body;

      if (!contentImage || !styleImage) {
        return res.status(400).json({ message: "Both content and style images are required" });
      }

      const { transferStyleFromImage } = await import("./services/styleTransfer");

      const styleOptions = {
        styleStrength: options?.styleStrength ?? 0.7,
        preserveContent: options?.preserveContent ?? 0.6,
        outputQuality: options?.outputQuality ?? "high"
      };

      const result = await transferStyleFromImage(contentImage, styleImage, styleOptions);

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Style transfer failed" });
      }

      res.json({ 
        success: true, 
        image: `data:image/png;base64,${result.imageBase64}` 
      });
    } catch (error) {
      console.error("Style transfer custom error:", error);
      res.status(500).json({ message: "Style transfer failed" });
    }
  });

  // ============== AFFILIATE ROUTES ==============

  app.get("/api/affiliate/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const [commissions, totalEarnings, pendingPayout, referredUsers] = await Promise.all([
        storage.getCommissionsByUserId(userId),
        storage.getTotalEarnings(userId),
        storage.getPendingPayout(userId),
        storage.getReferredUsers(userId),
      ]);
      
      res.json({ 
        totalEarnings: totalEarnings / 100,
        pendingPayout: pendingPayout / 100,
        activeReferrals: referredUsers.length,
        commissions: commissions.map(c => ({
          ...c,
          amount: c.amount / 100,
        })),
        referredUsers: referredUsers.map(u => ({
          id: u.id,
          email: u.email,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/affiliate/withdraw", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      // Validate input with strict banking validation
      const validatedInput = withdrawalRequestSchema.parse(req.body);

      // Convert user-entered dollars to cents for storage
      const amountInCents = Math.round(validatedInput.amount * 100);

      // Get pending payout (available for withdrawal) in cents
      const pendingPayout = await storage.getPendingPayout(userId);
      if (amountInCents > pendingPayout) {
        return res.status(400).json({ message: "Withdrawal amount exceeds available balance" });
      }

      const withdrawalData = insertWithdrawalSchema.parse({
        ...validatedInput,
        amount: amountInCents,
        userId,
      });

      const withdrawal = await storage.createWithdrawalRequest(withdrawalData);
      res.json({ withdrawal: { ...withdrawal, amount: withdrawal.amount / 100 } });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/affiliate/withdrawals", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const withdrawals = await storage.getWithdrawalsByUserId(userId);
      // Convert cents to dollars for display
      res.json({ 
        withdrawals: withdrawals.map(w => ({ ...w, amount: w.amount / 100 }))
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== LEADERBOARD ROUTES ==============

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const period = (req.query.period as 'weekly' | 'monthly' | 'all-time') || 'all-time';
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      if (!['weekly', 'monthly', 'all-time'].includes(period)) {
        return res.status(400).json({ message: "Invalid period. Use 'weekly', 'monthly', or 'all-time'" });
      }

      // Cache leaderboard for 1 minute to reduce DB load
      const leaderboard = await getFromCache(
        `leaderboard:${period}:${limit}`,
        CACHE_TTL.LEADERBOARD,
        () => storage.getLeaderboard(period, limit)
      );
      res.json({ leaderboard, period });
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ============== REFERRAL ROUTES ==============

  app.get("/api/referral/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Referral stats error:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  app.post("/api/referral/apply", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { referralCode } = req.body;
      
      if (!referralCode || typeof referralCode !== 'string') {
        return res.status(400).json({ message: "Referral code is required" });
      }
      
      const result = await storage.applyReferralCode(userId, referralCode.trim());
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({ success: true, referrerCredits: 5, message: "Referral code applied! Your referrer earned 5 bonus credits." });
    } catch (error) {
      console.error("Apply referral error:", error);
      res.status(500).json({ message: "Failed to apply referral code" });
    }
  });

  app.post("/api/referral/generate-code", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.affiliateCode) {
        return res.json({ code: user.affiliateCode, message: "You already have a referral code" });
      }
      
      const code = `UGLI-${userId.slice(0, 8).toUpperCase()}`;
      await storage.updateUserProfile(userId, { affiliateCode: code });
      
      res.json({ code, message: "Referral code generated successfully" });
    } catch (error) {
      console.error("Generate referral code error:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  // ============== IMAGE GENERATION ROUTES ==============

  const {
    analyzePrompt,
    enhancePrompt,
    generateImage: generateGeminiImage,
    generateChatSessionName,
    chatWithCreativeAgent,
  } = await import("./services/gemini");

  // ============== GUEST IMAGE GENERATION (NO AUTH) ==============

  const GUEST_GALLERY_USER_ID = "guest-gallery-user";

  async function ensureGuestGalleryUser() {
    let guestUser = await storage.getUser(GUEST_GALLERY_USER_ID);
    if (!guestUser) {
      guestUser = await storage.upsertUser({
        id: GUEST_GALLERY_USER_ID,
        username: "UGLI Gallery",
      });
    }
    return guestUser;
  }

  app.post("/api/guest/generate-image", guestGenerationLimiter, async (req, res) => {
    try {
      const { prompt, guestId } = req.body;
      if (!prompt || !guestId) {
        return res.status(400).json({ message: "Missing prompt or guestId" });
      }

      // Use direct SQL via pool to avoid Neon HTTP driver null response issues
      const { pool } = await import("./db");
      
      // Check if guest has already generated
      const existingResult = await pool.query(
        'SELECT id FROM guest_generations WHERE guest_id = $1 LIMIT 1',
        [guestId]
      );
      
      if (existingResult.rows.length > 0) {
        return res.status(403).json({ message: "Free generation already used. Please login for more." });
      }

      const result = await generateGeminiImage(prompt, [], "quality", "1:1", "draft", false);
      if (!result) {
        return res.status(500).json({ message: "Image generation failed. Please try again." });
      }

      // Insert guest generation record using pool
      await pool.query(
        'INSERT INTO guest_generations (guest_id) VALUES ($1) ON CONFLICT (guest_id) DO NOTHING',
        [guestId]
      );

      await ensureGuestGalleryUser();
      const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;
      
      // Save to generatedImages table
      await storage.createImage({
        userId: GUEST_GALLERY_USER_ID,
        imageUrl,
        prompt,
        style: "auto",
        aspectRatio: "1:1",
        generationType: "image",
        isPublic: true,
      });

      // Also save to galleryImages for discover page
      await storage.createGalleryImage({
        title: prompt.slice(0, 100),
        imageUrl,
        creator: "UGLI Guest",
        category: "ai-generated",
        aspectRatio: "1:1",
        prompt,
      });

      // Invalidate gallery cache so new image appears immediately
      await invalidateCache('gallery:images');

      return res.json({ imageData: result.imageData, mimeType: result.mimeType });
    } catch (error: any) {
      console.error("Guest generation error:", error);
      const message = error?.message?.includes('generation') ? error.message : "Generation failed. Please try again.";
      return res.status(500).json({ message });
    }
  });

  app.post("/api/generate/analyze", requireAuth, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const analysis = await analyzePrompt(prompt);
      res.json({ analysis });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  app.post("/api/generate/draft", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { prompt, stylePreset = "auto", aspectRatio = "1:1", detail = "medium", speed = "quality", imageCount = 1, isPublic = false } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const count = Math.min(Math.max(1, parseInt(imageCount) || 1), 4);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      sendEvent("status", { agent: "Text Sentinel", status: "working", message: "Analyzing prompt..." });

      const analysis = await analyzePrompt(prompt);
      sendEvent("analysis", { analysis });
      sendEvent("status", { agent: "Text Sentinel", status: "complete", message: "Analysis complete" });

      sendEvent("status", { agent: "Style Architect", status: "working", message: "Enhancing prompt..." });

      const { enhancedPrompt, negativePrompts } = await enhancePrompt(
        prompt,
        analysis,
        "draft",
        stylePreset,
        "draft",
        detail
      );
      sendEvent("enhancement", { enhancedPrompt, negativePrompts });
      sendEvent("status", { agent: "Style Architect", status: "complete", message: "Prompt enhanced" });

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: `Generating ${count} image${count > 1 ? 's' : ''} in parallel...` });
      sendEvent("progress", { completed: 0, total: count });

      // Generate all images in parallel with atomic counter
      const completionState = { count: 0 };
      const incrementAndGetCount = () => ++completionState.count;
      
      const generateImage = async (index: number) => {
        try {
          const result = await generateGeminiImage(enhancedPrompt, negativePrompts, speed, aspectRatio, "draft", analysis.hasTextRequest);
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });
          
          if (result) {
            const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;
            
            // Save image to database
            try {
              const savedImage = await storage.createImage({
                userId,
                imageUrl,
                prompt,
                style: stylePreset,
                aspectRatio,
                generationType: "image",
                isFavorite: false,
                isPublic: Boolean(isPublic),
              });
              
              // If image is public, also add to galleryImages for discovery page
              if (isPublic) {
                try {
                  await storage.createGalleryImage({
                    sourceImageId: savedImage.id,
                    title: prompt.substring(0, 100),
                    imageUrl,
                    creator: userId,
                    category: stylePreset !== "auto" ? stylePreset : "General",
                    aspectRatio,
                    prompt,
                  });
                  await invalidateCache('gallery:images');
                } catch (galleryError) {
                  console.error("Failed to add draft image to gallery:", galleryError);
                }
              }
              
              // Send savedImageId for efficient loading
              sendEvent("image", {
                index,
                savedImageId: savedImage.id,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
            } catch (saveError) {
              console.error("Failed to save draft image:", saveError);
              // Fallback: send image data directly
              sendEvent("image", {
                index,
                imageData: result.imageData,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
            }
            return { success: true, index };
          } else {
            sendEvent("image_error", { index, error: "Generation failed" });
            return { success: false, index };
          }
        } catch (err) {
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });
          sendEvent("image_error", { index, error: "Generation failed" });
          return { success: false, index };
        }
      };

      const promises = Array.from({ length: count }, (_, i) => generateImage(i));
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", { message: "Draft generation complete", totalImages: successCount });

      res.end();
    } catch (error) {
      console.error("Draft generation error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/generate/final", requireAuth, generationRateLimiter, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const {
        prompt,
        stylePreset = "auto",
        qualityLevel = "premium",
        aspectRatio = "1:1",
        detail = "medium",
        speed = "quality",
        imageCount = 1,
        isPublic = false,
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const count = Math.min(Math.max(1, parseInt(imageCount) || 1), 4);

      // SSE headers with anti-buffering settings
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
      res.setHeader("Content-Encoding", "none"); // Disable compression
      res.flushHeaders();

      const sendEvent = (event: string, data: any) => {
        const eventStr = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        res.write(eventStr);
        // Force immediate send
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      sendEvent("status", { agent: "Text Sentinel", status: "working", message: "Deep analysis..." });

      const analysis = await analyzePrompt(prompt);
      sendEvent("analysis", { analysis });
      sendEvent("status", { agent: "Text Sentinel", status: "complete", message: "Analysis complete" });

      sendEvent("status", { agent: "Style Architect", status: "working", message: "Creating master prompt..." });

      const { enhancedPrompt, negativePrompts } = await enhancePrompt(
        prompt,
        analysis,
        "final",
        stylePreset,
        qualityLevel,
        detail
      );
      sendEvent("enhancement", { enhancedPrompt, negativePrompts });
      sendEvent("status", { agent: "Style Architect", status: "complete", message: "Master prompt ready" });

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: `Generating ${count} image${count > 1 ? 's' : ''} in parallel...` });
      sendEvent("progress", { completed: 0, total: count });

      // Generate all images in parallel with atomic counter
      const completionState = { count: 0 };
      const incrementAndGetCount = () => ++completionState.count;
      
      const generateImage = async (index: number) => {
        try {
          const result = await generateGeminiImage(enhancedPrompt, negativePrompts, speed, aspectRatio, qualityLevel as "draft" | "premium", analysis.hasTextRequest);
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });

          if (result) {
            console.log(`[Premium Gen] Image ${index} generated successfully, saving to database...`);
            const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;
            
            try {
              const savedImage = await storage.createImage({
                userId,
                imageUrl,
                prompt,
                style: stylePreset,
                aspectRatio,
                generationType: "image",
                isFavorite: false,
                isPublic: Boolean(isPublic),
              });
              
              // If image is public, also add to galleryImages for discovery page
              if (isPublic) {
                try {
                  await storage.createGalleryImage({
                    sourceImageId: savedImage.id,
                    title: prompt.substring(0, 100),
                    imageUrl,
                    creator: userId,
                    category: stylePreset !== "auto" ? stylePreset : "General",
                    aspectRatio,
                    prompt,
                  });
                  // Invalidate gallery cache so new image appears immediately
                  await invalidateCache('gallery:images');
                  console.log(`[Premium Gen] Image ${index} added to public gallery`);
                } catch (galleryError) {
                  console.error("Failed to add image to gallery:", galleryError);
                }
              }
              
              console.log(`[Premium Gen] Image ${index} saved with ID ${savedImage.id}, sending to client...`);
              // Send small event with just the ID - frontend will fetch the image separately
              sendEvent("final_image", {
                index,
                savedImageId: savedImage.id,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
              console.log(`[Premium Gen] Image ${index} event sent to client`);
            } catch (saveError) {
              console.error("Failed to save image to database:", saveError);
              // Fallback: send image data directly if save failed
              sendEvent("final_image", {
                index,
                imageData: result.imageData,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
            }
            return { success: true, index };
          } else {
            console.log(`[Premium Gen] Image ${index} generation returned null`);
            sendEvent("image_error", { index, error: "Generation failed" });
            return { success: false, index };
          }
        } catch (err) {
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });
          sendEvent("image_error", { index, error: "Generation failed" });
          return { success: false, index };
        }
      };

      const promises = Array.from({ length: count }, (_, i) => generateImage(i));
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", {
        message: "Final generation complete",
        totalImages: successCount,
      });

      res.end();
    } catch (error) {
      console.error("Final generation error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/generate/single", requireAuth, generationRateLimiter, async (req, res) => {
    try {
      const { prompt, stylePreset = "auto" } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const analysis = await analyzePrompt(prompt);
      const { enhancedPrompt, negativePrompts } = await enhancePrompt(
        prompt,
        analysis,
        "draft",
        stylePreset,
        "standard"
      );

      const result = await generateGeminiImage(enhancedPrompt, negativePrompts, "quality", "1:1", "draft", analysis.hasTextRequest);

      if (result) {
        res.json({
          success: true,
          image: {
            data: result.imageData,
            mimeType: result.mimeType,
          },
          analysis,
          enhancedPrompt,
        });
      } else {
        res.status(500).json({ message: "Image generation failed" });
      }
    } catch (error) {
      console.error("Single generation error:", error);
      res.status(500).json({ message: "Generation failed" });
    }
  });

  // ============== MOCKUP GENERATION ROUTES ==============

  const {
    analyzeDesign,
    generateMockupPrompt,
    generateMockup,
  } = await import("./services/gemini");

  app.post("/api/mockup/analyze", requireAuth, async (req, res) => {
    try {
      const { designImage } = req.body;
      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");
      const analysis = await analyzeDesign(base64Data);
      res.json({ analysis });
    } catch (error) {
      console.error("Design analysis error:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  app.post("/api/mockup/generate", requireAuth, async (req, res) => {
    try {
      const {
        designImage,
        productType = "t-shirt",
        productColor = "white",
        scene = "studio",
        angle = "front",
        style = "minimal",
      } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");

      sendEvent("status", { stage: "analyzing", message: "Analyzing your design..." });

      const designAnalysis = await analyzeDesign(base64Data);
      sendEvent("analysis", { analysis: designAnalysis });

      sendEvent("status", { stage: "prompting", message: "Creating mockup prompt..." });

      const { prompt, negativePrompts } = await generateMockupPrompt(designAnalysis, {
        designBase64: base64Data,
        productType,
        productColor,
        scene,
        angle,
        style,
      });
      sendEvent("prompt", { prompt, negativePrompts });

      sendEvent("status", { stage: "generating", message: "Generating mockup image..." });

      const result = await generateMockup(base64Data, prompt, negativePrompts);

      if (result) {
        sendEvent("image", {
          imageData: result.imageData,
          mimeType: result.mimeType,
        });
        sendEvent("complete", { success: true, message: "Mockup generated successfully" });
      } else {
        sendEvent("error", { message: "Failed to generate mockup" });
      }

      res.end();
    } catch (error) {
      console.error("Mockup generation error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Mockup generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/mockup/generate-batch", requireAuth, async (req, res) => {
    try {
      const {
        designImage,
        productType = "t-shirt",
        productColors = ["White"],
        productSizes,
        angles = ["front"],
        scene = "studio",
        style = "minimal",
        modelDetails,
        journey = "DTG",
        patternScale,
        isSeamlessPattern,
        outputQuality: rawOutputQuality = "high",
        modelCustomization,
      } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const validOutputQualities = ['standard', 'high', 'ultra'] as const;
      const outputQuality = validOutputQualities.includes(rawOutputQuality) 
        ? rawOutputQuality as 'standard' | 'high' | 'ultra'
        : 'high';

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");

      const colorNameToHex: Record<string, string> = {
        "White": "#FFFFFF",
        "Black": "#000000",
        "Sport Grey": "#9E9E9E",
        "Dark Heather": "#545454",
        "Charcoal": "#424242",
        "Navy": "#1A237E",
        "Royal": "#0D47A1",
        "Light Blue": "#ADD8E6",
        "Red": "#D32F2F",
        "Cardinal": "#880E4F",
        "Maroon": "#4A148C",
        "Orange": "#F57C00",
        "Gold": "#FBC02D",
        "Yellow": "#FFEB3B",
        "Irish Green": "#388E3C",
        "Military Green": "#558B2F",
        "Forest": "#1B5E20",
        "Purple": "#7B1FA2",
        "Light Pink": "#F8BBD0",
        "Sand": "#F5F5DC",
      };

      const colors = (Array.isArray(productColors) ? productColors : [productColors]).map(colorName => ({
        name: colorName,
        hex: colorNameToHex[colorName] || "#FFFFFF"
      }));

      if (modelDetails) {
        const eliteGenerator = await import("./services/eliteMockupGenerator");
        const knowledge = await import("./services/knowledge");

        const ethnicityMap: Record<string, string> = {
          "CAUCASIAN": "White",
          "WHITE": "White",
          "AFRICAN": "Black",
          "BLACK": "Black",
          "ASIAN": "Asian",
          "HISPANIC": "Hispanic",
          "SOUTH_ASIAN": "Indian",
          "INDIAN": "Indian",
          "MIDDLE_EASTERN": "Middle Eastern",
          "SOUTHEAST_ASIAN": "Southeast Asian",
          "MIXED": "Diverse",
          "INDIGENOUS": "Indigenous",
          "DIVERSE": "Diverse"
        };

        const ageMap: Record<string, string> = {
          "ADULT": "Adult",
          "YOUNG_ADULT": "Young Adult",
          "TEEN": "Teen"
        };

        const sexMap: Record<string, string> = {
          "MALE": "Male",
          "FEMALE": "Female"
        };

        const mappedModelDetails = {
          age: ageMap[modelDetails.age] || "Adult",
          sex: sexMap[modelDetails.sex] || "Male",
          ethnicity: ethnicityMap[modelDetails.ethnicity] || "White",
          modelSize: modelDetails.modelSize || "M"
        };

        const styleMap: Record<string, string> = {
          // Lowercase fallbacks
          "minimal": "MINIMALIST_MODERN",
          "editorial": "EDITORIAL_FASHION",
          "vintage": "VINTAGE_RETRO",
          "street": "STREET_URBAN",
          "ecommerce": "ECOMMERCE_CLEAN",
          "clean": "ECOMMERCE_CLEAN",
          "bold": "BOLD_PLAYFUL",
          "playful": "BOLD_PLAYFUL",
          "premium": "PREMIUM_LUXE",
          "luxe": "PREMIUM_LUXE",
          "natural": "NATURAL_ORGANIC",
          "organic": "NATURAL_ORGANIC",
          // Direct ID mappings (frontend sends these)
          "ECOMMERCE_CLEAN": "ECOMMERCE_CLEAN",
          "EDITORIAL_FASHION": "EDITORIAL_FASHION",
          "VINTAGE_RETRO": "VINTAGE_RETRO",
          "STREET_URBAN": "STREET_URBAN",
          "MINIMALIST_MODERN": "MINIMALIST_MODERN",
          "BOLD_PLAYFUL": "BOLD_PLAYFUL",
          "PREMIUM_LUXE": "PREMIUM_LUXE",
          "NATURAL_ORGANIC": "NATURAL_ORGANIC"
        };
        const mappedStyle = styleMap[style] || styleMap[style.toLowerCase()] || "ECOMMERCE_CLEAN";

        sendEvent("status", { stage: "analyzing", message: "Analyzing your design...", progress: 5 });

        const isAopJourney = journey === "AOP";
        const productSource = isAopJourney ? knowledge.getAOPProducts() : knowledge.getDTGProducts();
        
        const product = productSource.find(p => 
          p.name.toLowerCase().includes(productType.toLowerCase()) ||
          p.subcategory?.toLowerCase().includes(productType.toLowerCase()) ||
          p.id.toLowerCase().includes(productType.toLowerCase())
        ) || productSource[0];

        const sizeMap: Record<string, string> = {
          "XS": "XS",
          "S": "S",
          "M": "M",
          "L": "L",
          "XL": "XL",
          "2XL": "XXL",
          "XXL": "XXL",
          "3XL": "XXXL",
          "XXXL": "XXXL",
          "4XL": "XXXL",
          "5XL": "XXXL"
        };

        const rawSizes: string[] = Array.isArray(productSizes) && productSizes.length > 0 
          ? productSizes 
          : [mappedModelDetails.modelSize || 'M'];
        
        const sizesToGenerate: string[] = rawSizes.map(s => sizeMap[s] || s);

        let personaLockFailed = false;
        let batchCompleted = false;
        let totalGeneratedCount = 0;
        const totalSizes = sizesToGenerate.length;
        const jobsPerSize = angles.length * colors.length;
        const totalJobs = jobsPerSize * totalSizes;

        console.log("=== ELITE MOCKUP GENERATION DEBUG ===");
        console.log("Product:", product?.name);
        console.log("Colors:", colors.map(c => c?.name));
        console.log("Angles:", angles);
        console.log("Sizes to generate:", sizesToGenerate);
        console.log("Model details:", {
          age: mappedModelDetails.age,
          sex: mappedModelDetails.sex,
          ethnicity: mappedModelDetails.ethnicity,
          modelSize: mappedModelDetails.modelSize
        });
        console.log("Total jobs expected:", totalJobs);
        console.log("=====================================");

        sendEvent("status", { stage: "preparing", message: "Preparing model reference...", progress: 8 });

        let sharedPersonaLock: any = undefined;

        try {
          for (let sizeIndex = 0; sizeIndex < sizesToGenerate.length; sizeIndex++) {
            const currentSize = sizesToGenerate[sizeIndex];
            
            const sizeModelDetails = {
              ...mappedModelDetails,
              modelSize: currentSize
            };

            const sizeLabel = totalSizes > 1 ? ` (Size ${currentSize})` : '';
            sendEvent("status", { 
              stage: "generating", 
              message: `Generating size ${currentSize}${totalSizes > 1 ? ` (${sizeIndex + 1}/${totalSizes})` : ''}...`, 
              progress: 10 + Math.round((sizeIndex / totalSizes) * 10)
            });

            const mergedCustomization = modelDetails?.customization || modelCustomization;
            
            const batch = await eliteGenerator.generateMockupBatch({
              journey: isAopJourney ? "AOP" : "DTG",
              designImage: base64Data,
              isSeamlessPattern: isAopJourney ? (isSeamlessPattern ?? true) : undefined,
              product: product,
              colors: colors,
              angles: angles as any[],
              modelDetails: {
                ...sizeModelDetails,
                customization: mergedCustomization
              } as any,
              brandStyle: mappedStyle as any,
              lightingPreset: 'three-point-classic',
              materialCondition: 'BRAND_NEW',
              environmentPrompt: scene,
              existingPersonaLock: sharedPersonaLock,
              patternScale: isAopJourney ? patternScale : undefined,
              outputQuality: outputQuality
            }, (completed, total, job) => {
              const completedOverall = (sizeIndex * jobsPerSize) + completed;
              const progress = 10 + Math.round((completedOverall / totalJobs) * 85);
              
              const batchJob = {
                id: job.id,
                color: job.color.name,
                angle: job.angle,
                size: currentSize,
                status: job.status as 'pending' | 'processing' | 'completed' | 'failed',
                retryCount: job.retryCount || 0,
                imageData: job.result?.imageData,
                mimeType: job.result?.mimeType,
                error: job.error
              };

              if (job.status === 'completed' && job.result) {
                totalGeneratedCount++;
                sendEvent("job_update", batchJob);
                sendEvent("image", {
                  jobId: job.id,
                  angle: job.angle,
                  color: job.color.name,
                  size: currentSize,
                  status: 'completed',
                  imageData: job.result.imageData,
                  mimeType: job.result.mimeType,
                  retryCount: job.retryCount || 0
                });
              } else if (job.status === 'failed') {
                sendEvent("job_update", batchJob);
                sendEvent("image_error", {
                  jobId: job.id,
                  angle: job.angle,
                  color: job.color.name,
                  size: currentSize,
                  status: 'failed',
                  error: job.error || "Generation failed",
                  retryCount: job.retryCount || 0
                });
              } else if (job.status === 'processing') {
                sendEvent("job_update", { ...batchJob, status: 'processing' });
              }

              sendEvent("status", {
                stage: "generating",
                message: `Generated ${completedOverall}/${totalJobs} mockups${sizeLabel}...`,
                progress
              });
            }, (error) => {
              if (error.type === 'persona_lock_failed') {
                personaLockFailed = true;
                sendEvent("persona_lock_failed", {
                  message: error.message,
                  details: error.details,
                  suggestion: "Try again or use a different model configuration"
                });
              } else {
                sendEvent("batch_error", {
                  type: error.type,
                  message: error.message,
                  details: error.details
                });
              }
            });

            if (personaLockFailed) {
              break;
            }

            if (sizeIndex === 0 && batch.personaLock) {
              sharedPersonaLock = batch.personaLock;
              console.log("PERSONA LOCK CAPTURED - will reuse for all subsequent sizes");
            }

            if (sizeIndex === 0 && batch.personaLockImage) {
              sendEvent("persona_lock", {
                headshotImage: batch.personaLockImage
              });
            }
          }

          if (!personaLockFailed) {
            batchCompleted = true;
            sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
            sendEvent("complete", { success: true, totalGenerated: totalGeneratedCount });
          } else {
            sendEvent("status", { 
              stage: "failed", 
              message: "Model generation failed - please try again", 
              progress: 0 
            });
          }
        } catch (batchErr) {
          console.error("Elite mockup batch error:", batchErr);
          const errorMessage = batchErr instanceof Error ? batchErr.message : String(batchErr);
          const isPersonaLockError = errorMessage.includes('Persona Lock failed');
          
          if (isPersonaLockError) {
            sendEvent("persona_lock_failed", {
              message: 'Could not generate a consistent model reference.',
              details: errorMessage,
              suggestion: "Please try again or adjust model selection"
            });
          } else {
            sendEvent("error", { message: errorMessage });
          }

          sendEvent("status", { 
            stage: "failed", 
            message: isPersonaLockError 
              ? "Model generation failed - please try again" 
              : "Generation failed", 
            progress: 0 
          });
        }

        sendEvent("stream_end", { 
          success: batchCompleted && !personaLockFailed,
          timestamp: Date.now() 
        });
        res.end();
        return;
      }

      sendEvent("status", { stage: "analyzing", message: "Analyzing your design...", progress: 5 });

      const designAnalysis = await analyzeDesign(base64Data);
      sendEvent("analysis", { analysis: designAnalysis });

      const totalJobs = angles.length * colors.length;
      let completedJobs = 0;

      for (const color of colors) {
        for (const angle of angles) {
          sendEvent("status", { 
            stage: "generating", 
            message: `Generating ${color.name} ${angle} view (${completedJobs + 1}/${totalJobs})...`,
            progress: 10 + Math.round((completedJobs / totalJobs) * 80)
          });

          const { prompt, negativePrompts } = await generateMockupPrompt(designAnalysis, {
            designBase64: base64Data,
            productType,
            productColor: color.name,
            scene,
            angle,
            style,
          });

          const result = await generateMockup(base64Data, prompt, negativePrompts);

          if (result) {
            sendEvent("image", {
              angle,
              color: color.name,
              imageData: result.imageData,
              mimeType: result.mimeType,
            });
          } else {
            sendEvent("image_error", { angle, color: color.name, error: "Failed to generate" });
          }

          completedJobs++;
        }
      }

      sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
      sendEvent("complete", { success: true, totalGenerated: completedJobs });

      res.end();
    } catch (error) {
      console.error("Batch mockup generation error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Batch generation failed" })}\n\n`);
      res.end();
    }
  });

  // ============== ELITE MOCKUP GENERATOR ROUTES ==============
  const {
    analyzeDesignForMockup,
    generatePersonaLock,
    generatePersonaHeadshot,
    buildRenderSpecification,
    generateMockupBatch,
    refineMockup,
    generateMockupWithRetry
  } = await import("./services/eliteMockupGenerator");

  const {
    getProduct,
    getDTGProducts,
    getAOPProducts,
    getAccessoryProducts,
    getHomeLivingProducts,
    getAllProducts,
    BRAND_STYLES
  } = await import("./services/knowledge");

  app.get("/api/elite-mockup/products", requireAuth, async (_req, res) => {
    try {
      const dtgProducts = getDTGProducts();
      const aopProducts = getAOPProducts();
      const accessoryProducts = getAccessoryProducts();
      const homeLivingProducts = getHomeLivingProducts();
      res.json({ dtgProducts, aopProducts, accessoryProducts, homeLivingProducts });
    } catch (error) {
      console.error("Products fetch error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/elite-mockup/brand-styles", requireAuth, async (_req, res) => {
    try {
      const styles = Object.values(BRAND_STYLES).map(style => ({
        id: style.id,
        name: style.name,
        description: style.description,
        moodKeywords: style.moodKeywords
      }));
      res.json({ styles });
    } catch (error) {
      console.error("Brand styles fetch error:", error);
      res.status(500).json({ message: "Failed to fetch brand styles" });
    }
  });

  app.post("/api/elite-mockup/analyze", requireAuth, async (req, res) => {
    try {
      const { designImage } = req.body;
      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");
      const analysis = await analyzeDesignForMockup(base64Data);
      res.json({ analysis });
    } catch (error) {
      console.error("Elite design analysis error:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  app.post("/api/elite-mockup/generate", requireAuth, async (req, res) => {
    try {
      const {
        journey = "DTG",
        designImage,
        product,
        colors,
        angles,
        modelDetails,
        brandStyle = "ECOMMERCE_CLEAN",
        lightingPreset,
        materialCondition,
        environmentPrompt
      } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      if (!product || !colors || !angles) {
        return res.status(400).json({ message: "Product, colors, and angles are required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");

      const validatedBrandStyle = brandStyle || 'ECOMMERCE_CLEAN';
      const validatedMaterialCondition = materialCondition || 'BRAND_NEW';
      const validatedLightingPreset = lightingPreset || 'three-point-classic';

      sendEvent("status", { stage: "analyzing", message: "Analyzing your design...", progress: 5 });

      let batchCompleted = false;
      let personaLockFailed = false;

      try {
        const batch = await generateMockupBatch({
          journey,
          designImage: base64Data,
          product,
          colors,
          angles,
          modelDetails,
          brandStyle: validatedBrandStyle,
          lightingPreset: validatedLightingPreset,
          materialCondition: validatedMaterialCondition,
          environmentPrompt
        }, (completed, total, job) => {
          const progress = 10 + Math.round((completed / total) * 85);
          
          if (job.status === 'completed' && job.result) {
            sendEvent("image", {
              jobId: job.id,
              angle: job.angle,
              color: job.color.name,
              imageData: job.result.imageData,
              mimeType: job.result.mimeType
            });
          } else if (job.status === 'failed') {
            sendEvent("image_error", {
              jobId: job.id,
              angle: job.angle,
              color: job.color.name,
              error: job.error || "Generation failed"
            });
          }

          sendEvent("status", {
            stage: "generating",
            message: `Generated ${completed}/${total} mockups...`,
            progress
          });
        }, (error) => {
          if (error.type === 'persona_lock_failed') {
            personaLockFailed = true;
            sendEvent("persona_lock_failed", {
              message: error.message,
              details: error.details,
              suggestion: "Try again or use a different model configuration"
            });
          } else {
            sendEvent("batch_error", {
              type: error.type,
              message: error.message,
              details: error.details
            });
          }
        });

        if (!personaLockFailed) {
          batchCompleted = true;

          if (batch.personaLockImage) {
            sendEvent("persona_lock", {
              headshotImage: batch.personaLockImage
            });
          }

          sendEvent("batch_complete", {
            batchId: batch.id,
            status: batch.status,
            totalJobs: batch.jobs.length,
            completedJobs: batch.jobs.filter(j => j.status === 'completed').length,
            failedJobs: batch.jobs.filter(j => j.status === 'failed').length
          });

          sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
        } else {
          sendEvent("status", { 
            stage: "failed", 
            message: "Model generation failed - please try again", 
            progress: 0 
          });
        }
      } catch (batchErr) {
        const errorMessage = batchErr instanceof Error ? batchErr.message : String(batchErr);
        const isPersonaLockError = errorMessage.includes('Persona Lock failed');
        
        if (isPersonaLockError) {
          sendEvent("persona_lock_failed", {
            message: 'Could not generate a consistent model reference for this configuration.',
            details: errorMessage,
            suggestion: "Please try again or adjust model selection (different age, ethnicity, or size)"
          });
        } else {
          sendEvent("batch_error", {
            type: 'batch_failed',
            message: 'Mockup generation encountered an error.',
            details: errorMessage
          });
        }

        sendEvent("status", { 
          stage: "failed", 
          message: isPersonaLockError 
            ? "Model generation failed - please try again" 
            : "Generation failed", 
          progress: 0 
        });
      }

      sendEvent("stream_end", { 
        success: batchCompleted && !personaLockFailed,
        timestamp: Date.now() 
      });
      res.end();
    } catch (error) {
      console.error("Elite mockup generation error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Elite mockup generation failed", type: "system_error" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/elite-mockup/refine", requireAuth, async (req, res) => {
    try {
      const { originalJob, refinementPrompt, originalDesignImage } = req.body;

      if (!originalJob || !refinementPrompt || !originalDesignImage) {
        return res.status(400).json({ message: "Original job, refinement prompt, and original design are required" });
      }

      const base64Data = originalDesignImage.replace(/^data:image\/\w+;base64,/, "");
      const result = await refineMockup(originalJob, refinementPrompt, base64Data);

      if (result) {
        res.json({
          success: true,
          imageData: result.imageData,
          mimeType: result.mimeType
        });
      } else {
        res.status(500).json({ message: "Refinement failed" });
      }
    } catch (error) {
      console.error("Elite mockup refinement error:", error);
      res.status(500).json({ message: "Refinement failed" });
    }
  });

  // ============== AI SEAMLESS PATTERN ROUTES ==============
  const { generateAISeamlessPattern } = await import("./services/gemini");

  app.post("/api/seamless-pattern/ai-enhanced", requireAuth, async (req, res) => {
    try {
      const { designImage } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const base64Match = designImage.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ message: "Invalid image format. Expected base64 data URL." });
      }

      const mimeType = `image/${base64Match[1]}`;
      const base64Data = base64Match[2];

      const result = await generateAISeamlessPattern(base64Data, mimeType);

      if (result) {
        res.json({
          success: true,
          patternUrl: `data:${result.mimeType};base64,${result.imageData}`,
          mimeType: result.mimeType,
          description: result.text
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to generate AI-enhanced pattern. Please try again." 
        });
      }
    } catch (error) {
      console.error("AI seamless pattern generation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "AI pattern generation failed" 
      });
    }
  });

  // ============== BACKGROUND REMOVAL ROUTES ==============
  const { 
    removeBackground, 
    removeBackgroundBatch,
    getDefaultBackgroundRemovalOptions,
    validateBackgroundRemovalOptions
  } = await import("./services/backgroundRemover");

  app.post("/api/background-removal", requireAuth, async (req, res) => {
    try {
      const { image, options } = req.body;

      if (!image || typeof image !== "string") {
        return res.status(400).json({ 
          success: false, 
          message: "Image is required. Provide a base64-encoded image string." 
        });
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      if (!base64Data || base64Data.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid image data. Provide a valid base64-encoded image." 
        });
      }

      const validatedOptions = validateBackgroundRemovalOptions(options || {});

      const result = await removeBackground(base64Data, validatedOptions);

      res.json({
        success: result.success,
        result
      });
    } catch (error) {
      console.error("Background removal error:", error);
      const errorMessage = error instanceof Error ? error.message : "Background removal failed";
      res.status(500).json({ 
        success: false, 
        message: errorMessage 
      });
    }
  });

  app.post("/api/background-removal/batch", requireAuth, async (req, res) => {
    try {
      const { images, options } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Images array is required. Provide an array of base64-encoded image strings." 
        });
      }

      if (images.length > 20) {
        return res.status(400).json({ 
          success: false, 
          message: "Maximum 20 images allowed per batch." 
        });
      }

      for (let i = 0; i < images.length; i++) {
        if (typeof images[i] !== "string" || images[i].length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid image at index ${i}. All images must be base64-encoded strings.` 
          });
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      };

      const validatedOptions = validateBackgroundRemovalOptions(options || {});

      const imageItems = images.map((img: string, index: number) => ({
        id: `img_${index}_${Date.now()}`,
        imageBase64: img.replace(/^data:image\/\w+;base64,/, "")
      }));

      const total = imageItems.length;

      sendEvent("job_start", { 
        total, 
        options: validatedOptions,
        timestamp: Date.now()
      });

      const results: Array<{ id: string; index: number; success: boolean; result: any }> = [];
      let hasError = false;

      try {
        await removeBackgroundBatch(
          imageItems,
          validatedOptions,
          (completed: number, totalCount: number, progressData: { id: string; result: any }) => {
            const index = imageItems.findIndex(item => item.id === progressData.id);
            
            sendEvent("job_progress", {
              current: completed,
              total: totalCount,
              percentage: Math.round((completed / totalCount) * 100)
            });

            sendEvent("job_complete", {
              id: progressData.id,
              index,
              success: progressData.result.success,
              result: progressData.result
            });

            results.push({
              id: progressData.id,
              index,
              success: progressData.result.success,
              result: progressData.result
            });
          }
        );
      } catch (batchError) {
        hasError = true;
        const errorMessage = batchError instanceof Error ? batchError.message : "Batch processing failed";
        console.error("Batch background removal error:", batchError);
        
        sendEvent("error", {
          message: errorMessage,
          timestamp: Date.now()
        });
      }

      if (!hasError) {
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        sendEvent("batch_complete", {
          total,
          successful: successCount,
          failed: failedCount,
          results: results.map(r => ({
            id: r.id,
            index: r.index,
            success: r.success
          })),
          timestamp: Date.now()
        });
      }

      res.end();
    } catch (error) {
      console.error("Background removal batch error:", error);
      const errorMessage = error instanceof Error ? error.message : "Batch processing failed";
      
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: errorMessage 
        });
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  app.get("/api/background-removal/presets", requireAuth, async (_req, res) => {
    try {
      const defaultOptions = getDefaultBackgroundRemovalOptions();

      const presets = {
        outputTypes: [
          { 
            id: 'transparent', 
            name: 'Transparent', 
            description: 'Remove background completely with alpha transparency (PNG)'
          },
          { 
            id: 'white', 
            name: 'White Background', 
            description: 'Replace background with pure white (#FFFFFF)'
          },
          { 
            id: 'color', 
            name: 'Custom Color', 
            description: 'Replace background with a custom solid color'
          },
          { 
            id: 'blur', 
            name: 'Blur Background', 
            description: 'Keep subject sharp with professional bokeh blur effect'
          }
        ],
        qualityLevels: [
          { 
            id: 'standard', 
            name: 'Standard', 
            description: 'Fast processing with good quality',
            credits: 1
          },
          { 
            id: 'high', 
            name: 'High', 
            description: 'Excellent edge detection and detail preservation',
            credits: 2
          },
          { 
            id: 'ultra', 
            name: 'Ultra', 
            description: 'Maximum precision for complex edges like hair and fur',
            credits: 4
          }
        ],
        edgeFeathering: {
          min: 0,
          max: 10,
          default: defaultOptions.edgeFeathering,
          description: 'Edge softness in pixels (0 = sharp, 10 = soft)'
        },
        defaults: defaultOptions
      };

      res.json(presets);
    } catch (error) {
      console.error("Background removal presets error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch presets" 
      });
    }
  });

  // ============== ADMIN ROUTES ==============

  // User Management
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const { limit, offset } = parsePagination(req.query, { limit: 20, maxLimit: 100 });

      // Optimized: Use database-level pagination instead of loading all users
      const { users: paginatedUsers, total: totalUsers } = await storage.getAllUsers(limit, offset);
      const totalPages = Math.ceil(totalUsers / limit);

      const safeUsers = paginatedUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt
      }));

      res.json({
        users: safeUsers,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages
        }
      });
    } catch (error) {
      console.error("Admin users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!role || typeof role !== 'string') {
        return res.status(400).json({ message: "Role is required" });
      }
      
      const validRoles = ['user', 'admin', 'moderator'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be one of: user, admin, moderator" });
      }
      
      const user = await storage.updateUserRole(id, role);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error("Admin role update error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // CRM Contacts
  app.get("/api/admin/crm/contacts", requireAdmin, async (req: any, res) => {
    try {
      const { limit, offset } = parsePagination(req.query, { limit: 50, maxLimit: 200 });

      // Optimized: Use database-level pagination
      const { contacts, total } = await storage.getContacts(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      res.json({ contacts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      console.error("Admin contacts fetch error:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get("/api/admin/crm/contacts/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json({ contact });
    } catch (error) {
      console.error("Admin contact fetch error:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post("/api/admin/crm/contacts", requireAdmin, async (req: any, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json({ contact });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Admin contact create error:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch("/api/admin/crm/contacts/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = insertContactSchema.partial().parse(req.body);
      
      const contact = await storage.updateContact(id, updateData);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json({ contact });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Admin contact update error:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/crm/contacts/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const contact = await storage.getContact(id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      await storage.deleteContact(id);
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Admin contact delete error:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // CRM Deals
  app.get("/api/admin/crm/deals", requireAdmin, async (req: any, res) => {
    try {
      const { limit, offset } = parsePagination(req.query, { limit: 50, maxLimit: 200 });

      // Optimized: Use database-level pagination
      const { deals, total } = await storage.getDeals(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      res.json({ deals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      console.error("Admin deals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get("/api/admin/crm/deals/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deal = await storage.getDeal(id);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json({ deal });
    } catch (error) {
      console.error("Admin deal fetch error:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post("/api/admin/crm/deals", requireAdmin, async (req: any, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.status(201).json({ deal });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Admin deal create error:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.patch("/api/admin/crm/deals/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = insertDealSchema.partial().parse(req.body);
      
      const deal = await storage.updateDeal(id, updateData);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json({ deal });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Admin deal update error:", error);
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete("/api/admin/crm/deals/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      await storage.deleteDeal(id);
      res.json({ message: "Deal deleted successfully" });
    } catch (error) {
      console.error("Admin deal delete error:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // CRM Activities
  app.get("/api/admin/crm/activities", requireAdmin, async (req: any, res) => {
    try {
      const { limit, offset } = parsePagination(req.query, { limit: 50, maxLimit: 200 });

      // Optimized: Use database-level pagination
      const { activities, total } = await storage.getActivities(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      res.json({ activities, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      console.error("Admin activities fetch error:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/admin/crm/activities", requireAdmin, async (req: any, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json({ activity });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Admin activity create error:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.patch("/api/admin/crm/activities/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = insertActivitySchema.partial().parse(req.body);
      
      const activity = await storage.updateActivity(id, updateData);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json({ activity });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Admin activity update error:", error);
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete("/api/admin/crm/activities/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const activity = await storage.getActivities();
      const activityExists = activity.find(a => a.id === id);
      
      if (!activityExists) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      await storage.deleteActivity(id);
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Admin activity delete error:", error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Analytics
  app.get("/api/admin/analytics", requireAdmin, async (_req: any, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json({ analytics });
    } catch (error) {
      console.error("Admin analytics fetch error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ============== SUPER ADMIN ROUTES ==============

  app.get("/api/super-admin/overview", requireSuperAdmin, async (_req: any, res) => {
    try {
      const overview = await storage.getSuperAdminOverview();
      res.json(overview);
    } catch (error) {
      console.error("Super admin overview error:", error);
      res.status(500).json({ message: "Failed to fetch overview" });
    }
  });

  app.get("/api/super-admin/users/growth", requireSuperAdmin, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const growth = await storage.getUserGrowthByDay(days);
      res.json({ growth });
    } catch (error) {
      console.error("Super admin user growth error:", error);
      res.status(500).json({ message: "Failed to fetch user growth" });
    }
  });

  app.get("/api/super-admin/generations/stats", requireSuperAdmin, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getGenerationsByDay(days);
      res.json({ stats });
    } catch (error) {
      console.error("Super admin generation stats error:", error);
      res.status(500).json({ message: "Failed to fetch generation stats" });
    }
  });

  app.get("/api/super-admin/top-creators", requireSuperAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const creators = await storage.getTopCreators(limit);
      res.json({ creators });
    } catch (error) {
      console.error("Super admin top creators error:", error);
      res.status(500).json({ message: "Failed to fetch top creators" });
    }
  });

  app.get("/api/super-admin/users/by-role", requireSuperAdmin, async (_req: any, res) => {
    try {
      const roleStats = await storage.getUsersByRole();
      res.json({ roleStats });
    } catch (error) {
      console.error("Super admin users by role error:", error);
      res.status(500).json({ message: "Failed to fetch users by role" });
    }
  });

  app.get("/api/super-admin/feature-usage", requireSuperAdmin, async (_req: any, res) => {
    try {
      const usage = await storage.getFeatureUsageBreakdown();
      res.json({ usage });
    } catch (error) {
      console.error("Super admin feature usage error:", error);
      res.status(500).json({ message: "Failed to fetch feature usage" });
    }
  });

  app.get("/api/super-admin/subscriptions", requireSuperAdmin, async (_req: any, res) => {
    try {
      const stats = await storage.getSubscriptionStats();
      res.json(stats);
    } catch (error) {
      console.error("Super admin subscriptions error:", error);
      res.status(500).json({ message: "Failed to fetch subscription stats" });
    }
  });

  app.get("/api/super-admin/affiliates", requireSuperAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const affiliates = await storage.getAffiliatePerformance(limit);
      res.json({ affiliates });
    } catch (error) {
      console.error("Super admin affiliates error:", error);
      res.status(500).json({ message: "Failed to fetch affiliate performance" });
    }
  });

  app.get("/api/super-admin/revenue", requireSuperAdmin, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const revenue = await storage.getRevenueByDay(days);
      res.json({ revenue });
    } catch (error) {
      console.error("Super admin revenue error:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/super-admin/daily-active-users", requireSuperAdmin, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const dau = await storage.getDailyActiveUsers(days);
      res.json({ dau });
    } catch (error) {
      console.error("Super admin DAU error:", error);
      res.status(500).json({ message: "Failed to fetch daily active users" });
    }
  });

  app.get("/api/super-admin/retention", requireSuperAdmin, async (_req: any, res) => {
    try {
      const retention = await storage.getRetentionRate();
      res.json(retention);
    } catch (error) {
      console.error("Super admin retention error:", error);
      res.status(500).json({ message: "Failed to fetch retention rate" });
    }
  });

  // ============== PROMPT FAVORITES ROUTES ==============

  app.post("/api/prompts/favorites", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const favoriteData = insertPromptFavoriteSchema.parse({
        ...req.body,
        userId,
      });

      const favorite = await storage.createPromptFavorite(favoriteData);
      res.status(201).json({ favorite });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create prompt favorite error:", error);
      res.status(500).json({ message: "Failed to save prompt favorite" });
    }
  });

  app.get("/api/prompts/favorites", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const favorites = await storage.getPromptFavorites(userId);
      res.json({ favorites });
    } catch (error) {
      console.error("Get prompt favorites error:", error);
      res.status(500).json({ message: "Failed to fetch prompt favorites" });
    }
  });

  app.delete("/api/prompts/favorites/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      await storage.deletePromptFavorite(id, userId);
      res.json({ message: "Prompt favorite deleted successfully" });
    } catch (error) {
      console.error("Delete prompt favorite error:", error);
      res.status(500).json({ message: "Failed to delete prompt favorite" });
    }
  });

  // ============== MOOD BOARD ROUTES ==============

  app.get("/api/mood-boards", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const boards = await storage.getMoodBoards(userId);
      res.json({ boards });
    } catch (error) {
      console.error("Get mood boards error:", error);
      res.status(500).json({ message: "Failed to fetch mood boards" });
    }
  });

  app.post("/api/mood-boards", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { name, description } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Name is required" });
      }

      const board = await storage.createMoodBoard(userId, name, description);
      res.status(201).json({ board });
    } catch (error) {
      console.error("Create mood board error:", error);
      res.status(500).json({ message: "Failed to create mood board" });
    }
  });

  app.get("/api/mood-boards/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const result = await storage.getMoodBoard(userId, id);
      
      if (!result) {
        return res.status(404).json({ message: "Mood board not found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Get mood board error:", error);
      res.status(500).json({ message: "Failed to fetch mood board" });
    }
  });

  app.patch("/api/mood-boards/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { name, description } = req.body;
      
      const board = await storage.updateMoodBoard(userId, id, { name, description });
      
      if (!board) {
        return res.status(404).json({ message: "Mood board not found" });
      }
      
      res.json({ board });
    } catch (error) {
      console.error("Update mood board error:", error);
      res.status(500).json({ message: "Failed to update mood board" });
    }
  });

  app.delete("/api/mood-boards/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      await storage.deleteMoodBoard(userId, id);
      res.json({ message: "Mood board deleted successfully" });
    } catch (error) {
      console.error("Delete mood board error:", error);
      res.status(500).json({ message: "Failed to delete mood board" });
    }
  });

  app.post("/api/mood-boards/:id/items", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { imageId, positionX, positionY, width, height, zIndex } = req.body;

      if (!imageId) {
        return res.status(400).json({ message: "Image ID is required" });
      }

      // Verify board ownership before adding item
      const isOwner = await storage.verifyBoardOwnership(userId, id);
      if (!isOwner) {
        return res.status(404).json({ message: "Mood board not found" });
      }

      const item = await storage.addItemToBoard(id, imageId, {
        positionX: positionX ?? 0,
        positionY: positionY ?? 0,
        width,
        height,
        zIndex,
      });

      res.status(201).json({ item });
    } catch (error) {
      console.error("Add item to board error:", error);
      res.status(500).json({ message: "Failed to add item to board" });
    }
  });

  app.patch("/api/mood-boards/:boardId/items/:itemId", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { itemId } = req.params;
      const { positionX, positionY, width, height, zIndex } = req.body;

      // Verify item belongs to a board owned by user
      const isOwner = await storage.verifyBoardItemOwnership(userId, itemId);
      if (!isOwner) {
        return res.status(404).json({ message: "Board item not found" });
      }

      const item = await storage.updateBoardItem(itemId, {
        positionX,
        positionY,
        width,
        height,
        zIndex,
      });

      if (!item) {
        return res.status(404).json({ message: "Board item not found" });
      }

      res.json({ item });
    } catch (error) {
      console.error("Update board item error:", error);
      res.status(500).json({ message: "Failed to update board item" });
    }
  });

  app.delete("/api/mood-boards/:boardId/items/:itemId", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { itemId } = req.params;

      // Verify item belongs to a board owned by user
      const isOwner = await storage.verifyBoardItemOwnership(userId, itemId);
      if (!isOwner) {
        return res.status(404).json({ message: "Board item not found" });
      }

      await storage.removeItemFromBoard(itemId);
      res.json({ message: "Item removed from board successfully" });
    } catch (error) {
      console.error("Remove item from board error:", error);
      res.status(500).json({ message: "Failed to remove item from board" });
    }
  });

  // Chat Sessions API
  app.get("/api/chat/sessions", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getChatSessions(userId);
      res.json({ sessions });
    } catch (error) {
      console.error("Get chat sessions error:", error);
      res.status(500).json({ message: "Failed to get chat sessions" });
    }
  });

  app.post("/api/chat/sessions", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { name, createProject } = req.body;
      
      let projectId: string | undefined;
      
      // Auto-create a project folder if requested
      if (createProject) {
        const projectName = name || `Chat Project ${new Date().toLocaleDateString()}`;
        const project = await storage.createMoodBoard(userId, projectName, "Auto-created from Chat Studio");
        projectId = project.id;
      }
      
      const session = await storage.createChatSession(userId, name || "New Chat", projectId);
      res.json({ session, projectId });
    } catch (error) {
      console.error("Create chat session error:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get("/api/chat/sessions/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const session = await storage.getChatSession(id, userId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      const messages = await storage.getChatMessages(id);
      
      // Enrich messages with imageUrl from generatedImages table
      const enrichedMessages = await Promise.all(
        messages.map(async (msg) => {
          if (msg.imageId) {
            const image = await storage.getImageById(msg.imageId, userId);
            return {
              ...msg,
              imageUrl: image?.imageUrl || null
            };
          }
          return msg;
        })
      );
      
      // Get linked project info if exists
      let project = null;
      if (session.projectId) {
        const projectData = await storage.getMoodBoard(userId, session.projectId);
        if (projectData) {
          project = projectData.board;
        }
      }
      
      res.json({ session, messages: enrichedMessages, project });
    } catch (error) {
      console.error("Get chat session error:", error);
      res.status(500).json({ message: "Failed to get chat session" });
    }
  });

  app.patch("/api/chat/sessions/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const data = req.body;
      
      const session = await storage.updateChatSession(id, userId, data);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      res.json({ session });
    } catch (error) {
      console.error("Update chat session error:", error);
      res.status(500).json({ message: "Failed to update chat session" });
    }
  });

  app.post("/api/chat/sessions/:id/generate-name", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { firstMessage } = req.body;
      
      if (!firstMessage) {
        return res.status(400).json({ message: "First message is required" });
      }
      
      // Check if name is already locked
      const existingSession = await storage.getChatSession(id, userId);
      if (!existingSession) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      if (existingSession.nameLocked) {
        // Name already locked, return existing name
        return res.json({ session: existingSession, name: existingSession.name });
      }
      
      const smartName = await generateChatSessionName(firstMessage);
      const session = await storage.updateChatSession(id, userId, { name: smartName, nameLocked: true });
      
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      res.json({ session, name: smartName });
    } catch (error) {
      console.error("Generate session name error:", error);
      res.status(500).json({ message: "Failed to generate session name" });
    }
  });
  
  app.post("/api/chat/sessions/:id/chat", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { messages, context, attachedImage } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array is required" });
      }
      
      let userProfile = null;
      try {
        const { getOrCreateUserProfile } = await import("./services/profileAnalyzer");
        userProfile = await getOrCreateUserProfile(userId);
      } catch (e) {
        console.error("Failed to load user profile:", e);
      }
      
      const enrichedContext = {
        ...context,
        userProfile: userProfile ? {
          preferredStyles: userProfile.preferredStyles,
          preferredSubjects: userProfile.preferredSubjects,
          preferredMoods: userProfile.preferredMoods,
          recentPrompts: userProfile.recentContextJson?.recentPrompts || [],
          creativePatternsDescription: userProfile.creativePatternsJson?.frequentPromptPatterns?.join(', ') || ''
        } : null
      };
      
      const response = await chatWithCreativeAgent(messages, enrichedContext, attachedImage || null);
      res.json(response);
    } catch (error) {
      console.error("Chat session error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.delete("/api/chat/sessions/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      await storage.deleteChatSession(id, userId);
      res.json({ message: "Chat session deleted" });
    } catch (error) {
      console.error("Delete chat session error:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  app.post("/api/chat/sessions/:id/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id: sessionId } = req.params;
      const { role, content, options, imageId, originalPrompt, enhancedPrompt } = req.body;
      
      // Verify session belongs to user
      const session = await storage.getChatSession(sessionId, userId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      const message = await storage.addChatMessage(sessionId, {
        role,
        content,
        options,
        imageId,
        originalPrompt,
        enhancedPrompt,
      });
      
      // If there's an image and session has a linked project, add image to project
      if (imageId && session.projectId) {
        try {
          const existingItems = await storage.getMoodBoard(userId, session.projectId);
          const itemCount = existingItems?.items.length || 0;
          await storage.addItemToBoard(session.projectId, imageId, {
            positionX: (itemCount % 3) * 220,
            positionY: Math.floor(itemCount / 3) * 220,
            width: 200,
            height: 200,
            zIndex: itemCount,
          });
        } catch (e) {
          console.error("Failed to add image to project:", e);
        }
      }
      
      res.json({ message });
    } catch (error) {
      console.error("Add chat message error:", error);
      res.status(500).json({ message: "Failed to add chat message" });
    }
  });

  // User Preferences API
  app.get("/api/user/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const preferences = await storage.getUserPreferences(userId);
      res.json({ preferences: preferences || null });
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });

  app.put("/api/user/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { updateUserPreferencesSchema } = await import("@shared/schema");
      const parseResult = updateUserPreferencesSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid request data", errors: parseResult.error.errors });
      }
      const preferences = await storage.upsertUserPreferences(userId, parseResult.data);
      res.json({ preferences });
    } catch (error) {
      console.error("Update user preferences error:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  app.patch("/api/user/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { updateUserPreferencesSchema } = await import("@shared/schema");
      const parseResult = updateUserPreferencesSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid request data", errors: parseResult.error.errors });
      }
      const preferences = await storage.upsertUserPreferences(userId, parseResult.data);
      res.json({ preferences });
    } catch (error) {
      console.error("Patch user preferences error:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  app.post("/api/user/preferences/analyze", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { getOrCreateUserProfile } = await import("./services/profileAnalyzer");
      const preferences = await getOrCreateUserProfile(userId);
      res.json({ preferences });
    } catch (error) {
      console.error("Analyze user preferences error:", error);
      res.status(500).json({ message: "Failed to analyze user preferences" });
    }
  });

  return httpServer;
}
