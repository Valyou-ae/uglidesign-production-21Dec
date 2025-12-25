import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { invalidateCache, getFromCache } from "../cache";
import { isSimplePrompt, classifyPrompt } from "../utils/prompt-classifier";
import { generationRateLimiter, guestGenerationLimiter } from "../rateLimiter";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

const GUEST_GALLERY_USER_ID = "guest-gallery-user";

// Credit costs for different generation types
const CREDIT_COSTS = {
  draft: {
    '1:1': 1,
    '16:9': 1,
    '9:16': 1,
    '4:3': 1,
    '3:4': 1,
  },
  premium: {
    '1:1': 2,
    '16:9': 3,
    '9:16': 3,
    '4:3': 2,
    '3:4': 2,
  },
  batch_discount: 0.75, // 25% discount for batch (4 images cost 3x single)
};

// Helper to calculate credit cost
function calculateCreditCost(quality: 'draft' | 'premium', aspectRatio: string, count: number): number {
  const baseCost = CREDIT_COSTS[quality][aspectRatio as keyof typeof CREDIT_COSTS.draft] || CREDIT_COSTS[quality]['1:1'];
  if (count === 1) return baseCost;
  // Batch discount: 4 images cost 3x single price (25% discount)
  return Math.ceil(baseCost * count * CREDIT_COSTS.batch_discount);
}

// Helper to check and deduct credits atomically
async function checkAndDeductCredits(
  userId: string,
  cost: number,
  operationType: string
): Promise<{ success: boolean; credits?: number; error?: string }> {
  if (cost === 0) return { success: true };
  
  const currentCredits = await storage.getUserCredits(userId);
  
  if (currentCredits < cost) {
    return {
      success: false,
      credits: currentCredits,
      error: `Insufficient credits. You need ${cost} credits for ${operationType}, but only have ${currentCredits}.`
    };
  }
  
  const updatedUser = await storage.deductCredits(userId, cost);
  return {
    success: true,
    credits: updatedUser?.credits ?? currentCredits - cost
  };
}

