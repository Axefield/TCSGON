import { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { ErrorDisplay } from '@/shared/components';
import { useToast } from '@/shared/hooks/useToast';
import type { ProjectInput } from '@/features/projects/types';

import styles from './ProjectPages.module.css';

export function ProjectCreatePage(): ReactElement {
  const navigate = useNavigate();
  const toast = useToast();
  const createProject = useCreateProject();

  const handleSubmit = async (input: ProjectInput): Promise<void> => {
    createProject.mutate(input, {
      onSuccess: (project) => {
        toast.success('Project created');
        navigate(`/projects/${project.id}`);
      },
      onError: () => {
        toast.error('Could not create project');
      },
    });
  };

  return (
    <section className={styles.page}>
      <div className={styles.headerStack}>
        <p className={styles.eyebrow}>Projects</p>
        <h1 className={styles.title}>Create project</h1>
      </div>
      {createProject.error ? <ErrorDisplay error={createProject.error} title="Failed to create project" /> : null}
      <ProjectForm mode="create" onSubmit={handleSubmit} isSubmitting={createProject.isPending} />
    </section>
  );
}
