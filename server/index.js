import express from 'express';

const app = express();
const PORT = 3000;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'שלום מהשרת!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});