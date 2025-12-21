import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { generationRateLimiter } from "../rateLimiter";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export async function registerInspirationRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  // ============== DAILY INSPIRATION ROUTES ==============

  app.get("/api/inspirations", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const inspirations = await storage.getDailyInspirations(limit);
      res.json({ inspirations });
    } catch (error) {
      logger.error("Inspirations error", error, { source: "inspiration" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/inspirations/today", async (_req: Request, res: Response) => {
    try {
      const inspiration = await storage.getTodaysInspiration();
      if (!inspiration) {
        return res.status(404).json({ message: "No inspiration available today" });
      }
      res.json(inspiration);
    } catch (error) {
      logger.error("Today's inspiration error", error, { source: "inspiration" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/inspirations/featured", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      const inspirations = await storage.getFeaturedInspirations(limit);
      res.json({ inspirations });
    } catch (error) {
      logger.error("Featured inspirations error", error, { source: "inspiration" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/prompts/recommendations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { analyzeUserProfile, generatePersonalizedPrompts } = await import("../services/profileAnalyzer");

      const analysis = await analyzeUserProfile(userId);
      const recommendations = await generatePersonalizedPrompts(analysis);

      res.json({ recommendations, analysis: { profileCompleteness: analysis.profileCompleteness } });
    } catch (error) {
      logger.error("Personalized prompts error", error, { source: "inspiration" });
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== STYLE TRANSFER ROUTES ==============

  app.get("/api/style-transfer/presets", async (_req: Request, res: Response) => {
    try {
      const { getStylePresets, getStylePresetsByCategory } = await import("../services/styleTransfer");
      const presets = getStylePresets();
      const byCategory = getStylePresetsByCategory();
      res.json({ presets, byCategory });
    } catch (error) {
      logger.error("Style presets error", error, { source: "inspiration" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/style-transfer/preset", generationRateLimiter, async (req: Request, res: Response) => {
    try {
      const { contentImage, presetId, options } = req.body;

      if (!contentImage || !presetId) {
        return res.status(400).json({ message: "Content image and preset ID are required" });
      }

      const { transferStyleFromPreset } = await import("../services/styleTransfer");

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
      logger.error("Style transfer preset error", error, { source: "inspiration" });
      res.status(500).json({ message: "Style transfer failed" });
    }
  });

  app.post("/api/style-transfer/custom", generationRateLimiter, async (req: Request, res: Response) => {
    try {
      const { contentImage, styleImage, options } = req.body;

      if (!contentImage || !styleImage) {
        return res.status(400).json({ message: "Both content and style images are required" });
      }

      const { transferStyleFromImage } = await import("../services/styleTransfer");

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
      logger.error("Style transfer custom error", error, { source: "inspiration" });
      res.status(500).json({ message: "Style transfer failed" });
    }
  });
}
