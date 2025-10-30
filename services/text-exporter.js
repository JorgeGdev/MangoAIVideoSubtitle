// services/text-exporter.js

/**
 * Exporta los subtítulos a formato de texto plano (.txt)
 * a partir del arreglo de words: [{ text, start, end }]
 */

/**
 * Genera un archivo de texto plano con los subtítulos
 * Formato: [MM:SS] Texto de la línea
 */
function buildTextFile(words, opts = {}) {
  const {
    gapThresholdSec = 0.5,
    maxLineDurSec = 2.8,
    maxChars = 42
  } = opts;

  if (!Array.isArray(words) || words.length === 0) {
    return '# No hay subtítulos disponibles\n';
  }

  const safe = words
    .map(w => ({
      text: String(w.text || '').trim(),
      start: Number.isFinite(w.start) ? w.start : 0,
      end: Number.isFinite(w.end) ? w.end : 0
    }))
    .filter(w => w.text && (w.end > w.start || (w.end === w.start && w.end > 0)));

  if (safe.length === 0) {
    return '# No hay subtítulos disponibles\n';
  }

  // Segmentar en líneas (misma lógica que ass-builder)
  const lines = segmentWords(safe, { gapThresholdSec, maxLineDurSec, maxChars });

  // Construir texto plano
  let output = '';
  for (const line of lines) {
    if (line.words.length === 0) continue;
    const timestamp = formatTimestamp(line.start);
    const text = line.words.map(w => w.text).join(' ');
    output += `[${timestamp}] ${text}\n`;
  }

  return output;
}

// --- Funciones auxiliares ---

function segmentWords(words, opts) {
  const { gapThresholdSec, maxLineDurSec, maxChars } = opts;
  const lines = [];
  let current = initLine(words[0]);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (i === 0) {
      addWord(current, w);
      continue;
    }

    const prev = words[i - 1];
    const gap = w.start - prev.end;
    const nextDur = (Math.max(w.end, current.end) - current.start);
    const nextChars = current.textLength + 1 + w.text.length;

    const shouldBreak =
      gap > gapThresholdSec ||
      nextDur > maxLineDurSec ||
      nextChars > maxChars;

    if (shouldBreak) {
      finalizeLine(lines, current);
      current = initLine(w);
    } else {
      addWord(current, w);
    }
  }
  finalizeLine(lines, current);

  return lines;
}

function initLine(firstWord) {
  return {
    words: [],
    start: firstWord.start,
    end: firstWord.end,
    textLength: 0
  };
}

function addWord(line, w) {
  line.words.push(w);
  line.end = Math.max(line.end, w.end);
  line.textLength += (line.words.length > 1 ? 1 : 0) + w.text.length;
}

function finalizeLine(lines, line) {
  if (line && line.words.length) lines.push(line);
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

module.exports = {
  buildTextFile
};
