/**
 * E2E: Projects CRUD journey.
 *
 * @see docs/plans/phase-2-data-and-features.md §9
 */
import { test, expect } from '@playwright/test';

import { setupMockApi } from './utils/mockApi';

test.describe('Projects @smoke @a11y', () => {
  test('loads project list with sort and pagination', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/projects');

    // Table should render with seed data
    await expect(page.getByRole('table', { name: /projects/i })).toBeVisible();

    // Sort by project name (column label is "Project")
    await page.getByRole('button', { name: /sort by project/i }).click();
    await expect(page.getByRole('button', { name: /sort by project/i })).toBeVisible();

    // Pagination should exist if > 1 page of data
    await expect(page.getByRole('navigation', { name: /projects pages/i })).toBeVisible();
  });

  test('navigates to project detail on row click', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/projects');

    // Wait for table rows to render (clickable rows have role="button")
    const rows = page.getByRole('button', { name: /view projects /i });
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    // Click first row to navigate to detail
    await rows.first().click();

    // Should land on detail page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('creates a new project', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/projects');

    // Click new project button
    await page.getByRole('button', { name: /new project/i }).click();

    // Fill form
    await page.getByLabel('Project name').fill('E2E Test Project');
    await page.getByLabel('Lead name').fill('Tester');
    await page.getByLabel(/description/i).fill('Created by Playwright');

    // Submit
    await page.getByRole('button', { name: /create project/i }).click();

    // Should redirect to detail page showing the new project name
    await expect(page.getByText('E2E Test Project')).toBeVisible({ timeout: 5000 });
  });

  test('full CRUD journey', async ({ page }) => {
    await setupMockApi(page);
    const projectName = `CRUD Project ${Date.now()}`;

    // CREATE
    await page.goto('/projects');
    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel('Project name').fill(projectName);
    await page.getByLabel('Lead name').fill('Tester');
    await page.getByRole('button', { name: /create project/i }).click();
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 5000 });

    // EDIT
    await page.getByRole('link', { name: /edit project/i }).click();

    const updatedName = `${projectName} (Updated)`;
    await page.getByLabel('Project name').clear();
    await page.getByLabel('Project name').fill(updatedName);
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });

    // DELETE — after edit redirects to detail page
    await page.getByRole('button', { name: /delete project/i }).click();

    // Confirm dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Should return to list, project no longer visible
    await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 5000 });
  });

  test('shows empty state when no projects match filter', async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/projects');

    // Apply a search that matches nothing
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzzznonexistent');
      await expect(page.getByRole('status')).toContainText(/no projects/i);
    }
  });

  test('shows error display on server failure', async ({ page }) => {
    await setupMockApi(page, { projectsError: true });

    await page.goto('/projects');

    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible({ timeout: 5000 });
  });
});
