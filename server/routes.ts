import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import path from "path";
import type { AuthenticatedRequest, SSEEventSender } from "./types";
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
import { verifyGoogleToken } from "./googleAuth";
import { registerAdminRoutes, registerSuperAdminRoutes, registerAuthRoutes, registerGalleryRoutes, registerUserRoutes, registerImageRoutes, registerGenerationRoutes, registerMockupRoutes, registerBackgroundRoutes, registerMoodBoardRoutes, createMiddleware } from "./routes/index";

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

  // TEST_MODE bypasses authentication - NEVER enable in production
  const isTestMode = process.env.TEST_MODE === "true" && process.env.NODE_ENV !== "production";
  if (process.env.TEST_MODE === "true" && process.env.NODE_ENV === "production") {
    console.error("WARNING: TEST_MODE is ignored in production for security reasons");
  }
  const TEST_USER_ID = "86375c89-623d-4e4f-b05b-056bc1663bf5";

  // Create shared middleware for route modules
  const sharedMiddleware = createMiddleware(isTestMode);

  // Register modularized routes
  registerAdminRoutes(app, sharedMiddleware);
  registerSuperAdminRoutes(app, sharedMiddleware);
  registerAuthRoutes(app, sharedMiddleware);
  registerGalleryRoutes(app, sharedMiddleware);
  registerUserRoutes(app, sharedMiddleware);
  registerImageRoutes(app, sharedMiddleware);
  await registerGenerationRoutes(app, sharedMiddleware);
  await registerMockupRoutes(app, sharedMiddleware);
  await registerBackgroundRoutes(app, sharedMiddleware);
  registerMoodBoardRoutes(app, sharedMiddleware);

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

  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (isTestMode) {
      (req as AuthenticatedRequest).user = (req as AuthenticatedRequest).user || { claims: { sub: TEST_USER_ID } };
      return next();
    }
    return isAuthenticated(req, res, next);
  };

  const getUserId = (req: AuthenticatedRequest): string => {
    if (isTestMode) {
      return TEST_USER_ID;
    }
    return req.user?.claims?.sub || '';
  };

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const userId = getUserId(req as AuthenticatedRequest);
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

  const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const userId = getUserId(req as AuthenticatedRequest);
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

  // Auth routes are now in server/routes/auth.ts
  // User/profile routes are now in server/routes/user.ts

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

  // Image and folder routes are now in server/routes/images.ts
  // Gallery routes are now in server/routes/gallery.ts

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

  // Image generation routes are now in server/routes/generation.ts

  // Import gemini services still used by other routes (chat)
  const {
    generateChatSessionName,
    chatWithCreativeAgent,
  } = await import("./services/gemini");

  // Mockup, elite mockup, and seamless pattern routes are now in server/routes/mockup.ts
  // Background removal routes are now in server/routes/background.ts

  // Admin routes are now in server/routes/admin.ts

  // Super admin routes are now in server/routes/super-admin.ts
  // Prompt favorites and mood board routes are now in server/routes/moodboard.ts

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

      // Batch fetch all images to avoid N+1 queries
      const imageIds = messages
        .filter(msg => msg.imageId)
        .map(msg => msg.imageId as string);

      const imageUrlMap = new Map<string, string>();
      if (imageIds.length > 0) {
        const images = await storage.getImagesByIds(imageIds, userId);
        for (const img of images) {
          imageUrlMap.set(img.id, img.imageUrl);
        }
      }

      // Enrich messages with imageUrl using the pre-fetched map
      const enrichedMessages = messages.map(msg => {
        if (msg.imageId) {
          return {
            ...msg,
            imageUrl: imageUrlMap.get(msg.imageId) || null
          };
        }
        return msg;
      });
      
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

  // User preferences API is now in server/routes/user.ts

  return httpServer;
}
