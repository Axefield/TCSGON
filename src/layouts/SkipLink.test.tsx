/**
 * SkipLink component tests.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §51, §57
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('renders a link with "Skip to content" text', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to content/i });
    expect(link).toBeInTheDocument();
  });

  it('renders a link with custom children', () => {
    render(<SkipLink>Skip navigation</SkipLink>);
    expect(screen.getByRole('link', { name: /skip navigation/i })).toBeInTheDocument();
  });

  it('targets #main-content by default', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#main-content');
  });

  it('targets custom target id', () => {
    render(<SkipLink targetId="content" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#content');
  });

  it('is focusable (for keyboard users)', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it('click focuses the target element and sets tabindex', () => {
    // Add a main element to the DOM
    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);

    render(<SkipLink />);
    const link = screen.getByRole('link');
    link.click();

    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');

    // Clean up
    document.body.removeChild(main);
  });

  it('click on custom target focuses that element', () => {
    const target = document.createElement('div');
    target.id = 'content';
    document.body.appendChild(target);

    render(<SkipLink targetId="content" />);
    const link = screen.getByRole('link');
    link.click();

    expect(document.activeElement).toBe(target);

    document.body.removeChild(target);
  });
});