// Helper to refund credits on failure
async function refundCredits(userId: string, amount: number, reason: string): Promise<void> {
  try {
    await storage.addCredits(userId, amount);
    logger.info(`Refunded ${amount} credits to user ${userId}: ${reason}`, { source: 'generation' });
  } catch (error) {
    logger.error(`Failed to refund ${amount} credits to user ${userId}`, error, { source: 'generation' });
  }
}

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

      // SECURITY FIX: Use atomic INSERT with RETURNING to prevent race condition
      // This ensures only one concurrent request can claim the guest slot
      // The unique constraint on guest_id prevents duplicates at the database level
      const insertResult = await pool.query(
        `INSERT INTO guest_generations (guest_id) 
         VALUES ($1) 
         ON CONFLICT (guest_id) DO NOTHING 
         RETURNING id`,
        [guestId]
      );

      // If no row was returned, the guest_id already exists (quota used)
      if (insertResult.rows.length === 0) {
        return res.status(403).json({ message: "Free generation already used. Please login for more." });
      }

      // Now safe to generate - we have atomically claimed the slot
      const result = await generateGeminiImage(prompt, [], "quality", "1:1", "draft", false);
      if (!result) {
        // Generation failed - remove the guest record so they can try again
        await pool.query('DELETE FROM guest_generations WHERE guest_id = $1', [guestId]);
        return res.status(500).json({ message: "Image generation failed. Please try again." });
      }

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
        parentImageId: null,
        editPrompt: null,
        versionNumber: 0,
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

      // Calculate and check credits before generation
      const creditCost = calculateCreditCost('draft', aspectRatio, count);
      const creditCheck = await checkAndDeductCredits(userId, creditCost, `draft generation (${count} image${count > 1 ? 's' : ''})`);
      
      if (!creditCheck.success) {
        return res.status(402).json({ 
          message: creditCheck.error,
          credits: creditCheck.credits,
          required: creditCost
        });
      }

      // Track credits deducted for potential refund
      let creditsDeducted = creditCost;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // Performance tracking
      const perfStart = Date.now();
      let perfAnalysisEnd = 0;
      let perfEnhancementEnd = 0;

      // Phase 3: Classify the prompt
      const classification = classifyPrompt(prompt);
      const simple = classification.isSimple;

      logger.info('Prompt classification', {
        source: 'generation',
        prompt: prompt.slice(0, 50),
        isSimple: simple,
        reason: classification.reason,
      });

      let analysis: any;
      let enhancedPrompt: string;
      let negativePrompts: string[];

      if (simple) {
        // Phase 3: Fast-track for simple prompts
        sendEvent("status", { 
          message: `Fast-track generation (${classification.reason})`,
          agent: "System",
          status: "working"
        });
        
        analysis = {
          isSimple: true,
          hasTextRequest: false,
          complexity: 'low',
        };
        enhancedPrompt = prompt;
        negativePrompts = ["blurry", "low quality", "distorted"];
        
        sendEvent("analysis", { analysis, cached: false, skipped: true });
        sendEvent("enhancement", { enhancedPrompt, negativePrompts, cached: false, skipped: true });
        perfAnalysisEnd = Date.now();
        perfEnhancementEnd = Date.now();
        
      } else {
        // Phase 2: Full pipeline with caching
        
        // Analysis with cache
        const analysisCacheKey = `analysis:${prompt}`;
        let analysisCached = false;
        
        analysis = await getFromCache(
          analysisCacheKey,
          3600 * 1000, // 1 hour
          async () => {
            sendEvent("status", { agent: "Text Sentinel", status: "working", message: "Analyzing prompt..." });
            return await analyzePrompt(prompt);
          }
        );
        
        // Check if it was cached by seeing if we have the analysis immediately
        analysisCached = Date.now() - perfStart < 100;
        
        sendEvent("analysis", { analysis, cached: analysisCached });
        sendEvent("status", { agent: "Text Sentinel", status: "complete", message: analysisCached ? "Analysis complete (cached)" : "Analysis complete" });
        perfAnalysisEnd = Date.now();
        
        // Enhancement with cache
        const enhancementCacheKey = `enhance:${prompt}:${stylePreset}`;
        let enhancementCached = false;
        const enhancementStart = Date.now();
        
        const enhancement = await getFromCache<{ enhancedPrompt: string; negativePrompts: string[] }>(
          enhancementCacheKey,
          1800 * 1000, // 30 minutes
          async () => {
            sendEvent("status", { agent: "Style Architect", status: "working", message: "Enhancing prompt..." });
            return await enhancePrompt(prompt, analysis, "draft", stylePreset, "draft", detail);
          }
        );
        
        enhancementCached = Date.now() - enhancementStart < 100;
        
        sendEvent("enhancement", { ...enhancement, cached: enhancementCached });
        sendEvent("status", { agent: "Style Architect", status: "complete", message: enhancementCached ? "Prompt enhanced (cached)" : "Prompt enhanced" });
        perfEnhancementEnd = Date.now();
        
        enhancedPrompt = enhancement.enhancedPrompt;
        negativePrompts = enhancement.negativePrompts;
      }

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
                parentImageId: null,
                editPrompt: null,
                versionNumber: 0,
              });

              // Phase 3: Parallelize database operations
              if (isPublic) {
                try {
                  await Promise.all([
                    storage.createGalleryImage({
                      sourceImageId: savedImage.id,
                      title: prompt.substring(0, 100),
                      imageUrl,
                      creator: userId,
                      category: stylePreset !== "auto" ? stylePreset : "General",
                      aspectRatio,
                      prompt,
                    }),
                    invalidateCache('gallery:images')
                  ]);
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

      const perfGenerationStart = Date.now();
      const promises = Array.from({ length: count }, (_, i) => generateImage(i));
      const results = await Promise.all(promises);
      const perfGenerationEnd = Date.now();
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = count - successCount;

      // Refund credits for failed images (proportional refund)
      if (failedCount > 0 && successCount < count) {
        const refundAmount = Math.ceil((creditCost / count) * failedCount);
        await refundCredits(userId, refundAmount, `${failedCount} of ${count} draft images failed`);
        sendEvent("credit_refund", { refunded: refundAmount, reason: `${failedCount} image(s) failed` });
      }

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", { message: "Draft generation complete", totalImages: successCount, creditsUsed: creditCost });

      // Performance logging
      const perfEnd = Date.now();
      const totalDuration = perfEnd - perfStart;
      const analysisDuration = perfAnalysisEnd - perfStart;
      const enhancementDuration = perfEnhancementEnd - perfAnalysisEnd;
      const generationDuration = perfGenerationEnd - perfEnhancementEnd;
      const dbDuration = perfEnd - perfGenerationEnd;

      logger.info('Generation performance metrics', {
        source: 'generation',
        totalDuration,
        analysisDuration,
        enhancementDuration,
        generationDuration,
        dbDuration,
        isSimple: simple,
        imageCount: count,
        quality: 'draft',
      });

      // Alert on slow generations
      if (totalDuration > 20000) {
        logger.warn('Slow generation detected', {
          source: 'generation',
          duration: totalDuration,
          prompt: prompt.slice(0, 50),
        });
      }

      res.end();
    } catch (error) {
      // Full refund on catastrophic failure
      await refundCredits(userId, creditsDeducted, "Draft generation failed completely");
      logger.error("Draft generation error", error, { source: "generation" });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed", creditsRefunded: creditsDeducted })}\n\n`);
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

      // Calculate and check credits before generation
      const creditCost = calculateCreditCost('premium', aspectRatio, count);
      const creditCheck = await checkAndDeductCredits(userId, creditCost, `premium generation (${count} image${count > 1 ? 's' : ''})`);
      
      if (!creditCheck.success) {
        return res.status(402).json({ 
          message: creditCheck.error,
          credits: creditCheck.credits,
          required: creditCost
        });
      }

      // Track credits deducted for potential refund
      let creditsDeducted = creditCost;

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
                parentImageId: null,
                editPrompt: null,
                versionNumber: 0,
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
      const failedCount = count - successCount;

      // Refund credits for failed images (proportional refund)
      if (failedCount > 0 && successCount < count) {
        const refundAmount = Math.ceil((creditCost / count) * failedCount);
        await refundCredits(userId, refundAmount, `${failedCount} of ${count} premium images failed`);
        sendEvent("credit_refund", { refunded: refundAmount, reason: `${failedCount} image(s) failed` });
      }

      sendEvent("status", { agent: "Visual Synthesizer", status: "complete", message: "Generation complete" });
      sendEvent("complete", {
        message: "Final generation complete",
        totalImages: successCount,
        creditsUsed: creditCost,
      });

      res.end();
    } catch (error) {
      // Full refund on catastrophic failure
      await refundCredits(userId, creditsDeducted, "Premium generation failed completely");
      logger.error("Final generation error", error, { source: "generation" });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Generation failed", creditsRefunded: creditsDeducted })}\n\n`);
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
