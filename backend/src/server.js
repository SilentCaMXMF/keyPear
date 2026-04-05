import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase } from './services/database.js';

dotenv.config();

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET is required. Copy .env.example to .env and configure.');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET is required. Copy .env.example to .env and configure.');
}

import authRoutes from './routes/auth.js';
import filesRoutes from './routes/files.js';
import foldersRoutes from './routes/folders.js';
import sharesRoutes from './routes/shares.js';
import chunksRoutes from './routes/chunks.js';
import logsRoutes from './routes/logs.js';
import { ChunkUpload } from './models/index.js';
import { nonceStore } from './services/nonceStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4321',
  'http://localhost:3000',
  'https://key-pear.vercel.app',
  'https://key-pear-eta.vercel.app',
].filter(Boolean);

const allowedOriginPatterns = [
  /\.vercel\.app$/,
  /\.keypear\.pedroocalado\.eu$/,
];

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    for (const pattern of allowedOriginPatterns) {
      if (pattern.test(origin)) {
        return callback(null, true);
      }
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 100 * 1024 * 1024 },
  abortOnLimit: true,
}));
app.use(globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/files/chunks', chunksRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  next(err);
});

setInterval(async () => {
  try {
    const deleted = await ChunkUpload.deleteExpired();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired chunk uploads`);
    }
  } catch (err) {
    console.error('Chunk cleanup error:', err);
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
