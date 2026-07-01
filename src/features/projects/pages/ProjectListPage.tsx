import { type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ProjectList } from '@/features/projects/components/ProjectList';
import { useProjectList } from '@/features/projects/hooks/useProjects';
import { EmptyState, ErrorDisplay } from '@/shared/components';

import styles from './ProjectPages.module.css';

type SortKey = 'name' | 'status' | 'createdAt' | 'updatedAt';

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function ProjectListPage(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const pageSize = 3;
  const sort = (searchParams.get('sort') as SortKey | null) ?? 'updatedAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
  const search = searchParams.get('search') ?? '';
  const statusParam = searchParams.get('status');
  const status = statusParam === 'active' || statusParam === 'paused' || statusParam === 'completed' || statusParam === 'archived'
    ? statusParam
    : undefined;

  const { data, isLoading, isError, error, refetch } = useProjectList({
    page,
    pageSize,
    sort,
    order,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
  });

  const updateParams = (patch: Readonly<Record<string, string | null>>): void => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    if (!patch.page) {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Projects</p>
          <h1 className={styles.title}>Project portfolio</h1>
        </div>
        <button className={styles.cta} type="button" onClick={() => navigate('/projects/new')}>
          New project
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => updateParams({ search: event.target.value || null })}
            placeholder="Search by project or lead"
          />
        </label>
        <label className={styles.searchField}>
          <span>Status</span>
          <select
            value={status ?? ''}
            onChange={(event) => updateParams({ status: event.target.value || null })}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      {isError && error ? (
        <ErrorDisplay error={error} onRetry={() => void refetch()} title="Failed to load projects" />
      ) : (
        <ProjectList
          projects={data?.items ?? []}
          isLoading={isLoading}
          page={page}
          totalPages={data?.totalPages ?? 1}
          sortKey={sort}
          sortOrder={order}
          onSort={(nextSort, nextOrder) => updateParams({ sort: nextSort, order: nextOrder })}
          onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          onOpen={(project) => navigate(`/projects/${project.id}`)}
          emptyState={
            <EmptyState
              heading="No projects match these filters"
              description="Try a different search or create a new project."
              action={{ label: 'Create project', onClick: () => navigate('/projects/new') }}
            />
          }
        />
      )}
    </section>
  );
}
