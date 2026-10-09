import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initializeDatabase } from './db/index.js';
import { sessionMiddleware } from './middleware/session.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import healthRouter from './routes/health.js';
import placesRouter from './routes/places.js';
import hazardsRouter from './routes/hazards.js';
import weatherRouter from './routes/weather.js';
import geocodeRouter from './routes/geocode.js';
import planRouter from './routes/plan.js';
import tripsRouter from './routes/trips.js';
import savedRouter from './routes/saved.js';
import reportsRouter from './routes/reports.js';
import adminRouter from './routes/admin.js';
import insightsRouter from './routes/insights.js';
import shareRouter from './routes/share.js';

// Initialize SQLite database and seed initial data
initializeDatabase();

const app = express();

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow client development proxies and inline leaflet icons
}));

app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(sessionMiddleware);
app.use(standardRateLimiter);

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/places', placesRouter);
app.use('/api/hazards', hazardsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/plan', planRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/saved', savedRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/share', shareRouter);

// Global Error Handler
app.use(errorHandler);

// Only listen if not imported in tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info(`⚡ CITYPULSE AI Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`Demo City: Pune, India | Tagline: "Plan around the city's pulse."`);
  });
}

export default app;
