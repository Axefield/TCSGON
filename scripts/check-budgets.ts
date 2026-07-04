#!/usr/bin/env tsx
/**
 * @file scripts/check-budgets.ts
 * @description Bundle budget checker for CI. Reads Vite build output and
 *   verifies per-route chunk sizes against budgets defined in AGENTS.md.
 *
 * Called in CI as: npx tsx scripts/check-budgets.ts
 *
 * Exits 0 if all budgets met, 1 on budget violation.
 *
 * Per AGENTS.md §3 (Performance) and Phase 6 §8.9:
 *   JS: 200 kB warn / 350 kB error (gzip)
 *   CSS: 30 kB warn / 60 kB error (gzip)
 *   Zero test/a11y deps in production bundle
 */

import { readFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

/* ------------------------------------------------------------------ */
/*  Budget configuration                                                */
/* ------------------------------------------------------------------ */

interface Budget {
  warnKb: number;
  errorKb: number;
}

const BUDGETS: Record<string, Budget> = {
  js: { warnKb: 200, errorKb: 350 },
  css: { warnKb: 30, errorKb: 60 },
};

const PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
);

const DIST_DIR = resolve(PROJECT_ROOT, 'dist');
const ASSETS_DIR = resolve(DIST_DIR, 'assets');

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Get gzipped size of a file in bytes.
 */
async function getGzipSize(filePath: string): Promise<number> {
  if (!existsSync(filePath)) return 0;

  const tmpFile = resolve(tmpdir(), `check-budgets-${randomUUID()}.gz`);
  try {
    await pipeline(
      createReadStream(filePath),
      createGzip(),
      createWriteStream(tmpFile),
    );
    return statSync(tmpFile).size;
  } finally {
    try {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    } catch {
      // Silently ignore cleanup errors
    }
  }
}

/**
 * Patterns that indicate test or a11y dependencies in bundled code.
 */
const LEAK_PATTERNS: RegExp[] = [
  /@testing-library\//,
  /jest-axe/,
  /axe-core/,
  /msw\//,
  /vitest\//,
  /playwright\//,
  /test-utils/,
  /\.test\.(js|mjs)/,
  /\.spec\.(js|mjs)/,
  /__tests__\//,
  /test-setup/,
];

/**
 * Check a single JS/CSS file for leaked test dependencies.
 */
function hasLeakedTestDep(content: string): boolean {
  return LEAK_PATTERNS.some((pattern) => pattern.test(content));
}

/* ------------------------------------------------------------------ */
/*  Asset scanning                                                      */
/* ------------------------------------------------------------------ */

interface AssetInfo {
  fileName: string;
  type: 'js' | 'css';
  fullPath: string;
  rawBytes: number;
  gzipBytes: number;
  hasLeak: boolean;
}

async function scanAssets(): Promise<AssetInfo[]> {
  if (!existsSync(ASSETS_DIR)) {
    throw new Error(
      `Assets directory not found at ${ASSETS_DIR}. Build the project first.`,
    );
  }

  const entries = readdirSync(ASSETS_DIR);
  const results: AssetInfo[] = [];

  for (const entry of entries) {
    const fullPath = resolve(ASSETS_DIR, entry);
    if (!statSync(fullPath).isFile()) continue;

    // Skip source maps
    if (entry.endsWith('.map')) continue;

    const ext = extname(entry).toLowerCase();
    let type: 'js' | 'css' | null = null;

    if (ext === '.js' || ext === '.mjs') {
      type = 'js';
    } else if (ext === '.css') {
      type = 'css';
    } else {
      continue;
    }

    const rawBytes = statSync(fullPath).size;
    const gzipBytes = await getGzipSize(fullPath);

    // Check for leaked test deps in JS files only
    let hasLeak = false;
    if (type === 'js') {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        hasLeak = hasLeakedTestDep(content);
      } catch {
        // Binary JS files can't be read as UTF-8 — skip leak check
      }
    }

    results.push({ fileName: entry, type, fullPath, rawBytes, gzipBytes, hasLeak });
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Budget checking                                                     */
/* ------------------------------------------------------------------ */

interface BudgetResult {
  pass: boolean;
  messages: string[];
}

async function checkBudgets(): Promise<BudgetResult> {
  const messages: string[] = [];
  let pass = true;

  const assets = await scanAssets();

  if (assets.length === 0) {
    return {
      pass: false,
      messages: ['No asset files found in dist/assets/. Build the project first.'],
    };
  }

  // Group by type for summary
  const byType: Record<string, AssetInfo[]> = { js: [], css: [] };
  for (const asset of assets) {
    byType[asset.type]?.push(asset);
  }

  for (const [type, typeAssets] of Object.entries(byType)) {
    if (typeAssets.length === 0) continue;

    const budget = BUDGETS[type]!;
    messages.push(`  ${type.toUpperCase()} files (${typeAssets.length} total):`);

    for (const asset of typeAssets) {
      const gzipKb = Math.round(asset.gzipBytes / 10.24) / 100;

      if (asset.gzipBytes > budget.errorKb * 1024) {
        messages.push(
          `    ❌ ERROR: ${asset.fileName} = ${gzipKb} kB gzip — exceeds error budget of ${budget.errorKb} kB`,
        );
        pass = false;
      } else if (asset.gzipBytes > budget.warnKb * 1024) {
        messages.push(
          `    ⚠️  WARN: ${asset.fileName} = ${gzipKb} kB gzip — exceeds warn budget of ${budget.warnKb} kB`,
        );
      } else {
        messages.push(
          `    ✅ ${asset.fileName} = ${gzipKb} kB gzip`,
        );
      }

      // Check for leaked test dependencies
      if (asset.hasLeak) {
        messages.push(
          `       ❌ ERROR: ${asset.fileName} contains test/a11y dependencies in production bundle!`,
        );
        pass = false;
      }
    }
  }

  return { pass, messages };
}

/* ------------------------------------------------------------------ */
/*  Main                                                                */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  console.log('\n📦 Bundle Budget Check\n');

  if (!existsSync(DIST_DIR)) {
    console.error(
      `\x1b[31m❌ dist/ directory not found. Run 'pnpm build' first.\x1b[0m`,
    );
    process.exit(1);
  }

  console.log('  Budgets (gzip):');
  console.log(`    JS:  ${BUDGETS.js.warnKb} kB warn / ${BUDGETS.js.errorKb} kB error`);
  console.log(`    CSS: ${BUDGETS.css.warnKb} kB warn / ${BUDGETS.css.errorKb} kB error`);
  console.log(`    Test deps: zero tolerance in production bundle\n`);

  const result = await checkBudgets();

  console.log('  Results:\n');
  for (const msg of result.messages) {
    console.log(msg);
  }

  if (result.pass) {
    console.log(`\x1b[32m✅ All budgets met.\x1b[0m\n`);
    process.exit(0);
  }

  console.log(`\n\x1b[31m❌ Budget violations found.\x1b[0m\n`);
  process.exit(1);
}

main().catch((err) => {
  console.error(
    `\n\x1b[31m❌ Script error: ${err instanceof Error ? err.message : String(err)}\x1b[0m`,
  );
  process.exit(1);
});
