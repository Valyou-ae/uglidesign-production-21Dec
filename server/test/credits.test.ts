import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStorage } from './utils';

describe('Credit System', () => {
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

  // Helper to check and deduct credits (matching routes.ts implementation)
  const checkAndDeductCredits = async (
    storage: ReturnType<typeof createMockStorage>,
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

  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  describe('Credit Costs', () => {
    it('should have zero cost for draft generation', () => {
      expect(CREDIT_COSTS.DRAFT_GENERATION).toBe(0);
    });

    it('should have correct costs for generation types', () => {
      expect(CREDIT_COSTS.SINGLE_GENERATION).toBe(1);
      expect(CREDIT_COSTS.FINAL_GENERATION).toBe(2);
      expect(CREDIT_COSTS.MOCKUP_GENERATION).toBe(3);
    });

    it('should have tiered costs for background removal', () => {
      expect(CREDIT_COSTS.BG_REMOVAL_STANDARD).toBe(1);
      expect(CREDIT_COSTS.BG_REMOVAL_HIGH).toBe(2);
      expect(CREDIT_COSTS.BG_REMOVAL_ULTRA).toBe(4);
    });
  });

  describe('checkAndDeductCredits', () => {
    it('should allow zero-cost operations without checking credits', async () => {
      const result = await checkAndDeductCredits(mockStorage, 'user-1', 0, 'draft');
      expect(result.success).toBe(true);
      expect(mockStorage.getUserCredits).not.toHaveBeenCalled();
    });

    it('should succeed when user has sufficient credits', async () => {
      mockStorage.getUserCredits.mockResolvedValue(100);
      mockStorage.deductCredits.mockResolvedValue({ credits: 99 });

      const result = await checkAndDeductCredits(mockStorage, 'user-1', 1, 'single generation');

      expect(result.success).toBe(true);
      expect(result.credits).toBe(99);
      expect(mockStorage.getUserCredits).toHaveBeenCalledWith('user-1');
      expect(mockStorage.deductCredits).toHaveBeenCalledWith('user-1', 1);
    });

    it('should fail when user has insufficient credits', async () => {
      mockStorage.getUserCredits.mockResolvedValue(2);

      const result = await checkAndDeductCredits(mockStorage, 'user-1', 5, 'mockup');

      expect(result.success).toBe(false);
      expect(result.credits).toBe(2);
      expect(result.error).toContain('Insufficient credits');
      expect(result.error).toContain('5 credits');
      expect(result.error).toContain('2');
      expect(mockStorage.deductCredits).not.toHaveBeenCalled();
    });

    it('should fail when user has exactly 0 credits', async () => {
      mockStorage.getUserCredits.mockResolvedValue(0);

      const result = await checkAndDeductCredits(mockStorage, 'user-1', 1, 'generation');

      expect(result.success).toBe(false);
      expect(result.credits).toBe(0);
    });

    it('should succeed when user has exactly enough credits', async () => {
      mockStorage.getUserCredits.mockResolvedValue(3);
      mockStorage.deductCredits.mockResolvedValue({ credits: 0 });

      const result = await checkAndDeductCredits(mockStorage, 'user-1', 3, 'mockup');

      expect(result.success).toBe(true);
      expect(result.credits).toBe(0);
    });

    it('should handle deductCredits returning null', async () => {
      mockStorage.getUserCredits.mockResolvedValue(10);
      mockStorage.deductCredits.mockResolvedValue(null);

      const result = await checkAndDeductCredits(mockStorage, 'user-1', 2, 'generation');

      expect(result.success).toBe(true);
      expect(result.credits).toBe(8); // Fallback to currentCredits - cost
    });
  });
});
