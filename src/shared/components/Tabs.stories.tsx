import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Tabs label="Project views" defaultIndex={0}>
        <Tabs.Tab label="Details" />
        <Tabs.Tab label="Activity" />
        <Tabs.Tab label="Settings" />
        <Tabs.Panel>
          <p>Details panel content.</p>
        </Tabs.Panel>
        <Tabs.Panel>
          <p>Activity panel content.</p>
        </Tabs.Panel>
        <Tabs.Panel>
          <p>Settings panel content.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <div style={{ width: 400 }}>
      <Tabs label="Profile sections" defaultIndex={0}>
        <Tabs.Tab label="Profile" />
        <Tabs.Tab label="Security" disabled />
        <Tabs.Tab label="Notifications" />
        <Tabs.Panel>
          <p>Edit your profile details here.</p>
        </Tabs.Panel>
        <Tabs.Panel>
          <p>Security settings are temporarily unavailable.</p>
        </Tabs.Panel>
        <Tabs.Panel>
          <p>Configure your notification preferences.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  ),
};

export const SingleTab: Story = {
  render: () => (
    <div style={{ width: 300 }}>
      <Tabs label="Single section">
        <Tabs.Tab label="Overview" />
        <Tabs.Panel>
          <p>Only one tab available.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [index, setIndex] = useState(0);

    return (
      <div style={{ width: 400 }}>
        <p style={{ marginBottom: 8, fontSize: 14, color: '#64748b' }}>
          Controlled: active tab is {index}
        </p>
        <Tabs label="Controlled tabs" index={index} onChange={setIndex}>
          <Tabs.Tab label="First" />
          <Tabs.Tab label="Second" />
          <Tabs.Tab label="Third" />
          <Tabs.Panel>
            <p>First panel — index 0.</p>
          </Tabs.Panel>
          <Tabs.Panel>
            <p>Second panel — index 1.</p>
          </Tabs.Panel>
          <Tabs.Panel>
            <p>Third panel — index 2.</p>
          </Tabs.Panel>
        </Tabs>
      </div>
    );
  },
};

export const ManyTabs: Story = {
  render: () => (
    <div style={{ width: 600 }}>
      <Tabs label="Many tabs" defaultIndex={2}>
        {Array.from({ length: 8 }, (_, i) => (
          <Tabs.Tab key={i} label={`Tab ${i + 1}`} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <Tabs.Panel key={i}>
            <p>Content for Tab {i + 1}.</p>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  ),
};
