// services/intro.js
// Pre-process: prepend intro (crossfade transition from intro to main)

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
 * Prepend intro to main video with smooth crossfade transition.
 * The crossfade happens at the END of the intro, transitioning INTO the main video.
 *
 * @param {string} introPath - Intro clip (9:16), e.g. public/assets/open.mp4
 * @param {string} mainPath  - Input: your main video (before burn step)
 * @param {string} outPath   - Output path (intro + main with crossfade)
 * @param {object} opts      - Options { durationSec: crossfade duration (default 0.3s) }
 */
async function prependIntroCrossfade(introPath, mainPath, outPath, opts = {}) {
  const crossfadeDuration = Math.max(0.1, Number(opts.durationSec) || 0.3);
  console.log('[intro] Starting crossfade transition...');
  console.log('[intro] Intro path:', introPath);
  console.log('[intro] Main path:', mainPath);
  console.log('[intro] Output path:', outPath);
  console.log('[intro] Crossfade duration:', crossfadeDuration, 'seconds');

  // Check if files exist
  if (!fs.existsSync(introPath)) {
    throw new Error(`Intro video not found: ${introPath}`);
  }
  if (!fs.existsSync(mainPath)) {
    throw new Error(`Main video not found: ${mainPath}`);
  }

  // Get video info
  const introInfo = await getVideoInfo(introPath);
  const mainInfo = await getVideoInfo(mainPath);
  
  console.log('[intro] Intro info:', introInfo);
  console.log('[intro] Main info:', mainInfo);

  if (!introInfo.duration || introInfo.duration <= 0.1) {
    throw new Error(`Intro video too short: duration=${introInfo.duration}s`);
  }

  // Ensure crossfade doesn't exceed intro duration
  const safeCrossfade = Math.min(crossfadeDuration, introInfo.duration * 0.8);
  const offset = Math.max(0, introInfo.duration - safeCrossfade);
  
  console.log('[intro] Safe crossfade duration:', safeCrossfade);
  console.log('[intro] Crossfade offset:', offset);

  const W = mainInfo.width;
  const H = mainInfo.height;

  // Ensure out dir exists
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  // Create crossfade with normalized framerate/timebase 
  // Intro (input 0) crossfades INTO main (input 1)
  await new Promise((resolve, reject) => {
    const targetFPS = mainInfo.fps; // Use main video's fps as target
    
    ffmpeg()
      .input(introPath)
      .input(mainPath)
      .outputOptions([
        '-filter_complex', 
        `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${targetFPS},format=yuv420p[intro_fps];[1:v]fps=${targetFPS},format=yuv420p[main_fps];[intro_fps][main_fps]xfade=transition=fade:duration=${safeCrossfade}:offset=${offset}[video];[0:a][1:a]acrossfade=duration=${safeCrossfade}[audio]`,
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
        console.log('[ffmpeg intro] CROSSFADE with FPS normalization started');
        console.log('[ffmpeg intro] Target FPS:', targetFPS);
        console.log('[ffmpeg intro] ffmpeg path:', ffmpegStatic);
        console.log('[ffmpeg intro] cmd:', cmdLine);
      })
      .on('stderr', line => console.log('[ffmpeg intro] stderr:', line))
      .on('error', (err, _stdout, stderr) => {
        console.error('[ffmpeg intro] error:', err?.message || err);
        if (stderr) console.error('[ffmpeg intro] stderr tail:\n', stderr);
        reject(err);
      })
      .on('end', () => {
        console.log('[ffmpeg intro] CROSSFADE completed successfully!');
        resolve();
      })
      .save(outPath);
  });
}

module.exports = { prependIntroCrossfade };