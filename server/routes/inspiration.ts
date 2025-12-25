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

}
