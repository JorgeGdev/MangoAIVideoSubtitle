// services/bgmix.js
// Add low-volume background music to a video (looped/truncated to match video)

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');                 // binario moderno para filtros
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegStatic);                            // habilita filtros modernos
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Mezcla música de fondo (mp3/whatever) sobre el audio del video.
 * - Loops del BGM (-stream_loop -1) para cubrir toda la duración del video
 * - Normaliza formatos (48kHz estéreo fltp) para evitar errores en amix
 * - Mantiene el video sin recomprimir (copy), re-codifica solo audio a AAC
 *
 * @param {string} mainPath  - MP4 de entrada (ya con subtítulos quemados)
 * @param {string} musicPath - MP3/OGG/etc. del BGM
 * @param {string} outPath   - MP4 de salida (video original + audio mezclado)
 * @param {object} opts      - { musicVol: number }  volumen lineal (0.0–1.0), default 0.12 (~ -18 dB)
 */
async function addBackgroundMusic(mainPath, musicPath, outPath, opts = {}) {
  const musicVol = Math.max(0, Math.min(1, opts.musicVol ?? 0.12)); // volumen bajito

  // Asegura carpeta salida y limpia si existe
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  // Filtro:
  //   [0:a]volume=musicVol, aformat(48k stereo)  -> [bgm]
  //   [1:a]aformat(48k stereo)                   -> [main]
  //   amix inputs=2 duration=shortest            -> [mix]
  //   Video: copiamos tal cual (c:v copy) para no recomprimir otra vez aquí
  const filterComplex = [
    `[0:a]volume=${musicVol},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[bgm]`,
    `[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[main]`,
    `[main][bgm]amix=inputs=2:duration=shortest:dropout_transition=0[mix]`
  ].join('; ');

  await new Promise((resolve, reject) => {
    ffmpeg()
      // loop infinito de la música (se truncará por duration=shortest)
      .input(musicPath)
      .inputOptions(['-stream_loop', '-1'])
      // video principal
      .input(mainPath)
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '1:v:0',         // toma el video del main (2º input)
        '-map', '[mix]',         // toma el audio mezclado
        '-c:v', 'copy',          // no recodifica video aquí
        '-c:a', 'aac',
        '-movflags', '+faststart'
      ])
      .on('start', cmd => console.log('[ffmpeg bgmix] cmd:', cmd))
      .on('stderr', line => console.log('[ffmpeg bgmix] stderr:', line))
      .on('error', (err, _stdout, stderr) => {
        console.error('[ffmpeg bgmix] error:', err?.message || err);
        if (stderr) console.error('[ffmpeg bgmix] stderr tail:\n', stderr);
        reject(err);
      })
      .on('end', resolve)
      .save(outPath);
  });
}

module.exports = { addBackgroundMusic };
