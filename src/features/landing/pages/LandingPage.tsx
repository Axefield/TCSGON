/**
 * LandingPage — public homepage for unauthenticated users.
 *
 * Shows a hero section with app description and feature cards.
 * Redirects authenticated users to `/dashboard` via declarative `<Navigate>`.
 *
 * @example
 *   <Route index element={<LandingPage />} />
 */
import { type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

import { selectIsAuthenticated } from '@/features/auth/slice/authSlice';
import { Button } from '@/shared/components';
import { ROUTES } from '@/routes';
import { useAppSelector } from '@/store/hooks';

import styles from './LandingPage.module.css';

const FEATURES = [
  {
    icon: '📊',
    title: 'Dashboard',
    description:
      "Get a bird's-eye view of all your projects with key metrics, recent activity, and quick status updates at a glance.",
  },
  {
    icon: '📁',
    title: 'Projects',
    description:
      'Create, manage, and track projects with detailed profiles, status updates, and team collaboration tools.',
  },
  {
    icon: '⚙️',
    title: 'Settings',
    description:
      'Customize your profile, manage account security, and configure application preferences to suit your workflow.',
  },
] as const;

export function LandingPage(): ReactElement {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <>
      <section className={styles.hero} aria-label="Welcome">
        <span className={styles.badge}>Enterprise Project Management</span>
        <h1 className={styles.title}>
          TCSgon
        </h1>
        <p className={styles.tagline}>
          A modern, accessible project management platform built for teams.
          Track projects, monitor progress, and stay in sync &mdash; all in
          one place.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" size="lg" href={ROUTES.signup}>
            Get started
          </Button>
          <Button variant="secondary" size="lg" href={ROUTES.login}>
            Sign in
          </Button>
        </div>
      </section>

      <section className={styles.features} aria-labelledby="features-heading">
        <h2 id="features-heading" className={styles.sectionTitle}>
          Everything you need
        </h2>
        <p className={styles.sectionSubtitle}>
          Core tools to keep your projects on track.
        </p>
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <small>&copy; {new Date().getFullYear()} TCSgon. All rights reserved.</small>
      </footer>
    </>
  );
}
