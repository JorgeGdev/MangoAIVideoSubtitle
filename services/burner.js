// services/burner.js
// All comments in English as requested.

const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Ensure directory exists.
 */
async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

/**
 * Escape ASS path for FFmpeg subtitles filter.
 * - Replace backslashes with forward slashes.
 * - Escape colon to avoid drive letter issues and filter parsing issues.
 */
function escapeAssPath(p) {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:');
}

/**
 * Compute a safe scale expression to fit into 1920x1080 keeping AR,
 * rounding to even integers to satisfy H.264 requirements.
 */
function scaleExpr() {
  // If input is larger than 1920x1080, downscale. Else keep original size.
  // Force even sizes.
  return "scale='2*trunc((if(gt(iw,1920),1920,iw))/2)':'2*trunc((if(gt(ih,1080),1080,ih))/2)'";
}

/**
 * Burn subtitles from an ASS file into a video.
 * Output is H.264 CRF 23, audio copied.
 * Uses a safe default font (DejaVu Sans) and outline for readability.
 *
 * @param {string} inputPath - Path to input video
 * @param {string} assPath   - Path to .ass subtitle file
 * @param {string} outPath   - Path to output video
 * @returns {Promise<void>}
 */
async function burnWithASS(inputPath, assPath, outPath) {
  await ensureDir(path.dirname(outPath));

  // Remove previous output if any
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  // Force style to ensure visible text even in minimal containers
  const forceStyle = "FontName=DejaVu Sans,BorderStyle=3,Outline=2,Shadow=0,PrimaryColour=&H00FFFFFF&,OutlineColour=&H00000000&";

  // Build the vf chain: scale then subtitles with forced style
  const assEsc = escapeAssPath(assPath);
  const vf = [
    scaleExpr(),
    `subtitles='${assEsc}':force_style='${forceStyle}'`
  ].join(',');

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOptions('-y')
      .outputOptions(
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-c:a', 'copy',
        '-vf', vf
      )
      // Logs you asked about:
      .on('start', cmd => console.log('[ffmpeg] cmd:', cmd))
      .on('stderr', line => console.log('[ffmpeg] stderr:', line))
      .on('error', (err, stdout, stderr) => {
        console.error('[ffmpeg] error:', err?.message || err);
        if (stderr) console.error('[ffmpeg] stderr tail:\n', stderr);
        reject(err);
      })
      .on('end', () => {
        console.log('[ffmpeg] done burn:', outPath);
        resolve();
      })
      .save(outPath);
  });
}

/**
 * Optional helper to get target dimensions like a "fit into 1920x1080" preview.
 */
function ffprobeAsync(file) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

async function getTargetDimensions(inputPath) {
  const meta = await ffprobeAsync(inputPath);
  const stream = (meta.streams || []).find(s => s.width && s.height) || {};
  const iw = Number(stream.width) || 1920;
  const ih = Number(stream.height) || 1080;

  // Compute fitted size while preserving AR and forcing even dimensions
  let width, height;
  if (iw <= 1920 && ih <= 1080) {
    width = iw;
    height = ih;
  } else {
    const scale = Math.min(1920 / iw, 1080 / ih);
    width = Math.round(iw * scale);
    height = Math.round(ih * scale);
  }
  if (width % 2 !== 0) width -= 1;
  if (height % 2 !== 0) height -= 1;

  return { input: { width: iw, height: ih }, output: { width, height } };
}

module.exports = { burnWithASS, getTargetDimensions };
