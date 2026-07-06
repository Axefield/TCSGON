import { type ReactElement } from 'react';

import type { Project } from '@/features/projects/types';
import { Button } from '@/shared/components';

import styles from './ProjectDetail.module.css';

export interface ProjectDetailProps {
  readonly project: Project;
  readonly onDelete: () => void;
  readonly isDeleting?: boolean;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ProjectDetail({
  project,
  onDelete,
  isDeleting = false,
}: ProjectDetailProps): ReactElement {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Project detail</p>
          <h1 className={styles.title}>{project.name}</h1>
        </div>
        <div className={styles.actions}>
          <Button href={`/projects/${project.id}/edit`} variant="secondary">Edit project</Button>
          <Button variant="danger" onClick={onDelete} loading={isDeleting}>Delete project</Button>
        </div>
      </div>

      <dl className={styles.grid}>
        <div>
          <dt>Status</dt>
          <dd>{project.status}</dd>
        </div>
        <div>
          <dt>Lead</dt>
          <dd>{project.leadName}</dd>
        </div>
        <div>
          <dt>Members</dt>
          <dd>{project.memberCount}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(project.createdAt)}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDate(project.updatedAt)}</dd>
        </div>
      </dl>

      <section className={styles.descriptionBlock}>
        <h2>Description</h2>
        <p>{project.description || 'No description provided yet.'}</p>
      </section>
    </section>
  );
}
