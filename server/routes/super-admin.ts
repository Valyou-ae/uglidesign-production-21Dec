import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { adminRateLimiter } from "../rateLimiter";
import type { Middleware } from "./middleware";
import { logger } from "../logger";

export function registerSuperAdminRoutes(app: Express, middleware: Middleware) {
  const { requireSuperAdmin } = middleware;

  app.get("/api/super-admin/overview", requireSuperAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const overview = await storage.getSuperAdminOverview();
      res.json(overview);
    } catch (error) {
      logger.error("Super admin overview error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch overview" });
    }
  });

  app.get("/api/super-admin/users/growth", requireSuperAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const growth = await storage.getUserGrowthByDay(days);
      res.json({ growth });
    } catch (error) {
      logger.error("Super admin user growth error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch user growth" });
    }
  });

  app.get("/api/super-admin/generations/stats", requireSuperAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getGenerationsByDay(days);
      res.json({ stats });
    } catch (error) {
      logger.error("Super admin generation stats error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch generation stats" });
    }
  });

  app.get("/api/super-admin/top-creators", requireSuperAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const creators = await storage.getTopCreators(limit);
      res.json({ creators });
    } catch (error) {
      logger.error("Super admin top creators error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch top creators" });
    }
  });

  app.get("/api/super-admin/users/by-role", requireSuperAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const roleStats = await storage.getUsersByRole();
      res.json({ roleStats });
    } catch (error) {
      logger.error("Super admin users by role error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch users by role" });
    }
  });

  app.get("/api/super-admin/feature-usage", requireSuperAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const usage = await storage.getFeatureUsageBreakdown();
      res.json({ usage });
    } catch (error) {
      logger.error("Super admin feature usage error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch feature usage" });
    }
  });

  app.get("/api/super-admin/subscriptions", requireSuperAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getSubscriptionStats();
      res.json(stats);
    } catch (error) {
      logger.error("Super admin subscriptions error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch subscription stats" });
    }
  });

  app.get("/api/super-admin/affiliates", requireSuperAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const affiliates = await storage.getAffiliatePerformance(limit);
      res.json({ affiliates });
    } catch (error) {
      logger.error("Super admin affiliates error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch affiliate performance" });
    }
  });

  app.get("/api/super-admin/revenue", requireSuperAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const revenue = await storage.getRevenueByDay(days);
      res.json({ revenue });
    } catch (error) {
      logger.error("Super admin revenue error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/super-admin/daily-active-users", requireSuperAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const dau = await storage.getDailyActiveUsers(days);
      res.json({ dau });
    } catch (error) {
      logger.error("Super admin DAU error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch daily active users" });
    }
  });

  app.get("/api/super-admin/retention", requireSuperAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const retention = await storage.getRetentionRate();
      res.json(retention);
    } catch (error) {
      logger.error("Super admin retention error", error, { source: "super-admin" });
      res.status(500).json({ message: "Failed to fetch retention rate" });
    }
  });
}
