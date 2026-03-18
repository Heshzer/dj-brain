import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'djbrain-secret-key-12345';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé : Veuillez vous connecter' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Add user info to request
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
};
