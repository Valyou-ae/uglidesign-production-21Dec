import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logger } from "./logger";

/**
 * Creates Express middleware that validates request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        logger.warn("Request validation failed", {
          source: "validation:body",
          path: req.path,
          errors,
        });
        return res.status(400).json({
          message: "Validation error",
          errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Creates Express middleware that validates request query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        logger.warn("Query validation failed", {
          source: "validation:query",
          path: req.path,
          errors,
        });
        return res.status(400).json({
          message: "Validation error",
          errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Creates Express middleware that validates request URL parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        logger.warn("Params validation failed", {
          source: "validation:params",
          path: req.path,
          errors,
        });
        return res.status(400).json({
          message: "Validation error",
          errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Safely parse and validate input, returning a result object
 */
export function safeValidate<T>(schema: ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}
