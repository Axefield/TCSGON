/**
 * SettingsPage — profile editor + password change.
 *
 * Two independent forms:
 *   1. Profile section — view and update name/email
 *   2. Password section — change current password
 *
 * Each form has its own submission handling so errors don't cross-pollinate.
 *
 * @see docs/plans/phase-3-authentication.md § User Profile Settings
 *
 * Accessibility:
 *  - `<form noValidate>` with `<label htmlFor>` on every input
 *  - Errors via `aria-describedby` + `aria-invalid`
 *  - Error summary `<div role="alert">` focused on mutation failure
 *  - Autocomplete attributes on all inputs
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { ErrorDisplay, Spinner } from '@/shared/components';
import { useToast } from '@/shared/hooks/useToast';
import type { ChangePasswordInput, UpdateProfileInput } from '@/shared/types/user';
import {
  ChangePasswordInputSchema,
  UpdateProfileInputSchema,
} from '@/shared/types/user';

import { useChangePassword, useProfileQuery, useUpdateProfile } from '../api/userApi';

import styles from './SettingsPage.module.css';

export function SettingsPage(): ReactElement {
  const toast = useToast();

  // ── Profile query ─────────────────────────────────────────────
  const { profile, isLoading, isError, error, refetch } = useProfileQuery();

  // ── Mutations ──────────────────────────────────────────────────
  const { updateProfile } = useUpdateProfile();
  const { changePassword } = useChangePassword();

  // ── Profile form ───────────────────────────────────────────────
  const profileErrorRef = useRef<HTMLDivElement>(null);
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setError: setProfileError,
    reset: resetProfileForm,
    getValues: getProfileValues,
    formState: {
      errors: profileErrors,
      isSubmitting: isProfileSubmitting,
      isDirty: isProfileDirty,
    },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileInputSchema),
    defaultValues: {
      name: profile?.name ?? '',
      email: profile?.email ?? '',
    },
    values: { name: profile?.name ?? '', email: profile?.email ?? '' },
  });

  const onProfileSubmit = handleProfileSubmit(async (data) => {
    // Strip unchanged fields
    const payload: UpdateProfileInput = {};
    if (data.name !== profile?.name && data.name !== undefined) {
      payload.name = data.name;
    }
    if (data.email !== profile?.email && data.email !== undefined) {
      payload.email = data.email;
    }

    // Nothing to update
    if (Object.keys(payload).length === 0) {
      return;
    }

    updateProfile.mutate(payload, {
      onSuccess: () => {
        toast.success('Profile updated');
        // Reset form with current values so defaultValues are updated
        // and dirty flag is cleared.
        resetProfileForm(getProfileValues());
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Failed to update profile.';
        setProfileError('root', { message });
        profileErrorRef.current?.focus();
      },
    });
  });

  // ── Password form ──────────────────────────────────────────────
  const passwordErrorRef = useRef<HTMLDivElement>(null);
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setError: setPasswordError,
    reset: resetPasswordForm,
    formState: {
      errors: passwordErrors,
      isSubmitting: isPasswordSubmitting,
    },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInputSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onPasswordSubmit = handlePasswordSubmit(async (data) => {
    changePassword.mutate(data, {
      onSuccess: () => {
        toast.success('Password changed');
        resetPasswordForm();
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Failed to change password.';
        setPasswordError('root', { message });
        passwordErrorRef.current?.focus();
      },
    });
  });

  // ── Guard: loading ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className={styles.page}>
        <Spinner label="Loading settings" />
      </section>
    );
  }

  // ── Guard: error ───────────────────────────────────────────────
  if (isError && error) {
    return (
      <section className={styles.page}>
        <ErrorDisplay error={error} onRetry={() => void refetch()} title="Failed to load settings" />
      </section>
    );
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <section className={styles.page}>
      <div className={styles.headerStack}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>Manage your account settings and password.</p>
      </div>

      {/* ── Profile Section ─────────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>

        <form noValidate onSubmit={onProfileSubmit}>
          {profileErrors.root ? (
            <div ref={profileErrorRef} role="alert" tabIndex={-1} className={styles.errorSummary}>
              {profileErrors.root.message}
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="settings-name" className={styles.label}>
              Name
            </label>
            <input
              id="settings-name"
              type="text"
              autoComplete="name"
              aria-required="true"
              aria-invalid={profileErrors.name ? 'true' : undefined}
              aria-describedby={profileErrors.name ? 'settings-name-error' : undefined}
              {...registerProfile('name')}
              className={`${styles.input} ${profileErrors.name ? styles.inputError : styles.inputNormal}`}
            />
            {profileErrors.name ? (
              <p id="settings-name-error" role="alert" className={styles.errorText}>
                {profileErrors.name.message}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="settings-email" className={styles.label}>
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={profileErrors.email ? 'true' : undefined}
              aria-describedby={profileErrors.email ? 'settings-email-error' : undefined}
              {...registerProfile('email')}
              className={`${styles.input} ${profileErrors.email ? styles.inputError : styles.inputNormal}`}
            />
            {profileErrors.email ? (
              <p id="settings-email-error" role="alert" className={styles.errorText}>
                {profileErrors.email.message}
              </p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={isProfileSubmitting || !isProfileDirty || updateProfile.isPending}
              aria-busy={isProfileSubmitting || updateProfile.isPending}
              className={styles.submitButton}
            >
              {isProfileSubmitting || updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      <hr className={styles.separator} />

      {/* ── Password Section ───────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Change password</h2>

        <form noValidate onSubmit={onPasswordSubmit}>
          {passwordErrors.root ? (
            <div ref={passwordErrorRef} role="alert" tabIndex={-1} className={styles.errorSummary}>
              {passwordErrors.root.message}
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="settings-current-password" className={styles.label}>
              Current password
            </label>
            <input
              id="settings-current-password"
              type="password"
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={passwordErrors.currentPassword ? 'true' : undefined}
              aria-describedby={passwordErrors.currentPassword ? 'settings-current-password-error' : undefined}
              {...registerPassword('currentPassword')}
              className={`${styles.input} ${passwordErrors.currentPassword ? styles.inputError : styles.inputNormal}`}
            />
            {passwordErrors.currentPassword ? (
              <p id="settings-current-password-error" role="alert" className={styles.errorText}>
                {passwordErrors.currentPassword.message}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="settings-new-password" className={styles.label}>
              New password
            </label>
            <input
              id="settings-new-password"
              type="password"
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={passwordErrors.newPassword ? 'true' : undefined}
              aria-describedby={passwordErrors.newPassword ? 'settings-new-password-error' : undefined}
              {...registerPassword('newPassword')}
              className={`${styles.input} ${passwordErrors.newPassword ? styles.inputError : styles.inputNormal}`}
            />
            {passwordErrors.newPassword ? (
              <p id="settings-new-password-error" role="alert" className={styles.errorText}>
                {passwordErrors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={isPasswordSubmitting || changePassword.isPending}
              aria-busy={isPasswordSubmitting || changePassword.isPending}
              className={styles.submitButton}
            >
              {isPasswordSubmitting || changePassword.isPending ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
