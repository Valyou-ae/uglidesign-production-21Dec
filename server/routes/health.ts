import type { Express, Request, Response } from "express";
import { pool } from "../db";
import { getRateLimitConfig } from "../rateLimiter";
import { getCacheStats } from "../cache";
import { logger } from "../logger";

export function registerHealthRoutes(app: Express) {
  /**
   * Health check endpoint for uptime monitoring
   * Returns 200 if app is healthy, 503 if unhealthy
   */
  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      // Check database connectivity
      const dbStart = Date.now();
      await pool.query("SELECT 1");
      const dbLatency = Date.now() - dbStart;

      // Get pool stats
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      };

      // Get rate limit config
      const rateLimits = getRateLimitConfig();

      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: "connected",
          latency: `${dbLatency}ms`,
          pool: poolStats,
        },
        rateLimits,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Simple ping endpoint for basic availability checks
   */
  app.get("/api/ping", (_req: Request, res: Response) => {
    res.status(200).json({ pong: true, timestamp: Date.now() });
  });

  /**
   * Cache statistics endpoint for monitoring cache effectiveness
   */
  app.get("/api/cache/stats", (_req: Request, res: Response) => {
    try {
      const stats = getCacheStats();
      res.status(200).json({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to get cache stats", error, { source: "health" });
      res.status(500).json({ 
        success: false, 
        message: "Failed to get cache stats" 
      });
    }
  });
}
