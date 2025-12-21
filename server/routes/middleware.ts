import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";

// Test mode configuration
const TEST_USER_ID = "test-user-123";

export function createMiddleware(isTestMode: boolean) {
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (isTestMode) {
      (req as AuthenticatedRequest).user = (req as AuthenticatedRequest).user || { claims: { sub: TEST_USER_ID } };
      return next();
    }
    return isAuthenticated(req, res, next);
  };

  const getUserId = (req: AuthenticatedRequest): string => {
    if (isTestMode) {
      return TEST_USER_ID;
    }
    return req.user?.claims?.sub || '';
  };

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const userId = getUserId(req as AuthenticatedRequest);
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        next();
      } catch (error) {
        console.error("Admin auth error:", error);
        res.status(500).json({ message: "Authentication error" });
      }
    });
  };

  const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const userId = getUserId(req as AuthenticatedRequest);
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'super_admin') {
          return res.status(403).json({ message: "Access denied. Super Admin privileges required." });
        }

        next();
      } catch (error) {
        console.error("Super Admin auth error:", error);
        res.status(500).json({ message: "Authentication error" });
      }
    });
  };

  return {
    requireAuth,
    getUserId,
    requireAdmin,
    requireSuperAdmin,
    isTestMode,
  };
}

export type Middleware = ReturnType<typeof createMiddleware>;
