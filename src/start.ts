import { Worker } from './worker.js';
import logger from './logger.js';


const worker = new Worker();
worker.start().then().catch((err) => {
  logger.error('startup error', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  worker.stop().then().catch((err) => {
    logger.error('shutdown error', err);
    process.exit(1);
  });
});