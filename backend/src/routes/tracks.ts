import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool } from '../config/db';
import { getFtpClient } from '../config/ftp';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// On stocke temporairement le fichier avant envoi FTP
const uploadDir = path.join(__dirname, '../../../dj-library/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

// POST /api/tracks/upload
router.post('/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const ftpClient = await getFtpClient();
    const remoteDir = process.env.FTP_REMOTE_DIR || '/dj-library/tracks';
    await ftpClient.ensureDir(remoteDir);

    const client = await pool.connect();
    const results = [];

    try {
      await client.query('BEGIN');

      for (const file of files) {
        const id = uuidv4();
        const remoteFilePath = `${remoteDir}/${file.filename}`;
        
        // Compute file hash
        const fileBuffer = fs.readFileSync(file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Upload FTP
        await ftpClient.uploadFrom(file.path, remoteFilePath);
        
        // Insert track into database
        const result = await client.query(
          `INSERT INTO tracks (id, file_name, file_size_bytes, file_hash, server_path) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
           [id, file.originalname, file.size, fileHash, remoteFilePath]
        );
        
        // Create initial dj_metadata entry
        await client.query(
          `INSERT INTO dj_metadata (track_id, sync_status) VALUES ($1, 'PENDING')`,
          [id]
        );

        results.push(result.rows[0]);
        
        // Supprimer fichier temp local
        try { fs.unlinkSync(file.path); } catch(e) {}
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Files uploaded to FTP successfully', tracks: results });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
      ftpClient.close();
    }
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// GET /api/tracks/ftp-tree (DEBUG ROUTE)
// Explore the FTP tree to find where files were uploaded
router.get('/ftp-tree', async (req, res) => {
  try {
    const ftpClient = await getFtpClient();
    // List the FTP root
    const root = await ftpClient.list('/');
    // For each directory, list its contents too
    const tree: Record<string, any[]> = { '/': root };
    for (const item of root) {
      if (item.isDirectory) {
        try {
          const subFiles = await ftpClient.list(`/${item.name}`);
          tree[`/${item.name}`] = subFiles.map(f => ({ name: f.name, isDir: f.isDirectory, size: f.size }));
        } catch (e) {
          tree[`/${item.name}`] = ['(access denied)'];
        }
      }
    }
    ftpClient.close();
    res.json(tree);
  } catch (error) {
    console.error('FTP Tree Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/tracks/scan
// Scanne le serveur FTP de l'ami (là où FileZilla uploade) et ajoute les nouveaux sons à la bibliothèque
router.post('/scan', requireAuth, async (req, res) => {
  try {
    const ftpClient = await getFtpClient();
    const remoteDir = process.env.FTP_REMOTE_DIR || '/dj-library/tracks';
    
    // S'assurer que le dossier existe
    await ftpClient.ensureDir(remoteDir);
    
    // Lister tous les fichiers
    const fileList = await ftpClient.list(remoteDir);
    console.log(`[FTP Scan] Found ${fileList.length} items in ${remoteDir}:`, fileList.map(f => `${f.name} (isFile: ${f.isFile})`));
    const audioFiles = fileList.filter(f => f.isFile && f.name.match(/\.(mp3|wav|flac|aiff|aif)$/i));
    
    ftpClient.close();
    
    const client = await pool.connect();
    const addedTracks = [];
    
    try {
      await client.query('BEGIN');
      
      // Récupérer ce qu'on a déjà en base pour ne pas faire de doublons
      const existingRes = await client.query('SELECT server_path FROM tracks');
      const existingPaths = new Set(existingRes.rows.map(r => r.server_path));
      
      for (const file of audioFiles) {
        const remoteFilePath = `${remoteDir}/${file.name}`;
        
        // Si le fichier n'est pas déjà dans notre bibliothèque, on l'ajoute !
        if (!existingPaths.has(remoteFilePath)) {
          const id = uuidv4();
          
          // Note: Full file hash computation during FTP scan is expensive because it requires downloading the file. 
          // For now, we omit it during FTP scan, or we'd need to download it:
          // const tempPath = path.join(uploadDir, file.name);
          // await ftpClient.downloadTo(tempPath, remoteFilePath);
          // const fileBuffer = fs.readFileSync(tempPath);
          // const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
          // fs.unlinkSync(tempPath);
          // We will just leave file_hash as NULL for FTP scanned files and fallback to size.
          const fileHash = null;

          await client.query(
            `INSERT INTO tracks (id, file_name, file_size_bytes, file_hash, server_path) 
             VALUES ($1, $2, $3, $4, $5)`,
             [id, file.name, file.size, fileHash, remoteFilePath]
          );
          
          await client.query(
            `INSERT INTO dj_metadata (track_id, sync_status) VALUES ($1, 'PENDING')`,
            [id]
          );
          
          addedTracks.push(file.name);
        }
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Scan complete', addedCount: addedTracks.length, addedTracks });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: 'Failed to scan FTP server' });
  }
});

// GET /api/tracks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, dm.notes, dm.last_modified, dm.sync_status,
        COALESCE(
          json_agg(json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color, 'is_permanent', tg.is_permanent)) 
          FILTER (WHERE tg.id IS NOT NULL), '[]'
        ) as tags
      FROM tracks t
      LEFT JOIN dj_metadata dm ON t.id = dm.track_id
      LEFT JOIN track_tags tt ON t.id = tt.track_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      GROUP BY t.id, dm.notes, dm.last_modified, dm.sync_status
      ORDER BY t.upload_date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch Tracks Error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});


// GET /api/tracks/:id/stream
router.get('/:id/stream', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT server_path, file_size_bytes FROM tracks WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Track not found');
    }

    const { server_path, file_size_bytes } = result.rows[0];
    const fileSize = parseInt(file_size_bytes, 10);
    
    // Configurer le téléchargement à la volée depuis le serveur FTP
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'none' // Pas de range request supportée facilement en stream FTP simple
    };
    
    res.writeHead(200, head);
    
    const ftpClient = await getFtpClient();
    try {
      // Stream directly the remote file to the HTTP response
      await ftpClient.downloadTo(res, server_path);
    } catch (e) {
      console.error('FTP Stream error', e);
    } finally {
      ftpClient.close();
    }
    
  } catch (error) {
    console.error('Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
});

// PUT /api/tracks/:id/metadata
router.put('/:id/metadata', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { notes, tags } = req.body; // tags should be array of tag ids or names

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (notes !== undefined) {
        await client.query('UPDATE dj_metadata SET notes = $1, sync_status = $2 WHERE track_id = $3', 
          [notes, 'PENDING', id]);
      }

      // Handle tags association
      if (Array.isArray(tags)) {
        // Clear old tags
        await client.query('DELETE FROM track_tags WHERE track_id = $1', [id]);
        
        for (let tagName of tags) {
          if (!tagName || typeof tagName !== 'string') continue;
          tagName = tagName.trim().toLowerCase().replace(/\s+/g, '-');
          if (!tagName) continue;

          // Find or create tag
          let tagRes = await client.query('SELECT id FROM tags WHERE name = $1', [tagName]);
          let tagId;
          if (tagRes.rows.length === 0) {
            const newTag = await client.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [tagName]);
            tagId = newTag.rows[0].id;
          } else {
            tagId = tagRes.rows[0].id;
          }
          
          await client.query('INSERT INTO track_tags (track_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', 
            [id, tagId]);
        }
        
        // Touch dj_metadata to trigger last_modified update
        await client.query('UPDATE dj_metadata SET sync_status = $1 WHERE track_id = $2', ['PENDING', id]);
      }

      await client.query('COMMIT');
      res.json({ message: 'Metadata updated successfully' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Metadata Update Error:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

export default router;
