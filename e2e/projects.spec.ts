/**
 * E2E: Projects CRUD journey.
 *
 * @see docs/plans/phase-2-data-and-features.md §9
 */
import { test, expect } from '@playwright/test';

test.describe('Projects @smoke @a11y', () => {
  test('loads project list with sort and pagination', async ({ page }) => {
    await page.goto('/projects');

    // Table should render with seed data
    await expect(page.getByRole('table', { name: /projects/i })).toBeVisible();

    // Sort by name
    await page.getByRole('button', { name: /sort by name/i }).click();
    await expect(page.getByRole('button', { name: /sort by name/i })).toBeVisible();

    // Pagination should exist if > 1 page of data
    await expect(page.getByRole('navigation', { name: /pagination/i })).toBeVisible();
  });

  test('navigates to project detail on row click', async ({ page }) => {
    await page.goto('/projects');

    // Wait for table rows
    const rows = page.getByRole('button', { name: /view projects list/i });
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    // Click first row
    const firstRow = page.locator('[role="button"]').first();
    await firstRow.click();

    // Should land on detail page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('creates a new project', async ({ page }) => {
    await page.goto('/projects');

    // Click create button
    await page.getByRole('button', { name: /create project/i }).click();

    // Fill form
    await page.getByLabel(/name/i).fill('E2E Test Project');
    await page.getByLabel(/lead name/i).fill('Tester');
    await page.getByLabel(/description/i).fill('Created by Playwright');

    // Submit
    await page.getByRole('button', { name: /submit/i }).click();

    // Should redirect to list and show the new project
    await expect(page.getByText('E2E Test Project')).toBeVisible({ timeout: 5000 });
  });

  test.describe.serial('full CRUD journey', () => {
    let projectName = `CRUD Project ${Date.now()}`;

    test('create → edit → delete', async ({ page }) => {
      // CREATE
      await page.goto('/projects');
      await page.getByRole('button', { name: /create project/i }).click();
      await page.getByLabel(/name/i).fill(projectName);
      await page.getByLabel(/lead name/i).fill('Tester');
      await page.getByRole('button', { name: /submit/i }).click();
      await expect(page.getByText(projectName)).toBeVisible({ timeout: 5000 });

      // EDIT
      await page.getByText(projectName).click();
      await page.getByRole('button', { name: /edit/i }).click();

      const updatedName = `${projectName} (Updated)`;
      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill(updatedName);
      await page.getByRole('button', { name: /submit/i }).click();
      await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });
      projectName = updatedName;

      // DELETE
      await page.getByRole('button', { name: /edit/i }).click();
      await page.getByRole('button', { name: /delete/i }).click();

      // Confirm dialog
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await page.getByRole('button', { name: /confirm/i }).click();

      // Should return to list, project no longer visible
      await expect(page.getByText(projectName)).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('shows empty state when no projects match filter', async ({ page }) => {
    await page.goto('/projects');

    // Apply a search that matches nothing
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzzznonexistent');
      await expect(page.getByRole('status')).toContainText(/no projects/i);
    }
  });

  test('shows error display on server failure', async ({ page }) => {
    await page.route('**/api/projects*', async (route) => {
      await route.fulfill({ status: 500, body: 'Server Error' });
    });

    await page.goto('/projects');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });
});
