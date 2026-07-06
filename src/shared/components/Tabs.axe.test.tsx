/**
 * axe-core a11y audit — Tabs
 *
 * Tabs implements the WAI-ARIA tabs pattern with role="tablist",
 * role="tab", role="tabpanel", and keyboard navigation.
 * Must not introduce any a11y violations in any interactive state.
 */
import { render } from '@testing-library/react';

import { testA11y } from '@/test-utils';

import { Tabs } from './Tabs';

describe('Tabs a11y', () => {
  it('basic tabs have no a11y violations', async () => {
    const { container } = render(
      <Tabs label="Project views">
        <Tabs.Tab label="Details" />
        <Tabs.Tab label="Activity" />
        <Tabs.Panel>Details content</Tabs.Panel>
        <Tabs.Panel>Activity content</Tabs.Panel>
      </Tabs>,
    );

    await testA11y(container);
  });

  it('tabs with disabled tab have no a11y violations', async () => {
    const { container } = render(
      <Tabs label="Settings">
        <Tabs.Tab label="General" />
        <Tabs.Tab label="Advanced" disabled />
        <Tabs.Tab label="Notifications" />
        <Tabs.Panel>General settings</Tabs.Panel>
        <Tabs.Panel>Advanced settings (disabled)</Tabs.Panel>
        <Tabs.Panel>Notification settings</Tabs.Panel>
      </Tabs>,
    );

    await testA11y(container);
  });

  it('controlled tabs with second tab active have no a11y violations', async () => {
    const { container } = render(
      <Tabs label="Profile" index={1} onChange={() => {}}>
        <Tabs.Tab label="View" />
        <Tabs.Tab label="Edit" />
        <Tabs.Panel>View profile</Tabs.Panel>
        <Tabs.Panel>Edit profile</Tabs.Panel>
      </Tabs>,
    );

    await testA11y(container);
  });
});
