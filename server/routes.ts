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
      if (!withdrawalData.bankName || !withdrawalData.accountNumber || !withdrawalData.accountHolderName) {
        return res.status(400).json({ message: "Bank name, account number, and account holder name are required" });
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
      const { prompt, stylePreset = "auto", aspectRatio = "1:1", detail = "medium" } = req.body;
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

      const result = await generateGeminiImage(enhancedPrompt, negativePrompts);

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

      const result = await generateGeminiImage(enhancedPrompt, negativePrompts);

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
        productColor = "white",
        angles = ["front"],
        scene = "studio",
        style = "minimal",
        modelDetails,
      } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
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

      if (modelDetails) {
        const eliteGenerator = await import("./services/eliteMockupGenerator");
        const knowledge = await import("./services/knowledge");

        sendEvent("status", { stage: "analyzing", message: "Analyzing your design...", progress: 5 });

        const product = knowledge.getDTGProducts().find(p => 
          p.name.toLowerCase().includes(productType.toLowerCase()) ||
          p.subcategory?.toLowerCase().includes(productType.toLowerCase())
        ) || knowledge.getDTGProducts()[0];

        const colorHex = productColor === "white" ? "#FFFFFF" : 
                         productColor === "black" ? "#000000" : "#FFFFFF";

        let personaLockFailed = false;
        let batchCompleted = false;

        try {
          const batch = await eliteGenerator.generateMockupBatch({
            journey: "DTG",
            designImage: base64Data,
            product: product,
            colors: [{ name: productColor, hex: colorHex }],
            angles: angles as any[],
            modelDetails: modelDetails,
            brandStyle: style.toUpperCase().replace(/\s+/g, '_') as any || 'ECOMMERCE_CLEAN',
            lightingPreset: 'three-point-classic',
            materialCondition: 'BRAND_NEW',
            environmentPrompt: scene
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

            sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
            sendEvent("complete", { success: true, totalGenerated: batch.jobs.filter(j => j.status === 'completed').length });
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

      const totalAngles = angles.length;
      let completedAngles = 0;

      for (const angle of angles) {
        sendEvent("status", { 
          stage: "generating", 
          message: `Generating ${angle} view (${completedAngles + 1}/${totalAngles})...`,
          progress: 10 + Math.round((completedAngles / totalAngles) * 80)
        });

        const { prompt, negativePrompts } = await generateMockupPrompt(designAnalysis, {
          designBase64: base64Data,
          productType,
          productColor,
          scene,
          angle,
          style,
        });

        const result = await generateMockup(base64Data, prompt, negativePrompts);

        if (result) {
          sendEvent("image", {
            angle,
            imageData: result.imageData,
            mimeType: result.mimeType,
          });
        } else {
          sendEvent("image_error", { angle, error: "Failed to generate" });
        }

        completedAngles++;
      }

      sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
      sendEvent("complete", { success: true, totalGenerated: completedAngles });

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
    getAllProducts,
    BRAND_STYLES
  } = await import("./services/knowledge");

  app.get("/api/elite-mockup/products", requireAuth, async (_req, res) => {
    try {
      const dtgProducts = getDTGProducts();
      const aopProducts = getAOPProducts();
      res.json({ dtgProducts, aopProducts });
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

  return httpServer;
}
