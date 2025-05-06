export function setupErrorHandlers(logger) {
  process.on('SIGINT', () => {
    logger.info({ msg: 'Received SIGINT. Shutting down...' });
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info({ msg: 'Received SIGTERM. Shutting down...' });
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error, msg: 'Uncaught Exception' });
    console.error(`Uncaught Exception! Check ${logFilePath}. Shutting down...`);
    logger.flush();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise, msg: 'Unhandled Rejection' });
    console.error(`Unhandled Rejection! Check ${logFilePath}. Shutting down...`);
    logger.flush();
    process.exit(1);
  });
}