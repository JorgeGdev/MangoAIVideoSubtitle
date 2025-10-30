// services/burner.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe'); // ⬅️ nuevo
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// Muy importante en Windows: indicar dónde está ffprobe
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Burn-in de subtítulos ASS y downscale a 1080p (manteniendo AR).
 * Salida con CRF 23, audio copy.
 */
async function burnWithASS(inputPath, assPath, outPath) {
  await ensureDir(path.dirname(outPath));

  // Borrar archivo de salida si existe
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  return new Promise((resolve, reject) => {
    const vf = [
      // Método compatible: redondear a números pares manualmente
      "scale='2*trunc((if(gt(iw,1920),1920,iw))/2)':'2*trunc((if(gt(ih,1080),1080,ih))/2)'",
      // Escapar correctamente para Windows
      `subtitles='${assPath.replace(/\\/g, '/').replace(/:/g, '\\:')}'`
    ].join(',');

    ffmpeg(inputPath)
      .videoFilters(vf)
      .outputOptions([
        '-c:v libx264',
        '-preset veryfast',
        '-crf 23',
        '-c:a copy'
      ])
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg error:', err.message);
        console.error('FFmpeg stderr:', stderr);
        reject(err);
      })
      .on('end', () => resolve(outPath))
      .save(outPath);
  });
}

/**
 * Devuelve dimensiones del INPUT y del OUTPUT “fitted” a la caja 1920x1080,
 * emulando el filtro: force_original_aspect_ratio=decrease
 */
async function getTargetDimensions(inputPath) {
  const meta = await ffprobeAsync(inputPath);
  const stream = (meta.streams || []).find(s => s.width && s.height) || {};
  const iw = Number(stream.width) || 1920;
  const ih = Number(stream.height) || 1080;

  const { width, height } = fitBox(iw, ih, 1920, 1080);
  return { input: { width: iw, height: ih }, output: { width, height } };
}

function fitBox(iw, ih, maxW, maxH) {
  let width, height;
  
  if (iw <= maxW && ih <= maxH) {
    width = iw;
    height = ih;
  } else {
    const scale = Math.min(maxW / iw, maxH / ih);
    width = Math.round(iw * scale);
    height = Math.round(ih * scale);
  }
  
  // Asegurar que las dimensiones sean pares (divisibles por 2)
  if (width % 2 !== 0) width = width - 1;
  if (height % 2 !== 0) height = height - 1;
  
  return { width, height };
}

function ffprobeAsync(file) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

module.exports = { burnWithASS, getTargetDimensions };
