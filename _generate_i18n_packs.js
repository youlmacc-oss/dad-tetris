const fs = require('fs');

const en = JSON.parse(fs.readFileSync('_i18n_en.json', 'utf8'));
const languages = {
  de: { dad: 'Papa', extras: ['📋 Protokoll kopieren', '💾 Als Datei speichern', '📋 Protokoll kopiert', '💾 Protokolldatei gespeichert'] },
  'pt-BR': { dad: 'Papai', extras: ['📋 Copiar log', '💾 Salvar arquivo', '📋 Log copiado', '💾 Arquivo de log salvo'] },
  vi: { dad: 'Bố', extras: ['📋 Sao chép nhật ký', '💾 Lưu tệp', '📋 Đã sao chép nhật ký', '💾 Đã lưu tệp nhật ký'] },
  id: { dad: 'Ayah', extras: ['📋 Salin log', '💾 Simpan file', '📋 Log disalin', '💾 File log disimpan'] },
};

const fixedValues = new Set([
  'SCORE', 'LEVEL', 'LINES', 'BEST', 'NEXT', 'HOLD', 'NEXT 1', 'NEXT 2',
  'ON', 'OFF', 'DAD TETRIS',
]);

const protectedPatterns = [
  /\[\[\[I18N_SPLIT_\d+\]\]\]/g,
  /\//g,
  /\{(?:speed|tier|score|n|name|combo|level|lines|date|state|time)\}/g,
  /\b(?:SCORE|LEVEL|LINES|BEST|NEXT|HOLD|ON|OFF|SPEED)\b/g,
  /\b(?:Dad's|Dad|DAD)\b/g,
  /\[✅ ALL GREEN\]/g,
  /\[PASS 7\/7\]/g,
  /#[a-z0-9-]+/gi,
  /\b(?:gemstone|glass|wire_glass|mecha|candy)\b/g,
  /\b(?:localStorage|IndexedDB|DadTetrisDB|media_files|block_skin_style|navigator\.vibrate|updateCheerMsg|ROWS|Web Audio API|GameEngine)\b/g,
];

function protect(text) {
  const saved = [];
  let value = text.replace(/DAD TETRIS/g, () => {
    const marker = `ZXQPH${saved.length}QXZ`;
    saved.push('DAD TETRIS');
    return marker;
  });
  for (const pattern of protectedPatterns) {
    value = value.replace(pattern, match => {
      const marker = `ZXQPH${saved.length}QXZ`;
      saved.push(match);
      return marker;
    });
  }
  return { value, saved };
}

function restore(text, saved, dad) {
  let value = text;
  saved.forEach((token, index) => {
    value = value.replaceAll(`ZXQPH${index}QXZ`, token);
  });
  // Ensure the requested family term is used consistently while retaining DAD TETRIS.
  value = value.replace(/\bDad's\b/g, `${dad}'s`);
  value = value.replace(/\b(?:Dad|DAD)\b/g, dad);
  value = value.replaceAll(`${dad} TETRIS`, 'DAD TETRIS');
  return value;
}

async function translate(text, target, dad) {
  if (fixedValues.has(text)) return text;
  const { value, saved } = protect(text);
  const apiTarget = target === 'pt-BR' ? 'pt' : target;
  const url = `https://lingva.ml/api/v1/en/${apiTarget}/${encodeURIComponent(value)}`;

  let error;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const translated = data.translation;
      return restore(translated, saved, dad);
    } catch (err) {
      error = err;
      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw new Error(`Translation failed (${target}): ${text}\n${error}`);
}

async function mapConcurrent(entries, concurrency, mapper) {
  const result = new Array(entries.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= entries.length) return;
      result[index] = await mapper(entries[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return result;
}

async function main() {
  const entries = Object.entries(en);
  let output = {};
  try {
    output = JSON.parse(fs.readFileSync('_i18n_new_packs.json', 'utf8'));
  } catch {}
  const requiredTokens = [
    '[✅ ALL GREEN]', '[PASS 7/7]', '#dad-cheer-banner',
    'gemstone', 'glass', 'wire_glass', 'mecha', 'candy', 'localStorage',
    'SCORE', 'LEVEL', 'LINES', 'BEST', 'NEXT', 'HOLD', 'ON', 'OFF', 'DAD TETRIS',
  ];
  const placeholders = text => [
    ...text.matchAll(/\{(?:speed|tier|score|n|name|combo|level|lines|date|state|time)\}/g),
  ].map(match => match[0]).sort().join('|');

  for (const [language, config] of Object.entries(languages)) {
    console.log(`Translating ${language}...`);
    const current = output[language] || {};
    const needsTranslation = ([key, source]) => {
      if (language === 'id') return true;
      const value = current[key] || '';
      if (!value || placeholders(source) !== placeholders(value)) return true;
      return requiredTokens.some(token => source.includes(token) && !value.includes(token));
    };
    const pending = entries.filter(needsTranslation);
    const translated = await mapConcurrent(pending, 4, async ([key, value]) => [
      key,
      await translate(value, language, config.dad),
    ]);
    output[language] = { ...current, ...Object.fromEntries(translated) };
    output[language].speed = 'SPEED';
    [
      output[language].diagCopyLog,
      output[language].diagSaveFile,
      output[language].diagCopied,
      output[language].diagSaved,
    ] = config.extras;
  }
  fs.writeFileSync('_i18n_new_packs.json', `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
