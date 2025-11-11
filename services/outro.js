// services/outro.js
// Post-process: append outro (simple concatenation to avoid filter issues)

const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");               // ← usa binario moderno
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
const path = require("path");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegStatic);                          // ← clave para habilitar xfade
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Probe helper
 */
function ffprobeAsync(file) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

/**
 * Get duration (seconds), width, height, fps from a video
 */
async function getVideoInfo(p) {
  const meta = await ffprobeAsync(p);
  const stream = (meta.streams || []).find((s) => s.codec_type === "video") || {};
  const r = (stream.r_frame_rate || "30/1").split("/");
  const fps = (Number(r[0]) || 30) / (Number(r[1]) || 1);
  const dur = Number(meta.format?.duration) || 0;
  const width = Number(stream.width) || 1080;
  const height = Number(stream.height) || 1920;
  return { duration: dur, width, height, fps };
}

/**
 * Append outro to main video with smooth crossfade transition.
 * Uses a simpler approach to avoid complex filter issues.
 *
 * @param {string} mainPath  - Input: your burned subtitles MP4 (output of burn step)
 * @param {string} outroPath - Outro clip (9:16), e.g. public/assets/outro.mp4
 * @param {string} outPath   - Final output path (with outro)
 * @param {object} opts      - Options { durationSec: crossfade duration (default 0.3s) }
 */
async function appendOutroCrossfade(mainPath, outroPath, outPath, opts = {}) {
  const crossfadeDuration = Math.max(0.1, Number(opts.durationSec) || 0.3);
  console.log('[outro] Starting crossfade transition...');
  console.log('[outro] Main path:', mainPath);
  console.log('[outro] Outro path:', outroPath);
  console.log('[outro] Output path:', outPath);
  console.log('[outro] Crossfade duration:', crossfadeDuration, 'seconds');

  // Check if files exist
  if (!fs.existsSync(mainPath)) {
    throw new Error(`Main video not found: ${mainPath}`);
  }
  if (!fs.existsSync(outroPath)) {
    throw new Error(`Outro video not found: ${outroPath}`);
  }

  // Get video info
  const mainInfo = await getVideoInfo(mainPath);
  const outroInfo = await getVideoInfo(outroPath);
  
  console.log('[outro] Main info:', mainInfo);
  console.log('[outro] Outro info:', outroInfo);

  if (!mainInfo.duration || mainInfo.duration <= 0.1) {
    throw new Error(`Main video too short: duration=${mainInfo.duration}s`);
  }

  // Ensure crossfade doesn't exceed main video duration
  const safeCrossfade = Math.min(crossfadeDuration, mainInfo.duration * 0.8);
  const offset = Math.max(0, mainInfo.duration - safeCrossfade);
  
  console.log('[outro] Safe crossfade duration:', safeCrossfade);
  console.log('[outro] Crossfade offset:', offset);

  const W = mainInfo.width;
  const H = mainInfo.height;

  // Ensure out dir exists
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  // Create crossfade with normalized framerate/timebase (both videos must have same fps for xfade)
  await new Promise((resolve, reject) => {
    const targetFPS = mainInfo.fps; // Use main video's fps as target
    
    ffmpeg()
      .input(mainPath)
      .input(outroPath)
      .outputOptions([
        '-filter_complex', 
        `[0:v]fps=${targetFPS},format=yuv420p[main_fps];[1:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${targetFPS},format=yuv420p[scaled_fps];[main_fps][scaled_fps]xfade=transition=fade:duration=${safeCrossfade}:offset=${offset}[video];[0:a][1:a]acrossfade=duration=${safeCrossfade}[audio]`,
        '-map', '[video]',
        '-map', '[audio]',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23', 
        '-pix_fmt', 'yuv420p',  // ← FUERZA pixel format compatible
        '-c:a', 'aac',
        '-movflags', '+faststart'
      ])
      .on('start', cmdLine => {
        console.log('[ffmpeg outro] CROSSFADE with FPS normalization started');
        console.log('[ffmpeg outro] Target FPS:', targetFPS);
        console.log('[ffmpeg outro] ffmpeg path:', ffmpegStatic);
        console.log('[ffmpeg outro] cmd:', cmdLine);
      })
      .on('stderr', line => console.log('[ffmpeg outro] stderr:', line))
      .on('error', (err, _stdout, stderr) => {
        console.error('[ffmpeg outro] error:', err?.message || err);
        if (stderr) console.error('[ffmpeg outro] stderr tail:\n', stderr);
        reject(err);
      })
      .on('end', () => {
        console.log('[ffmpeg outro] CROSSFADE completed successfully!');
        resolve();
      })
      .save(outPath);
  });
}

module.exports = { appendOutroCrossfade };
