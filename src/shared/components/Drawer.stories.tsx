import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from './Button';
import { Drawer } from './Drawer';

const meta: Meta<typeof Drawer> = {
  title: 'Components/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const RightSide: Story = {
  args: {
    open: true,
    title: 'Filters',
    side: 'right',
    children: (
      <div style={{ padding: '1rem 0' }}>
        <p>Filter options go here.</p>
      </div>
    ),
    onClose: () => {},
  },
};

export const LeftSide: Story = {
  args: {
    open: true,
    title: 'Navigation',
    side: 'left',
    children: (
      <nav style={{ padding: '1rem 0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '0.5rem 0' }}>Dashboard</li>
          <li style={{ padding: '0.5rem 0' }}>Projects</li>
          <li style={{ padding: '0.5rem 0' }}>Settings</li>
        </ul>
      </nav>
    ),
    onClose: () => {},
  },
};

export const WithFormContent: Story = {
  args: {
    open: true,
    title: 'Edit Profile',
    side: 'right',
    children: (
      <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Name</label>
          <input id="name" defaultValue="Alice" style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Email</label>
          <input id="email" defaultValue="alice@example.com" style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
        </div>
        <Button variant="primary">Save</Button>
      </div>
    ),
    onClose: () => {},
  },
};

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open drawer
        </Button>
        <Drawer
          open={open}
          title="Slide-in panel"
          side="right"
          onClose={() => setOpen(false)}
        >
          <p>Drawer content goes here.</p>
        </Drawer>
      </>
    );
  },
};

export const BackdropDisabled: Story = {
  args: {
    open: true,
    title: 'Attention required',
    side: 'right',
    closeOnBackdrop: false,
    closeOnEsc: false,
    children: (
      <div style={{ padding: '1rem 0' }}>
        <p>This drawer cannot be dismissed by clicking the backdrop or pressing Escape.</p>
      </div>
    ),
    onClose: () => {},
  },
};
