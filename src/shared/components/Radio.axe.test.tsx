/**
 * axe-core a11y audit — Radio.Group
 *
 * Radio.Group renders role="radiogroup" with aria-label and
 * native <input type="radio"> elements with associated <label>.
 * Must not introduce any a11y violations in any interactive state.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Radio } from './Radio';

describe('Radio.Group a11y', () => {
  it('basic radio group has no a11y violations', async () => {
    const { container } = render(
      <Radio.Group
        name="status"
        value="active"
        onChange={() => {}}
        label="Filter by status"
      >
        <Radio value="active" label="Active" />
        <Radio value="paused" label="Paused" />
        <Radio value="completed" label="Completed" />
      </Radio.Group>,
    );

    await testA11y(container);
  });

  it('radio group with disabled option has no a11y violations', async () => {
    const { container } = render(
      <Radio.Group
        name="status"
        value="paused"
        onChange={() => {}}
        label="Filter by status"
      >
        <Radio value="active" label="Active" />
        <Radio value="paused" label="Paused" disabled />
        <Radio value="completed" label="Completed" />
      </Radio.Group>,
    );

    await testA11y(container);
  });
});
