/**
 * axe-core a11y audit — Drawer
 *
 * Drawer renders via `createPortal` to `document.body`, so we use
 * `baseElement` (which defaults to `document.body`) as the axe container
 * to ensure portal content is included in the audit.
 */
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';

import { testA11y } from '@/test-utils';

import { Drawer } from './Drawer';

describe('Drawer a11y', () => {
  it('default drawer (side="right") has no violations', async () => {
    const { baseElement } = render(
      <Drawer open={true} onClose={() => {}} title="Filters" side="right">
        <p>Drawer content goes here.</p>
      </Drawer>,
    );
    await testA11y(baseElement);
  });

  it('drawer with side="left" has no violations', async () => {
    const { baseElement } = render(
      <Drawer open={true} onClose={() => {}} title="Navigation" side="left">
        <nav>
          <a href="/">Home</a>
          <a href="/settings">Settings</a>
        </nav>
      </Drawer>,
    );
    await testA11y(baseElement);
  });
});
