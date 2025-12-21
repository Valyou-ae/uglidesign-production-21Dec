import { vi } from 'vitest';
import type { Request, Response } from 'express';

/**
 * Creates a mock Express Request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    get: vi.fn().mockReturnValue(''),
    ...overrides,
  };
}

/**
 * Creates a mock Express Response object
 */
export function createMockResponse(): Partial<Response> & { _json: any; _status: number } {
  const res: any = {
    _json: null,
    _status: 200,
    status: vi.fn().mockImplementation(function(this: any, code: number) {
      this._status = code;
      return this;
    }),
    json: vi.fn().mockImplementation(function(this: any, data: any) {
      this._json = data;
      return this;
    }),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    getHeader: vi.fn(),
  };
  return res;
}

/**
 * Creates a mock authenticated user
 */
export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    credits: 100,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock admin user
 */
export function createMockAdmin(overrides: Record<string, any> = {}) {
  return createMockUser({
    role: 'admin',
    ...overrides,
  });
}

/**
 * Creates a mock authenticated request
 */
export function createAuthenticatedRequest(user: ReturnType<typeof createMockUser>, overrides: Partial<Request> = {}): Partial<Request> {
  return createMockRequest({
    user: {
      claims: {
        sub: user.id,
      },
    },
    ...overrides,
  } as any);
}

/**
 * Creates a mock image object
 */
export function createMockImage(overrides: Record<string, any> = {}) {
  return {
    id: 'test-image-id',
    userId: 'test-user-id',
    prompt: 'test prompt',
    imageUrl: 'https://example.com/image.png',
    thumbnailUrl: 'https://example.com/thumb.png',
    status: 'completed',
    generationType: 'single',
    visibility: 'private',
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock storage functions
 */
export function createMockStorage() {
  return {
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserRole: vi.fn(),
    getUserCredits: vi.fn().mockResolvedValue(100),
    deductCredits: vi.fn(),
    addCredits: vi.fn(),
    getImage: vi.fn(),
    getUserImages: vi.fn(),
    createImage: vi.fn(),
    updateImage: vi.fn(),
    deleteImage: vi.fn(),
    getPublicImages: vi.fn(),
    getAllUsers: vi.fn().mockResolvedValue({ users: [], total: 0 }),
    getContacts: vi.fn().mockResolvedValue({ contacts: [], total: 0 }),
    getContact: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    getDeals: vi.fn().mockResolvedValue({ deals: [], total: 0 }),
    getDeal: vi.fn(),
    createDeal: vi.fn(),
    updateDeal: vi.fn(),
    deleteDeal: vi.fn(),
    getActivities: vi.fn().mockResolvedValue({ activities: [], total: 0 }),
    createActivity: vi.fn(),
    updateActivity: vi.fn(),
    deleteActivity: vi.fn(),
    getAnalytics: vi.fn().mockResolvedValue({}),
    getCommissionByStripeSessionId: vi.fn(),
    getUserByStripeCustomerId: vi.fn(),
    createCommission: vi.fn(),
  };
}

/**
 * Wait helper for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
