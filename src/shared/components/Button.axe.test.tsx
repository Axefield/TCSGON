/**
 * axe-core a11y audit — Button
 *
 * @phase Phase 7 — Design System & Feature Hardening
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Button } from './Button';

describe('Button a11y', () => {
  it('default primary button has no a11y violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    await testA11y(container);
  });

  it('secondary button has no a11y violations', async () => {
    const { container } = render(<Button variant="secondary">Cancel</Button>);
    await testA11y(container);
  });

  it('danger button has no a11y violations', async () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    await testA11y(container);
  });

  it('ghost button has no a11y violations', async () => {
    const { container } = render(<Button variant="ghost">More</Button>);
    await testA11y(container);
  });

  it('disabled button has no a11y violations', async () => {
    const { container } = render(<Button disabled>Save</Button>);
    await testA11y(container);
  });

  it('loading button has no a11y violations', async () => {
    const { container } = render(<Button loading>Saving</Button>);
    await testA11y(container);
  });

  it('link button has no a11y violations', async () => {
    const { container } = render(<Button href="/projects">Projects</Button>);
    await testA11y(container);
  });

  it('button with icon has no a11y violations', async () => {
    const { container } = render(<Button icon="★">Favorite</Button>);
    await testA11y(container);
  });

  it('full-width button has no a11y violations', async () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);
    await testA11y(container);
  });

  it('small danger button has no a11y violations', async () => {
    const { container } = render(
      <Button variant="danger" size="sm">
        Remove
      </Button>,
    );
    await testA11y(container);
  });

  it('large primary button has no a11y violations', async () => {
    const { container } = render(
      <Button variant="primary" size="lg">
        Create Project
      </Button>,
    );
    await testA11y(container);
  });
});
