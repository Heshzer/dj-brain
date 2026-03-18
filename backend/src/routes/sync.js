"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../config/db");
const router = express_1.default.Router();
// GET /api/sync/changes?since=timestamp
router.get('/changes', async (req, res) => {
    const { since } = req.query;
    try {
        let query = `
      SELECT t.id, t.file_name, t.file_hash, t.file_size_bytes, 
             dm.notes, dm.last_modified, dm.sync_status,
             COALESCE(
               array_agg(tg.name) FILTER (WHERE tg.name IS NOT NULL), '{}'
             ) as tags_array
      FROM tracks t
      JOIN dj_metadata dm ON t.id = dm.track_id
      LEFT JOIN track_tags tt ON t.id = tt.track_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
    `;
        const queryParams = [];
        // Si un timestamp est fourni, on ne renvoie que les tracks modifiées depuis
        if (since && typeof since === 'string') {
            const sinceDate = new Date(parseInt(since) || since);
            if (!isNaN(sinceDate.getTime())) {
                query += ` WHERE dm.last_modified > $1 `;
                queryParams.push(sinceDate);
            }
        }
        else {
            query += ` WHERE dm.sync_status = 'PENDING' `;
        }
        query += ` GROUP BY t.id, dm.notes, dm.last_modified, dm.sync_status`;
        const result = await db_1.pool.query(query, queryParams);
        // Formatage spécial du "djtags string" pour l'Agent Desktop (pour Rekordbox)
        const formattedResult = result.rows.map(row => ({
            ...row,
            rekordbox_comment: row.tags_array.length > 0 ? `#djtags: ${row.tags_array.join(';')}` : ''
        }));
        res.json(formattedResult);
    }
    catch (error) {
        console.error('Sync Changes Error:', error);
        res.status(500).json({ error: 'Failed to fetch sync changes' });
    }
});
// POST /api/sync/ack
// L'agent desktop appelle cette route pour dire "J'ai bien synchro ces tracks"
router.post('/ack', async (req, res) => {
    const { trackIds } = req.body;
    if (!Array.isArray(trackIds) || trackIds.length === 0) {
        return res.status(400).json({ error: 'No track IDs provided' });
    }
    try {
        await db_1.pool.query(`UPDATE dj_metadata SET sync_status = 'SYNCED' WHERE track_id = ANY($1)`, [trackIds]);
        res.json({ message: 'Sync status updated' });
    }
    catch (error) {
        console.error('Sync Ack Error:', error);
        res.status(500).json({ error: 'Failed to acknowledge sync' });
    }
});
exports.default = router;
//# sourceMappingURL=sync.js.map