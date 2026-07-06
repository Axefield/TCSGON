/**
 * Badge component unit tests.
 *
 * Badge is a pure presentational component — no state, no forwardRef,
 * no side effects.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';
import styles from './Badge.module.css';

describe('Badge', () => {
  // ─── Render ────────────────────────────────────────────────────

  it('renders children text as a <span>', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText(/new/i);
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
  });

  it('renders with a child element (ReactNode)', () => {
    render(
      <Badge>
        <span data-testid="icon" />
      </Badge>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  // ─── Size variants ────────────────────────────────────────────

  it('renders with default size (md)', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText(/default/i)).toHaveClass(styles.md!);
  });

  it('renders with sm size', () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText(/small/i)).toHaveClass(styles.sm!);
  });

  it('renders with lg size', () => {
    render(<Badge size="lg">Large</Badge>);
    expect(screen.getByText(/large/i)).toHaveClass(styles.lg!);
  });

  // ─── Variant colors ───────────────────────────────────────────

  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText(/default/i)).toHaveClass(styles.default!);
  });

  it('renders with primary variant', () => {
    render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText(/primary/i)).toHaveClass(styles.primary!);
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText(/success/i)).toHaveClass(styles.success!);
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText(/warning/i)).toHaveClass(styles.warning!);
  });

  it('renders with danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText(/danger/i)).toHaveClass(styles.danger!);
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText(/info/i)).toHaveClass(styles.info!);
  });

  // ─── className ────────────────────────────────────────────────

  it('merges custom className', () => {
    render(<Badge className="my-class">Custom</Badge>);
    expect(screen.getByText(/custom/i)).toHaveClass('my-class');
  });

  // ─── Not rendered/interactive ─────────────────────────────────

  it('does NOT render a <button>, <a>, or interactive element — it is a <span>', () => {
    render(<Badge>Static</Badge>);
    const badge = screen.getByText(/static/i);
    expect(badge.tagName).toBe('SPAN');
    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('tabindex');
    expect(badge.querySelector('button')).toBeNull();
    expect(badge.querySelector('a')).toBeNull();
  });
});
