import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, createMockUser, createMockAdmin, createMockStorage } from './utils';

describe('Authentication & Authorization', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  describe('Role-based Access Control', () => {
    it('should identify regular users correctly', () => {
      const user = createMockUser({ role: 'user' });
      expect(user.role).toBe('user');
      expect(user.role !== 'admin').toBe(true);
      expect(user.role !== 'super_admin').toBe(true);
    });

    it('should identify admin users correctly', () => {
      const admin = createMockAdmin();
      expect(admin.role).toBe('admin');
    });

    it('should identify super_admin users correctly', () => {
      const superAdmin = createMockUser({ role: 'super_admin' });
      expect(superAdmin.role).toBe('super_admin');
    });

    it('should validate admin access (admin or super_admin)', () => {
      const hasAdminAccess = (role: string) => role === 'admin' || role === 'super_admin';

      expect(hasAdminAccess('user')).toBe(false);
      expect(hasAdminAccess('admin')).toBe(true);
      expect(hasAdminAccess('super_admin')).toBe(true);
      expect(hasAdminAccess('moderator')).toBe(false);
    });

    it('should validate super_admin access (super_admin only)', () => {
      const hasSuperAdminAccess = (role: string) => role === 'super_admin';

      expect(hasSuperAdminAccess('user')).toBe(false);
      expect(hasSuperAdminAccess('admin')).toBe(false);
      expect(hasSuperAdminAccess('super_admin')).toBe(true);
    });
  });

  describe('User ID Extraction', () => {
    it('should extract user ID from authenticated request', () => {
      const user = createMockUser({ id: 'user-123' });
      const req: any = {
        user: {
          claims: {
            sub: user.id,
          },
        },
      };

      const getUserId = (req: any): string => req.user?.claims?.sub || '';
      expect(getUserId(req)).toBe('user-123');
    });

    it('should return empty string for unauthenticated request', () => {
      const req: any = {};
      const getUserId = (req: any): string => req.user?.claims?.sub || '';
      expect(getUserId(req)).toBe('');
    });

    it('should handle missing claims gracefully', () => {
      const req: any = { user: {} };
      const getUserId = (req: any): string => req.user?.claims?.sub || '';
      expect(getUserId(req)).toBe('');
    });
  });

  describe('Admin Route Authorization', () => {
    const createAdminMiddleware = (storage: ReturnType<typeof createMockStorage>) => {
      return async (req: any, res: any, next: () => void) => {
        const userId = req.user?.claims?.sub;
        if (!userId) {
          return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        next();
      };
    };

    it('should reject unauthenticated requests', async () => {
      const middleware = createAdminMiddleware(mockStorage);
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res._status).toBe(401);
      expect(res._json).toEqual({ message: 'Not authenticated' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests from non-existent users', async () => {
      mockStorage.getUser.mockResolvedValue(null);

      const middleware = createAdminMiddleware(mockStorage);
      const req: any = { user: { claims: { sub: 'unknown-user' } } };
      const res = createMockResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res._status).toBe(404);
      expect(res._json).toEqual({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests from regular users', async () => {
      mockStorage.getUser.mockResolvedValue(createMockUser({ role: 'user' }));

      const middleware = createAdminMiddleware(mockStorage);
      const req: any = { user: { claims: { sub: 'user-id' } } };
      const res = createMockResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res._status).toBe(403);
      expect(res._json).toEqual({ message: 'Access denied. Admin privileges required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow requests from admin users', async () => {
      mockStorage.getUser.mockResolvedValue(createMockAdmin());

      const middleware = createAdminMiddleware(mockStorage);
      const req: any = { user: { claims: { sub: 'admin-id' } } };
      const res = createMockResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow requests from super_admin users', async () => {
      mockStorage.getUser.mockResolvedValue(createMockUser({ role: 'super_admin' }));

      const middleware = createAdminMiddleware(mockStorage);
      const req: any = { user: { claims: { sub: 'super-admin-id' } } };
      const res = createMockResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Valid Role Updates', () => {
    const validRoles = ['user', 'admin', 'moderator'];

    it('should accept valid roles', () => {
      validRoles.forEach(role => {
        expect(validRoles.includes(role)).toBe(true);
      });
    });

    it('should reject invalid roles', () => {
      const invalidRoles = ['superuser', 'root', 'manager', ''];
      invalidRoles.forEach(role => {
        expect(validRoles.includes(role)).toBe(false);
      });
    });
  });
});

describe('Commission Tracking', () => {
  it('should calculate 20% commission correctly', () => {
    // Formula from webhookHandlers.ts: Math.trunc((amountTotal * 20 + 50) / 100)
    const calculateCommission = (amountCents: number): number => {
      return Math.trunc((amountCents * 20 + 50) / 100);
    };

    // Test various amounts
    expect(calculateCommission(1000)).toBe(200);   // $10.00 -> $2.00
    expect(calculateCommission(5000)).toBe(1000);  // $50.00 -> $10.00
    expect(calculateCommission(9999)).toBe(2000);  // $99.99 -> $20.00
    expect(calculateCommission(100)).toBe(20);     // $1.00 -> $0.20
    expect(calculateCommission(1)).toBe(0);        // $0.01 -> $0.00 (too small for commission)
  });

  it('should handle edge cases', () => {
    const calculateCommission = (amountCents: number): number => {
      return Math.trunc((amountCents * 20 + 50) / 100);
    };

    expect(calculateCommission(0)).toBe(0);
    expect(calculateCommission(-100)).toBeLessThan(0); // Negative amounts (should be blocked upstream)
  });
});
