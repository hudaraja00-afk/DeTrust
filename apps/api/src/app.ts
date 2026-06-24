import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import corsConfig from './config/cors';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler, defaultLimiter } from './middleware';

// Import routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import jobRoutes from './routes/job.routes';
import proposalRoutes from './routes/proposal.routes';
import skillRoutes from './routes/skill.routes';
import uploadRoutes from './routes/upload.routes';
import contractRoutes from './routes/contract.routes';
import notificationRoutes from './routes/notification.routes';
import reviewRoutes from './routes/review.routes';
import disputeRoutes from './routes/dispute.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes from './routes/admin.routes';
import supportRoutes from './routes/support.routes';
import publicRoutes from './routes/public.routes';

// Create Express app
const app: Application = express();

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: config.isProd ? undefined : false,
}));

// CORS
app.use(cors(corsConfig));

// Rate limiting
app.use(defaultLimiter);

// =============================================================================
// PARSING MIDDLEWARE
// =============================================================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// Compression
app.use(compression());

// =============================================================================
// LOGGING MIDDLEWARE
// =============================================================================

// HTTP request logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// =============================================================================
// API ROUTES
// =============================================================================

const API_PREFIX = '/api';

// Static uploads
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check (no prefix for k8s/docker health checks)
app.use('/health', healthRoutes);
app.use(`${API_PREFIX}/health`, healthRoutes);

// Auth routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// User routes
app.use(`${API_PREFIX}/users`, userRoutes);

// Job routes
app.use(`${API_PREFIX}/jobs`, jobRoutes);

// Proposal routes
app.use(`${API_PREFIX}/proposals`, proposalRoutes);

// Skill catalog routes
app.use(`${API_PREFIX}/skills`, skillRoutes);

// Contract routes
app.use(`${API_PREFIX}/contracts`, contractRoutes);

// Upload routes
app.use(`${API_PREFIX}/uploads`, uploadRoutes);

// Notification routes
app.use(`${API_PREFIX}/notifications`, notificationRoutes);

// Review routes
app.use(`${API_PREFIX}/reviews`, reviewRoutes);

// Dispute routes
app.use(`${API_PREFIX}/disputes`, disputeRoutes);

// Message routes
app.use(`${API_PREFIX}/messages`, messageRoutes);

// Admin routes
app.use(`${API_PREFIX}/admin`, adminRoutes);

// Support routes
app.use(`${API_PREFIX}/support`, supportRoutes);

// Public routes (no auth — landing page stats & reviews)
app.use(`${API_PREFIX}/public`, publicRoutes);

// API documentation (Swagger UI)
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DeTrust API Docs',
}));

// OpenAPI JSON spec
app.get(`${API_PREFIX}/docs.json`, (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
