import { logger } from "./logger";

interface CircuitBreakerOptions {
  failureThreshold: number;  // Number of failures before opening circuit
  resetTimeout: number;      // Time in ms before trying again (half-open state)
  name: string;              // Name of the service for logging
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuits = new Map<string, CircuitState>();

/**
 * Circuit breaker pattern implementation for external service calls
 * Prevents cascading failures when external services are down
 */
export function createCircuitBreaker<T>(
  options: CircuitBreakerOptions
): (fn: () => Promise<T>) => Promise<T> {
  const { failureThreshold, resetTimeout, name } = options;

  // Initialize circuit state
  if (!circuits.has(name)) {
    circuits.set(name, {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    });
  }

  return async (fn: () => Promise<T>): Promise<T> => {
    const circuit = circuits.get(name)!;
    const now = Date.now();

    // Check if circuit should transition from open to half-open
    if (circuit.state === 'open') {
      if (now - circuit.lastFailure >= resetTimeout) {
        circuit.state = 'half-open';
        logger.info(`Circuit breaker ${name}: transitioning to half-open`, { source: "circuit-breaker" });
      } else {
        const retryIn = Math.ceil((resetTimeout - (now - circuit.lastFailure)) / 1000);
        throw new Error(`Service ${name} is temporarily unavailable. Retry in ${retryIn}s`);
      }
    }

    try {
      const result = await fn();

      // Success: reset circuit
      if (circuit.state !== 'closed') {
        logger.info(`Circuit breaker ${name}: closing circuit after success`, { source: "circuit-breaker" });
      }
      circuit.failures = 0;
      circuit.state = 'closed';

      return result;
    } catch (error) {
      circuit.failures++;
      circuit.lastFailure = now;

      // Check if we should open the circuit
      if (circuit.failures >= failureThreshold) {
        circuit.state = 'open';
        logger.error(`Circuit breaker ${name}: opening circuit after ${circuit.failures} failures`, {
          source: "circuit-breaker",
          error: error instanceof Error ? error.message : String(error),
        });
      } else {
        logger.warn(`Circuit breaker ${name}: failure ${circuit.failures}/${failureThreshold}`, {
          source: "circuit-breaker",
          error: error instanceof Error ? error.message : String(error),
        });
      }

      throw error;
    }
  };
}

// Pre-configured circuit breakers for common services
export const stripeCircuit = createCircuitBreaker<any>({
  name: 'stripe',
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
});

export const geminiCircuit = createCircuitBreaker<any>({
  name: 'gemini',
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
});

export const replicateCircuit = createCircuitBreaker<any>({
  name: 'replicate',
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
});

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelay?: number; maxDelay?: number; name?: string } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, name = 'operation' } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (lastError.message.includes('insufficient credits') ||
          lastError.message.includes('unauthorized') ||
          lastError.message.includes('Invalid') ||
          lastError.message.includes('not found')) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        logger.warn(`${name} failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, {
          source: "retry",
          error: lastError.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Get current circuit breaker status for monitoring
 */
export function getCircuitStatus(): Record<string, { state: string; failures: number; lastFailure: string }> {
  const status: Record<string, { state: string; failures: number; lastFailure: string }> = {};

  for (const [name, circuit] of circuits) {
    status[name] = {
      state: circuit.state,
      failures: circuit.failures,
      lastFailure: circuit.lastFailure ? new Date(circuit.lastFailure).toISOString() : 'never',
    };
  }

  return status;
}
