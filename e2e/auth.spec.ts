/**
 * E2E: Auth flows — login, signup, logout, password reset, settings.
 *
 * Covers:
 *  - Unauthenticated flows: login, signup, forgot/reset password
 *  - Authenticated flows: logout, settings page
 *  - Error states: invalid credentials, conflict, missing token
 *
 * @see docs/plans/phase-3-authentication.md
 */
import { test, expect } from '@playwright/test';

import { setupMockApi } from './utils/mockApi';

const VALID_PASSWORD = 'password123';

test.describe('Auth flows @smoke', () => {
  // ── Login ───────────────────────────────────────────────────────────

  test('renders login page', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /sign in/i, level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('logs in with valid credentials and redirects to dashboard', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('admin@tcsgon.dev');
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await setupMockApi(page, { authenticated: false, authError: 'invalid' });
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('admin@tcsgon.dev');
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Server returns 401 → API client normalises to 'Authentication required.'
    await expect(page.getByText(/authentication required/i)).toBeVisible({ timeout: 5_000 });
  });

  // ── Signup ──────────────────────────────────────────────────────────

  test('renders signup page', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/signup');

    await expect(page.getByRole('heading', { name: /create an account/i, level: 1 })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('signs up and redirects to dashboard', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/signup');

    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/^email$/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill(VALID_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeVisible();
  });

  test('shows validation error for short password on signup', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/signup');

    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/^email$/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('short');

    // Tab to trigger blur (mode: onTouched) — client-side validation fires
    await page.getByLabel(/confirm password/i).focus();

    // Password validation error should appear
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('shows conflict error on duplicate email during signup', async ({ page }) => {
    await setupMockApi(page, { authenticated: false, authError: 'conflict' });
    await page.goto('/signup');

    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/^email$/i).fill('taken@example.com');
    await page.getByLabel(/^password$/i).fill(VALID_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    // Server returns 409 — API client returns generic http error message
    await expect(page.getByText(/request failed with status 409/i)).toBeVisible({ timeout: 5_000 });
  });

  test('redirects authenticated users away from signup', async ({ page }) => {
    await setupMockApi(page); // authenticated: true (default)
    await page.goto('/signup');

    // Should redirect to dashboard immediately
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  // ── Forgot password ─────────────────────────────────────────────────

  test('renders forgot password page', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: /forgot password/i, level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('submits forgot password form and shows success', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/forgot-password');

    await page.getByLabel(/email/i).fill('admin@tcsgon.dev');
    await page.getByRole('button', { name: /send reset link/i }).click();

    // Success message
    await expect(page.getByRole('status')).toContainText(/check your email/i, { timeout: 5_000 });
  });

  // ── Reset password ──────────────────────────────────────────────────

  test('renders reset password page with valid token', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/reset-password?token=valid-reset-token');

    await expect(page.getByRole('heading', { name: /reset password/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New password', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible();
  });

  test('shows error when reset token is missing', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/reset-password');

    // Heading should reflect invalid link state
    await expect(page.getByRole('heading', { name: /invalid reset link/i, level: 1 })).toBeVisible();
  });

  test('completes password reset flow', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/reset-password?token=valid-reset-token');

    await page.getByRole('textbox', { name: 'New password', exact: true }).fill(VALID_PASSWORD);
    await page.getByLabel(/confirm new password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /reset password/i }).click();

    // Redirects to dashboard after reset (auto-login)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeVisible();
  });

  // ── Logout ──────────────────────────────────────────────────────────

  test('logs out and redirects to login', async ({ page }) => {
    await setupMockApi(page); // authenticated: true (default)
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeVisible();

    // Open profile menu — avatar shows "E" for "E2E User"
    await page.getByRole('button', { name: /E E2E User/i }).click();
    await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible();

    // Click Sign out
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /sign in/i, level: 1 })).toBeVisible();
  });

  // ── Settings (authenticated) ────────────────────────────────────────

  test('loads settings page when authenticated', async ({ page }) => {
    await setupMockApi(page); // authenticated: true (default)
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /settings/i, level: 1 })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toHaveValue('E2E User');
    await expect(page.getByLabel(/^email$/i)).toHaveValue('e2e@test.com');
  });

  // ── Session expiry ──────────────────────────────────────────────────

  test('redirects to login on session expiry', async ({ page }) => {
    // Seed a session but make the session-check endpoint return 401
    await setupMockApi(page, { authError: 'expired' });
    await page.goto('/dashboard');

    // The session check should fail and redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /sign in/i, level: 1 })).toBeVisible();
  });

  // ── Login redirect ──────────────────────────────────────────────────

  test('preserves redirect param after login', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/login?next=/projects');

    await page.getByLabel(/email/i).fill('admin@tcsgon.dev');
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to /projects (the ?next= target), not /dashboard
    await expect(page).toHaveURL(/\/projects/, { timeout: 10_000 });
  });

  // ── Edge cases (Phase 3c.4) ──────────────────────────────────────────

  test('shows offline error on network failure during login', async ({ page }) => {
    await setupMockApi(page, { authenticated: false, authNetworkError: true });
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('admin@tcsgon.dev');
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // The form's catch block displays the ApiError's message from rejected fetch.
    // The exact message may vary by browser ("Failed to fetch" / "Load failed") —
    // the critical assertion is that the error alert appears and contains text.
    // The error summary has tabindex="-1" to distinguish from the toast container.
    await expect(page.locator('[role="alert"][tabindex="-1"]')).toBeVisible({ timeout: 10_000 });
  });

  test('shows validation error for name exceeding max length on signup', async ({ page }) => {
    await setupMockApi(page, { authenticated: false });
    await page.goto('/signup');

    // Enter name exceeding Zod max(120) limit
    await page.getByLabel(/name/i).fill('A'.repeat(121));

    // Tab to email field → blur triggers client-side validation (mode: onTouched)
    await page.getByLabel(/^email$/i).focus();

    // Zod default message for .max(120) — "String must contain at most 120 character(s)"
    await expect(page.getByText(/120 character/i)).toBeVisible();
  });

  test('handles network error on forgot password gracefully', async ({ page }) => {
    await setupMockApi(page, { authenticated: false, authNetworkError: true });
    await page.goto('/forgot-password');

    await page.getByLabel(/email/i).fill('admin@tcsgon.dev');
    await page.getByRole('button', { name: /send reset link/i }).click();

    // Mutation error is caught — show error summary alert (with tabindex="-1")
    await expect(page.locator('[role="alert"][tabindex="-1"]')).toBeVisible({ timeout: 10_000 });
  });
});
