import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import {
  ProjectInputSchema,
  type ProjectInput,
  type ProjectStatus,
} from '@/features/projects/types';

import styles from './ProjectForm.module.css';

export interface ProjectFormProps {
  readonly mode: 'create' | 'edit';
  readonly initialValues?: Partial<ProjectInput>;
  readonly onSubmit: (input: ProjectInput) => Promise<void> | void;
  readonly isSubmitting?: boolean;
  readonly submitLabel?: string;
}

const statusOptions: ReadonlyArray<{ readonly value: ProjectStatus; readonly label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function ProjectForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel,
}: ProjectFormProps): ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(ProjectInputSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      status: initialValues?.status ?? 'active',
      leadName: initialValues?.leadName ?? '',
    },
  });

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      noValidate
    >
      <div className={styles.field}>
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" {...register('name')} aria-invalid={errors.name ? 'true' : 'false'} />
        {errors.name ? <p className={styles.error}>{errors.name.message}</p> : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="project-lead">Lead name</label>
        <input id="project-lead" {...register('leadName')} aria-invalid={errors.leadName ? 'true' : 'false'} />
        {errors.leadName ? <p className={styles.error}>{errors.leadName.message}</p> : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="project-status">Status</label>
        <select id="project-status" {...register('status')}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="project-description">Description</label>
        <textarea id="project-description" rows={6} {...register('description')} />
        {errors.description ? <p className={styles.error}>{errors.description.message}</p> : null}
      </div>

      <button className={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : (submitLabel ?? (mode === 'create' ? 'Create project' : 'Save changes'))}
      </button>
    </form>
  );
}
