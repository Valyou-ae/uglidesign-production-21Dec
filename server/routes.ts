import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertImageSchema, insertWithdrawalSchema, updateProfileSchema, insertContactSchema, insertDealSchema, insertActivitySchema, insertPromptFavoriteSchema, insertMoodBoardSchema, insertMoodBoardItemSchema, guestGenerations } from "@shared/schema";
import { ZodError } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);

  const isTestMode = process.env.TEST_MODE === "true";
  const TEST_USER_ID = "86375c89-623d-4e4f-b05b-056bc1663bf5";

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

  app.post("/api/auth/google", async (req: any, res) => {
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

      // Check if user exists by email
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user using upsertUser for full field support
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);
        user = await storage.upsertUser({
          id: googleId,
          email,
          username,
          displayName: name || username,
          profileImageUrl: picture || null,
          role: 'user',
        });
      } else {
        // Update existing user's profile image and display name from Google if not set
        const updates: any = {};
        if (picture && !user.profileImageUrl) {
          updates.profileImageUrl = picture;
        }
        if (name && !user.displayName) {
          updates.displayName = name;
        }
        // Always update profile image if it changed
        if (picture && user.profileImageUrl !== picture) {
          updates.profileImageUrl = picture;
        }
        if (Object.keys(updates).length > 0) {
          user = await storage.updateUserProfile(user.id, updates) || user;
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
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
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
      const products = await stripeService.listProductsWithPrices(true);
      res.json({ products });
    } catch (error) {
      console.error("Stripe products error:", error);
      res.status(500).json({ message: "Failed to get products" });
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
      const imageData = insertImageSchema.parse({
        ...req.body,
        userId,
      });

      const image = await storage.createImage(imageData);
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
      const images = await storage.getImagesByUserId(userId);
      res.json({ images });
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

  // ============== AFFILIATE ROUTES ==============

  app.get("/api/affiliate/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const commissions = await storage.getCommissionsByUserId(userId);
      const totalEarnings = await storage.getTotalEarnings(userId);
      
      res.json({ 
        totalEarnings,
        activeReferrals: commissions.length,
        commissions 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/affiliate/withdraw", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const withdrawalData = insertWithdrawalSchema.parse({
        ...req.body,
        userId,
      });

      if (!withdrawalData.bankName || !withdrawalData.accountNumber || !withdrawalData.accountHolderName) {
        return res.status(400).json({ message: "Bank name, account number, and account holder name are required" });
      }

      const totalEarnings = await storage.getTotalEarnings(userId);
      if (withdrawalData.amount > totalEarnings) {
        return res.status(400).json({ message: "Withdrawal amount exceeds available balance" });
      }

      if (withdrawalData.amount <= 0) {
        return res.status(400).json({ message: "Withdrawal amount must be greater than zero" });
      }

      const withdrawal = await storage.createWithdrawalRequest(withdrawalData);
      res.json({ withdrawal });
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
      res.json({ withdrawals });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== IMAGE GENERATION ROUTES ==============

  const {
    analyzePrompt,
    enhancePrompt,
    generateImage: generateGeminiImage,
  } = await import("./services/gemini");

  // ============== GUEST IMAGE GENERATION (NO AUTH) ==============

  app.post("/api/guest/generate-image", async (req, res) => {
    try {
      const { prompt, guestId } = req.body;
      if (!prompt || !guestId) {
        return res.status(400).json({ message: "Missing prompt or guestId" });
      }

      const existing = await db.select().from(guestGenerations).where(eq(guestGenerations.guestId, guestId));
      if (existing.length > 0) {
        return res.status(403).json({ message: "Free generation already used. Please login for more." });
      }

      const result = await generateGeminiImage(prompt, [], "quality");
      if (!result) {
        return res.status(500).json({ message: "Generation failed" });
      }

      await db.insert(guestGenerations).values({ guestId });

      return res.json({ imageData: result.imageData, mimeType: result.mimeType });
    } catch (error) {
      console.error("Guest generation error:", error);
      return res.status(500).json({ message: "Generation failed" });
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

  app.post("/api/generate/draft", requireAuth, async (req, res) => {
    try {
      const { prompt, stylePreset = "auto", aspectRatio = "1:1", detail = "medium", speed = "quality" } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

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

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: "Generating image..." });

      const result = await generateGeminiImage(enhancedPrompt, negativePrompts, speed);

      if (result) {
        sendEvent("image", {
          index: 0,
          imageData: result.imageData,
          mimeType: result.mimeType,
          progress: "1/1",
        });
      } else {
        sendEvent("image_error", { index: 0, error: "Generation failed" });
      }

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", { message: "Draft generation complete", totalImages: result ? 1 : 0 });

      res.end();
    } catch (error) {
      console.error("Draft generation error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/generate/final", requireAuth, async (req, res) => {
    try {
      const {
        prompt,
        stylePreset = "auto",
        qualityLevel = "premium",
        aspectRatio = "1:1",
        detail = "medium",
        speed = "quality",
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
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

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: "Generating image..." });

      const result = await generateGeminiImage(enhancedPrompt, negativePrompts, speed);

      if (result) {
        sendEvent("final_image", {
          index: 0,
          imageData: result.imageData,
          mimeType: result.mimeType,
        });
      } else {
        sendEvent("image_error", { index: 0, error: "Generation failed" });
      }

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", {
        message: "Final generation complete",
        totalImages: result ? 1 : 0,
      });

      res.end();
    } catch (error) {
      console.error("Final generation error:", error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/generate/single", requireAuth, async (req, res) => {
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

      const result = await generateGeminiImage(enhancedPrompt, negativePrompts);

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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const allUsers = await storage.getAllUsers();
      const totalUsers = allUsers.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const startIndex = (page - 1) * limit;
      const paginatedUsers = allUsers.slice(startIndex, startIndex + limit);
      
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
  app.get("/api/admin/crm/contacts", requireAdmin, async (_req: any, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json({ contacts });
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
  app.get("/api/admin/crm/deals", requireAdmin, async (_req: any, res) => {
    try {
      const deals = await storage.getDeals();
      res.json({ deals });
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
  app.get("/api/admin/crm/activities", requireAdmin, async (_req: any, res) => {
    try {
      const activities = await storage.getActivities();
      res.json({ activities });
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
      const { id } = req.params;
      const { imageId, positionX, positionY, width, height, zIndex } = req.body;
      
      if (!imageId) {
        return res.status(400).json({ message: "Image ID is required" });
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
      const { itemId } = req.params;
      const { positionX, positionY, width, height, zIndex } = req.body;
      
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
      const { itemId } = req.params;
      
      await storage.removeItemFromBoard(itemId);
      res.json({ message: "Item removed from board successfully" });
    } catch (error) {
      console.error("Remove item from board error:", error);
      res.status(500).json({ message: "Failed to remove item from board" });
    }
  });

  return httpServer;
}
