import type { Express, Request, Response } from "express";
import sharp from "sharp";
import { storage } from "../storage";
import { generationRateLimiter } from "../rateLimiter";
import { getFromCache, CACHE_TTL, invalidateCache } from "../cache";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";

export function registerGalleryRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  app.get("/api/gallery", async (req: Request, res: Response) => {
    try {
      // Cache gallery images for 5 minutes to reduce DB load
      const images = await getFromCache(
        'gallery:images',
        CACHE_TTL.GALLERY_IMAGES,
        () => storage.getGalleryImages()
      );
      const userId = (req as AuthenticatedRequest).user?.claims?.sub;

      let likedImageIds: string[] = [];
      if (userId) {
        likedImageIds = await storage.getUserLikedImages(userId);
      }

      const imagesWithLikeStatus = images.map(img => ({
        ...img,
        thumbnailUrl: `/api/gallery/${img.id}/thumbnail`,
        isLiked: likedImageIds.includes(img.id)
      }));

      res.json({ images: imagesWithLikeStatus });
    } catch (error) {
      console.error("Gallery error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/gallery/:imageId/like", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { imageId } = req.params;

      const result = await storage.likeGalleryImage(imageId, userId);
      invalidateCache('gallery:images');
      res.json(result);
    } catch (error) {
      console.error("Like error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/gallery/:imageId/view", generationRateLimiter, async (req: Request, res: Response) => {
    try {
      const { imageId } = req.params;

      const image = await storage.incrementGalleryImageView(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      invalidateCache('gallery:images');
      res.json({ viewCount: image.viewCount });
    } catch (error) {
      console.error("View tracking error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/gallery/:imageId/use", requireAuth, async (req: Request, res: Response) => {
    try {
      const { imageId } = req.params;

      const image = await storage.incrementGalleryImageUse(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      invalidateCache('gallery:images');
      res.json({ useCount: image.useCount });
    } catch (error) {
      console.error("Use tracking error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/gallery/:imageId", async (req: Request, res: Response) => {
    try {
      const { imageId } = req.params;

      // Try to get from cache first, fall back to direct query
      const cachedImages = await getFromCache(
        'gallery:images',
        CACHE_TTL.GALLERY_IMAGES,
        () => storage.getGalleryImages()
      );

      let image = cachedImages.find(img => img.id === imageId);
      if (!image) {
        // If not in cache, try direct query (for newly added images)
        image = await storage.getGalleryImageById(imageId);
      }

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const userId = (req as AuthenticatedRequest).user?.claims?.sub;
      let isLiked = false;
      if (userId) {
        isLiked = await storage.hasUserLikedImage(imageId, userId);
      }

      res.json({ ...image, isLiked });
    } catch (error) {
      console.error("Gallery image error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Serve optimized thumbnail for gallery images (faster loading)
  app.get("/api/gallery/:imageId/thumbnail", async (req: Request, res: Response) => {
    try {
      const { imageId } = req.params;
      const width = Math.min(parseInt(req.query.w as string) || 400, 800);

      const image = await storage.getGalleryImageById(imageId);
      if (!image || !image.imageUrl) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Handle base64 images
      if (image.imageUrl.startsWith('data:image/')) {
        const base64Data = image.imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const thumbnail = await sharp(buffer)
          .resize(width, undefined, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 75 })
          .toBuffer();

        res.set({
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=604800', // Cache for 1 week
        });
        return res.send(thumbnail);
      }

      // For URL-based images, redirect
      res.redirect(image.imageUrl);
    } catch (error) {
      console.error("Thumbnail error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}
