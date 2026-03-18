import express from 'express';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// GET /api/tags - Get all tags (both permanent and ad-hoc)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, color, is_permanent FROM tags ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch Tags Error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// POST /api/tags - Create a new permanent tag
router.post('/', requireAuth, async (req, res) => {
  const { name, color } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Tag name is required' });
  }

  const tagName = name.trim().toLowerCase().replace(/\s+/g, '-');
  const tagColor = color || '#444444';

  try {
    const newTag = await pool.query(
      'INSERT INTO tags (name, color, is_permanent) VALUES ($1, $2, TRUE) RETURNING *',
      [tagName, tagColor]
    );
    res.status(201).json(newTag.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Tag already exists' });
    }
    console.error('Create Tag Error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT /api/tags/:id - Update a permanent tag
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  try {
    // Basic update logic, we only allow updating color for now to preserve relationships, or name if preferred.
    // If name is changed, we'll format it.
    let updateQuery = 'UPDATE tags SET ';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (name) {
      updateQuery += `name = $${paramIndex}, `;
      queryParams.push(name.trim().toLowerCase().replace(/\s+/g, '-'));
      paramIndex++;
    }

    if (color) {
      updateQuery += `color = $${paramIndex}, `;
      queryParams.push(color);
      paramIndex++;
    }

    if (queryParams.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateQuery = updateQuery.slice(0, -2) + ` WHERE id = $${paramIndex} RETURNING *`;
    queryParams.push(id);

    const updatedTag = await pool.query(updateQuery, queryParams);

    if (updatedTag.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(updatedTag.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
        return res.status(409).json({ error: 'Tag name already used' });
    }
    console.error('Update Tag Error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
     const deleteResult = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);
     if (deleteResult.rows.length === 0) {
         return res.status(404).json({ error: 'Tag not found' });
     }
     res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
      console.error('Delete Tag Error:', error);
      res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
