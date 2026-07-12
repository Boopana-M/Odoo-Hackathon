import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, mongoose } from './config/db.js';
import authRoutes from './routes/auth/authRoutes.js';

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register routes
app.use('/api/auth', authRoutes);

// Basic Health Check Route
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

// Database Connection and Server Bootstrap
async function startServer() {
  try {
    // Connect to MongoDB Compass local instance
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Automatically start if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('server.js')) {
  startServer();
}

export default app;
