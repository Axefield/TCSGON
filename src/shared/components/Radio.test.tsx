/**
 * Radio.Group + Radio compound component — unit tests.
 *
 * Radio.Group manages a set of Radio options with role="radiogroup",
 * aria-label, and keyboard navigation (Arrow keys, disabled skip).
 * Each Radio renders a native <input type="radio"> with associated <label>.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Radio } from './Radio';

const OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

describe('Radio.Group', () => {
  // ─── Group render ──────────────────────────────────────────────────

  it('renders with role="radiogroup" and correct aria-label', () => {
    render(
      <Radio.Group
        name="status"
        value="active"
        onChange={() => {}}
        label="Filter by status"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('aria-label', 'Filter by status');
  });

  it('renders all radio options', () => {
    render(
      <Radio.Group
        name="status"
        value="active"
        onChange={() => {}}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });

  it('marks the correct option as checked based on value prop', () => {
    render(
      <Radio.Group
        name="status"
        value="paused"
        onChange={() => {}}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    expect(screen.getByRole('radio', { name: /paused/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /active/i })).not.toBeChecked();
    expect(
      screen.getByRole('radio', { name: /completed/i }),
    ).not.toBeChecked();
  });

  it('renders an empty group with no radio inputs when no children', () => {
    render(
      <Radio.Group
        name="status"
        value=""
        onChange={() => {}}
        label="Empty"
      >
        <></>
      </Radio.Group>,
    );

    // The group wrapper is still rendered but no radio inputs exist.
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  // ─── Radio interaction ────────────────────────────────────────────

  it('calls onChange with the correct value when a radio label is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Radio.Group
        name="status"
        value="active"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    await user.click(screen.getByText(/paused/i));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('paused');
  });

  it('does NOT call onChange when the currently selected option is clicked (native radio behavior)', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Radio.Group
        name="status"
        value="active"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    // Click the already-selected radio — native browser behavior does not
    // fire the change event for an already-checked radio.
    await user.click(screen.getByText(/active/i));
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── Keyboard navigation ──────────────────────────────────────────

  it('ArrowRight selects the next option', () => {
    const handleChange = vi.fn();

    render(
      <Radio.Group
        name="status"
        value="active"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const radios = screen.getAllByRole('radio');
    radios[0]?.focus();
    fireEvent.keyDown(radios[0]!, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith('paused');
  });

  it('ArrowDown also selects the next option', () => {
    const handleChange = vi.fn();

    render(
      <Radio.Group
        name="status"
        value="active"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const radios = screen.getAllByRole('radio');
    radios[0]?.focus();
    fireEvent.keyDown(radios[0]!, { key: 'ArrowDown' });

    expect(handleChange).toHaveBeenCalledWith('paused');
  });

  it('ArrowLeft selects the previous option', () => {
    const handleChange = vi.fn();

    render(
      <Radio.Group
        name="status"
        value="completed"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const radios = screen.getAllByRole('radio');
    radios[2]?.focus();
    fireEvent.keyDown(radios[2]!, { key: 'ArrowLeft' });

    expect(handleChange).toHaveBeenCalledWith('paused');
  });

  it('ArrowUp also selects the previous option', () => {
    const handleChange = vi.fn();

    render(
      <Radio.Group
        name="status"
        value="completed"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const radios = screen.getAllByRole('radio');
    radios[2]?.focus();
    fireEvent.keyDown(radios[2]!, { key: 'ArrowUp' });

    expect(handleChange).toHaveBeenCalledWith('paused');
  });

  it('wraps around from first to last with ArrowLeft', () => {
    const handleChange = vi.fn();

    render(
      <Radio.Group
        name="status"
        value="active"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const radios = screen.getAllByRole('radio');
    radios[0]?.focus();
    fireEvent.keyDown(radios[0]!, { key: 'ArrowLeft' });

    expect(handleChange).toHaveBeenCalledWith('completed');
  });

  it('wraps around from last to first with ArrowRight', () => {
    const handleChange = vi.fn();

    render(
      <Radio.Group
        name="status"
        value="completed"
        onChange={handleChange}
        label="Filter"
      >
        {OPTIONS.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Radio.Group>,
    );

    const radios = screen.getAllByRole('radio');
    radios[2]?.focus();
    fireEvent.keyDown(radios[2]!, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith('active');
  });

  it('skips disabled radios during keyboard navigation', () => {
    const handleChange = vi.fn();

    render(
      <Radio.Group
        name="status"
        value="a"
        onChange={handleChange}
        label="Group"
      >
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B (disabled)" disabled />
        <Radio value="c" label="Option C" />
      </Radio.Group>,
    );

    // The disabled radio is still in the DOM but skipped by :not([disabled]) query.
    const allRadios = screen.getAllByRole('radio');
    expect(allRadios).toHaveLength(3);
    expect(allRadios[1]).toBeDisabled();

    // Navigate from A → should skip disabled B and land on C.
    allRadios[0]?.focus();
    fireEvent.keyDown(allRadios[0]!, { key: 'ArrowRight' });

    expect(handleChange).toHaveBeenCalledWith('c');
  });
});
