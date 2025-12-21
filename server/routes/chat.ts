import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export async function registerChatRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  // Import Gemini chat services
  const {
    generateChatSessionName,
    chatWithCreativeAgent,
  } = await import("../services/gemini");

  // ============== CHAT SESSIONS API ==============

  app.get("/api/chat/sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const sessions = await storage.getChatSessions(userId);
      res.json({ sessions });
    } catch (error) {
      logger.error("Get chat sessions error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to get chat sessions" });
    }
  });

  app.post("/api/chat/sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { name, createProject } = req.body;

      let projectId: string | undefined;

      // Auto-create a project folder if requested
      if (createProject) {
        const projectName = name || `Chat Project ${new Date().toLocaleDateString()}`;
        const project = await storage.createMoodBoard(userId, projectName, "Auto-created from Chat Studio");
        projectId = project.id;
      }

      const session = await storage.createChatSession(userId, name || "New Chat", projectId);
      res.json({ session, projectId });
    } catch (error) {
      logger.error("Create chat session error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  app.get("/api/chat/sessions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      const session = await storage.getChatSession(id, userId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      const messages = await storage.getChatMessages(id);

      // Batch fetch all images to avoid N+1 queries
      const imageIds = messages
        .filter(msg => msg.imageId)
        .map(msg => msg.imageId as string);

      const imageUrlMap = new Map<string, string>();
      if (imageIds.length > 0) {
        const images = await storage.getImagesByIds(imageIds, userId);
        for (const img of images) {
          imageUrlMap.set(img.id, img.imageUrl);
        }
      }

      // Enrich messages with imageUrl using the pre-fetched map
      const enrichedMessages = messages.map(msg => {
        if (msg.imageId) {
          return {
            ...msg,
            imageUrl: imageUrlMap.get(msg.imageId) || null
          };
        }
        return msg;
      });

      // Get linked project info if exists
      let project = null;
      if (session.projectId) {
        const projectData = await storage.getMoodBoard(userId, session.projectId);
        if (projectData) {
          project = projectData.board;
        }
      }

      res.json({ session, messages: enrichedMessages, project });
    } catch (error) {
      logger.error("Get chat session error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to get chat session" });
    }
  });

  app.patch("/api/chat/sessions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const data = req.body;

      const session = await storage.updateChatSession(id, userId, data);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      res.json({ session });
    } catch (error) {
      logger.error("Update chat session error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to update chat session" });
    }
  });

  app.post("/api/chat/sessions/:id/generate-name", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;
      const { firstMessage } = req.body;

      if (!firstMessage) {
        return res.status(400).json({ message: "First message is required" });
      }

      // Check if name is already locked
      const existingSession = await storage.getChatSession(id, userId);
      if (!existingSession) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      if (existingSession.nameLocked) {
        // Name already locked, return existing name
        return res.json({ session: existingSession, name: existingSession.name });
      }

      const smartName = await generateChatSessionName(firstMessage);
      const session = await storage.updateChatSession(id, userId, { name: smartName, nameLocked: true });

      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      res.json({ session, name: smartName });
    } catch (error) {
      logger.error("Generate session name error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to generate session name" });
    }
  });

  app.post("/api/chat/sessions/:id/chat", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { messages, context, attachedImage } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      let userProfile = null;
      try {
        const { getOrCreateUserProfile } = await import("../services/profileAnalyzer");
        userProfile = await getOrCreateUserProfile(userId);
      } catch (e) {
        logger.error("Failed to load user profile", e, { source: "chat" });
      }

      const enrichedContext = {
        ...context,
        userProfile: userProfile ? {
          preferredStyles: userProfile.preferredStyles,
          preferredSubjects: userProfile.preferredSubjects,
          preferredMoods: userProfile.preferredMoods,
          recentPrompts: (userProfile.recentContextJson as { recentPrompts?: string[] } | null)?.recentPrompts || [],
          creativePatternsDescription: (userProfile.creativePatternsJson as { frequentPromptPatterns?: string[] } | null)?.frequentPromptPatterns?.join(', ') || ''
        } : null
      };

      const response = await chatWithCreativeAgent(messages, enrichedContext, attachedImage || null);
      res.json(response);
    } catch (error) {
      logger.error("Chat session error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.delete("/api/chat/sessions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id } = req.params;

      await storage.deleteChatSession(id, userId);
      res.json({ message: "Chat session deleted" });
    } catch (error) {
      logger.error("Delete chat session error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  app.post("/api/chat/sessions/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { id: sessionId } = req.params;
      const { role, content, options, imageId, originalPrompt, enhancedPrompt } = req.body;

      // Verify session belongs to user
      const session = await storage.getChatSession(sessionId, userId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      const message = await storage.addChatMessage(sessionId, {
        role,
        content,
        options,
        imageId,
        originalPrompt,
        enhancedPrompt,
      });

      // If there's an image and session has a linked project, add image to project
      if (imageId && session.projectId) {
        try {
          const existingItems = await storage.getMoodBoard(userId, session.projectId);
          const itemCount = existingItems?.items.length || 0;
          await storage.addItemToBoard(session.projectId, imageId, {
            positionX: (itemCount % 3) * 220,
            positionY: Math.floor(itemCount / 3) * 220,
            width: 200,
            height: 200,
            zIndex: itemCount,
          });
        } catch (e) {
          logger.error("Failed to add image to project", e, { source: "chat" });
        }
      }

      res.json({ message });
    } catch (error) {
      logger.error("Add chat message error", error, { source: "chat" });
      res.status(500).json({ message: "Failed to add chat message" });
    }
  });
}
