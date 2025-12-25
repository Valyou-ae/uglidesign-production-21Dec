import type { Express, Request, Response } from "express";
import { ZodError } from "zod";
import { storage } from "../storage";
import { insertImageSchema, insertImageFolderSchema } from "@shared/schema";
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

      // Auto-assign default folder if no folderId provided - using pool to avoid Neon HTTP driver issues
      let folderId = req.body.folderId;
      if (!folderId) {
        try {
          // Check if default folder exists
          const existingResult = await pool.query(
            `SELECT id FROM image_folders WHERE user_id = $1 AND name = 'My Folder' LIMIT 1`,
            [userId]
          );

          if (existingResult.rows.length > 0) {
            folderId = existingResult.rows[0].id;
          } else {
            // Create default folder
            const insertResult = await pool.query(
              `INSERT INTO image_folders (user_id, name, color) VALUES ($1, 'My Folder', '#6366f1') RETURNING id`,
              [userId]
            );
            if (insertResult.rows && insertResult.rows[0]) {
              folderId = insertResult.rows[0].id;
            }
          }
        } catch (folderError) {
          logger.error("Folder creation error (non-blocking)", folderError, { source: "images" });
          // Continue without folder - folderId remains undefined/null
        }
      }

      // Strip out version-related fields from client - these are only set by the edit endpoint
      const { parentImageId, editPrompt, versionNumber, ...safeBody } = req.body;
      
      const imageData = insertImageSchema.parse({
        ...safeBody,
        userId,
        folderId: folderId || null,
        // Force these fields to safe defaults for regular image creation
        parentImageId: null,
        editPrompt: null,
        versionNumber: 0,
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
  // SECURITY FIX: Added ownership validation with public image fallback
  app.get("/api/images/:id/image", async (req: Request, res: Response) => {
    try {
      // Get userId from authenticated user (claims.sub) OR guestId from session
      const authReq = req as AuthenticatedRequest & { session?: { guestId?: string } };
      const userId = authReq.user?.claims?.sub || authReq.session?.guestId;

      let image;
      
      // First, try to get image with ownership validation
      if (userId) {
        image = await storage.getImageById(req.params.id, userId);
      }
      
      // If not found (user doesn't own it), check if it's a public image
      // This allows viewing public images without ownership while protecting private ones
      if (!image) {
        const publicImage = await storage.getPublicImageById(req.params.id);
        if (publicImage) {
          image = publicImage;
        } else {
          // Image doesn't exist or is private and user doesn't own it
          return res.status(404).json({ message: "Image not found" });
        }
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
      logger.info("Toggle favorite request", { imageId: req.params.id, source: "images" });
      const userId = getUserId(req as AuthenticatedRequest);
      logger.info("Toggle favorite userId", { userId, source: "images" });
      const image = await storage.toggleImageFavorite(req.params.id, userId);
      logger.info("Toggle favorite result", { found: !!image, source: "images" });
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ image });
    } catch (error) {
      logger.error("Toggle favorite error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/images/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
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
      logger.info("Visibility toggle request", { imageId: req.params.id, source: "images" });
      const userId = getUserId(req as AuthenticatedRequest);
      logger.info("Visibility toggle userId", { userId, source: "images" });
      const { isPublic } = req.body;
      logger.info("Visibility toggle isPublic", { isPublic, source: "images" });
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ message: "isPublic must be a boolean" });
      }
      const image = await storage.setImageVisibility(req.params.id, userId, isPublic);
      logger.info("Visibility toggle result", { found: !!image, source: "images" });
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      // Invalidate gallery cache to reflect visibility change
      await invalidateCache('gallery:images');
      res.json({ image });
    } catch (error) {
      logger.error("Visibility toggle error", error, { source: "images" });
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

  // ============== IMAGE FOLDERS ROUTES ==============

  app.get("/api/folders/default", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const folder = await storage.getOrCreateDefaultFolder(userId);
      res.json({ folder });
    } catch (error) {
      logger.error("Get default folder error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/folders", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const folders = await storage.getFoldersByUser(userId);
      res.json({ folders });
    } catch (error) {
      logger.error("Get folders error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/folders", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const data = insertImageFolderSchema.parse({ ...req.body, userId });
      const folder = await storage.createFolder(data);
      res.json({ folder });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      logger.error("Create folder error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/folders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { name, color } = req.body;

      const folder = await storage.updateFolder(id, userId, { name, color });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      res.json({ folder });
    } catch (error) {
      logger.error("Update folder error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/folders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      await storage.deleteFolder(id, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Delete folder error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/images/:id/folder", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { folderId } = req.body;

      const image = await storage.moveImageToFolder(id, userId, folderId || null);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ image });
    } catch (error) {
      logger.error("Move image to folder error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });

  // Edit an image using AI - creates a new version
  app.post("/api/images/:id/edit", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { editPrompt } = req.body;

      if (!editPrompt || typeof editPrompt !== "string" || editPrompt.trim().length === 0) {
        return res.status(400).json({ message: "Edit prompt is required" });
      }

      // Get the original image
      const originalImage = await storage.getImageById(id, userId);
      if (!originalImage) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Get the base64 image data from the URL
      let imageBase64 = originalImage.imageUrl;
      if (imageBase64.startsWith("data:")) {
        // Extract base64 from data URL
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          imageBase64 = matches[2];
        }
      }

      // Import and call the editImage function
      const { editImage } = await import("../services/gemini");
      const result = await editImage(imageBase64, editPrompt.trim());

      if (!result) {
        return res.status(500).json({ message: "Failed to edit image. Please try again." });
      }

      // Determine root image - walk the ENTIRE parent chain and verify ownership
      let rootImageId = originalImage.id;
      let currentImage = originalImage;
      let chainDepth = 0;
      const MAX_CHAIN_DEPTH = 100; // Prevent infinite loops
      
      while (currentImage.parentImageId && chainDepth < MAX_CHAIN_DEPTH) {
        chainDepth++;
        const parentImage = await storage.getImageById(currentImage.parentImageId, userId);
        if (!parentImage) {
          // Parent exists but doesn't belong to this user - security violation
          return res.status(403).json({ message: "Cannot edit: ancestor image not owned by you" });
        }
        currentImage = parentImage;
        rootImageId = parentImage.id;
      }
      
      const versions = await storage.getImageVersionHistory(rootImageId, userId);
      const nextVersion = versions.length + 1;

      // Create new image entry as a child of the original
      const newImageUrl = `data:${result.mimeType};base64,${result.imageData}`;
      const newImage = await storage.createImage({
        userId,
        imageUrl: newImageUrl,
        prompt: originalImage.prompt,
        style: originalImage.style,
        aspectRatio: originalImage.aspectRatio,
        generationType: "edit",
        folderId: originalImage.folderId,
        parentImageId: rootImageId,
        editPrompt: editPrompt.trim(),
        versionNumber: nextVersion,
      });

      res.json({ 
        image: {
          ...newImage,
          imageUrl: `/api/images/${newImage?.id}/image`
        }
      });
    } catch (error) {
      logger.error("Image edit error", error, { source: "images" });
      res.status(500).json({ message: "Failed to edit image. Please try again." });
    }
  });

  // Get version history for an image
  app.get("/api/images/:id/versions", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      // Get the original image to find the root
      const image = await storage.getImageById(id, userId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Find root image ID (either this image if it has no parent, or the parent)
      const rootImageId = image.parentImageId || image.id;
      
      // Get all versions in the chain - filtered by user for security
      const versions = await storage.getImageVersionHistory(rootImageId, userId);

      // Return optimized version list
      const optimizedVersions = versions.map(v => ({
        id: v.id,
        imageUrl: `/api/images/${v.id}/image`,
        editPrompt: v.editPrompt,
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
      }));

      res.json({ versions: optimizedVersions, rootImageId });
    } catch (error) {
      logger.error("Get versions error", error, { source: "images" });
      res.status(500).json({ message: "Server error" });
    }
  });
}
