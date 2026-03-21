import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import passport from 'passport';
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

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4321' }));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
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
