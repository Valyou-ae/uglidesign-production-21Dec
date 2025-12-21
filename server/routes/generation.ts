import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { invalidateCache } from "../cache";
import { generationRateLimiter, guestGenerationLimiter } from "../rateLimiter";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

const GUEST_GALLERY_USER_ID = "guest-gallery-user";

async function ensureGuestGalleryUser() {
  let guestUser = await storage.getUser(GUEST_GALLERY_USER_ID);
  if (!guestUser) {
    guestUser = await storage.upsertUser({
      id: GUEST_GALLERY_USER_ID,
      username: "UGLI Gallery",
    });
  }
  return guestUser;
}

export async function registerGenerationRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  // Import Gemini services
  const {
    analyzePrompt,
    enhancePrompt,
    generateImage: generateGeminiImage,
  } = await import("../services/gemini");

  // ============== GUEST IMAGE GENERATION (NO AUTH) ==============

  app.post("/api/guest/generate-image", guestGenerationLimiter, async (req: Request, res: Response) => {
    try {
      const { prompt, guestId } = req.body;
      if (!prompt || !guestId) {
        return res.status(400).json({ message: "Missing prompt or guestId" });
      }

      // Use direct SQL via pool to avoid Neon HTTP driver null response issues
      const { pool } = await import("../db");

      // Check if guest has already generated
      const existingResult = await pool.query(
        'SELECT id FROM guest_generations WHERE guest_id = $1 LIMIT 1',
        [guestId]
      );

      if (existingResult.rows.length > 0) {
        return res.status(403).json({ message: "Free generation already used. Please login for more." });
      }

      const result = await generateGeminiImage(prompt, [], "quality", "1:1", "draft", false);
      if (!result) {
        return res.status(500).json({ message: "Image generation failed. Please try again." });
      }

      // Insert guest generation record using pool
      await pool.query(
        'INSERT INTO guest_generations (guest_id) VALUES ($1) ON CONFLICT (guest_id) DO NOTHING',
        [guestId]
      );

      await ensureGuestGalleryUser();
      const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;

      // Save to generatedImages table
      await storage.createImage({
        userId: GUEST_GALLERY_USER_ID,
        imageUrl,
        prompt,
        style: "auto",
        aspectRatio: "1:1",
        generationType: "image",
        isPublic: true,
      });

      // Also save to galleryImages for discover page
      await storage.createGalleryImage({
        title: prompt.slice(0, 100),
        imageUrl,
        creator: "UGLI Guest",
        category: "ai-generated",
        aspectRatio: "1:1",
        prompt,
      });

      // Invalidate gallery cache so new image appears immediately
      await invalidateCache('gallery:images');

      return res.json({ imageData: result.imageData, mimeType: result.mimeType });
    } catch (error: unknown) {
      logger.error("Guest generation error", error, { source: "generation" });
      const err = error as { message?: string };
      const message = err?.message?.includes('generation') ? err.message : "Generation failed. Please try again.";
      return res.status(500).json({ message });
    }
  });

  // ============== IMAGE GENERATION ROUTES ==============

  app.post("/api/generate/analyze", requireAuth, async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const analysis = await analyzePrompt(prompt);
      res.json({ analysis });
    } catch (error) {
      logger.error("Analysis error", error, { source: "generation" });
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  app.post("/api/generate/draft", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { prompt, stylePreset = "auto", aspectRatio = "1:1", detail = "medium", speed = "quality", imageCount = 1, isPublic = false } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const count = Math.min(Math.max(1, parseInt(imageCount) || 1), 4);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
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

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: `Generating ${count} image${count > 1 ? 's' : ''} in parallel...` });
      sendEvent("progress", { completed: 0, total: count });

      // Generate all images in parallel with atomic counter
      const completionState = { count: 0 };
      const incrementAndGetCount = () => ++completionState.count;

      const generateImage = async (index: number) => {
        try {
          const result = await generateGeminiImage(enhancedPrompt, negativePrompts, speed, aspectRatio, "draft", analysis.hasTextRequest);
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });

          if (result) {
            const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;

            // Save image to database
            try {
              const savedImage = await storage.createImage({
                userId,
                imageUrl,
                prompt,
                style: stylePreset,
                aspectRatio,
                generationType: "image",
                isFavorite: false,
                isPublic: Boolean(isPublic),
              });

              // If image is public, also add to galleryImages for discovery page
              if (isPublic) {
                try {
                  await storage.createGalleryImage({
                    sourceImageId: savedImage.id,
                    title: prompt.substring(0, 100),
                    imageUrl,
                    creator: userId,
                    category: stylePreset !== "auto" ? stylePreset : "General",
                    aspectRatio,
                    prompt,
                  });
                  await invalidateCache('gallery:images');
                } catch (galleryError) {
                  logger.error("Failed to add draft image to gallery", galleryError, { source: "generation" });
                }
              }

              // Send savedImageId for efficient loading
              sendEvent("image", {
                index,
                savedImageId: savedImage.id,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
            } catch (saveError) {
              logger.error("Failed to save draft image", saveError, { source: "generation" });
              // Fallback: send image data directly
              sendEvent("image", {
                index,
                imageData: result.imageData,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
            }
            return { success: true, index };
          } else {
            sendEvent("image_error", { index, error: "Generation failed" });
            return { success: false, index };
          }
        } catch {
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });
          sendEvent("image_error", { index, error: "Generation failed" });
          return { success: false, index };
        }
      };

      const promises = Array.from({ length: count }, (_, i) => generateImage(i));
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", { message: "Draft generation complete", totalImages: successCount });

      res.end();
    } catch (error) {
      logger.error("Draft generation error", error, { source: "generation" });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/generate/final", requireAuth, generationRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const {
        prompt,
        stylePreset = "auto",
        qualityLevel = "premium",
        aspectRatio = "1:1",
        detail = "medium",
        speed = "quality",
        imageCount = 1,
        isPublic = false,
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const count = Math.min(Math.max(1, parseInt(imageCount) || 1), 4);

      // SSE headers with anti-buffering settings
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
      res.setHeader("Content-Encoding", "none"); // Disable compression
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
        const eventStr = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        res.write(eventStr);
        // Force immediate send
        if (typeof (res as { flush?: () => void }).flush === 'function') {
          (res as { flush: () => void }).flush();
        }
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

      sendEvent("status", { agent: "Visual Synthesizer", status: "working", message: `Generating ${count} image${count > 1 ? 's' : ''} in parallel...` });
      sendEvent("progress", { completed: 0, total: count });

      // Generate all images in parallel with atomic counter
      const completionState = { count: 0 };
      const incrementAndGetCount = () => ++completionState.count;

      const generateImage = async (index: number) => {
        try {
          const result = await generateGeminiImage(enhancedPrompt, negativePrompts, speed, aspectRatio, qualityLevel as "draft" | "premium", analysis.hasTextRequest);
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });

          if (result) {
            logger.info(`[Premium Gen] Image ${index} generated successfully, saving to database...`, { source: "generation" });
            const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;

            try {
              const savedImage = await storage.createImage({
                userId,
                imageUrl,
                prompt,
                style: stylePreset,
                aspectRatio,
                generationType: "image",
                isFavorite: false,
                isPublic: Boolean(isPublic),
              });

              // If image is public, also add to galleryImages for discovery page
              if (isPublic) {
                try {
                  await storage.createGalleryImage({
                    sourceImageId: savedImage.id,
                    title: prompt.substring(0, 100),
                    imageUrl,
                    creator: userId,
                    category: stylePreset !== "auto" ? stylePreset : "General",
                    aspectRatio,
                    prompt,
                  });
                  // Invalidate gallery cache so new image appears immediately
                  await invalidateCache('gallery:images');
                  logger.info(`[Premium Gen] Image ${index} added to public gallery`, { source: "generation" });
                } catch (galleryError) {
                  logger.error("Failed to add image to gallery", galleryError, { source: "generation" });
                }
              }

              logger.info(`[Premium Gen] Image ${index} saved with ID ${savedImage.id}, sending to client...`, { source: "generation" });
              // Send small event with just the ID - frontend will fetch the image separately
              sendEvent("final_image", {
                index,
                savedImageId: savedImage.id,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
              logger.info(`[Premium Gen] Image ${index} event sent to client`, { source: "generation" });
            } catch (saveError) {
              logger.error("Failed to save image to database", saveError, { source: "generation" });
              // Fallback: send image data directly if save failed
              sendEvent("final_image", {
                index,
                imageData: result.imageData,
                mimeType: result.mimeType,
                progress: `${currentCount}/${count}`,
              });
            }
            return { success: true, index };
          } else {
            logger.info(`[Premium Gen] Image ${index} generation returned null`, { source: "generation" });
            sendEvent("image_error", { index, error: "Generation failed" });
            return { success: false, index };
          }
        } catch {
          const currentCount = incrementAndGetCount();
          sendEvent("progress", { completed: currentCount, total: count });
          sendEvent("image_error", { index, error: "Generation failed" });
          return { success: false, index };
        }
      };

      const promises = Array.from({ length: count }, (_, i) => generateImage(i));
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", {
        message: "Final generation complete",
        totalImages: successCount,
      });

      res.end();
    } catch (error) {
      logger.error("Final generation error", error, { source: "generation" });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/generate/single", requireAuth, generationRateLimiter, async (req: Request, res: Response) => {
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

      const result = await generateGeminiImage(enhancedPrompt, negativePrompts, "quality", "1:1", "draft", analysis.hasTextRequest);

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
      logger.error("Single generation error", error, { source: "generation" });
      res.status(500).json({ message: "Generation failed" });
    }
  });
}
