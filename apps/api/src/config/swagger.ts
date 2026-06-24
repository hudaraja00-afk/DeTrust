import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DeTrust API',
      version: '1.0.0',
      description:
        'DeTrust Decentralized Freelance Marketplace API — blockchain-backed escrow, trust scoring, dispute resolution, and more.',
      contact: {
        name: 'DeTrust Team',
        url: 'https://github.com/Haseeb243/DeTrust',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT httpOnly cookie set after login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & registration' },
      { name: 'Users', description: 'User profiles and trust scores' },
      { name: 'Jobs', description: 'Job posting and browsing' },
      { name: 'Proposals', description: 'Proposal submission and management' },
      { name: 'Contracts', description: 'Contract and milestone management' },
      { name: 'Reviews', description: 'Review and feedback system' },
      { name: 'Disputes', description: 'Dispute resolution and juror voting' },
      { name: 'Messages', description: 'In-platform messaging' },
      { name: 'Notifications', description: 'Real-time notifications' },
      { name: 'Admin', description: 'Admin dashboard and management' },
      { name: 'Health', description: 'Health and readiness checks' },
    ],
  },
  // Centralized API documentation file
  apis: [
    './src/config/swagger-paths.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
