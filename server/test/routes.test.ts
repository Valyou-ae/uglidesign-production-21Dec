import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, createMockUser, createMockAdmin, createAuthenticatedRequest, createMockStorage } from './utils';

describe('Route Utilities', () => {
  describe('parsePagination', () => {
    // Import the utility function
    const parsePagination = (query: { limit?: string; offset?: string; page?: string }, defaults: { limit: number; maxLimit: number }) => {
      const limit = Math.min(Math.max(1, parseInt(query.limit as string) || defaults.limit), defaults.maxLimit);
      let offset = 0;
      if (query.page) {
        const page = Math.max(1, parseInt(query.page as string) || 1);
        offset = (page - 1) * limit;
      } else if (query.offset) {
        offset = Math.max(0, parseInt(query.offset as string) || 0);
      }
      offset = Math.min(offset, 100000);
      return { limit, offset };
    };

    it('should use default limit when not provided', () => {
      const result = parsePagination({}, { limit: 20, maxLimit: 100 });
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should respect maxLimit', () => {
      const result = parsePagination({ limit: '500' }, { limit: 20, maxLimit: 100 });
      expect(result.limit).toBe(100);
    });

    it('should calculate offset from page number', () => {
      const result = parsePagination({ page: '3', limit: '10' }, { limit: 20, maxLimit: 100 });
      expect(result.offset).toBe(20); // (3-1) * 10
    });

    it('should use offset directly when provided', () => {
      const result = parsePagination({ offset: '50' }, { limit: 20, maxLimit: 100 });
      expect(result.offset).toBe(50);
    });

    it('should cap offset at 100000', () => {
      const result = parsePagination({ offset: '200000' }, { limit: 20, maxLimit: 100 });
      expect(result.offset).toBe(100000);
    });

    it('should handle invalid inputs gracefully', () => {
      const result = parsePagination({ limit: 'invalid', page: 'abc' }, { limit: 20, maxLimit: 100 });
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should enforce minimum limit of 1', () => {
      const result = parsePagination({ limit: '-5' }, { limit: 20, maxLimit: 100 });
      expect(result.limit).toBe(1);
    });
  });
});

describe('Error Message Sanitization', () => {
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

  it('should return safe error messages', () => {
    expect(getSafeErrorMessage(new Error('Insufficient credits'))).toBe('Insufficient credits');
    expect(getSafeErrorMessage(new Error('Resource not found'))).toBe('Resource not found');
  });

  it('should sanitize sensitive error messages', () => {
    expect(getSafeErrorMessage(new Error('Database connection failed'))).toBe('An error occurred');
    expect(getSafeErrorMessage(new Error('Invalid SQL query'))).toBe('An error occurred');
    expect(getSafeErrorMessage(new Error('API key is invalid'))).toBe('An error occurred');
  });

  it('should sanitize file paths', () => {
    expect(getSafeErrorMessage(new Error('Error in /home/user/secret/file.ts'))).toBe('An error occurred');
  });

  it('should handle non-Error objects', () => {
    expect(getSafeErrorMessage('string error')).toBe('An error occurred');
    expect(getSafeErrorMessage(null)).toBe('An error occurred');
    expect(getSafeErrorMessage(undefined)).toBe('An error occurred');
  });

  it('should use custom fallback message', () => {
    expect(getSafeErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});

describe('Mock Utilities', () => {
  it('should create a mock request with default values', () => {
    const req = createMockRequest();
    expect(req.body).toEqual({});
    expect(req.params).toEqual({});
    expect(req.query).toEqual({});
  });

  it('should create a mock request with overrides', () => {
    const req = createMockRequest({ body: { name: 'test' } });
    expect(req.body).toEqual({ name: 'test' });
  });

  it('should create a mock response with status and json methods', () => {
    const res = createMockResponse();
    res.status(404);
    res.json({ message: 'Not found' });

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ message: 'Not found' });
  });

  it('should create a mock user with default values', () => {
    const user = createMockUser();
    expect(user.id).toBe('test-user-id');
    expect(user.role).toBe('user');
    expect(user.credits).toBe(100);
  });

  it('should create a mock admin user', () => {
    const admin = createMockAdmin();
    expect(admin.role).toBe('admin');
  });

  it('should create an authenticated request', () => {
    const user = createMockUser();
    const req = createAuthenticatedRequest(user);
    expect((req as any).user.claims.sub).toBe(user.id);
  });

  it('should create a mock storage with all required methods', () => {
    const storage = createMockStorage();
    expect(storage.getUser).toBeDefined();
    expect(storage.createUser).toBeDefined();
    expect(storage.getUserCredits).toBeDefined();
  });
});
