/**
 * axe-core a11y audit — Tooltip
 *
 * Validates that both the hidden trigger (with aria-describedby) and
 * the visible tooltip (role="tooltip") do not introduce any a11y
 * violations.
 *
 * NOTE: fake timers are used ONLY in the visible-state test to drive
 * the setTimeout-based show delay. They are restored to real timers
 * before calling testA11y because axe-core depends on setTimeout
 * internally.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { testA11y } from '@/test-utils';
import { describe, it, vi, afterEach } from 'vitest';

import { Tooltip } from './Tooltip';

describe('Tooltip a11y', () => {
  // Ensure real timers are always restored even if a test fails.
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tooltip trigger with aria-describedby when hidden has no a11y violations', async () => {
    const { container } = render(
      <Tooltip content="Helpful text here">
        <button>Hover me</button>
      </Tooltip>,
    );

    // Tooltip is hidden but the trigger should already have aria-describedby.
    // No fake timers needed here — axe requires real timers.
    await testA11y(container);
  });

  it('tooltip when visible has no a11y violations', async () => {
    vi.useFakeTimers();

    const { container } = render(
      <Tooltip content="Helpful text here">
        <button>Hover me</button>
      </Tooltip>,
    );

    // Show the tooltip via fake-timer-driven event cycle.
    fireEvent.mouseOver(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Restore real timers BEFORE axe runs — axe needs setTimeout internally.
    vi.useRealTimers();

    await testA11y(container);
  });
});
