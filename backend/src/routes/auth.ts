import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'djbrain-secret-key-12345';

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    // Pour simplifier l'installation, si la table est vide, le premier login crée le compte admin
    if (result.rows.length === 0) {
      const dbCheck = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(dbCheck.rows[0].count) === 0) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', [username, hashedPassword, 'admin']);
        
        // Authenticate immediately
        const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        return res.json({ message: 'Compte administrateur créé avec succès', user: { username, role: 'admin' } });
      }
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (passwordMatch) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
      // Set cookie configuration depending on domain and environment
      res.cookie('token', token, { 
        httpOnly: true, 
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });
      res.json({ message: 'Login success', user: { username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: 'Identifiants incorrects' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Check auth status route
router.get('/status', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ authenticated: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

export default router;
