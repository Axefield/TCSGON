/**
 * Shared type definitions for test utilities.
 *
 * @packageDocumentation
 */

import type { QueryClientConfig } from '@tanstack/react-query';
import type { HttpHandler } from 'msw';
import type { setupServer } from 'msw/node';
// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export interface RenderWithProvidersOptions {
  /** Initial route entries for MemoryRouter (required when the component uses router hooks) */
  initialEntries?: string[];
  /** React Query client configuration */
  queryClientOptions?: {
    defaultOptions?: QueryClientConfig['defaultOptions'];
  };
  /** Additional wrapper component to compose (applied innermost) */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

// ---------------------------------------------------------------------------
// A11y helpers
// ---------------------------------------------------------------------------

export interface A11yHelpers {
  /** Run axe on a rendered container; throws on critical/serious violations */
  testA11y: (container: HTMLElement) => Promise<A11yAssertion>;
  /** Create or update an aria-live region */
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  /** Assert a focus trap traps focus correctly */
  testFocusTrap: (trapElement: HTMLElement) => Promise<FocusTrapResult>;
}

export interface A11yAssertion {
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
}

export interface A11yViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  nodes: number;
  help: string;
  helpUrl: string;
}

export interface FocusTrapResult {
  trapped: boolean;
  firstElement: Element | null;
  lastElement: Element | null;
  escapeHatch: Element | null;
}

// ---------------------------------------------------------------------------
// MSW helpers
// ---------------------------------------------------------------------------

export interface MSWHelpers {
  /** The shared MSW server instance */
  server: ReturnType<typeof setupServer>;
  /** Reset to default handlers */
  reset: () => void;
  /** Override handlers for a specific test */
  use: (...handlers: HttpHandler[]) => void;
}

// ---------------------------------------------------------------------------
// Edge case registry
// ---------------------------------------------------------------------------

export type EdgeCaseSeverity = 'critical' | 'high' | 'medium' | 'low';
export type EdgeCaseCategory =
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'empty_state'
  | 'invalid_input'
  | 'permission_denied'
  | 'timeout'
  | 'concurrent_edit'
  | 'overflow';

export interface EdgeCaseEntry {
  /** Unique identifier (branded EdgeCaseId) */
  id: string;
  /** Feature name (e.g. "settings", "auth") */
  feature: string;
  /** Human-readable scenario description */
  scenario: string;
  /** Edge case category */
  category: EdgeCaseCategory;
  /** Severity level */
  severity: EdgeCaseSeverity;
  /** Detailed description of the scenario */
  description: string;
  /** Expected system behaviour */
  expectedBehavior: string;
  /** Type of test coverage */
  testCoverage: 'unit' | 'integration' | 'e2e' | 'none';
  /** Relative path to the test file (optional) */
  testFile?: string;
  /** URL to related bug ticket (optional) */
  relatedBug?: string;
}

export interface EdgeCaseRegistry {
  schemaVersion: '1.0';
  lastUpdated: string; // ISO 8601
  entries: EdgeCaseEntry[];
}

// ---------------------------------------------------------------------------
// A11y audit result
// ---------------------------------------------------------------------------

export type A11yStatus = 'pass' | 'fail' | 'manual-review' | 'not-tested';

export interface A11yAuditResult {
  route: string;
  status: A11yStatus;
  auditDate: string;
  violations: A11yViolation[];
  tool: 'axe-core' | 'manual-nvda' | 'manual-voiceover' | 'keyboard-only' | 'color-contrast';
  notes?: string;
}

// ---------------------------------------------------------------------------
// Branded IDs (for type-safe identifiers in tests)
// ---------------------------------------------------------------------------

declare const TestIdBrand: unique symbol;
export type TestId = string & { [TestIdBrand]: never };

declare const ScenarioIdBrand: unique symbol;
export type ScenarioId = string & { [ScenarioIdBrand]: never };

declare const EdgeCaseIdBrand: unique symbol;
export type EdgeCaseId = string & { [EdgeCaseIdBrand]: never };

declare const A11yRuleIdBrand: unique symbol;
export type A11yRuleId = string & { [A11yRuleIdBrand]: never };
