/**
 * Tabs compound component — unit tests.
 *
 * Tabs implements the WAI-ARIA tabs pattern with keyboard navigation:
 * - ArrowRight / ArrowLeft to cycle tabs
 * - Home / End to jump to first / last tab
 * - Disabled tabs are skipped during keyboard nav
 * - Inactive panels return null (not hidden via CSS)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// The disabled CSS class applies pointer-events: none, which blocks
// userEvent.click. For disabled-tab assertions we use fireEvent.click
// to verify the handler logic (the component sets onClick={undefined}).
const clickDisabled = (element: HTMLElement) =>
  fireEvent.click(element);

import { Tabs } from './Tabs';

describe('Tabs', () => {
  // ─── Render ───────────────────────────────────────────────────────

  it('renders tablist with correct aria-label', () => {
    render(
      <Tabs label="Project views">
        <Tabs.Tab label="Details" />
        <Tabs.Tab label="Activity" />
        <Tabs.Panel>Details content</Tabs.Panel>
        <Tabs.Panel>Activity content</Tabs.Panel>
      </Tabs>,
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    expect(tablist).toHaveAttribute('aria-label', 'Project views');
  });

  it('renders all tab triggers', () => {
    render(
      <Tabs label="Test">
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B" />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('Tab A');
    expect(tabs[1]).toHaveTextContent('Tab B');
    expect(tabs[2]).toHaveTextContent('Tab C');
  });

  it('renders the first tab as selected by default (aria-selected="true")', () => {
    render(
      <Tabs label="Test">
        <Tabs.Tab label="First" />
        <Tabs.Tab label="Second" />
        <Tabs.Panel>First content</Tabs.Panel>
        <Tabs.Panel>Second content</Tabs.Panel>
      </Tabs>,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('renders the first panel content by default', () => {
    render(
      <Tabs label="Test">
        <Tabs.Tab label="First" />
        <Tabs.Tab label="Second" />
        <Tabs.Panel>Panel content for first</Tabs.Panel>
        <Tabs.Panel>Panel content for second</Tabs.Panel>
      </Tabs>,
    );

    expect(
      screen.getByRole('tabpanel', { name: /first/i }),
    ).toHaveTextContent(/panel content for first/i);
  });

  it('does NOT render inactive panels (Panel returns null)', () => {
    render(
      <Tabs label="Test">
        <Tabs.Tab label="First" />
        <Tabs.Tab label="Second" />
        <Tabs.Panel>Visible content</Tabs.Panel>
        <Tabs.Panel>Hidden content</Tabs.Panel>
      </Tabs>,
    );

    // Only one tabpanel should be in the DOM.
    const panels = screen.getAllByRole('tabpanel');
    expect(panels).toHaveLength(1);
    expect(panels[0]).toHaveTextContent(/visible content/i);
    expect(screen.queryByText(/hidden content/i)).not.toBeInTheDocument();
  });

  // ─── Controlled mode ──────────────────────────────────────────────

  it('index prop controls which tab is active', () => {
    render(
      <Tabs label="Test" index={1} onChange={() => {}}>
        <Tabs.Tab label="First" />
        <Tabs.Tab label="Second" />
        <Tabs.Panel>First content</Tabs.Panel>
        <Tabs.Panel>Second content</Tabs.Panel>
      </Tabs>,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('tabpanel')).toHaveTextContent(/second content/i);
  });

  it('calls onChange when a tab is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Tabs label="Test" onChange={handleChange}>
        <Tabs.Tab label="First" />
        <Tabs.Tab label="Second" />
        <Tabs.Panel>First content</Tabs.Panel>
        <Tabs.Panel>Second content</Tabs.Panel>
      </Tabs>,
    );

    await user.click(screen.getByRole('tab', { name: /second/i }));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  // ─── Disabled tab ─────────────────────────────────────────────────

  it('disabled tab has aria-disabled="true"', () => {
    render(
      <Tabs label="Test">
        <Tabs.Tab label="Available" />
        <Tabs.Tab label="Locked" disabled />
        <Tabs.Panel>Available content</Tabs.Panel>
        <Tabs.Panel>Locked content</Tabs.Panel>
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: /locked/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('tab', { name: /available/i })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('clicking disabled tab does NOT call onChange', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" onChange={handleChange}>
        <Tabs.Tab label="Available" />
        <Tabs.Tab label="Locked" disabled />
        <Tabs.Panel>Available content</Tabs.Panel>
        <Tabs.Panel>Locked content</Tabs.Panel>
      </Tabs>,
    );

    // Use fireEvent because the CSS class sets pointer-events: none.
    clickDisabled(screen.getByRole('tab', { name: /locked/i }));
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── Keyboard navigation ──────────────────────────────────────────

  it('ArrowRight selects the next tab', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B" />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('ArrowLeft selects the previous tab', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" index={2} onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B" />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('Home selects the first tab', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" index={2} onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B" />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'Home' });

    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('End selects the last tab', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B" />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'End' });

    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('ArrowRight wraps around from last tab to first', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" index={2} onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B" />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('ArrowLeft wraps around from first tab to last', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B" />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('ArrowRight skips disabled tabs during keyboard navigation', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B (disabled)" disabled />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B (disabled)</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    // Tab A (index 0) is active by default. Pressing ArrowRight should
    // skip disabled Tab B (index 1) and activate Tab C (index 2).
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('ArrowLeft skips disabled tabs during keyboard navigation', () => {
    const handleChange = vi.fn();

    render(
      <Tabs label="Test" index={2} onChange={handleChange}>
        <Tabs.Tab label="Tab A" />
        <Tabs.Tab label="Tab B (disabled)" disabled />
        <Tabs.Tab label="Tab C" />
        <Tabs.Panel>A</Tabs.Panel>
        <Tabs.Panel>B (disabled)</Tabs.Panel>
        <Tabs.Panel>C</Tabs.Panel>
      </Tabs>,
    );

    // Tab C (index 2) is active. Pressing ArrowLeft should skip disabled
    // Tab B (index 1) and activate Tab A (index 0).
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

    expect(handleChange).toHaveBeenCalledWith(0);
  });
});
