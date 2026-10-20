import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const params = [];
  let patientFilter = '';
  if (req.query.patient) {
    params.push(req.query.patient);
    patientFilter = 'AND u.id IN (SELECT user_id FROM user_patients WHERE patient_id = $1)';
  }
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.monthly_quota, u.points,
            (SELECT COUNT(*)::int FROM task_signups s
               JOIN tasks t ON t.id = s.task_id
              WHERE s.user_id = u.id
                AND date_trunc('month', t.starts_at) = date_trunc('month', now())) AS this_month_count,
            COALESCE(
              (SELECT json_agg(json_build_object('id', p.id, 'full_name', p.full_name) ORDER BY p.full_name)
                 FROM patients p JOIN user_patients up ON up.patient_id = p.id
                WHERE up.user_id = u.id), '[]') AS patients
       FROM users u
      WHERE u.role = 'volunteer' ${patientFilter}
      ORDER BY u.full_name`,
    params
  );
  res.json(result.rows);
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const quota = Number(req.body?.monthly_quota);
  if (!Number.isInteger(quota) || quota < 0 || quota > 20) {
    return res.status(400).json({ message: 'המכסה צריכה להיות בין 0 ל-20' });
  }
  const result = await pool.query(
    `UPDATE users SET monthly_quota = $1 WHERE id = $2
     RETURNING id, full_name, email, phone, role, monthly_quota, points`,
    [quota, req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'המתנדב לא נמצא' });
  }
  res.json(result.rows[0]);
});

export default router;