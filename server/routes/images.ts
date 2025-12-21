import type { Express, Request, Response } from "express";
import { ZodError } from "zod";
import { storage } from "../storage";
import { insertImageSchema, insertImageProjectSchema } from "@shared/schema";
import { invalidateCache, getCachedImageBuffer, imageCache } from "../cache";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { parsePagination } from "./utils";
import { logger } from "../logger";

export function registerImageRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  // ============== IMAGE ROUTES ==============

  app.post("/api/images", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { pool } = await import("../db");

      // Auto-assign default project if no projectId provided - using pool to avoid Neon HTTP driver issues
      let projectId = req.body.projectId;
      if (!projectId) {
        try {
          // Check if default project exists
          const existingResult = await pool.query(
            `SELECT id FROM image_projects WHERE user_id = $1 AND name = 'My Project' LIMIT 1`,
            [userId]
          );

          if (existingResult.rows.length > 0) {
            projectId = existingResult.rows[0].id;
          } else {
            // Create default project
            const insertResult = await pool.query(
              `INSERT INTO image_projects (user_id, name, color) VALUES ($1, 'My Project', '#6366f1') RETURNING id`,
              [userId]
            );
            if (insertResult.rows && insertResult.rows[0]) {
              projectId = insertResult.rows[0].id;
            }
          }
        } catch (projectError) {
          logger.error("Project creation error (non-blocking)", projectError, { source: "images" });
          // Continue without project - projectId remains undefined/null
        }
      }

      const imageData = insertImageSchema.parse({
        ...req.body,
        userId,
        projectId: projectId || null,
      });

      const image = await storage.createImage(imageData);
      
      if (!image) {
        console.error("Failed to create image - storage returned undefined");
        return res.status(500).json({ message: "Failed to save image to database." });
      }

      // Only save to gallery for discover page if image is public
      if (imageData.isPublic) {
        const user = await storage.getUser(userId);
        await storage.createGalleryImage({
          sourceImageId: image.id,
          title: imageData.prompt?.slice(0, 100) || "AI Generated Image",
          imageUrl: imageData.imageUrl,
          creator: user?.displayName || user?.username || "UGLI User",
          category: "ai-generated",
          aspectRatio: imageData.aspectRatio || "1:1",
          prompt: imageData.prompt || "",
        });
      }

      // Invalidate gallery cache so new image appears immediately
      await invalidateCache('gallery:images');

      res.json({ image });
    } catch (error) {
      logger.error("Image save error", error, { source: "images" });
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save image. Please try again." });
    }
  });

  app.get("/api/images", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { limit, offset } = parsePagination(req.query as Record<string, string>, { limit: 20, maxLimit: 100 });
      const { images, total } = await storage.getImagesByUserId(userId, limit, offset);

      // Return images with URL paths instead of full base64 for faster loading
      const optimizedImages = images.map(img => ({
        ...img,
        imageUrl: `/api/images/${img.id}/image`
      }));

      res.json({ images: optimizedImages, total, limit, offset, hasMore: offset + images.length < total });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Serve actual image data by ID (lazy loading for performance)
  // Supports both authenticated users and guests via session
  app.get("/api/images/:id/image", async (req: Request, res: Response) => {
    try {
      // Get userId from authenticated user (claims.sub) OR guestId from session
      const authReq = req as AuthenticatedRequest & { session?: { guestId?: string } };
      const userId = authReq.user?.claims?.sub || authReq.session?.guestId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const image = await storage.getImageById(req.params.id, userId);

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Handle base64 data URLs with caching for faster repeated access
      const imageUrl = image.imageUrl;
      if (imageUrl.startsWith('data:')) {
        // Use cached buffer if available, otherwise decode and cache
        const cached = getCachedImageBuffer(req.params.id, imageUrl);
        if (cached) {
          res.set({
            'Content-Type': cached.mimeType,
            'Content-Length': cached.buffer.length,
            'Cache-Control': 'private, max-age=31536000, immutable',
            'X-Cache': 'HIT'
          });
          return res.send(cached.buffer);
        }

        // Fallback: decode without caching if cache failed
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          res.set({
            'Content-Type': mimeType,
            'Content-Length': buffer.length,
            'Cache-Control': 'private, max-age=31536000, immutable',
            'X-Cache': 'MISS'
          });
          return res.send(buffer);
        }
      }

      // For regular URLs, redirect
      res.redirect(imageUrl);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/favorite", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const image = await storage.toggleImageFavorite(req.params.id, userId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ image });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/images/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const authReq = req as AuthenticatedRequest & { session?: { guestId?: string; passport?: { user?: { id?: string } } } };
      logger.info("Delete image request", { 
        imageId: req.params.id, 
        userId, 
        claimsSub: authReq.user?.claims?.sub,
        passportId: authReq.session?.passport?.user?.id,
        guestId: authReq.session?.guestId
      }, { source: "images" });
      const success = await storage.deleteImage(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ message: "Image deleted" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/visibility", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ message: "isPublic must be a boolean" });
      }
      const image = await storage.setImageVisibility(req.params.id, userId, isPublic);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      // Invalidate gallery cache to reflect visibility change
      await invalidateCache('gallery:images');
      res.json({ image });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/public", async (req: Request, res: Response) => {
    try {
      const { limit } = parsePagination(req.query as Record<string, string>, { limit: 50, maxLimit: 100 });
      const images = await storage.getPublicImages(limit);
      res.json({ images });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/share/:id", async (req: Request, res: Response) => {
    try {
      const image = await storage.getPublicImageById(req.params.id);
      if (!image) {
        return res.status(404).json({ message: "Image not found or is private" });
      }
      // Get gallery image ID for like functionality
      const galleryImage = await storage.getGalleryImageBySourceId(req.params.id);
      const likeCount = galleryImage?.likeCount || 0;
      const viewCount = galleryImage?.viewCount || 0;
      const remixCount = galleryImage?.useCount || 0;

      // Check if current user has liked this image (if logged in)
      let likedByViewer = false;
      const authReq = req as AuthenticatedRequest & { session?: { passport?: { user?: { id?: string } } } };
      const userId = authReq.user?.claims?.sub || authReq.session?.passport?.user?.id;
      if (userId && galleryImage?.id) {
        likedByViewer = await storage.hasUserLikedImage(String(galleryImage.id), userId);
      }

      // Increment view count asynchronously
      if (galleryImage?.id) {
        storage.incrementGalleryImageView(String(galleryImage.id)).catch(() => {});
      }

      res.json({
        image: {
          ...image,
          galleryImageId: galleryImage?.id ? String(galleryImage.id) : null,
          likeCount,
          viewCount: viewCount + 1, // Include the current view
          remixCount,
          likedByViewer
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Track remix when user clicks remix button
  app.post("/api/images/:id/remix", async (req: Request, res: Response) => {
    try {
      const galleryImage = await storage.getGalleryImageBySourceId(req.params.id);
      if (galleryImage?.id) {
        await storage.incrementGalleryImageUse(String(galleryImage.id));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/calendar", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      const counts = await storage.getImageCountsByMonth(userId, year, month);
      res.json({ counts });
    } catch (error) {
      logger.error("Calendar data error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/images/by-date", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
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
      logger.error("Images by date error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== IMAGE PROJECTS ROUTES ==============

  app.get("/api/projects/default", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const project = await storage.getOrCreateDefaultProject(userId);
      res.json({ project });
    } catch (error) {
      logger.error("Get default project error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const projects = await storage.getProjectsByUser(userId);
      res.json({ projects });
    } catch (error) {
      logger.error("Get projects error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const data = insertImageProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(data);
      res.json({ project });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      logger.error("Create project error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { name, color } = req.body;

      const project = await storage.updateProject(id, userId, { name, color });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ project });
    } catch (error) {
      logger.error("Update project error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      await storage.deleteProject(id, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Delete project error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/project", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { projectId } = req.body;

      const image = await storage.moveImageToProject(id, userId, projectId || null);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ image });
    } catch (error) {
      logger.error("Move image to project error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });
}
