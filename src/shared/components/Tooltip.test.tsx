/**
 * Tooltip — unit tests.
 *
 * Tooltip is a wrapper that shows/hides a tooltip bubble on hover/focus
 * using setTimeout delays (defaults: show 500ms, hide 200ms).
 *
 * Because the component relies on timers for its show/hide delay, all
 * event-driven tests use `vi.useFakeTimers()` + `act()` to control
 * the passage of time.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { Tooltip } from './Tooltip';
import styles from './Tooltip.module.css';

describe('Tooltip', () => {
  // ─── Setup / teardown ─────────────────────────────────────────

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Render ───────────────────────────────────────────────────

  it('renders the trigger children', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('tooltip is hidden by default', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByText('tooltip text')).not.toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── Visible state — attribute assertions ─────────────────────

  it('tooltip has role="tooltip" when visible', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    // Show tooltip
    fireEvent.mouseOver(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('tooltip text');
  });

  it('trigger element has aria-describedby pointing to tooltip id', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    // Show tooltip so we can read its id
    fireEvent.mouseOver(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const tooltip = screen.getByRole('tooltip');
    const trigger = screen.getByText('Hover me').closest('[aria-describedby]')!;

    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });

  // ─── Events — mouse ──────────────────────────────────────────

  it('shows on mouse enter (mouseOver)', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseOver(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('tooltip text')).toBeInTheDocument();
  });

  it('hides on mouse leave (mouseOut)', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    // Show first
    fireEvent.mouseOver(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText('tooltip text')).toBeInTheDocument();

    // Hide
    fireEvent.mouseOut(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(300);
    }); // past the 200 ms hide delay

    expect(screen.queryByText('tooltip text')).not.toBeInTheDocument();
  });

  // ─── Events — keyboard focus ─────────────────────────────────

  it('shows on focus', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText('tooltip text')).toBeInTheDocument();
  });

  it('hides on blur', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    // Show first
    fireEvent.focus(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText('tooltip text')).toBeInTheDocument();

    // Hide
    fireEvent.blur(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('tooltip text')).not.toBeInTheDocument();
  });

  // ─── Position ─────────────────────────────────────────────────

  it('default position applies "top" class', () => {
    render(
      <Tooltip content="tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseOver(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass(styles.top!);
  });

  it('custom position "bottom" applies corresponding class', () => {
    render(
      <Tooltip content="tooltip text" position="bottom">
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseOver(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass(styles.bottom!);
  });
});
