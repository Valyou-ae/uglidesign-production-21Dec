import type { Express, Request, Response } from "express";
import { ZodError } from "zod";
import { storage } from "../storage";
import { insertPromptFavoriteSchema } from "@shared/schema";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export function registerMoodBoardRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  // ============== PROMPT FAVORITES ROUTES ==============

  app.post("/api/prompts/favorites", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const favoriteData = insertPromptFavoriteSchema.parse({
        ...req.body,
        userId,
      });

      const favorite = await storage.createPromptFavorite(favoriteData);
      res.status(201).json({ favorite });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      logger.error("Create prompt favorite error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to save prompt favorite" });
    }
  });

  app.get("/api/prompts/favorites", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const favorites = await storage.getPromptFavorites(userId);
      res.json({ favorites });
    } catch (error) {
      logger.error("Get prompt favorites error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to fetch prompt favorites" });
    }
  });

  app.delete("/api/prompts/favorites/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      await storage.deletePromptFavorite(id, userId);
      res.json({ message: "Prompt favorite deleted successfully" });
    } catch (error) {
      logger.error("Delete prompt favorite error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to delete prompt favorite" });
    }
  });

  // ============== MOOD BOARD ROUTES ==============

  app.get("/api/mood-boards", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const boards = await storage.getMoodBoards(userId);
      res.json({ boards });
    } catch (error) {
      logger.error("Get mood boards error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to fetch mood boards" });
    }
  });

  app.post("/api/mood-boards", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { name, description } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Name is required" });
      }

      const board = await storage.createMoodBoard(userId, name, description);
      res.status(201).json({ board });
    } catch (error) {
      logger.error("Create mood board error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to create mood board" });
    }
  });

  app.get("/api/mood-boards/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      const result = await storage.getMoodBoard(userId, id);

      if (!result) {
        return res.status(404).json({ message: "Mood board not found" });
      }

      res.json(result);
    } catch (error) {
      logger.error("Get mood board error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to fetch mood board" });
    }
  });

  app.patch("/api/mood-boards/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { name, description } = req.body;

      const board = await storage.updateMoodBoard(userId, id, { name, description });

      if (!board) {
        return res.status(404).json({ message: "Mood board not found" });
      }

      res.json({ board });
    } catch (error) {
      logger.error("Update mood board error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to update mood board" });
    }
  });

  app.delete("/api/mood-boards/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      await storage.deleteMoodBoard(userId, id);
      res.json({ message: "Mood board deleted successfully" });
    } catch (error) {
      logger.error("Delete mood board error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to delete mood board" });
    }
  });

  app.post("/api/mood-boards/:id/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { imageId, positionX, positionY, width, height, zIndex } = req.body;

      if (!imageId) {
        return res.status(400).json({ message: "Image ID is required" });
      }

      // Verify board ownership before adding item
      const isOwner = await storage.verifyBoardOwnership(userId, id);
      if (!isOwner) {
        return res.status(404).json({ message: "Mood board not found" });
      }

      const item = await storage.addItemToBoard(id, imageId, {
        positionX: positionX ?? 0,
        positionY: positionY ?? 0,
        width,
        height,
        zIndex,
      });

      res.status(201).json({ item });
    } catch (error) {
      logger.error("Add item to board error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to add item to board" });
    }
  });

  app.patch("/api/mood-boards/:boardId/items/:itemId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { itemId } = req.params;
      const { positionX, positionY, width, height, zIndex } = req.body;

      // Verify item belongs to a board owned by user
      const isOwner = await storage.verifyBoardItemOwnership(userId, itemId);
      if (!isOwner) {
        return res.status(404).json({ message: "Board item not found" });
      }

      const item = await storage.updateBoardItem(itemId, {
        positionX,
        positionY,
        width,
        height,
        zIndex,
      });

      if (!item) {
        return res.status(404).json({ message: "Board item not found" });
      }

      res.json({ item });
    } catch (error) {
      logger.error("Update board item error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to update board item" });
    }
  });

  app.delete("/api/mood-boards/:boardId/items/:itemId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { itemId } = req.params;

      // Verify item belongs to a board owned by user
      const isOwner = await storage.verifyBoardItemOwnership(userId, itemId);
      if (!isOwner) {
        return res.status(404).json({ message: "Board item not found" });
      }

      await storage.removeItemFromBoard(itemId);
      res.json({ message: "Item removed from board successfully" });
    } catch (error) {
      logger.error("Remove item from board error", error, { source: "moodboard" });
      res.status(500).json({ message: "Failed to remove item from board" });
    }
  });
}
