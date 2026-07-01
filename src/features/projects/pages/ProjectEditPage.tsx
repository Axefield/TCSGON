import { type ReactElement } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { useProjectDetails, useUpdateProject } from '@/features/projects/hooks/useProjects';
import type { ProjectInput } from '@/features/projects/types';
import { ErrorDisplay, Spinner } from '@/shared/components';
import { useToast } from '@/shared/hooks/useToast';
import { asProjectId } from '@/shared/types/brand';

import styles from './ProjectPages.module.css';

function ProjectEditRoute({ id }: { readonly id: string }): ReactElement {
  const navigate = useNavigate();
  const toast = useToast();
  const projectId = asProjectId(id);
  const { project, isLoading, isError, error, refetch } = useProjectDetails(projectId);
  const updateProject = useUpdateProject();

  const handleSubmit = async (input: ProjectInput): Promise<void> => {
    updateProject.mutate(
      { id: projectId, input },
      {
        onSuccess: (nextProject) => {
          toast.success('Project updated');
          navigate(`/projects/${nextProject.id}`);
        },
        onError: () => {
          toast.error('Could not update project');
        },
      },
    );
  };

  return (
    <section className={styles.page}>
      {isLoading ? <Spinner label="Loading project" /> : null}
      {isError && error ? <ErrorDisplay error={error} onRetry={() => void refetch()} title="Failed to load project" /> : null}
      {project ? (
        <>
          <div className={styles.headerStack}>
            <p className={styles.eyebrow}>Projects</p>
            <h1 className={styles.title}>Edit project</h1>
          </div>
          <ProjectForm
            mode="edit"
            initialValues={{
              name: project.name,
              description: project.description,
              status: project.status,
              leadName: project.leadName,
            }}
            onSubmit={handleSubmit}
            isSubmitting={updateProject.isPending}
          />
        </>
      ) : null}
    </section>
  );
}

export function ProjectEditPage(): ReactElement {
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  return <ProjectEditRoute id={id} />;
}
