import { db } from './sqlite.js';
import { initSchema } from './schema.js';
import { seedDatabase } from './seed.js';
import { logger } from '../utils/logger.js';

export function initializeDatabase(): void {
  try {
    initSchema();
    seedDatabase();
    logger.info('Database initialized and verified successfully.');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export { db };
