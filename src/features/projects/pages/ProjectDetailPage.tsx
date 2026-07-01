import { type ReactElement } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { ProjectDetail } from '@/features/projects/components/ProjectDetail';
import { useDeleteProject, useProjectDetails } from '@/features/projects/hooks/useProjects';
import { ErrorDisplay, Spinner } from '@/shared/components';
import { useConfirm } from '@/shared/hooks';
import { useToast } from '@/shared/hooks/useToast';
import { asProjectId } from '@/shared/types/brand';

import styles from './ProjectPages.module.css';

function ProjectDetailRoute({ id }: { readonly id: string }): ReactElement {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const projectId = asProjectId(id);
  const { project, isLoading, isError, error, refetch } = useProjectDetails(projectId);
  const deleteMutation = useDeleteProject();

  const handleDelete = async (): Promise<void> => {
    const approved = await confirm({
      title: 'Delete project?',
      message: 'This action cannot be undone and will remove the project from the portfolio.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });

    if (!approved) {
      return;
    }

    deleteMutation.mutate(projectId, {
      onSuccess: () => {
        toast.success('Project deleted');
        navigate('/projects');
      },
      onError: () => {
        toast.error('Could not delete project');
      },
    });
  };

  return (
    <>
      <section className={styles.page}>
        {isLoading ? <Spinner label="Loading project" /> : null}
        {isError && error ? <ErrorDisplay error={error} onRetry={() => void refetch()} title="Failed to load project" /> : null}
        {project ? (
          <ProjectDetail project={project} onDelete={() => void handleDelete()} isDeleting={deleteMutation.isPending} />
        ) : null}
      </section>
      <ConfirmDialogComponent />
    </>
  );
}

export function ProjectDetailPage(): ReactElement {
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  return <ProjectDetailRoute id={id} />;
}
