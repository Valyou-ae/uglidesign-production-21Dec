import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcrypt";
import { insertUserSchema, insertImageSchema, insertWithdrawalSchema, updateProfileSchema } from "@shared/schema";
import { ZodError } from "zod";

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

  // Testing mode - skip auth when TEST_MODE is enabled
  const isTestMode = process.env.TEST_MODE === "true";
  const TEST_USER_ID = "86375c89-623d-4e4f-b05b-056bc1663bf5";

  // Auth middleware - bypassed in test mode
  const requireAuth = (req: any, res: any, next: any) => {
    if (isTestMode) {
      // In test mode, use the test user ID
      req.session.userId = req.session.userId || TEST_USER_ID;
      return next();
    }
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
      const profileData = updateProfileSchema.parse(req.body);

      const user = await storage.updateUserProfile(req.session.userId!, profileData);

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
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
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

      // Validate required banking fields
      if (!withdrawalData.bankName || !withdrawalData.accountNumber || !withdrawalData.accountName) {
        return res.status(400).json({ message: "Bank name, account number, and account name are required" });
      }

      // Validate withdrawal amount doesn't exceed available balance
      const totalEarnings = await storage.getTotalEarnings(req.session.userId!);
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

  app.get("/api/affiliate/withdrawals", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawalsByUserId(req.session.userId!);
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
    generateMultipleImages,
    scoreImage,
  } = await import("./services/gemini");

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
      const { prompt, stylePreset = "auto", aspectRatio = "1:1" } = req.body;
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
        "draft"
      );
      sendEvent("enhancement", { enhancedPrompt, negativePrompts });
      sendEvent("status", { agent: "Style Architect", status: "complete", message: "Prompt enhanced" });

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: "Generating images..." });

      const imageCount = 4;
      let completedCount = 0;

      await generateMultipleImages(
        enhancedPrompt,
        negativePrompts,
        imageCount,
        (index, result) => {
          completedCount++;
          if (result) {
            sendEvent("image", {
              index,
              imageData: result.imageData,
              mimeType: result.mimeType,
              progress: `${completedCount}/${imageCount}`,
            });
          } else {
            sendEvent("image_error", { index, error: "Generation failed" });
          }
          sendEvent("progress", { completed: completedCount, total: imageCount });
        }
      );

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", { message: "Draft generation complete", totalImages: completedCount });

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
        qualityLevel = "standard",
        aspectRatio = "1:1",
        enableCuration = true,
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
        qualityLevel
      );
      sendEvent("enhancement", { enhancedPrompt, negativePrompts });
      sendEvent("status", { agent: "Style Architect", status: "complete", message: "Master prompt ready" });

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: "Generating candidates..." });

      const candidateCount = enableCuration ? 8 : 2;
      const candidates: { index: number; imageData: string; mimeType: string; score?: number }[] = [];

      await generateMultipleImages(
        enhancedPrompt,
        negativePrompts,
        candidateCount,
        (index, result) => {
          if (result) {
            candidates.push({
              index,
              imageData: result.imageData,
              mimeType: result.mimeType,
            });
            sendEvent("candidate", {
              index,
              progress: `${candidates.length}/${candidateCount}`,
            });
          }
        }
      );

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Candidates generated" });

      if (enableCuration && candidates.length > 1) {
        sendEvent("status", { agent: "Quality Analyst", status: "working", message: "Scoring images..." });

        for (const candidate of candidates) {
          const score = await scoreImage(candidate.imageData, prompt);
          candidate.score = score.overall;
          sendEvent("score", { index: candidate.index, score });
        }

        candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
        sendEvent("status", { agent: "Quality Analyst", status: "complete", message: "Best images selected" });
      }

      sendEvent("status", { agent: "Master Refiner", status: "working", message: "Applying final polish..." });

      const topCandidates = candidates.slice(0, 2);

      for (const candidate of topCandidates) {
        sendEvent("final_image", {
          index: candidate.index,
          imageData: candidate.imageData,
          mimeType: candidate.mimeType,
          score: candidate.score,
        });
      }

      sendEvent("status", { agent: "Master Refiner", status: "complete", message: "Refinement complete" });
      sendEvent("complete", {
        message: "Final generation complete",
        totalCandidates: candidates.length,
        selectedCount: topCandidates.length,
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

  return httpServer;
}
