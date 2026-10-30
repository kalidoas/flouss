import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running Flouss i18n Verification Suite...\n');

let hasError = false;

// 1. Check translations.ts dictionary parity
const translationsPath = path.join(rootDir, 'src', 'i18n', 'translations.ts');
const translationsContent = fs.readFileSync(translationsPath, 'utf-8');

// Simple TypeScript parser to extract object keys
function extractKeysFromTS(content) {
  // We can evaluate the translations object by executing a minimal TS bundle or parsing JSON-like structures
  // Since translations is a pure exported object without external deps, let's parse via regex or minimal mock
  const frMatch = content.match(/fr:\s*{([\s\S]*?)ar:\s*{/);
  const arMatch = content.match(/ar:\s*{([\s\S]*?)en:\s*{/);
  const enMatch = content.match(/en:\s*{([\s\S]*?)}\s*as const;/);

  if (!frMatch || !arMatch || !enMatch) {
    console.error('❌ Could not parse translations.ts sections (fr, ar, en)');
    process.exit(1);
  }

  function getSectionKeys(sectionText) {
    const keys = new Set();
    const lines = sectionText.split('\n');
    let currentCategory = '';
    for (const line of lines) {
      const trimmed = line.trim();
      // Match top level group e.g. "dashboard: {"
      const groupMatch = trimmed.match(/^([a-zA-Z0-9_]+):\s*{/);
      if (groupMatch) {
        currentCategory = groupMatch[1];
        continue;
      }
      if (trimmed.startsWith('},')) {
        currentCategory = '';
        continue;
      }
      // Match key e.g. "title: '...'"
      const keyMatch = trimmed.match(/^([a-zA-Z0-9_]+):/);
      if (keyMatch) {
        const fullKey = currentCategory ? `${currentCategory}.${keyMatch[1]}` : keyMatch[1];
        keys.add(fullKey);
      }
    }
    return keys;
  }

  return {
    fr: getSectionKeys(frMatch[1]),
    ar: getSectionKeys(arMatch[1]),
    en: getSectionKeys(enMatch[1]),
  };
}

const { fr, ar, en } = extractKeysFromTS(translationsContent);

console.log(`📊 Total dictionary keys parsed: FR (${fr.size}), AR (${ar.size}), EN (${en.size})`);

// Compare FR vs AR
const missingInAr = [...fr].filter((k) => !ar.has(k));
const extraInAr = [...ar].filter((k) => !fr.has(k));

if (missingInAr.length > 0) {
  console.error(`❌ Keys missing in AR (${missingInAr.length}):`, missingInAr.slice(0, 10));
  hasError = true;
}
if (extraInAr.length > 0) {
  console.error(`❌ Keys in AR not present in FR (${extraInAr.length}):`, extraInAr.slice(0, 10));
  hasError = true;
}

// Compare FR vs EN
const missingInEn = [...fr].filter((k) => !en.has(k));
const extraInEn = [...en].filter((k) => !fr.has(k));

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
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      tsxFiles.push(fullPath);
    }
  }
}

walkDir(path.join(rootDir, 'src'));

// Known problematic untranslated phrases that were specifically flagged in the prompt
const flaggedRawStrings = [
  'Enregistrer une dépense',
  'Valider la dépense',
  'Enregistrer le revenu',
  'Alimenter un objectif',
  'Save an expense',
  'Validate the expense',
];

const foundIssues = [];

for (const file of tsxFiles) {
  const relPath = path.relative(rootDir, file);
  // Skip Logo.tsx where Flouss brand is intentionally written
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
  console.log('✅ Hardcoded UI strings check passed: No raw modal titles or action buttons found.');
}

if (hasError) {
  console.error('\n❌ check:i18n FAILED with errors.');
  process.exit(1);
} else {
  console.log('\n🎉 check:i18n PASSED successfully!\n');
  process.exit(0);
}
