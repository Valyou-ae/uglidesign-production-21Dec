import type { Express, Request, Response } from "express";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export async function registerBackgroundRoutes(app: Express, middleware: Middleware) {
  const { requireAuth } = middleware;

  // Import background removal services
  const {
    removeBackground,
    removeBackgroundBatch,
    getDefaultBackgroundRemovalOptions,
    validateBackgroundRemovalOptions
  } = await import("../services/backgroundRemover");

  // ============== BACKGROUND REMOVAL ROUTES ==============

  app.post("/api/background-removal", requireAuth, async (req: Request, res: Response) => {
    try {
      const { image, options } = req.body;

      if (!image || typeof image !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image is required. Provide a base64-encoded image string."
        });
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      if (!base64Data || base64Data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid image data. Provide a valid base64-encoded image."
        });
      }

      const validatedOptions = validateBackgroundRemovalOptions(options || {});

      const result = await removeBackground(base64Data, validatedOptions);

      res.json({
        success: result.success,
        result
      });
    } catch (error) {
      logger.error("Background removal error", error, { source: "background" });
      const errorMessage = error instanceof Error ? error.message : "Background removal failed";
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  });

  app.post("/api/background-removal/batch", requireAuth, async (req: Request, res: Response) => {
    try {
      const { images, options } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Images array is required. Provide an array of base64-encoded image strings."
        });
      }

      if (images.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Maximum 20 images allowed per batch."
        });
      }

      for (let i = 0; i < images.length; i++) {
        if (typeof images[i] !== "string" || images[i].length === 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid image at index ${i}. All images must be base64-encoded strings.`
          });
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as { flush?: () => void }).flush === 'function') {
          (res as { flush: () => void }).flush();
        }
      };

      const validatedOptions = validateBackgroundRemovalOptions(options || {});

      const imageItems = images.map((img: string, index: number) => ({
        id: `img_${index}_${Date.now()}`,
        imageBase64: img.replace(/^data:image\/\w+;base64,/, "")
      }));

      const total = imageItems.length;

      sendEvent("job_start", {
        total,
        options: validatedOptions,
        timestamp: Date.now()
      });

      const results: Array<{ id: string; index: number; success: boolean; result: unknown }> = [];
      let hasError = false;

      try {
        await removeBackgroundBatch(
          imageItems,
          validatedOptions,
          (completed: number, totalCount: number, progressData: { id: string; result: { success: boolean } }) => {
            const index = imageItems.findIndex(item => item.id === progressData.id);

            sendEvent("job_progress", {
              current: completed,
              total: totalCount,
              percentage: Math.round((completed / totalCount) * 100)
            });

            sendEvent("job_complete", {
              id: progressData.id,
              index,
              success: progressData.result.success,
              result: progressData.result
            });

            results.push({
              id: progressData.id,
              index,
              success: progressData.result.success,
              result: progressData.result
            });
          }
        );
      } catch (batchError) {
        hasError = true;
        const errorMessage = batchError instanceof Error ? batchError.message : "Batch processing failed";
        logger.error("Batch background removal error", batchError, { source: "background" });

        sendEvent("error", {
          message: errorMessage,
          timestamp: Date.now()
        });
      }

      if (!hasError) {
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        sendEvent("batch_complete", {
          total,
          successful: successCount,
          failed: failedCount,
          results: results.map(r => ({
            id: r.id,
            index: r.index,
            success: r.success
          })),
          timestamp: Date.now()
        });
      }

      res.end();
    } catch (error) {
      logger.error("Background removal batch error", error, { source: "background" });
      const errorMessage = error instanceof Error ? error.message : "Batch processing failed";

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: errorMessage
        });
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  app.get("/api/background-removal/presets", requireAuth, async (_req: Request, res: Response) => {
    try {
      const defaultOptions = getDefaultBackgroundRemovalOptions();

      const presets = {
        outputTypes: [
          {
            id: 'transparent',
            name: 'Transparent',
            description: 'Remove background completely with alpha transparency (PNG)'
          },
          {
            id: 'white',
            name: 'White Background',
            description: 'Replace background with pure white (#FFFFFF)'
          },
          {
            id: 'color',
            name: 'Custom Color',
            description: 'Replace background with a custom solid color'
          },
          {
            id: 'blur',
            name: 'Blur Background',
            description: 'Keep subject sharp with professional bokeh blur effect'
          }
        ],
        qualityLevels: [
          {
            id: 'standard',
            name: 'Standard',
            description: 'Fast processing with good quality',
            credits: 1
          },
          {
            id: 'high',
            name: 'High',
            description: 'Excellent edge detection and detail preservation',
            credits: 2
          },
          {
            id: 'ultra',
            name: 'Ultra',
            description: 'Maximum precision for complex edges like hair and fur',
            credits: 4
          }
        ],
        edgeFeathering: {
          min: 0,
          max: 10,
          default: defaultOptions.edgeFeathering,
          description: 'Edge softness in pixels (0 = sharp, 10 = soft)'
        },
        defaults: defaultOptions
      };

      res.json(presets);
    } catch (error) {
      logger.error("Background removal presets error", error, { source: "background" });
      res.status(500).json({
        success: false,
        message: "Failed to fetch presets"
      });
    }
  });
}
