import type { Express, Request, Response } from "express";
import path from "path";
import { ZodError } from "zod";
import { storage } from "../storage";
import { updateProfileSchema } from "@shared/schema";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export function registerUserRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  // ============== PROFILE ROUTES ==============

  app.patch("/api/user/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
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
  app.post("/api/user/profile/photo", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
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
      logger.error("Profile photo upload error", error, { source: "user" });
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Remove profile photo endpoint
  app.delete("/api/user/profile/photo", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);

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
      logger.error("Profile photo removal error", error, { source: "user" });
      res.status(500).json({ message: "Failed to remove profile photo" });
    }
  });

  // ============== USER STATS ROUTES ==============

  app.get("/api/user/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const stats = await storage.getUserStats(userId);
      const credits = await storage.getUserCredits(userId);
      res.json({ ...stats, credits });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/user/credits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const credits = await storage.getUserCredits(userId);
      res.json({ credits });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== USER PREFERENCES ROUTES ==============

  app.get("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const preferences = await storage.getUserPreferences(userId);
      res.json({ preferences: preferences || null });
    } catch (error) {
      logger.error("Get user preferences error", error, { source: "user" });
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });

  app.put("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { updateUserPreferencesSchema } = await import("@shared/schema");
      const parseResult = updateUserPreferencesSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid request data", errors: parseResult.error.errors });
      }
      const preferences = await storage.upsertUserPreferences(userId, parseResult.data);
      res.json({ preferences });
    } catch (error) {
      logger.error("Update user preferences error", error, { source: "user" });
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  app.patch("/api/user/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { updateUserPreferencesSchema } = await import("@shared/schema");
      const parseResult = updateUserPreferencesSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid request data", errors: parseResult.error.errors });
      }
      const preferences = await storage.upsertUserPreferences(userId, parseResult.data);
      res.json({ preferences });
    } catch (error) {
      logger.error("Patch user preferences error", error, { source: "user" });
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  app.post("/api/user/preferences/analyze", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { getOrCreateUserProfile } = await import("../services/profileAnalyzer");
      const preferences = await getOrCreateUserProfile(userId);
      res.json({ preferences });
    } catch (error) {
      logger.error("Analyze user preferences error", error, { source: "user" });
      res.status(500).json({ message: "Failed to analyze user preferences" });
    }
  });
}
