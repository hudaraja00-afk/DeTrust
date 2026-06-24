import http from 'http';

import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initSocketIO } from './config/socket';
import { startQueues, stopQueues } from './queues';

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
initSocketIO(server);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🛑 HTTP server closed');
    
    try {
      await stopQueues();
      await disconnectDatabase();
      await disconnectRedis();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Connect to Redis
    await connectRedis();

    // Start BullMQ queues and workers
    await startQueues();

    // Start listening
    server.listen(config.server.port, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║                  DeTrust API Server                      ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║  🚀 Server running on port ${config.server.port}                         ║`);
      console.log(`║  📍 Environment: ${config.isDev ? 'development' : 'production'}                           ║`);
      console.log(`║  🔗 API URL: ${config.server.apiUrl}                  ║`);
      console.log('╚══════════════════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default server;
