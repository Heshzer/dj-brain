import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import tracksRouter from './routes/tracks';
import syncRouter from './routes/sync';
import authRouter from './routes/auth';
import cookieParser from 'cookie-parser';

import tagsRouter from './routes/tags';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = [
  'https://dj-brain.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// S'assurer que le port d'upload existe
export const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../dj-library');

// Route Home
app.get('/', (req, res) => {
  res.send('DJ Brain API is running');
});

// Routes API
app.use('/api/auth', authRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/sync', syncRouter);
app.use('/api/tags', tagsRouter);

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Le serveur tourne sur http://localhost:${port}`);
  console.log(`[server]: Le volume backend de stockage audio est : ${uploadDir}`);
});
