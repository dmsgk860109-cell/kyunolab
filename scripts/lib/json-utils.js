const fs = require('fs');

function parseJsonText(text, label = 'JSON') {
  const payload = String(text || '').replace(/^\uFEFF/, '');
  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new Error(`Unable to parse ${label}: ${error.message}`);
  }
}

function readJsonFile(filePath, label = filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (arguments.length > 2) return fallback;
    throw new Error(`Missing file: ${label}`);
  }

  const text = fs.readFileSync(filePath, 'utf8');
  return parseJsonText(text, label);
}

module.exports = {
  parseJsonText,
  readJsonFile
};
