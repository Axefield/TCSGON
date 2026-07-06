import { type ReactElement } from 'react';

import type { Project, ProjectStatus } from '@/features/projects/types';
import { Badge, DataTable, Pagination } from '@/shared/components';

import styles from './ProjectList.module.css';

export interface ProjectListProps {
  readonly projects: ReadonlyArray<Project>;
  readonly isLoading?: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly sortKey: 'name' | 'status' | 'createdAt' | 'updatedAt';
  readonly sortOrder: 'asc' | 'desc';
  readonly onSort: (key: 'name' | 'status' | 'createdAt' | 'updatedAt', order: 'asc' | 'desc') => void;
  readonly onPageChange: (page: number) => void;
  readonly onOpen: (project: Project) => void;
  readonly emptyState: ReactElement;
}

function badgeVariant(status: ProjectStatus): 'success' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'active': return 'success';
    case 'paused': return 'warning';
    case 'completed': return 'info';
    case 'archived': return 'default';
  }
}

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function ProjectList({
  projects,
  isLoading = false,
  page,
  totalPages,
  sortKey,
  sortOrder,
  onSort,
  onPageChange,
  onOpen,
  emptyState,
}: ProjectListProps): ReactElement {
  return (
    <div className={styles.wrapper}>
      <DataTable
        columns={[
          {
            key: 'name',
            label: 'Project',
            sortable: true,
            render: (project) => (
              <div className={styles.primaryCell}>
                <strong>{project.name}</strong>
                <span className={styles.meta}>Lead: {project.leadName}</span>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (project) => (
              <Badge variant={badgeVariant(project.status)}>
                {statusLabels[project.status]}
              </Badge>
            ),
          },
          {
            key: 'memberCount',
            label: 'Members',
            align: 'right',
            render: (project) => String(project.memberCount),
          },
          {
            key: 'updatedAt',
            label: 'Updated',
            sortable: true,
            render: (project) => formatDate(project.updatedAt),
          },
        ]}
        data={projects}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={(key, order) => {
          if (key === 'name' || key === 'status' || key === 'createdAt' || key === 'updatedAt') {
            onSort(key, order);
          }
        }}
        isLoading={isLoading}
        onRowClick={onOpen}
        rowKey={(project) => project.id}
        emptyState={emptyState}
        label="Projects"
      />

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} label="Projects pages" />
    </div>
  );
}
