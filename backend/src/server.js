import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, mongoose } from './config/db.js';

// ── Phase 1: Import unified model index to register all Mongoose models ───────
// This MUST come before any route/controller import so that populate() calls
// and cross-model references always find the registered schema.
import './models/index.js';

// ── Route imports (add new route files here as phases are completed) ──────────
import authRoutes from './routes/auth/authRoutes.js';

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configuration
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Route registration ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseConnected: mongoose.connection.readyState === 1,
    databaseState: states[mongoose.connection.readyState]
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

// ── Server bootstrap ──────────────────────────────────────────────────────────
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`AssetFlow backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('server.js')) {
  startServer();
}

export default app;
