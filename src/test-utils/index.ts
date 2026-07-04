/**
 * Test utilities barrel export.
 *
 * Convenience re-exports so test files can import from a single location:
 *
 * ```ts
 * import { renderWithProviders, screen, userEvent, testA11y, msw } from '@/test-utils';
 * ```
 *
 * @packageDocumentation
 */

// Re-export all RTL utilities so test files only need this import
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Re-export custom render (overrides RTL `render`)
export { renderWithProviders } from './render';

// Re-export a11y helpers
export { testA11y, announce } from './a11y';

// Re-export MSW helpers
export { msw, server, createDeferredResponse, createErrorResponse } from './msw';

// Re-export types
export type {
  A11yAssertion,
  A11yAuditResult,
  A11yHelpers,
  A11yStatus,
  A11yViolation,
  EdgeCaseCategory,
  EdgeCaseEntry,
  EdgeCaseRegistry,
  EdgeCaseSeverity,
  FocusTrapResult,
  MSWHelpers,
  RenderWithProvidersOptions,
  TestId,
  ScenarioId,
  EdgeCaseId,
  A11yRuleId,
} from './types';
