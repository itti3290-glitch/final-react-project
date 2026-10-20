import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.post('/patients', requireAuth, async (req, res) => {
  const code = (req.body?.join_code || '').trim().toUpperCase();
  const patient = await pool.query('SELECT id FROM patients WHERE join_code = $1', [code]);
  if (patient.rows.length === 0) {
    return res.status(400).json({ message: 'קוד ההצטרפות לא נמצא' });
  }
  await pool.query(
    `INSERT INTO user_patients (user_id, patient_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [req.user.id, patient.rows[0].id]
  );
  const patients = await pool.query(
    `SELECT p.id, p.full_name FROM patients p
       JOIN user_patients up ON up.patient_id = p.id
      WHERE up.user_id = $1
      ORDER BY p.full_name`,
    [req.user.id]
  );
  res.json(patients.rows);
});

export default router;