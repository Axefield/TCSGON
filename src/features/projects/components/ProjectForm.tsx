import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Input, Select } from '@/shared/components';

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
        <Input
          id="project-name"
          label="Project name"
          error={errors.name?.message}
          {...register('name')}
        />
      </div>

      <div className={styles.field}>
        <Input
          id="project-lead"
          label="Lead name"
          error={errors.leadName?.message}
          {...register('leadName')}
        />
      </div>

      <div className={styles.field}>
        <Select
          id="project-status"
          label="Status"
          {...register('status')}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.field}>
        <label htmlFor="project-description">Description</label>
        <textarea id="project-description" rows={6} {...register('description')} />
        {errors.description ? <p className={styles.error}>{errors.description.message}</p> : null}
      </div>

      <Button type="submit" variant="primary" loading={isSubmitting}>
        {submitLabel ?? (mode === 'create' ? 'Create project' : 'Save changes')}
      </Button>
    </form>
  );
}
