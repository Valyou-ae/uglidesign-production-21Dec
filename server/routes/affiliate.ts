import type { Express, Request, Response } from "express";
import { ZodError } from "zod";
import { storage } from "../storage";
import { insertWithdrawalSchema, withdrawalRequestSchema } from "@shared/schema";
import { getFromCache, CACHE_TTL } from "../cache";
import type { Middleware } from "./middleware";
import type { AuthenticatedRequest } from "../types";
import { logger } from "../logger";

export function registerAffiliateRoutes(app: Express, middleware: Middleware) {
  const { requireAuth, getUserId } = middleware;

  // ============== AFFILIATE ROUTES ==============

  app.get("/api/affiliate/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const [commissions, totalEarnings, pendingPayout, referredUsers] = await Promise.all([
        storage.getCommissionsByUserId(userId),
        storage.getTotalEarnings(userId),
        storage.getPendingPayout(userId),
        storage.getReferredUsers(userId),
      ]);

      res.json({
        totalEarnings: totalEarnings / 100,
        pendingPayout: pendingPayout / 100,
        activeReferrals: referredUsers.length,
        commissions: commissions.map(c => ({
          ...c,
          amount: c.amount / 100,
        })),
        referredUsers: referredUsers.map(u => ({
          id: u.id,
          email: u.email,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/affiliate/withdraw", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);

      // Validate input with strict banking validation
      const validatedInput = withdrawalRequestSchema.parse(req.body);

      // Convert user-entered dollars to cents for storage
      const amountInCents = Math.round(validatedInput.amount * 100);

      // Get pending payout (available for withdrawal) in cents
      const pendingPayout = await storage.getPendingPayout(userId);
      if (amountInCents > pendingPayout) {
        return res.status(400).json({ message: "Withdrawal amount exceeds available balance" });
      }

      const withdrawalData = insertWithdrawalSchema.parse({
        ...validatedInput,
        amount: amountInCents,
        userId,
      });

      const withdrawal = await storage.createWithdrawalRequest(withdrawalData);
      res.json({ withdrawal: { ...withdrawal, amount: withdrawal.amount / 100 } });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/affiliate/withdrawals", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const withdrawals = await storage.getWithdrawalsByUserId(userId);
      // Convert cents to dollars for display
      res.json({
        withdrawals: withdrawals.map(w => ({ ...w, amount: w.amount / 100 }))
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // ============== LEADERBOARD ROUTES ==============

  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'weekly' | 'monthly' | 'all-time') || 'all-time';
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      if (!['weekly', 'monthly', 'all-time'].includes(period)) {
        return res.status(400).json({ message: "Invalid period. Use 'weekly', 'monthly', or 'all-time'" });
      }

      // Cache leaderboard for 1 minute to reduce DB load
      const leaderboard = await getFromCache(
        `leaderboard:${period}:${limit}`,
        CACHE_TTL.LEADERBOARD,
        () => storage.getLeaderboard(period, limit)
      );
      res.json({ leaderboard, period });
    } catch (error) {
      logger.error("Leaderboard error", error, { source: "affiliate" });
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ============== REFERRAL ROUTES ==============

  app.get("/api/referral/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error("Referral stats error", error, { source: "affiliate" });
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  app.post("/api/referral/apply", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const { referralCode } = req.body;

      if (!referralCode || typeof referralCode !== 'string') {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const result = await storage.applyReferralCode(userId, referralCode.trim());

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({ success: true, referrerCredits: 5, message: "Referral code applied! Your referrer earned 5 bonus credits." });
    } catch (error) {
      logger.error("Apply referral error", error, { source: "affiliate" });
      res.status(500).json({ message: "Failed to apply referral code" });
    }
  });

  app.post("/api/referral/generate-code", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.affiliateCode) {
        return res.json({ code: user.affiliateCode, message: "You already have a referral code" });
      }

      const code = `UGLI-${userId.slice(0, 8).toUpperCase()}`;
      await storage.updateUserProfile(userId, { affiliateCode: code });

      res.json({ code, message: "Referral code generated successfully" });
    } catch (error) {
      logger.error("Generate referral code error", error, { source: "affiliate" });
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });
}
