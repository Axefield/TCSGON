/**
 * axe-core a11y audit — Modal
 *
 * Modal renders via `createPortal` to `document.body`, so we use
 * `baseElement` (which defaults to `document.body`) as the axe container
 * to ensure portal content is included in the audit.
 */
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';

import { testA11y } from '@/test-utils';

import { Modal } from './Modal';

describe('Modal a11y', () => {
  it('basic open modal has no violations', async () => {
    const { baseElement } = render(
      <Modal open={true} onClose={() => {}} title="Edit project">
        <p>Modal body content goes here.</p>
      </Modal>,
    );
    await testA11y(baseElement);
  });

  it('modal with non-dismissible backdrop and Escape has no violations', async () => {
    const { baseElement } = render(
      <Modal
        open={true}
        onClose={() => {}}
        title="Important"
        closeOnBackdrop={false}
        closeOnEsc={false}
      >
        <p>This modal cannot be dismissed by clicking outside.</p>
      </Modal>,
    );
    await testA11y(baseElement);
  });
});
