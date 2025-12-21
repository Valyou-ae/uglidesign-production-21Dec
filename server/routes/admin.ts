import type { Express, Request, Response } from "express";
import { ZodError } from "zod";
import { storage } from "../storage";
import {
  insertContactSchema,
  insertDealSchema,
  insertActivitySchema,
} from "@shared/schema";
import { adminRateLimiter } from "../rateLimiter";
import type { Middleware } from "./middleware";
import { parsePagination } from "./utils";
import type { AuthenticatedRequest } from "../types";
import { imageCache, getCacheStats } from "../cache";
import { logger } from "../logger";

export function registerAdminRoutes(app: Express, middleware: Middleware) {
  const { requireAdmin } = middleware;

  // ============== USER MANAGEMENT ==============

  app.get("/api/admin/users", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { limit, offset } = parsePagination(req.query as Record<string, string>, { limit: 20, maxLimit: 100 });
      const page = Math.floor(offset / limit) + 1;

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
      logger.error("Admin users fetch error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
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
      logger.error("Admin role update error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // ============== CRM CONTACTS ==============

  app.get("/api/admin/crm/contacts", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { limit, offset } = parsePagination(req.query as Record<string, string>, { limit: 50, maxLimit: 200 });
      const { contacts, total } = await storage.getContacts(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      res.json({ contacts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      logger.error("Admin contacts fetch error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get("/api/admin/crm/contacts/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const contact = await storage.getContact(id);

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      res.json({ contact });
    } catch (error) {
      logger.error("Admin contact fetch error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post("/api/admin/crm/contacts", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.status(201).json({ contact });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      logger.error("Admin contact create error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch("/api/admin/crm/contacts/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
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
      logger.error("Admin contact update error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/crm/contacts/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const contact = await storage.getContact(id);

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      await storage.deleteContact(id);
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      logger.error("Admin contact delete error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // ============== CRM DEALS ==============

  app.get("/api/admin/crm/deals", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { limit, offset } = parsePagination(req.query as Record<string, string>, { limit: 50, maxLimit: 200 });
      const { deals, total } = await storage.getDeals(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      res.json({ deals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      logger.error("Admin deals fetch error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get("/api/admin/crm/deals/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deal = await storage.getDeal(id);

      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      res.json({ deal });
    } catch (error) {
      logger.error("Admin deal fetch error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post("/api/admin/crm/deals", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.status(201).json({ deal });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      logger.error("Admin deal create error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.patch("/api/admin/crm/deals/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
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
      logger.error("Admin deal update error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete("/api/admin/crm/deals/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deal = await storage.getDeal(id);

      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      await storage.deleteDeal(id);
      res.json({ message: "Deal deleted successfully" });
    } catch (error) {
      logger.error("Admin deal delete error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // ============== CRM ACTIVITIES ==============

  app.get("/api/admin/crm/activities", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { limit, offset } = parsePagination(req.query as Record<string, string>, { limit: 50, maxLimit: 200 });
      const { activities, total } = await storage.getActivities(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      res.json({ activities, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      logger.error("Admin activities fetch error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/admin/crm/activities", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json({ activity });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      logger.error("Admin activity create error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.patch("/api/admin/crm/activities/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
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
      logger.error("Admin activity update error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete("/api/admin/crm/activities/:id", requireAdmin, adminRateLimiter, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Check if activity exists by getting all activities (not ideal but matches original code)
      const { activities } = await storage.getActivities(1000, 0);
      const activityExists = activities.find(a => a.id === id);

      if (!activityExists) {
        return res.status(404).json({ message: "Activity not found" });
      }

      await storage.deleteActivity(id);
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      logger.error("Admin activity delete error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // ============== ANALYTICS ==============

  app.get("/api/admin/analytics", requireAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json({ analytics });
    } catch (error) {
      logger.error("Admin analytics fetch error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ============== CACHE MONITORING ==============

  app.get("/api/admin/cache-stats", requireAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const stats = getCacheStats();
      const { pool } = await import("../db");

      // Get database pool stats
      const dbStats = {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      };

      res.json({
        cache: stats,
        database: dbStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Cache stats error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to fetch cache stats" });
    }
  });

  app.post("/api/admin/cache-clear", requireAdmin, adminRateLimiter, async (_req: Request, res: Response) => {
    try {
      const { clearCache } = await import("../cache");
      clearCache();
      imageCache.clear();
      res.json({ message: "Cache cleared successfully", timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error("Cache clear error", error, { source: "admin" });
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });
}
