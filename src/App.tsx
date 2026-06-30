import { useAppSelector } from '@/store/hooks';

import styles from './App.module.css';

/**
 * Root application component — Phase 0 shell.
 *
 * Phase 0: renders a semantic heading and reads the theme from Redux to prove
 * the store is wired. Real router + layout + route-level Suspense land in Phase 1.
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/} for a11y patterns
 */
export function App(): JSX.Element {
  const theme = useAppSelector((state) => state.ui.theme);

  return (
    <main className={styles.app} data-theme={theme}>
      <h1 className={styles.heading}>TCSgon</h1>
      <p className={styles.tagline}>
        Enterprise React SPA scaffold — Phase 0 (project shell).
      </p>
    </main>
  );
}