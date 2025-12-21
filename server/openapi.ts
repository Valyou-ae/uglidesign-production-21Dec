/**
 * OpenAPI 3.0 Documentation for UGLI Design API
 */
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'UGLI Design API',
    version: '1.0.0',
    description: 'AI-powered design generation platform API',
  },
  servers: [
    { url: '/api', description: 'API Server' },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'User', description: 'User management' },
    { name: 'Generation', description: 'Image generation' },
    { name: 'Gallery', description: 'Public gallery' },
    { name: 'Billing', description: 'Credits and payments' },
    { name: 'Admin', description: 'Admin operations' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'API health check',
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/user': {
      get: {
        tags: ['User'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile' },
          401: { description: 'Not authenticated' },
        },
      },
    },
    '/user/credits': {
      get: {
        tags: ['User'],
        summary: 'Get user credits balance',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Credits balance',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    credits: { type: 'number', example: 100 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/generate': {
      post: {
        tags: ['Generation'],
        summary: 'Generate an image',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string', maxLength: 2000 },
                  stylePreset: {
                    type: 'string',
                    enum: ['auto', 'photorealistic', 'digital-art', 'anime', 'oil-painting'],
                  },
                  aspectRatio: {
                    type: 'string',
                    enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Generated image' },
          400: { description: 'Invalid request' },
          401: { description: 'Not authenticated' },
          402: { description: 'Insufficient credits' },
          429: { description: 'Rate limit exceeded' },
        },
      },
    },
    '/gallery': {
      get: {
        tags: ['Gallery'],
        summary: 'Get public gallery images',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Gallery images',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    images: { type: 'array' },
                    total: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/billing/checkout': {
      post: {
        tags: ['Billing'],
        summary: 'Create checkout session for credits',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['priceId'],
                properties: {
                  priceId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Checkout session created' },
          401: { description: 'Not authenticated' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: { description: 'User list' },
          401: { description: 'Not authenticated' },
          403: { description: 'Admin access required' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
      },
    },
  },
};

/**
 * Register OpenAPI documentation endpoint
 */
export function registerOpenApiRoutes(app: any) {
  app.get('/api/docs/openapi.json', (_req: any, res: any) => {
    res.json(openApiSpec);
  });

  // Simple HTML documentation viewer
  app.get('/api/docs', (_req: any, res: any) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>UGLI Design API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
    });
  </script>
</body>
</html>
    `);
  });
}
