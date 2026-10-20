import { Router } from 'express';
import crypto from 'node:crypto';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (req.user.role === 'admin') {
    const result = await pool.query('SELECT * FROM patients ORDER BY full_name');
    return res.json(result.rows);
  }
  const result = await pool.query(
    `SELECT p.id, p.full_name, p.address, p.contact_phone, p.notes
       FROM patients p
       JOIN user_patients up ON up.patient_id = p.id
      WHERE up.user_id = $1
      ORDER BY p.full_name`,
    [req.user.id]
  );
  res.json(result.rows);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { full_name, address, contact_phone, notes } = req.body ?? {};
  if (!full_name || !address || !contact_phone) {
    return res.status(400).json({ message: 'חסרים פרטים בטופס' });
  }
  const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  const result = await pool.query(
    `INSERT INTO patients (full_name, address, contact_phone, notes, join_code)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [full_name, address, contact_phone, notes || null, joinCode]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { full_name, address, contact_phone, notes } = req.body ?? {};
  const result = await pool.query(
    `UPDATE patients
        SET full_name = $1, address = $2, contact_phone = $3, notes = $4
      WHERE id = $5 RETURNING *`,
    [full_name, address, contact_phone, notes || null, req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'המטופל לא נמצא' });
  }
  res.json(result.rows[0]);
});

export default router;