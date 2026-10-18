import express from 'express';
import pool from './db.js';

const app = express();
const PORT = 3000;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'שלום מהשרת!' });
});

app.get('/api/patients', async (req, res) => {
  const result = await pool.query('SELECT * FROM patients');
  res.json(result.rows);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});