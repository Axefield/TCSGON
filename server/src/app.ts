import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import { errorHandler } from './middleware/error.js';

const app = express();

// ─── Middleware stack ───────────────────────────────────────────

// 1. CORS — allow Vite dev origin
app.use(cors({ origin: config.corsOrigin, credentials: true }));

// 2. JSON body parser
app.use(express.json());

// 3. Request logger (simple, dev-only)
if (!config.isProduction) {
  app.use((req, _res, next) => {
    const start = Date.now();
    _res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`);
    });
    next();
  });
}

// ─── Routes ─────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error handler (must be last) ──────────────────────────────

app.use(errorHandler);

export default app;
