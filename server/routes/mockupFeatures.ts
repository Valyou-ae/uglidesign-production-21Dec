import type { Express, Request, Response } from "express";
import type { Middleware } from "./middleware";
import { logger } from "../logger";
import { storage } from "../storage";
import { nanoid } from "nanoid";
import archiver from "archiver";

export async function registerMockupFeatureRoutes(app: Express, middleware: Middleware) {
  const { requireAuth } = middleware;

  // ============== MOCKUP HISTORY & GALLERY ==============

  /**
   * GET /api/mockups
   * Get user's mockup history with pagination and filtering
   */
  app.get("/api/mockups", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { page = 1, limit = 20, isPublic, isFavorite, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build query
      let query = `SELECT * FROM mockups WHERE userId = ?`;
      const params: any[] = [userId];

      if (isPublic !== undefined) {
        query += ` AND isPublic = ?`;
        params.push(isPublic === 'true');
      }

      if (isFavorite !== undefined) {
        query += ` AND isFavorite = ?`;
        params.push(isFavorite === 'true');
      }

      if (search) {
        query += ` AND (prompt LIKE ? OR tags LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
      params.push(Number(limit), offset);

      const mockups = await storage.query(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM mockups WHERE userId = ?`;
      const countParams: any[] = [userId];
      if (isPublic !== undefined) {
        countQuery += ` AND isPublic = ?`;
        countParams.push(isPublic === 'true');
      }
      if (isFavorite !== undefined) {
        countQuery += ` AND isFavorite = ?`;
        countParams.push(isFavorite === 'true');
      }
      const [{ total }] = await storage.query(countQuery, countParams);

      res.json({
        mockups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error("Get mockups error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to retrieve mockups" });
    }
  });

  /**
   * POST /api/mockups/:id/favorite
   * Toggle favorite status
   */
  app.post("/api/mockups/:id/favorite", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get current status
      const [mockup] = await storage.query(
        `SELECT isFavorite FROM mockups WHERE id = ? AND userId = ?`,
        [id, userId]
      );

      if (!mockup) {
        return res.status(404).json({ message: "Mockup not found" });
      }

      // Toggle
      const newStatus = !mockup.isFavorite;
      await storage.query(
        `UPDATE mockups SET isFavorite = ? WHERE id = ?`,
        [newStatus, id]
      );

      res.json({ isFavorite: newStatus });
    } catch (error) {
      logger.error("Toggle favorite error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  /**
   * POST /api/mockups/:id/share
   * Generate public share link
   */
  app.post("/api/mockups/:id/share", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify ownership
      const [mockup] = await storage.query(
        `SELECT * FROM mockups WHERE id = ? AND userId = ?`,
        [id, userId]
      );

      if (!mockup) {
        return res.status(404).json({ message: "Mockup not found" });
      }

      // Generate share token if doesn't exist
      let shareToken = mockup.shareToken;
      if (!shareToken) {
        shareToken = nanoid(16);
        await storage.query(
          `UPDATE mockups SET isPublic = TRUE, shareToken = ? WHERE id = ?`,
          [shareToken, id]
        );
      } else {
        // Just make it public
        await storage.query(
          `UPDATE mockups SET isPublic = TRUE WHERE id = ?`,
          [id]
        );
      }

      const shareUrl = `${process.env.PUBLIC_URL || 'https://ugli.design'}/mockup/${shareToken}`;

      res.json({ shareUrl, shareToken });
    } catch (error) {
      logger.error("Share mockup error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to share mockup" });
    }
  });

  /**
   * DELETE /api/mockups/:id/share
   * Unshare mockup (make private)
   */
  app.delete("/api/mockups/:id/share", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.query(
        `UPDATE mockups SET isPublic = FALSE WHERE id = ? AND userId = ?`,
        [id, userId]
      );

      res.json({ success: true });
    } catch (error) {
      logger.error("Unshare mockup error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to unshare mockup" });
    }
  });

  /**
   * POST /api/mockups/download-bulk
   * Download multiple mockups as ZIP
   */
  app.post("/api/mockups/download-bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;
      const { mockupIds } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!Array.isArray(mockupIds) || mockupIds.length === 0) {
        return res.status(400).json({ message: "mockupIds array is required" });
      }

      if (mockupIds.length > 50) {
        return res.status(400).json({ message: "Maximum 50 mockups per download" });
      }

      // Get mockups
      const placeholders = mockupIds.map(() => '?').join(',');
      const mockups = await storage.query(
        `SELECT m.*, gi.imageData, gi.mimeType 
         FROM mockups m 
         JOIN generatedImages gi ON m.imageId = gi.id 
         WHERE m.id IN (${placeholders}) AND m.userId = ?`,
        [...mockupIds, userId]
      );

      if (mockups.length === 0) {
        return res.status(404).json({ message: "No mockups found" });
      }

      // Create ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="mockups-${Date.now()}.zip"`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      for (const mockup of mockups) {
        const ext = mockup.mimeType === 'image/png' ? 'png' : 'jpg';
        const filename = `mockup-${mockup.id}.${ext}`;
        const buffer = Buffer.from(mockup.imageData, 'base64');
        archive.append(buffer, { name: filename });
      }

      await archive.finalize();
    } catch (error) {
      logger.error("Bulk download error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to create download" });
    }
  });

  // ============== MOCKUP PRESETS ==============

  /**
   * GET /api/mockup-presets
   * Get user's saved presets
   */
  app.get("/api/mockup-presets", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const presets = await storage.query(
        `SELECT * FROM mockup_presets WHERE userId = ? ORDER BY isDefault DESC, usageCount DESC, createdAt DESC`,
        [userId]
      );

      res.json({ presets });
    } catch (error) {
      logger.error("Get presets error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to retrieve presets" });
    }
  });

  /**
   * POST /api/mockup-presets
   * Save a new preset
   */
  app.post("/api/mockup-presets", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, description, settings, isDefault } = req.body;

      if (!name || !settings) {
        return res.status(400).json({ message: "Name and settings are required" });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await storage.query(
          `UPDATE mockup_presets SET isDefault = FALSE WHERE userId = ?`,
          [userId]
        );
      }

      const id = nanoid();
      await storage.query(
        `INSERT INTO mockup_presets (id, userId, name, description, settings, isDefault) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, name, description || null, JSON.stringify(settings), isDefault || false]
      );

      res.json({ id, message: "Preset saved successfully" });
    } catch (error) {
      logger.error("Save preset error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to save preset" });
    }
  });

  /**
   * DELETE /api/mockup-presets/:id
   * Delete a preset
   */
  app.delete("/api/mockup-presets/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.query(
        `DELETE FROM mockup_presets WHERE id = ? AND userId = ?`,
        [id, userId]
      );

      res.json({ success: true });
    } catch (error) {
      logger.error("Delete preset error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to delete preset" });
    }
  });

  // ============== WATERMARKS ==============

  /**
   * GET /api/watermarks
   * Get user's watermarks
   */
  app.get("/api/watermarks", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const watermarks = await storage.query(
        `SELECT w.*, gi.imageData, gi.mimeType 
         FROM user_watermarks w 
         JOIN generatedImages gi ON w.imageId = gi.id 
         WHERE w.userId = ? 
         ORDER BY isDefault DESC, createdAt DESC`,
        [userId]
      );

      res.json({ watermarks });
    } catch (error) {
      logger.error("Get watermarks error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to retrieve watermarks" });
    }
  });

  /**
   * POST /api/watermarks
   * Upload a new watermark
   */
  app.post("/api/watermarks", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, imageData, position, opacity, scale, isDefault } = req.body;

      if (!name || !imageData) {
        return res.status(400).json({ message: "Name and image are required" });
      }

      // Save image
      const imageId = nanoid();
      await storage.query(
        `INSERT INTO generatedImages (id, userId, imageData, mimeType, isPublic) VALUES (?, ?, ?, ?, ?)`,
        [imageId, userId, imageData.replace(/^data:image\/\w+;base64,/, ""), 'image/png', false]
      );

      // If setting as default, unset other defaults
      if (isDefault) {
        await storage.query(
          `UPDATE user_watermarks SET isDefault = FALSE WHERE userId = ?`,
          [userId]
        );
      }

      // Save watermark
      const id = nanoid();
      await storage.query(
        `INSERT INTO user_watermarks (id, userId, name, imageId, position, opacity, scale, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, name, imageId, position || 'bottom-right', opacity || 0.5, scale || 0.1, isDefault || false]
      );

      res.json({ id, message: "Watermark saved successfully" });
    } catch (error) {
      logger.error("Save watermark error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to save watermark" });
    }
  });

  /**
   * DELETE /api/watermarks/:id
   * Delete a watermark
   */
  app.delete("/api/watermarks/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get watermark to delete associated image
      const [watermark] = await storage.query(
        `SELECT imageId FROM user_watermarks WHERE id = ? AND userId = ?`,
        [id, userId]
      );

      if (watermark) {
        // Delete image
        await storage.query(`DELETE FROM generatedImages WHERE id = ?`, [watermark.imageId]);
        // Delete watermark
        await storage.query(`DELETE FROM user_watermarks WHERE id = ?`, [id]);
      }

      res.json({ success: true });
    } catch (error) {
      logger.error("Delete watermark error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to delete watermark" });
    }
  });

  // ============== MOCKUP COMPARISONS ==============

  /**
   * POST /api/mockup-comparisons
   * Create a comparison set
   */
  app.post("/api/mockup-comparisons", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, mockupIds } = req.body;

      if (!Array.isArray(mockupIds) || mockupIds.length < 2) {
        return res.status(400).json({ message: "At least 2 mockups required for comparison" });
      }

      if (mockupIds.length > 10) {
        return res.status(400).json({ message: "Maximum 10 mockups per comparison" });
      }

      const id = nanoid();
      await storage.query(
        `INSERT INTO mockup_comparisons (id, userId, name, mockupIds) VALUES (?, ?, ?, ?)`,
        [id, userId, name || null, JSON.stringify(mockupIds)]
      );

      res.json({ id, message: "Comparison created successfully" });
    } catch (error) {
      logger.error("Create comparison error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to create comparison" });
    }
  });

  /**
   * GET /api/mockup-comparisons/:id
   * Get comparison details
   */
  app.get("/api/mockup-comparisons/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.claims?.sub;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [comparison] = await storage.query(
        `SELECT * FROM mockup_comparisons WHERE id = ? AND userId = ?`,
        [id, userId]
      );

      if (!comparison) {
        return res.status(404).json({ message: "Comparison not found" });
      }

      // Get mockup details
      const mockupIds = JSON.parse(comparison.mockupIds);
      const placeholders = mockupIds.map(() => '?').join(',');
      const mockups = await storage.query(
        `SELECT m.*, gi.imageData, gi.mimeType 
         FROM mockups m 
         JOIN generatedImages gi ON m.imageId = gi.id 
         WHERE m.id IN (${placeholders})`,
        mockupIds
      );

      res.json({ comparison, mockups });
    } catch (error) {
      logger.error("Get comparison error", error, { source: "mockupFeatures" });
      res.status(500).json({ message: "Failed to retrieve comparison" });
    }
  });
}
