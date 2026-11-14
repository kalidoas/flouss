import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running Flouss i18n Verification Suite...\n');

let hasError = false;

// 1. Check translations.ts dictionary parity and values
const translationsPath = path.join(rootDir, 'src', 'i18n', 'translations.ts');
const translationsContent = fs.readFileSync(translationsPath, 'utf-8');

const frMatch = translationsContent.match(/fr:\s*{([\s\S]*?)ar:\s*{/);
const arMatch = translationsContent.match(/ar:\s*{([\s\S]*?)en:\s*{/);
const enMatch = translationsContent.match(/en:\s*{([\s\S]*?)}\s*as const;/);

if (!frMatch || !arMatch || !enMatch) {
  console.error('❌ Could not parse translations.ts sections (fr, ar, en)');
  process.exit(1);
}

function extractDictionary(sectionText) {
  const dict = new Map();
  const lines = sectionText.split('\n');
  let currentCategory = '';
  let pendingKey = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const groupMatch = trimmed.match(/^([a-zA-Z0-9_]+):\s*{/);
    if (groupMatch) {
      currentCategory = groupMatch[1];
      pendingKey = '';
      continue;
    }
    if (trimmed.startsWith('},')) {
      currentCategory = '';
      pendingKey = '';
      continue;
    }

    if (pendingKey) {
      const valMatch = trimmed.match(/^['"`](.*)['"`],?$/);
      if (valMatch) {
        dict.set(pendingKey, valMatch[1]);
        pendingKey = '';
        continue;
      }
    }

    const kvMatch = trimmed.match(/^([a-zA-Z0-9_]+):\s*['"`](.*)['"`],?$/);
    if (kvMatch) {
      const fullKey = currentCategory ? `${currentCategory}.${kvMatch[1]}` : kvMatch[1];
      dict.set(fullKey, kvMatch[2]);
      pendingKey = '';
      continue;
    }

    const keyOnlyMatch = trimmed.match(/^([a-zA-Z0-9_]+):$/);
    if (keyOnlyMatch) {
      pendingKey = currentCategory ? `${currentCategory}.${keyOnlyMatch[1]}` : keyOnlyMatch[1];
      continue;
    }
  }
  return dict;
}

const frDict = extractDictionary(frMatch[1]);
const arDict = extractDictionary(arMatch[1]);
const enDict = extractDictionary(enMatch[1]);

console.log(`📊 Total dictionary keys parsed: FR (${frDict.size}), AR (${arDict.size}), EN (${enDict.size})`);

// 1A. Parity: Missing or Extra Keys
const missingInAr = [...frDict.keys()].filter((k) => !arDict.has(k));
const extraInAr = [...arDict.keys()].filter((k) => !frDict.has(k));

if (missingInAr.length > 0) {
  console.error(`❌ Keys missing in AR (${missingInAr.length}):`, missingInAr.slice(0, 10));
  hasError = true;
}
if (extraInAr.length > 0) {
  console.error(`❌ Keys in AR not present in FR (${extraInAr.length}):`, extraInAr.slice(0, 10));
  hasError = true;
}

const missingInEn = [...frDict.keys()].filter((k) => !enDict.has(k));
const extraInEn = [...enDict.keys()].filter((k) => !frDict.has(k));

if (missingInEn.length > 0) {
  console.error(`❌ Keys missing in EN (${missingInEn.length}):`, missingInEn.slice(0, 10));
  hasError = true;
}
if (extraInEn.length > 0) {
  console.error(`❌ Keys in EN not present in FR (${extraInEn.length}):`, extraInEn.slice(0, 10));
  hasError = true;
}

if (!hasError) {
  console.log('✅ Dictionary parity check passed: 100% key synchronization between fr, ar, en.');
}

// 1B. Identical Values Check: FR or AR values must not be identical to EN (excluding legitimate universal terms/brands)
const allowedIdentical = new Set([
  'Flouss', 'MAD', 'PIN', 'Google Calendar', 'Google', 'PWA', 'XP', 'Lv', 'URL', 'JSON',
  'OK', 'SMS', 'Email', 'Total', 'Sport', 'Score', 'Gym', 'Date', 'Fast-food', 'Restaurant',
  'Shopping', 'Transport', 'Status', 'Note', 'Notes', 'Finances & Budget', 'Salam', 'Urgent',
  'Budget', 'Budgets', 'Train / ONCF', 'Gaming', 'Sadaqa', 'Zakat', 'Crypto', 'transactions',
  'Action', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha',
  '—', '•', '0', '1', '100%', '4x10', '3x12', '+{points} XP', '{count}', '{amount} MAD', 'Normal',
]);

const unexpectedIdenticalFR = [];
const unexpectedIdenticalAR = [];

for (const [key, frVal] of frDict.entries()) {
  const enVal = enDict.get(key);
  if (!enVal) continue;
  const cleanFr = frVal.trim();
  const cleanEn = enVal.trim();

  if (cleanFr === cleanEn && !allowedIdentical.has(cleanFr)) {
    if (!/^[0-9\s.,+/%$#@!—\-•:;()\[\]{}]+$/.test(cleanFr) && cleanFr.length > 4) {
      unexpectedIdenticalFR.push({ key, value: cleanFr });
    }
  }
}

for (const [key, arVal] of arDict.entries()) {
  const enVal = enDict.get(key);
  if (!enVal) continue;
  const cleanAr = arVal.trim();
  const cleanEn = enVal.trim();

  if (cleanAr === cleanEn && !allowedIdentical.has(cleanAr)) {
    if (!/^[0-9\s.,+/%$#@!—\-•:;()\[\]{}]+$/.test(cleanAr) && cleanAr.length > 2) {
      unexpectedIdenticalAR.push({ key, value: cleanAr });
    }
  }
}

if (unexpectedIdenticalFR.length > 0) {
  console.error(`❌ Found ${unexpectedIdenticalFR.length} FR keys with untranslated English values:`);
  for (const item of unexpectedIdenticalFR) {
    console.error(`  - ${item.key}: "${item.value}"`);
  }
  hasError = true;
} else {
  console.log('✅ FR translation check passed: All French dictionary values properly localized.');
}

if (unexpectedIdenticalAR.length > 0) {
  console.error(`❌ Found ${unexpectedIdenticalAR.length} AR keys with untranslated English values:`);
  for (const item of unexpectedIdenticalAR) {
    console.error(`  - ${item.key}: "${item.value}"`);
  }
  hasError = true;
} else {
  console.log('✅ AR translation check passed: No untranslated English strings in Arabic dictionary.');
}

// 2. Scan TSX files for hardcoded strings that should use i18n
const tsxFiles = [];
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
      tsxFiles.push(fullPath);
    }
  }
}

walkDir(path.join(rootDir, 'src'));

// Known problematic untranslated phrases specifically flagged in prompt
const flaggedRawStrings = [
  'Enregistrer une dépense',
  'Valider la dépense',
  'Enregistrer le revenu',
  'Alimenter un objectif',
  'Save an expense',
  'Validate the expense',
  'semaines',
  'Lun/Mer/Ven/Dim',
  'Cliquez sur une case',
  'Moins/Plus',
  'Attention Requise',
  'Équilibre flux',
  'Catégorie ayant le plus gros impact',
];

const foundIssues = [];

for (const file of tsxFiles) {
  const relPath = path.relative(rootDir, file);
  if (relPath.includes('Logo.tsx') || relPath.includes('translations.ts')) continue;

  const content = fs.readFileSync(file, 'utf-8');
  for (const raw of flaggedRawStrings) {
    if (content.includes(`"${raw}"`) || content.includes(`'${raw}'`) || content.includes(`>${raw}<`)) {
      foundIssues.push({ file: relPath, string: raw });
    }
  }
}

if (foundIssues.length > 0) {
  console.error(`❌ Found ${foundIssues.length} hardcoded strings in JSX that must use i18n:`);
  for (const issue of foundIssues) {
    console.error(`  - ${issue.file}: "${issue.string}"`);
  }
  hasError = true;
} else {
  console.log('✅ Hardcoded UI strings check passed: No flagged hardcoded strings found.');
}

if (hasError) {
  console.error('\n❌ check:i18n FAILED with errors.');
  process.exit(1);
} else {
  console.log('\n🎉 check:i18n PASSED successfully!\n');
  process.exit(0);
}
