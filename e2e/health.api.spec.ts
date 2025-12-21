import { test, expect } from '@playwright/test';

test.describe('Health Check API', () => {
  test('GET /health returns healthy status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  test('GET /ready returns readiness status', async ({ request }) => {
    const response = await request.get('/ready');
    // May return 503 if DB is not connected, but endpoint should exist
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.checks).toBeDefined();
  });

  test('GET /api/health returns API health', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});

test.describe('Public API Endpoints', () => {
  test('GET /api/gallery returns gallery images', async ({ request }) => {
    const response = await request.get('/api/gallery');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body.images)).toBeTruthy();
  });

  test('GET /api/inspirations returns inspirations', async ({ request }) => {
    const response = await request.get('/api/inspirations');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('Protected endpoints return 401 without auth', async ({ request }) => {
    const response = await request.get('/api/user');
    expect(response.status()).toBe(401);
  });

  test('POST /api/generate requires authentication', async ({ request }) => {
    const response = await request.post('/api/generate', {
      data: { prompt: 'test' }
    });
    expect(response.status()).toBe(401);
  });
});
