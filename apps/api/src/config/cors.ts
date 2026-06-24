import { config } from './index';

export const corsConfig = {
  origin: config.isDev 
    ? [config.server.frontendUrl, 'http://localhost:3000', 'http://localhost:3001']
    : [config.server.frontendUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit', 'Content-Disposition'],
  maxAge: 86400, // 24 hours
};

export default corsConfig;
