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

app.use(cors({
  origin: true, // Allow all origins for local network testing
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
