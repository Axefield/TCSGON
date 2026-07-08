import type { Meta, StoryObj } from '@storybook/react';

import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/120?img=11',
    alt: 'Alice Chen',
    name: 'Alice Chen',
    size: 'md',
  },
};

export const WithInitials: Story = {
  args: {
    alt: 'Bob Smith',
    name: 'Bob Smith',
    size: 'md',
  },
};

export const SingleInitial: Story = {
  args: {
    alt: 'Alice',
    name: 'Alice',
    size: 'md',
  },
};

export const FallbackIcon: Story = {
  args: {
    alt: 'Unknown user',
    size: 'md',
  },
};

export const ImageWithSrcSet: Story = {
  args: {
    src: 'https://i.pravatar.cc/120?img=11',
    srcSet: 'https://i.pravatar.cc/60?img=11 60w, https://i.pravatar.cc/120?img=11 120w, https://i.pravatar.cc/240?img=11 240w',
    sizes: '(max-width: 640px) 60px, 120px',
    alt: 'Alice Chen',
    name: 'Alice Chen',
    size: 'xl',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar alt="User" name="User A" size="sm" />
      <Avatar alt="User" name="User B" size="md" />
      <Avatar alt="User" name="User C" size="lg" />
      <Avatar alt="User" name="User D" size="xl" />
    </div>
  ),
};

export const FailedImage: Story = {
  args: {
    src: 'https://invalid.example.com/missing.jpg',
    alt: 'Failed load',
    name: 'John Doe',
    size: 'md',
  },
};

export const EagerLoading: Story = {
  args: {
    src: 'https://i.pravatar.cc/120?img=7',
    alt: 'Eager loaded',
    name: 'Eager User',
    size: 'md',
    loading: 'eager',
  },
};

export const FallbackIconSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar alt="U" size="sm" />
      <Avatar alt="U" size="md" />
      <Avatar alt="U" size="lg" />
      <Avatar alt="U" size="xl" />
    </div>
  ),
};
