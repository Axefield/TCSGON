/**
 * AuthLayout component tests.
 *
 * Pure presentational component — no router, no store, no network.
 *
 * @phase Phase 6 — Testing & A11y Hardening
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthLayout } from './AuthLayout';

describe('AuthLayout', () => {
  it('renders the heading as an h1', () => {
    render(<AuthLayout heading="Sign in">content</AuthLayout>);
    const heading = screen.getByRole('heading', { level: 1, name: /sign in/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders subheading when provided', () => {
    render(
      <AuthLayout heading="Sign in" subheading="Welcome back">
        content
      </AuthLayout>,
    );
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('does NOT render subheading when not provided', () => {
    const { container } = render(<AuthLayout heading="Sign in">content</AuthLayout>);
    // The subheading is rendered as a <p> with the subheading class
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders children', () => {
    render(
      <AuthLayout heading="Sign in">
        <form aria-label="login-form">
          <button type="submit">Log in</button>
        </form>
      </AuthLayout>,
    );
    expect(screen.getByRole('form', { name: /login-form/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('applies wrapper and card CSS classes', () => {
    const { container } = render(<AuthLayout heading="Sign in">content</AuthLayout>);
    // The outermost div uses the wrapper class; direct child uses the card class
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper!.className).toContain('wrapper');
  });

  it('heading uses the heading CSS class', () => {
    render(<AuthLayout heading="Sign in">content</AuthLayout>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('heading');
  });
});
