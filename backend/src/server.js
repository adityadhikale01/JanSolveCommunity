import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(`  JanSolve + JanFeed Community API Running     `);
      console.log(`  Port: http://localhost:${ENV.PORT}           `);
      console.log(`  Health: http://localhost:${ENV.PORT}/api/v1/health`);
      console.log(`  Environment: ${ENV.NODE_ENV}                 `);
      console.log(`===============================================`);
    });

    // Handle graceful shutdown
    const handleShutdown = () => {
      console.log('\n[JanSolve] Gracefully terminating server...');
      server.close(() => {
        console.log('[JanSolve] HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (error) {
    console.error('Fatal error starting JanSolve server:', error);
    process.exit(1);
  }
};

startServer();
