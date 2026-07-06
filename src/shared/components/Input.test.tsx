/**
 * Input component unit tests.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './Input';
import styles from './Input.module.css';

describe('Input', () => {
  // ─── Render modes ──────────────────────────────────────────────────

  it('renders with a label text', () => {
    render(<Input label="Username" />);
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
    expect(screen.getByText(/username/i)).toBeInTheDocument();
  });

  it('renders without a label (just input)', () => {
    const { container } = render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText(/enter name/i)).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
  });

  it('renders with a placeholder', () => {
    render(<Input placeholder="you@example.com" />);
    expect(
      screen.getByPlaceholderText(/you@example\.com/i),
    ).toBeInTheDocument();
  });

  it('renders with a value', () => {
    render(<Input value="test value" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });

  // ─── forwardRef ──────────────────────────────────────────────────

  it('forwards ref to the underlying input element', () => {
    const ref = vi.fn();
    render(<Input ref={ref} label="Name" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('passes ref to the input element (verify with focus test)', () => {
    const ref = vi.fn();
    render(<Input ref={ref} label="Field" />);
    const inputEl = ref.mock.calls[0]?.[0] as HTMLInputElement | undefined;
    expect(inputEl).toBeInstanceOf(HTMLInputElement);

    inputEl?.focus();
    expect(screen.getByRole('textbox', { name: /field/i })).toHaveFocus();
  });

  // ─── Sizes ────────────────────────────────────────────────────────

  it('renders with default size (md)', () => {
    render(<Input label="Size" />);
    expect(screen.getByRole('textbox', { name: /size/i })).toHaveClass(
      styles.md!,
    );
  });

  it('renders with sm size', () => {
    render(<Input label="Small" size="sm" />);
    expect(screen.getByRole('textbox', { name: /small/i })).toHaveClass(
      styles.sm!,
    );
  });

  it('renders with lg size', () => {
    render(<Input label="Large" size="lg" />);
    expect(screen.getByRole('textbox', { name: /large/i })).toHaveClass(
      styles.lg!,
    );
  });

  // ─── Full width ──────────────────────────────────────────────────

  it('applies fullWidth class when true', () => {
    const { container } = render(<Input label="Wide" fullWidth />);
    expect(container.firstChild).toHaveClass(styles.fullWidth!);
  });

  // ─── States ──────────────────────────────────────────────────────

  it('renders disabled input', () => {
    render(<Input label="Disabled" disabled />);
    expect(
      screen.getByRole('textbox', { name: /disabled/i }),
    ).toBeDisabled();
  });

  it('renders with aria-invalid when error is provided', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('renders error message with role="alert"', () => {
    render(<Input label="Email" error="This field is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /this field is required/i,
    );
  });

  it('renders hint text when provided', () => {
    render(<Input label="Name" hint="Enter your full name" />);
    expect(screen.getByText(/enter your full name/i)).toBeInTheDocument();
  });

  it('hides hint when error is present (hint + error → only error shown)', () => {
    render(
      <Input
        label="Name"
        hint="Enter your full name"
        error="Name is required"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
    expect(screen.queryByText(/enter your full name/i)).toBeNull();
  });

  it('associates error with input via aria-describedby', () => {
    render(<Input label="Email" error="Invalid format" />);
    const input = screen.getByRole('textbox', { name: /email/i });
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveTextContent(/invalid format/i);
    expect(errorEl).toHaveAttribute('role', 'alert');
  });

  it('associates hint with input via aria-describedby', () => {
    render(<Input label="Name" hint="Enter your legal name" />);
    const input = screen.getByRole('textbox', { name: /name/i });
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const hintEl = document.getElementById(describedBy!);
    expect(hintEl).toBeInTheDocument();
    expect(hintEl).toHaveTextContent(/enter your legal name/i);
  });

  // ─── className ──────────────────────────────────────────────────

  it('merges custom className', () => {
    render(<Input label="Test" className="my-custom-class" />);
    expect(screen.getByRole('textbox', { name: /test/i })).toHaveClass(
      'my-custom-class',
    );
  });

  // ─── Events ─────────────────────────────────────────────────────

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Input label="Name" onChange={handleChange} />);
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'a');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles onFocus event', () => {
    const handleFocus = vi.fn();
    render(<Input label="Name" onFocus={handleFocus} />);
    fireEvent.focus(screen.getByRole('textbox', { name: /name/i }));
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });
});
