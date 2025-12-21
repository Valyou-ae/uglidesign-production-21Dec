import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import path from "path";
import type { AuthenticatedRequest, SSEEventSender } from "./types";
import { createServer, type Server } from "http";
import sharp from "sharp";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { logger } from "./logger";
import { 
  authRateLimiter, 
  passwordResetLimiter, 
  generationRateLimiter, 
  guestGenerationLimiter,
  adminRateLimiter 
} from "./rateLimiter";
import {
  insertImageSchema,
  insertWithdrawalSchema,
  withdrawalRequestSchema,
  updateProfileSchema,
  insertContactSchema,
  insertDealSchema,
  insertActivitySchema,
  insertPromptFavoriteSchema,
  insertMoodBoardSchema,
  insertMoodBoardItemSchema,
  guestGenerations,
  uuidSchema,
  promptSchema,
  guestGenerationSchema,
  createMoodBoardSchema,
  updateRoleSchema,
  insertImageFolderSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { getFromCache, CACHE_TTL, invalidateCache } from "./cache";
import { verifyGoogleToken } from "./googleAuth";
import { registerAdminRoutes, registerSuperAdminRoutes, registerAuthRoutes, registerGalleryRoutes, registerUserRoutes, registerImageRoutes, registerGenerationRoutes, registerMockupRoutes, registerBackgroundRoutes, registerMoodBoardRoutes, registerChatRoutes, registerBillingRoutes, registerAffiliateRoutes, registerInspirationRoutes, createMiddleware } from "./routes/index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check endpoints for load balancer and Kubernetes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', async (_req, res) => {
    try {
      // Test database connectivity
      await db.execute(sql`SELECT 1`);
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: { database: 'ok' }
      });
    } catch (error) {
      res.status(503).json({
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        checks: { database: 'failed' }
      });
    }
  });

  // Gemini API key stats endpoint for monitoring (admin-only)
  app.get('/api/admin/gemini-stats', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { keyManager } = await import('./services/gemini');
      const stats = keyManager.getStats();

      res.json({
        ...stats,
        timestamp: new Date().toISOString(),
        estimatedCapacity: {
          // Image generation is limited by IPM (images per minute), not RPM
          paidTier1_IPM: stats.availableKeys * 10,      // ~10 images/min per key
          paidTier1_RPM: stats.availableKeys * 1000,    // ~1000 requests/min per key
          tier2_IPM: stats.availableKeys * 50,          // Estimated higher IPM
          enterprise_IPM: stats.availableKeys * 500,    // Custom enterprise limits
        }
      });
    } catch (error) {
      logger.error("Gemini stats error", error, { source: "routes" });
      res.status(500).json({ message: "Failed to get Gemini stats" });
    }
  });

  // Serve attached_assets folder for user-uploaded images
  app.use('/attached_assets', express.static(path.resolve(process.cwd(), 'attached_assets')));

  await setupAuth(app);

  // Create shared middleware for route modules
  const sharedMiddleware = createMiddleware();

  // Register modularized routes
  registerAdminRoutes(app, sharedMiddleware);
  registerSuperAdminRoutes(app, sharedMiddleware);
  registerAuthRoutes(app, sharedMiddleware);
  registerGalleryRoutes(app, sharedMiddleware);
  registerUserRoutes(app, sharedMiddleware);
  registerImageRoutes(app, sharedMiddleware);
  await registerGenerationRoutes(app, sharedMiddleware);
  await registerMockupRoutes(app, sharedMiddleware);
  await registerBackgroundRoutes(app, sharedMiddleware);
  registerMoodBoardRoutes(app, sharedMiddleware);
  await registerChatRoutes(app, sharedMiddleware);
  await registerBillingRoutes(app, sharedMiddleware);
  registerAffiliateRoutes(app, sharedMiddleware);
  await registerInspirationRoutes(app, sharedMiddleware);

  // Credit costs for different operations
  const CREDIT_COSTS = {
    DRAFT_GENERATION: 0,
    FINAL_GENERATION: 2,
    SINGLE_GENERATION: 1,
    MOCKUP_GENERATION: 3,
    BG_REMOVAL_STANDARD: 1,
    BG_REMOVAL_HIGH: 2,
    BG_REMOVAL_ULTRA: 4,
  } as const;

  // Helper to safely parse and validate pagination parameters
  const parsePagination = (query: { limit?: string; offset?: string; page?: string }, defaults: { limit: number; maxLimit: number }) => {
    const limit = Math.min(Math.max(1, parseInt(query.limit as string) || defaults.limit), defaults.maxLimit);
    let offset = 0;
    if (query.page) {
      const page = Math.max(1, parseInt(query.page as string) || 1);
      offset = (page - 1) * limit;
    } else if (query.offset) {
      offset = Math.max(0, parseInt(query.offset as string) || 0);
    }
    // Cap offset to prevent excessive values
    offset = Math.min(offset, 100000);
    return { limit, offset };
  };

  // Helper to check and deduct credits
  const checkAndDeductCredits = async (
    userId: string, 
    cost: number,
    operationType: string
  ): Promise<{ success: boolean; credits?: number; error?: string }> => {
    if (cost === 0) {
      return { success: true };
    }
    
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
  };

  // Safe error message sanitizer - prevents leaking sensitive info
  const getSafeErrorMessage = (error: unknown, fallback: string = "An error occurred"): string => {
    if (!(error instanceof Error)) {
      return fallback;
    }
    
    const message = error.message;
    
    const sensitivePatterns = [
      /at\s+\S+\s+\(/i,
      /\/[\w\/]+\.\w+/,
      /password|secret|key|token/i,
      /database|sql|query/i,
      /eai_again|enotfound|econnrefused/i,
      /helium|neon/i,
      /internal server/i,
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(message)) {
        logger.error("Sanitized error (sensitive pattern detected)", null, { source: "routes", message });
        return fallback;
      }
    }
    
    const safePatterns = [
      /insufficient credits/i,
      /invalid.*input/i,
      /not found/i,
      /unauthorized/i,
      /too many requests/i,
      /generation failed/i,
      /image.*required/i,
      /prompt.*required/i,
    ];
    
    for (const pattern of safePatterns) {
      if (pattern.test(message)) {
        return message;
      }
    }
    
    if (message.length < 100 && !/[\/\\]/.test(message)) {
      return message;
    }
    
    return fallback;
  };

  // All routes have been modularized into server/routes/

  return httpServer;
}
