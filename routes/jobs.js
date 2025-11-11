// routes/jobs.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');

const { transcribeToWords } = require('../services/transcriber');
const { buildASS } = require('../services/ass-builder');
const { burnWithASS, getTargetDimensions } = require('../services/burner');
const { buildTextFile } = require('../services/text-exporter');

const router = express.Router();

const TMP_DIR = path.join(__dirname, '..', 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const store = new Map();

function makeRecordFromId(id) {
  const base = path.join(TMP_DIR, id);
  return {
    id,
    inputPath: `${base}.mp4`,
    base,
    assPath: `${base}.ass`,
    outPath: `${base}_subbed.mp4`,
    wordsPath: `${base}.words.json`,
    txtPath: `${base}.txt`,
    outputName: `${id}_subbed.mp4`
  };
}

function resolveRecord(idOrFilename) {
  if (store.has(idOrFilename)) return store.get(idOrFilename);
  const id = path.basename(idOrFilename, path.extname(idOrFilename));
  if (store.has(id)) return store.get(id);

  const files = fs.readdirSync(TMP_DIR);
  const hit = files.find((f) => f.startsWith(id) && f.toLowerCase().endsWith('.mp4'));
  if (hit) {
    const foundId = path.basename(hit, '.mp4');
    const rec = makeRecordFromId(foundId);
    rec.inputPath = path.join(TMP_DIR, hit);
    store.set(foundId, rec);
    return rec;
  }
  return null;
}

function formatTimestampName(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const H = pad(date.getHours());
  const M = pad(date.getMinutes());
  const S = pad(date.getSeconds());
  return `${y}-${m}-${d}_${H}-${M}-${S}.mp4`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, _file, cb) => {
    const rand = crypto.randomBytes(8).toString('hex');
    const id = `${Date.now()}_${rand}`;
    cb(null, `${id}.mp4`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'video/mp4' || file.originalname.toLowerCase().endsWith('.mp4');
    if (!ok) return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only MP4 is allowed'));
    cb(null, true);
  }
});

router.post('/subtitle', upload.single('file'), (req, res) => {
  const f = req.file;
  const id = path.basename(f.filename, '.mp4');

  const rec = makeRecordFromId(id);
  rec.inputPath = f.path;
  store.set(id, rec);

  return res.status(200).json({
    status: 'uploaded',
    id,
    filename: f.filename,
    sizeBytes: f.size,
    path: f.path.replace(/\\/g, '/')
  });
});

router.post('/subtitle/:id/process', async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const filename = req.body?.filename;
    const rec = resolveRecord(filename || idParam);
    if (!rec) return res.status(404).json({ ok: false, error: 'Upload id not found' });

    console.log('Processing:', rec.id);
    console.log('Input path:', rec.inputPath);

    // 1) Transcribir
    console.log('Step 1: Transcribing...');
    const words = await transcribeToWords(rec.inputPath);
    fs.writeFileSync(rec.wordsPath, JSON.stringify({ words }, null, 2), 'utf8');
    console.log('Transcription complete, words:', words.length);

    // 2) Dimensiones salida (encajada en 1920x1080)
    console.log('Step 2: Getting dimensions...');
    const dims = await getTargetDimensions(rec.inputPath);
    const W = dims.output.width  || 1920;
    const H = dims.output.height || 1080;
    console.log('Dimensions:', W, 'x', H);

    // Tamaño consistente: limita por alto y por ancho
    const baseH = H * 0.052;             // ~5.2% de la altura
    const baseW = W * 0.070;             // ~7.0% del ancho
    const fontSize = Math.max(30, Math.round(Math.min(baseH, baseW)));

    // Más arriba (~22% de la altura)
    const marginV = Math.round(H * 0.22);

    // 3) .ASS con color azul claro y NO-SOLAPE
    console.log('Step 3: Building ASS file...');
    const assText = buildASS(words, {
      font: 'Montserrat',
      fontSize,
      marginV,
      primary: '&H00FFFFFF&',
      secondary: '&H00FFCC66&',
      segment: {
        gapThresholdSec: 0.5,
        maxLineDurSec: 2.8,
        maxChars: 42
      },
      timing: {
        minWordSec: 0.06,
        leadSec: 0.00,
        tailSec: 0.12,
        warmupCs: 6,
        minInterGapSec: 0.06
      }
    });
    fs.writeFileSync(rec.assPath, assText, 'utf8');
    console.log('ASS file saved:', rec.assPath);

    // 4) Generar archivo de texto con los subtítulos
    console.log('Step 4: Building text file...');
    const txtContent = buildTextFile(words, {
      gapThresholdSec: 0.5,
      maxLineDurSec: 2.8,
      maxChars: 42
    });
    fs.writeFileSync(rec.txtPath, txtContent, 'utf8');
    console.log('Text file saved:', rec.txtPath);

    // 5) Renombrar salida por timestamp
    const stampedName = formatTimestampName(new Date());
    rec.outPath = path.join(TMP_DIR, stampedName);
    rec.outputName = stampedName;
    console.log('Output path:', rec.outPath);

    // 6) Burn-in
    console.log('Step 5: Burning subtitles with FFmpeg...');
    await burnWithASS(rec.inputPath, rec.assPath, rec.outPath);
    console.log('Burn-in complete!');

    return res.json({
      ok: true,
      id: rec.id,
      downloadUrl: `/api/subtitle/${rec.id}/download`,
      txtUrl: `/api/subtitle/${rec.id}/download/txt`
    });
  } catch (err) {
    console.error('Error in process:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message,
      details: err.stack
    });
  }
});

router.get('/subtitle/:id/download', (req, res) => {
  const id = req.params.id;
  const rec = resolveRecord(id);
  if (!rec || !fs.existsSync(rec.outPath)) {
    return res.status(404).json({ ok: false, error: 'Output not found' });
  }
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${rec.outputName}"`);
  fs.createReadStream(rec.outPath).pipe(res);
});

router.get('/subtitle/:id/download/txt', (req, res) => {
  const id = req.params.id;
  const rec = resolveRecord(id);
  if (!rec || !fs.existsSync(rec.txtPath)) {
    return res.status(404).json({ ok: false, error: 'Text file not found' });
  }
  const filename = `${rec.id}_subtitles.txt`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  fs.createReadStream(rec.txtPath).pipe(res);
});

module.exports = router;
