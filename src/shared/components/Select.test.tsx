/**
 * Select component unit tests.
 *
 * Mirrors Input.test.tsx patterns exactly.
 * Select renders a native `<select>` element which maps to role="combobox".
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './Select';
import styles from './Select.module.css';

describe('Select', () => {
  // ─── Render modes ──────────────────────────────────────────────────

  it('renders with a label text', () => {
    render(
      <Select label="Role">
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </Select>,
    );
    expect(
      screen.getByRole('combobox', { name: /role/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/role/i)).toBeInTheDocument();
  });

  it('renders without a label (just select)', () => {
    const { container } = render(
      <Select>
        <option value="a">Option A</option>
      </Select>,
    );
    expect(container.querySelector('select')).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
  });

  it('renders children options', () => {
    render(
      <Select label="Fruit">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
        <option value="cherry">Cherry</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: /fruit/i });
    expect(select).toContainElement(screen.getByText('Apple'));
    expect(select).toContainElement(screen.getByText('Banana'));
    expect(select).toContainElement(screen.getByText('Cherry'));
  });

  it('renders with a placeholder option', () => {
    render(
      <Select label="Country">
        <option value="" disabled>
          Select a country
        </option>
        <option value="us">United States</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: /country/i });
    expect(select).toContainElement(screen.getByText(/select a country/i));
  });

  // ─── forwardRef ──────────────────────────────────────────────────

  it('forwards ref to the underlying select element', () => {
    const ref = vi.fn();
    render(<Select ref={ref} label="Role" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLSelectElement));
  });

  it('passes ref to the select element (verify with focus test)', () => {
    const ref = vi.fn();
    render(<Select ref={ref} label="Field" />);
    const selectEl = ref.mock.calls[0]?.[0] as HTMLSelectElement | undefined;
    expect(selectEl).toBeInstanceOf(HTMLSelectElement);

    selectEl?.focus();
    expect(screen.getByRole('combobox', { name: /field/i })).toHaveFocus();
  });

  // ─── Sizes ────────────────────────────────────────────────────────

  it('renders with default size (md)', () => {
    render(<Select label="Size" />);
    expect(screen.getByRole('combobox', { name: /size/i })).toHaveClass(
      styles.md!,
    );
  });

  it('renders with sm size', () => {
    render(<Select label="Small" size="sm" />);
    expect(screen.getByRole('combobox', { name: /small/i })).toHaveClass(
      styles.sm!,
    );
  });

  it('renders with lg size', () => {
    render(<Select label="Large" size="lg" />);
    expect(screen.getByRole('combobox', { name: /large/i })).toHaveClass(
      styles.lg!,
    );
  });

  // ─── Full width ──────────────────────────────────────────────────

  it('applies fullWidth class on wrapper when true', () => {
    const { container } = render(<Select label="Wide" fullWidth />);
    expect(container.firstChild).toHaveClass(styles.fullWidth!);
  });

  // ─── States ──────────────────────────────────────────────────────

  it('renders disabled select', () => {
    render(<Select label="Disabled" disabled />);
    expect(
      screen.getByRole('combobox', { name: /disabled/i }),
    ).toBeDisabled();
  });

  it('renders with aria-invalid when error is provided', () => {
    render(<Select label="Role" error="This field is required" />);
    expect(screen.getByRole('combobox', { name: /role/i })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('renders error message with role="alert"', () => {
    render(<Select label="Role" error="This field is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /this field is required/i,
    );
  });

  it('renders hint text when provided', () => {
    render(<Select label="Role" hint="Choose your access level" />);
    expect(
      screen.getByText(/choose your access level/i),
    ).toBeInTheDocument();
  });

  it('hides hint when error is present (hint + error → only error shown)', () => {
    render(
      <Select
        label="Role"
        hint="Choose your access level"
        error="Role is required"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/role is required/i);
    expect(screen.queryByText(/choose your access level/i)).toBeNull();
  });

  it('associates error with select via aria-describedby', () => {
    render(<Select label="Role" error="Invalid selection" />);
    const select = screen.getByRole('combobox', { name: /role/i });
    const describedBy = select.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveTextContent(/invalid selection/i);
    expect(errorEl).toHaveAttribute('role', 'alert');
  });

  it('associates hint with select via aria-describedby', () => {
    render(<Select label="Role" hint="Choose your access level" />);
    const select = screen.getByRole('combobox', { name: /role/i });
    const describedBy = select.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const hintEl = document.getElementById(describedBy!);
    expect(hintEl).toBeInTheDocument();
    expect(hintEl).toHaveTextContent(/choose your access level/i);
  });

  it('renders a custom arrow indicator with aria-hidden', () => {
    const { container } = render(<Select label="Role" />);
    const arrow = container.querySelector('[aria-hidden="true"]');
    expect(arrow).toBeInTheDocument();
    expect(arrow).toHaveTextContent('▼');
  });

  // ─── className ──────────────────────────────────────────────────

  it('merges custom className', () => {
    render(<Select label="Test" className="my-custom-class" />);
    expect(screen.getByRole('combobox', { name: /test/i })).toHaveClass(
      'my-custom-class',
    );
  });

  // ─── Events ─────────────────────────────────────────────────────

  it('calls onChange when a different option is selected', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select label="Role" onChange={handleChange}>
        <option value="">Select...</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </Select>,
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /role/i }),
      'admin',
    );
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles onFocus event', () => {
    const handleFocus = vi.fn();
    render(<Select label="Role" onFocus={handleFocus} />);
    fireEvent.focus(screen.getByRole('combobox', { name: /role/i }));
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });
});
