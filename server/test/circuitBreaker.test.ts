import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCircuitBreaker, withRetry, getCircuitStatus } from '../circuitBreaker';

describe('Circuit Breaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createCircuitBreaker', () => {
    it('should execute function when circuit is closed', async () => {
      const circuit = createCircuitBreaker({
        name: 'test-service-1',
        failureThreshold: 3,
        resetTimeout: 10000,
      });

      const mockFn = vi.fn().mockResolvedValue('success');
      const result = await circuit(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should open circuit after threshold failures', async () => {
      const circuit = createCircuitBreaker({
        name: 'test-service-2',
        failureThreshold: 2,
        resetTimeout: 10000,
      });

      const mockFn = vi.fn().mockRejectedValue(new Error('Service error'));

      // First failure
      await expect(circuit(mockFn)).rejects.toThrow('Service error');

      // Second failure - should open circuit
      await expect(circuit(mockFn)).rejects.toThrow('Service error');

      // Third call - circuit should be open
      await expect(circuit(mockFn)).rejects.toThrow('temporarily unavailable');
      expect(mockFn).toHaveBeenCalledTimes(2); // Only called twice, not third time
    });

    it('should transition to half-open after timeout', async () => {
      const circuit = createCircuitBreaker({
        name: 'test-service-3',
        failureThreshold: 1,
        resetTimeout: 5000,
      });

      const mockFn = vi.fn().mockRejectedValueOnce(new Error('Service error'));

      // Open the circuit
      await expect(circuit(mockFn)).rejects.toThrow('Service error');

      // Circuit is open
      await expect(circuit(mockFn)).rejects.toThrow('temporarily unavailable');

      // Advance time past reset timeout
      vi.advanceTimersByTime(6000);

      // Now function should be called (half-open state)
      mockFn.mockResolvedValueOnce('recovered');
      const result = await circuit(mockFn);
      expect(result).toBe('recovered');
    });

    it('should close circuit after successful call in half-open state', async () => {
      const circuit = createCircuitBreaker({
        name: 'test-service-4',
        failureThreshold: 1,
        resetTimeout: 5000,
      });

      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Service error'))
        .mockResolvedValue('success');

      // Open circuit
      await expect(circuit(mockFn)).rejects.toThrow('Service error');

      // Advance time to half-open
      vi.advanceTimersByTime(6000);

      // Successful call should close circuit
      await circuit(mockFn);

      // Should work normally now
      const result = await circuit(mockFn);
      expect(result).toBe('success');
    });

    it('should reset failure count on success', async () => {
      const circuit = createCircuitBreaker({
        name: 'test-service-5',
        failureThreshold: 3,
        resetTimeout: 10000,
      });

      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success') // This resets
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockRejectedValueOnce(new Error('Error 4'));

      await expect(circuit(mockFn)).rejects.toThrow('Error 1');
      await expect(circuit(mockFn)).rejects.toThrow('Error 2');
      await circuit(mockFn); // Success - resets count
      await expect(circuit(mockFn)).rejects.toThrow('Error 3');
      await expect(circuit(mockFn)).rejects.toThrow('Error 4');

      // Circuit should still allow calls (only 2 failures since reset)
      mockFn.mockResolvedValueOnce('still works');
      const result = await circuit(mockFn);
      expect(result).toBe('still works');
    });
  });

  describe('getCircuitStatus', () => {
    it('should return status of all circuits', async () => {
      const circuit = createCircuitBreaker({
        name: 'status-test',
        failureThreshold: 1,
        resetTimeout: 10000,
      });

      // Open the circuit
      const mockFn = vi.fn().mockRejectedValue(new Error('Error'));
      await expect(circuit(mockFn)).rejects.toThrow();

      const status = getCircuitStatus();
      expect(status['status-test']).toBeDefined();
      expect(status['status-test'].state).toBe('open');
      expect(status['status-test'].failures).toBe(1);
    });
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const resultPromise = withRetry(mockFn, { maxRetries: 3, initialDelay: 100 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Transient error'))
      .mockResolvedValueOnce('success');

    const resultPromise = withRetry(mockFn, { maxRetries: 3, initialDelay: 100, name: 'test' });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on certain errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('insufficient credits'));

    await expect(
      withRetry(mockFn, { maxRetries: 3, initialDelay: 100 })
    ).rejects.toThrow('insufficient credits');

    expect(mockFn).toHaveBeenCalledTimes(1); // No retries for this error
  });

  it('should throw after max retries', async () => {
    vi.useRealTimers(); // Use real timers for this test
    const mockFn = vi.fn().mockRejectedValue(new Error('Persistent error'));

    await expect(
      withRetry(mockFn, { maxRetries: 2, initialDelay: 10 })
    ).rejects.toThrow('Persistent error');

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValueOnce('success');

    // Don't await yet, just start the promise
    const resultPromise = withRetry(mockFn, { maxRetries: 3, initialDelay: 1000 });

    // First call happens immediately
    expect(mockFn).toHaveBeenCalledTimes(1);

    // After 1000ms (first delay), second call
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // After 2000ms more (doubled delay), third call
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockFn).toHaveBeenCalledTimes(3);

    const result = await resultPromise;
    expect(result).toBe('success');
  });
});
