/**
 * Checkbox component unit tests.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox';
import styles from './Checkbox.module.css';

describe('Checkbox', () => {
  // ─── Render modes ──────────────────────────────────────────────────

  it('renders with label text', () => {
    render(<Checkbox label="Accept terms" />);
    expect(
      screen.getByRole('checkbox', { name: /accept terms/i }),
    ).toBeInTheDocument();
  });

  it('renders without a label', () => {
    const { container } = render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    // The <label> element is always rendered (holds the visual control SVG),
    // but the label text <span> is omitted when no label prop is given.
    expect(container.querySelector(`.${styles.labelText!}`)).toBeNull();
  });

  it('renders checked by default', () => {
    render(<Checkbox label="Default on" defaultChecked />);
    expect(
      screen.getByRole('checkbox', { name: /default on/i }),
    ).toBeChecked();
  });

  // ─── forwardRef ──────────────────────────────────────────────────

  it('forwards ref to the underlying input element', () => {
    const ref = vi.fn();
    render(<Checkbox ref={ref} label="Name" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('ref allows focusing the input', () => {
    const ref = vi.fn();
    render(<Checkbox ref={ref} label="Field" />);
    const inputEl = ref.mock.calls[0]?.[0] as HTMLInputElement | undefined;
    expect(inputEl).toBeInstanceOf(HTMLInputElement);

    inputEl?.focus();
    expect(
      screen.getByRole('checkbox', { name: /field/i }),
    ).toHaveFocus();
  });

  // ─── Size variants ────────────────────────────────────────────────

  it('renders with default size (md)', () => {
    const { container } = render(<Checkbox label="Size" />);
    expect(container.firstChild).toHaveClass(styles.md!);
  });

  it('renders with sm size', () => {
    const { container } = render(<Checkbox label="Small" size="sm" />);
    expect(container.firstChild).toHaveClass(styles.sm!);
  });

  it('renders with lg size', () => {
    const { container } = render(<Checkbox label="Large" size="lg" />);
    expect(container.firstChild).toHaveClass(styles.lg!);
  });

  // ─── States ──────────────────────────────────────────────────────

  it('renders disabled checkbox', () => {
    render(<Checkbox label="Disabled" disabled />);
    expect(
      screen.getByRole('checkbox', { name: /disabled/i }),
    ).toBeDisabled();
  });

  it('renders with aria-invalid when error is provided', () => {
    render(<Checkbox label="Email" error="Invalid email" />);
    expect(
      screen.getByRole('checkbox', { name: /email/i }),
    ).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders error message with role="alert"', () => {
    render(<Checkbox label="Email" error="This field is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /this field is required/i,
    );
  });

  it('associates error via aria-describedby', () => {
    render(<Checkbox label="Email" error="Invalid format" />);
    const checkbox = screen.getByRole('checkbox', { name: /email/i });
    const describedBy = checkbox.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveTextContent(/invalid format/i);
    expect(errorEl).toHaveAttribute('role', 'alert');
  });

  // ─── Indeterminate ───────────────────────────────────────────────

  it('does not set HTML indeterminate attribute (DOM property only)', () => {
    const { container } = render(<Checkbox indeterminate label="Indet" />);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).not.toHaveAttribute('indeterminate');
  });

  it('sets indeterminate DOM property on the underlying input', () => {
    // indeterminate is a DOM property, not an HTML attribute.
    // The component sets it via useEffect + ref, so we pass an object ref.
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Checkbox indeterminate ref={ref} label="Test" />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
  });

  // ─── className ──────────────────────────────────────────────────

  it('merges custom className on wrapper div', () => {
    const { container } = render(
      <Checkbox label="Test" className="my-custom-class" />,
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  // ─── Events ─────────────────────────────────────────────────────

  it('calls onChange when clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Toggle" onChange={handleChange} />);
    await user.click(screen.getByRole('checkbox', { name: /toggle/i }));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('calls onChange when label text is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Label click" onChange={handleChange} />);
    await user.click(screen.getByText(/label click/i));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  // ─── DOM spread ─────────────────────────────────────────────────

  it('passes extra props (data-testid) through to the input', () => {
    render(<Checkbox label="Extra" data-testid="custom-checkbox" />);
    expect(screen.getByTestId('custom-checkbox')).toBeInTheDocument();
  });
});
