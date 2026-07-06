/**
 * EmptyState — centered placeholder shown when a list or view has no data.
 *
 * @example
 *   <EmptyState
 *     heading="No projects yet"
 *     description="Create your first project to get started."
 *     action={{ label: "Create project", onClick: handleCreate }}
 *   />
 */
import type { ReactElement, ReactNode } from 'react';

import { Button } from './Button';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly heading: string;
  readonly description?: string;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

export function EmptyState({
  icon,
  heading,
  description,
  action,
}: EmptyStateProps): ReactElement {
  return (
    <div className={styles.container} role="status">
      {icon ? <div className={styles.icon} aria-hidden="true">{icon}</div> : null}
      <h2 className={styles.heading}>{heading}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? (
        <Button variant="primary" onClick={action.onClick}>{action.label}</Button>
      ) : null}
    </div>
  );
}
