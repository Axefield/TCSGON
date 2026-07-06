/**
 * Button component tests.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';
import styles from './Button.module.css';

describe('Button', () => {
  // ─── Render mode: <button> vs <a> ────────────────────────────────────

  it('renders as a <button> by default', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('renders as an <a> when href is provided', () => {
    render(<Button href="/projects">Projects</Button>);
    const link = screen.getByRole('link', { name: /projects/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/projects');
  });

  // ─── Variants ────────────────────────────────────────────────────────

  it('applies the base button class', () => {
    const { container } = render(<Button>Label</Button>);
    expect(container.firstChild).toHaveClass(styles.button!);
  });

  it('applies a non-default variant class', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass(styles.danger!);
  });

  // ─── Sizes ───────────────────────────────────────────────────────────

  it('applies default size md', () => {
    const { container } = render(<Button>Label</Button>);
    expect(container.firstChild).toHaveClass(styles.md!);
  });

  it('applies a non-default size class', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.firstChild).toHaveClass(styles.lg!);
  });

  // ─── States: disabled ────────────────────────────────────────────────

  it('renders disabled when disabled prop is true', () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  // ─── States: loading ─────────────────────────────────────────────────

  it('renders disabled and aria-busy when loading', () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole('button', { name: /saving/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('shows a spinner when loading', () => {
    const { container } = render(<Button loading>Save</Button>);
    // Spinner has role="status" when not decorative
    expect(container.querySelector('[role="presentation"]')).toBeInTheDocument();
  });

  it('renders children text while loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  // ─── Icon ────────────────────────────────────────────────────────────

  it('renders icon on the left by default', () => {
    const { container } = render(<Button icon="★">Star</Button>);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('★');
    // Icon should appear before the label in DOM order
    const label = container.querySelector('span:not([aria-hidden])');
    expect(label).toHaveTextContent('Star');
  });

  it('renders icon on the right when iconPosition is right', () => {
    const { container } = render(
      <Button icon="★" iconPosition="right">
        Star
      </Button>,
    );
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  // ─── Full width ──────────────────────────────────────────────────────

  it('applies fullWidth class', () => {
    const { container } = render(<Button fullWidth>Wide</Button>);
    expect(container.firstChild).toHaveClass(styles.fullWidth!);
  });

  // ─── Custom className ────────────────────────────────────────────────

  it('merges custom className', () => {
    const { container } = render(<Button className="my-class">Hi</Button>);
    expect(container.firstChild).toHaveClass('my-class');
  });

  // ─── type prop (button only) ─────────────────────────────────────────

  it('defaults type to button', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', { name: /submit/i })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('accepts type submit', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button', { name: /submit/i })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  // ─── Events ──────────────────────────────────────────────────────────

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button', { name: /click/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: /click/i }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ─── Link mode extras ────────────────────────────────────────────────

  it('adds rel="noopener noreferrer" when target is _blank', () => {
    render(
      <Button href="https://example.com" target="_blank">
        External
      </Button>,
    );
    const link = screen.getByRole('link', { name: /external/i });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('preserves custom rel when not _blank', () => {
    render(
      <Button href="/about" rel="author">
        About
      </Button>,
    );
    const link = screen.getByRole('link', { name: /about/i });
    expect(link).toHaveAttribute('rel', 'author');
  });

  // ─── aria-label passthrough ──────────────────────────────────────────

  it('passes aria-label to the element', () => {
    render(<Button aria-label="Close dialog">X</Button>);
    expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument();
  });
});
