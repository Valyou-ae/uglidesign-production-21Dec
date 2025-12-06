import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcrypt";
import { insertUserSchema, insertImageSchema, insertWithdrawalSchema } from "@shared/schema";
import { ZodError } from "zod";
import { generateImageWithPipeline } from "./gemini";

const PgSession = ConnectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Session middleware
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
      }),
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // ============== AUTH ROUTES ==============
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password } = insertUserSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique affiliate code
      const affiliateCode = `${username.toLowerCase()}-${Math.random().toString(36).substring(7)}`;

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Update affiliate code
      await storage.updateUserProfile(user.id, { affiliateCode });

      // Set session
      req.session.userId = user.id;

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          affiliateCode
        } 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          affiliateCode: user.affiliateCode
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
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
          socialLinks: user.socialLinks || [],
          affiliateCode: user.affiliateCode
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== USER/PROFILE ROUTES ==============

  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { displayName, firstName, lastName, bio, socialLinks } = req.body;

      const user = await storage.updateUserProfile(req.session.userId!, {
        displayName,
        firstName,
        lastName,
        bio,
        socialLinks,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== IMAGE GENERATION ROUTES ==============

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, style, aspectRatio } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Use the 3-phase pipeline for 100% text accuracy
      // Phase 1: Text Sentinel detects text requirements
      // Phase 2: Style Architect creates Art Direction prompt
      // Phase 3: Image Generator renders with accurate text
      const result = await generateImageWithPipeline(prompt, style);
      
      const imageUrl = `data:${result.mimeType};base64,${result.imageBase64}`;

      // Use session userId if logged in, otherwise use a default test user
      let userId = req.session.userId;
      if (!userId) {
        const testUser = await storage.getUserByUsername("testuser");
        userId = testUser?.id || "anonymous";
      }

      const image = await storage.createImage({
        userId,
        imageUrl,
        prompt: result.pipeline?.finalPrompt || prompt,
        style: style || "default",
        aspectRatio: aspectRatio || "1:1",
        generationType: "ai-generated",
      });

      res.json({ 
        image,
        enhancedPrompt: result.pipeline?.finalPrompt,
        pipeline: result.pipeline ? {
          textAnalysis: result.pipeline.textAnalysis,
          textDirections: result.pipeline.artDirection.textDirections,
          ocrValidation: result.pipeline.ocrValidation ? {
            accuracyScore: result.pipeline.ocrValidation.accuracyScore,
            passedValidation: result.pipeline.ocrValidation.passedValidation,
            extractedTexts: result.pipeline.ocrValidation.extractedTexts,
            matchDetails: result.pipeline.ocrValidation.matchDetails,
          } : undefined,
          attempts: result.pipeline.attempts,
        } : undefined,
      });
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate image" });
    }
  });

  // ============== IMAGE ROUTES ==============

  app.post("/api/images", requireAuth, async (req, res) => {
    try {
      const imageData = insertImageSchema.parse({
        ...req.body,
        userId: req.session.userId,
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

  app.get("/api/images", requireAuth, async (req, res) => {
    try {
      const images = await storage.getImagesByUserId(req.session.userId!);
      res.json({ images });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/favorite", requireAuth, async (req, res) => {
    try {
      const image = await storage.toggleImageFavorite(req.params.id, req.session.userId!);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ image });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/images/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteImage(req.params.id, req.session.userId!);
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ message: "Image deleted" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== AFFILIATE ROUTES ==============

  app.get("/api/affiliate/stats", requireAuth, async (req, res) => {
    try {
      const commissions = await storage.getCommissionsByUserId(req.session.userId!);
      const totalEarnings = await storage.getTotalEarnings(req.session.userId!);
      
      res.json({ 
        totalEarnings,
        activeReferrals: commissions.length,
        commissions 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/affiliate/withdraw", requireAuth, async (req, res) => {
    try {
      const withdrawalData = insertWithdrawalSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const withdrawal = await storage.createWithdrawalRequest(withdrawalData);
      res.json({ withdrawal });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/affiliate/withdrawals", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawalsByUserId(req.session.userId!);
      res.json({ withdrawals });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
