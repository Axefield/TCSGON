/**
 * SettingsPageStub tests.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsPageStub } from './SettingsPageStub';

describe('SettingsPageStub', () => {
  it('renders settings heading', () => {
    render(<SettingsPageStub />);
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders placeholder message', () => {
    render(<SettingsPageStub />);
    expect(screen.getByText(/account settings will appear here/i)).toBeInTheDocument();
  });
});
