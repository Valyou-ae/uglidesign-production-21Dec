import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, safeValidate } from '../validation';
import { createMockRequest, createMockResponse } from './utils';

describe('Validation Middleware', () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    age: z.number().min(0).optional(),
  });

  describe('validateBody', () => {
    it('should pass valid data through', () => {
      const middleware = validateBody(testSchema);
      const req = createMockRequest({ body: { name: 'John', email: 'john@example.com' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should return 400 for invalid data', () => {
      const middleware = validateBody(testSchema);
      const req = createMockRequest({ body: { name: '', email: 'invalid' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res._status).toBe(400);
      expect(res._json.message).toBe('Validation error');
      expect(res._json.errors).toHaveLength(2);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return specific error messages', () => {
      const middleware = validateBody(testSchema);
      const req = createMockRequest({ body: { name: 'John', email: 'invalid-email' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res._json.errors[0].message).toBe('Invalid email');
    });

    it('should transform valid data', () => {
      const transformSchema = z.object({
        name: z.string().transform(s => s.toUpperCase()),
      });
      const middleware = validateBody(transformSchema);
      const req = createMockRequest({ body: { name: 'john' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(req.body.name).toBe('JOHN');
    });
  });

  describe('validateQuery', () => {
    const querySchema = z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    });

    it('should pass valid query params', () => {
      const middleware = validateQuery(querySchema);
      const req = createMockRequest({ query: { page: '1', limit: '10' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(10);
    });

    it('should reject invalid query params', () => {
      const middleware = validateQuery(querySchema);
      const req = createMockRequest({ query: { page: 'abc' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res._status).toBe(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    const paramsSchema = z.object({
      id: z.string().uuid("Invalid ID format"),
    });

    it('should pass valid UUID params', () => {
      const middleware = validateParams(paramsSchema);
      const req = createMockRequest({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid UUID params', () => {
      const middleware = validateParams(paramsSchema);
      const req = createMockRequest({ params: { id: 'not-a-uuid' } });
      const res = createMockResponse();
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(res._status).toBe(400);
      expect(res._json.errors[0].message).toBe('Invalid ID format');
    });
  });

  describe('safeValidate', () => {
    it('should return success with parsed data for valid input', () => {
      const result = safeValidate(testSchema, { name: 'John', email: 'john@example.com' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', email: 'john@example.com' });
      }
    });

    it('should return failure with errors for invalid input', () => {
      const result = safeValidate(testSchema, { name: '', email: 'invalid' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle non-Zod errors gracefully', () => {
      const badSchema = {
        parse: () => { throw new Error('Unexpected error'); },
      } as any;

      const result = safeValidate(badSchema, {});

      expect(result.success).toBe(false);
    });
  });
});
