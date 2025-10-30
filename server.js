// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck simple
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Rutas de API (upload MP4 ≤ 10 MB)
const jobsRouter = require('./routes/jobs');
app.use('/api', jobsRouter);

// Fallback raíz
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejador de errores JSON (incluye errores de Multer)
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10 MB)' :
      err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Only MP4 is allowed' :
      err.message || 'Upload error';
    return res.status(400).json({ ok: false, error: msg, code: err.code });
  }
  if (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
  next();
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`[subtitles] listening on http://localhost:${PORT}`);
});
