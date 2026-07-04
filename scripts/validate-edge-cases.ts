#!/usr/bin/env tsx
/**
 * @file scripts/validate-edge-cases.ts
 * @description Validate docs/edge-cases/registry.json against its Zod schema.
 * Called in CI as: npx tsx scripts/validate-edge-cases.ts
 *
 * Exits 0 on success, 1 on failure with all errors printed to stderr.
 *
 * Per AGENTS.md §6 review checklist and Phase 6 §14/§8.8:
 * - Schema validation on CI
 * - One entry per unique feature scenario per category
 * - Must reference test file or "none" with justification
 */

import { z } from 'zod';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ------------------------------------------------------------------ */
/*  Schema definitions matching plan §14 / src/test-utils/types.ts     */
/* ------------------------------------------------------------------ */

const edgeCaseSeverity = z.enum(['critical', 'high', 'medium', 'low']);

const edgeCaseCategory = z.enum([
  'loading',
  'empty',
  'error',
  'offline',
  'empty_state',
  'invalid_input',
  'permission_denied',
  'timeout',
  'concurrent_edit',
  'overflow',
]);

const testCoverageStatus = z.enum(['unit', 'integration', 'e2e', 'none']);

const edgeCaseIdRegex = /^EC-\d{3,4}$/;

const edgeCaseEntrySchema = z.object({
  id: z.string().regex(edgeCaseIdRegex, {
    message: 'Edge case ID must match pattern EC-NNN (e.g., EC-001, EC-0123)',
  }),
  feature: z
    .string()
    .min(1, 'Feature name is required')
    .regex(/^[a-z][a-z0-9_-]*$/, {
      message:
        'Feature name must be lowercase, starting with a letter, using kebab-case or snake_case (e.g., "auth", "project-list")',
    }),
  scenario: z
    .string()
    .min(1, 'Scenario description is required')
    .max(200, 'Scenario description must be 200 characters or fewer'),
  category: edgeCaseCategory,
  severity: edgeCaseSeverity,
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or fewer'),
  expectedBehavior: z
    .string()
    .min(1, 'Expected behavior is required')
    .max(500, 'Expected behavior must be 500 characters or fewer'),
  testCoverage: testCoverageStatus,
  testFile: z
    .string()
    .min(1)
    .optional()
    .describe('Relative path to test file (required when testCoverage !== "none")'),
  relatedBug: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .describe('GitHub issue URL if known, or empty string'),
});

const edgeCaseRegistrySchema = z.object({
  schemaVersion: z.literal('1.0', {
    errorMap: () => ({ message: 'schemaVersion must be exactly "1.0"' }),
  }),
  lastUpdated: z
    .string()
    .datetime({ offset: true })
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'lastUpdated must be a valid ISO 8601 datetime string',
    }),
  entries: z.array(edgeCaseEntrySchema).min(1, 'Registry must contain at least one entry'),
});

export type EdgeCaseEntry = z.infer<typeof edgeCaseEntrySchema>;
export type EdgeCaseRegistry = z.infer<typeof edgeCaseRegistrySchema>;

/* ------------------------------------------------------------------ */
/*  Validation helpers                                                 */
/* ------------------------------------------------------------------ */

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate the registry JSON file against the Zod schema.
 */
function validateRegistry(filePath: string): ValidationResult {
  const errors: string[] = [];

  // 1. File existence
  if (!existsSync(filePath)) {
    return { valid: false, errors: [`File not found: ${filePath}`] };
  }

  // 2. Parse JSON
  let raw: unknown;
  try {
    const content = readFileSync(filePath, 'utf-8');
    raw = JSON.parse(content);
  } catch (err) {
    return {
      valid: false,
      errors: [
        `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }

  // 3. Validate against Zod schema
  const parsed = edgeCaseRegistrySchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      errors.push(`  [${path}] ${issue.message} (received: ${JSON.stringify(issue.received) ?? 'undefined'})`);
    }
    // Return early — further checks depend on valid structure
    return { valid: false, errors };
  }

  const registry = parsed.data;

  // 4. Uniqueness checks
  const idSet = new Set<string>();
  for (const entry of registry.entries) {
    if (idSet.has(entry.id)) {
      errors.push(`  Duplicate entry id: ${entry.id}`);
    }
    idSet.add(entry.id);
  }

  // 5. Cross-field consistency
  for (const entry of registry.entries) {
    // 5a. testFile required when coverage is not "none"
    if (entry.testCoverage !== 'none' && !entry.testFile) {
      errors.push(
        `  ${entry.id}: testFile is required when testCoverage is "${entry.testCoverage}"`,
      );
    }

    // 5b. testFile should not be present when coverage is "none"
    if (entry.testCoverage === 'none' && entry.testFile) {
      errors.push(
        `  ${entry.id}: testFile should be empty when testCoverage is "none" (got "${entry.testFile}")`,
      );
    }

    // 5c. Verify testFile exists (relative to project root)
    if (entry.testFile) {
      const projectRoot = resolve(dirname(filePath), '..', '..');
      const testPath = resolve(projectRoot, entry.testFile);
      if (!existsSync(testPath)) {
        errors.push(
          `  ${entry.id}: referenced testFile does not exist: ${entry.testFile}`,
        );
      }
    }

    // 5d. relatedBug should be a valid URL or empty
    if (entry.relatedBug && entry.relatedBug !== '') {
      try {
        new URL(entry.relatedBug);
      } catch {
        errors.push(
          `  ${entry.id}: relatedBug must be a valid URL or empty string (got "${entry.relatedBug}")`,
        );
      }
    }
  }

  // 6. Minimum coverage check — flag edges that need test coverage
  const untested = registry.entries.filter((e) => e.testCoverage === 'none');
  if (untested.length > 0) {
    const ids = untested.map((e) => e.id).join(', ');
    const message = `  Warning: ${untested.length} edge case(s) have no test coverage: ${ids}`;
    // Print as warning, not error — allowed per plan §8.8 as long as justified
    console.warn(`\x1b[33m${message}\x1b[0m`);
  }

  return { valid: errors.length === 0, errors };
}

/* ------------------------------------------------------------------ */
/*  Main                                                                */
/* ------------------------------------------------------------------ */

function main(): void {
  const registryPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'docs',
    'edge-cases',
    'registry.json',
  );

  const result = validateRegistry(registryPath);

  if (!result.valid) {
    console.error(`\n\x1b[31m❌ Edge case registry validation FAILED:\x1b[0m\n`);
    for (const err of result.errors) {
      console.error(err);
    }
    process.exit(1);
  }

  console.log(`\n\x1b[32m✅ Edge case registry validation passed.\x1b[0m`);
  process.exit(0);
}

main();
