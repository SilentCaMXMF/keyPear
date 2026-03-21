import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

import authRoutes from './routes/auth.js';
import filesRoutes from './routes/files.js';
import foldersRoutes from './routes/folders.js';
import sharesRoutes from './routes/shares.js';
import chunksRoutes from './routes/chunks.js';
import logsRoutes from './routes/logs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4321',
  'http://localhost:3000',
].filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(fileUpload({ 
  useTempFiles: true, 
  tempFileDir: '/tmp/',
  limits: { fileSize: 100 * 1024 * 1024 },
  abortOnLimit: true,
}));
app.use(passport.initialize());

app.use(globalLimiter);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

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

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/files/chunks', chunksRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
