/**
 * SettingsPageStub — placeholder settings page.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10
 */
import { type ReactElement } from 'react';

export function SettingsPageStub(): ReactElement {
  return (
    <section>
      <h1 style={{ margin: '0 0 0.5rem' }}>Settings</h1>
      <p style={{ color: 'var(--color-fg-muted, #64748b)' }}>
        Account settings will appear here.
      </p>
    </section>
  );
}
