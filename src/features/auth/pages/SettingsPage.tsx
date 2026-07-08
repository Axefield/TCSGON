/**
 * SettingsPage — profile editor + password change + notification preferences.
 *
 * Three independent forms:
 *   1. Profile section — view and update name/email/avatar
 *   2. Password section — change current password
 *   3. Notification preferences — toggle email, push, in-app, digest, marketing
 *
 * Each form has its own submission handling so errors don't cross-pollinate.
 *
 * @see docs/plans/phase-3-authentication.md § User Profile Settings
 * @see docs/plans/phase-5-settings.md
 *
 * Accessibility:
 *  - `<form noValidate>` with `<label htmlFor>` on every input
 *  - Errors via `aria-describedby` + `aria-invalid`
 *  - Error summary `<div role="alert">` focused on mutation failure
 *  - Autocomplete attributes on all inputs
 *  - Toggle switches use native `<input type="checkbox">` with visible labels
 *    and `aria-describedby` for descriptions
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { type ChangeEventHandler, type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Avatar, Button, ErrorDisplay, Input, Spinner } from '@/shared/components';
import { useToast } from '@/shared/hooks/useToast';
import type {
  ChangePasswordInput,
  UpdateNotificationPreferencesInput,
  UpdateProfileInput,
} from '@/shared/types/user';
import {
  ChangePasswordInputSchema,
  UpdateProfileInputSchema,
} from '@/shared/types/user';

import {
  useChangePassword,
  useNotificationPreferences,
  useProfileQuery,
  useUpdateNotificationPreferences,
  useUpdateProfile,
  useUploadAvatar,
} from '../api/userApi';

import styles from './SettingsPage.module.css';

export function SettingsPage(): ReactElement {
  const toast = useToast();
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  // ── Profile query ─────────────────────────────────────────────
  const { profile, isLoading, isError, error, refetch } = useProfileQuery();

  // ── Notification preferences query ────────────────────────────
  const {
    preferences: notifPrefs,
    isLoading: notifPrefsLoading,
    isError: notifPrefsIsError,
    error: notifPrefsError,
    refetch: refetchNotifPrefs,
  } = useNotificationPreferences();

  // ── Mutations ──────────────────────────────────────────────────
  const { updateProfile } = useUpdateProfile();
  const { uploadAvatar } = useUploadAvatar();
  const { changePassword } = useChangePassword();
  const { updatePreferences } = useUpdateNotificationPreferences();

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
    values: useMemo(
      () => ({
        name: profile?.name ?? '',
        email: profile?.email ?? '',
      }),
      [profile?.name, profile?.email],
    ),
  });

  const currentAvatarUrl = avatarPreviewUrl ?? profile?.avatarUrl ?? null;

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

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

  const handleAvatarChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = '';
      if (!file) return;

      const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif']);
      if (!allowedTypes.has(file.type)) {
        toast.error('Avatar must be a PNG, JPEG, WebP, or AVIF image.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Avatar must be 2 MB or smaller.');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setAvatarPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return previewUrl;
      });

      uploadAvatar.mutate(file, {
        onSuccess: () => {
          toast.success('Avatar updated');
        },
        onError: (err) => {
          URL.revokeObjectURL(previewUrl);
          setAvatarPreviewUrl(null);
          toast.error(err instanceof Error ? err.message : 'Failed to upload avatar.');
        },
      });
    },
    [toast, uploadAvatar],
  );

  // ── Notification toggle handler ───────────────────────────────
  // Single handler keyed by `name` attribute — each toggle input
  // has a `name` matching the API field (e.g. "emailNotifications").
  const handleNotificationChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const field = e.target.name as keyof UpdateNotificationPreferencesInput;
      updatePreferences.mutate(
        { [field]: e.target.checked } as UpdateNotificationPreferencesInput,
        {
          onSuccess: () => {
            toast.success('Notification preferences updated');
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Failed to update preferences');
          },
        },
      );
    },
    [updatePreferences, toast],
  );

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
            <Input
              id="settings-name"
              label="Name"
              type="text"
              autoComplete="name"
              aria-required="true"
              error={profileErrors.name?.message}
              {...registerProfile('name')}
            />
          </div>

          <div className={styles.field}>
            <Input
              id="settings-email"
              label="Email"
              type="email"
              autoComplete="email"
              aria-required="true"
              error={profileErrors.email?.message}
              {...registerProfile('email')}
            />
          </div>

          {/* ── Avatar upload ────────────────────────────── */}
          <div className={styles.field}>
            <div className={styles.avatarRow}>
              <Avatar
                src={currentAvatarUrl ?? undefined}
                alt={profile?.name ?? 'Avatar'}
                name={profile?.name ?? undefined}
                size="xl"
              />
              <div className={styles.avatarUploadControls}>
                <label className={styles.label} htmlFor="settings-avatar-file">
                  Avatar image
                </label>
                <input
                  id="settings-avatar-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className={styles.fileInput}
                  onChange={handleAvatarChange}
                  aria-describedby="settings-avatar-help"
                  disabled={uploadAvatar.isPending}
                />
                <p id="settings-avatar-help" className={styles.helpText}>
                  Upload a PNG, JPEG, WebP, or AVIF image up to 2 MB.
                </p>
                {uploadAvatar.isPending ? (
                  <p className={styles.uploadStatus} role="status">Uploading avatar…</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              disabled={!isProfileDirty}
              loading={isProfileSubmitting || updateProfile.isPending}
            >
              {isProfileSubmitting || updateProfile.isPending ? 'Saving…' : 'Save changes'}
            </Button>
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
            <Input
              id="settings-current-password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              aria-required="true"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />
          </div>

          <div className={styles.field}>
            <Input
              id="settings-new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              aria-required="true"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />
          </div>

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              loading={isPasswordSubmitting || changePassword.isPending}
            >
              {isPasswordSubmitting || changePassword.isPending ? 'Changing…' : 'Change password'}
            </Button>
          </div>
        </form>
      </div>

      <hr className={styles.separator} />

      {/* ── Notification Preferences Section ──────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <p className={styles.sectionDescription}>
          Choose which notifications you would like to receive.
        </p>

        {notifPrefsLoading ? (
          <Spinner label="Loading notification preferences" />
        ) : notifPrefsIsError ? (
          <ErrorDisplay error={notifPrefsError} onRetry={() => void refetchNotifPrefs()} title="Failed to load notification preferences" />
        ) : notifPrefs ? (
          <div className={styles.toggleGroup}>
            {/* eslint-disable jsx-a11y/label-has-associated-control -- label wraps input; text is in nested span */}
            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <span className={styles.toggleLabelText}>Email notifications</span>
                <span id="notif-email-desc" className={styles.toggleDescription}>
                  Receive notifications via email
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="emailNotifications"
                checked={notifPrefs.emailNotifications}
                onChange={handleNotificationChange}
                className={styles.toggle}
                aria-describedby="notif-email-desc"
              />
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <span className={styles.toggleLabelText}>Push notifications</span>
                <span id="notif-push-desc" className={styles.toggleDescription}>
                  Receive push notifications in your browser
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="pushNotifications"
                checked={notifPrefs.pushNotifications}
                onChange={handleNotificationChange}
                className={styles.toggle}
                aria-describedby="notif-push-desc"
              />
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <span className={styles.toggleLabelText}>In-app notifications</span>
                <span id="notif-inapp-desc" className={styles.toggleDescription}>
                  Show notifications within the application
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="inAppNotifications"
                checked={notifPrefs.inAppNotifications}
                onChange={handleNotificationChange}
                className={styles.toggle}
                aria-describedby="notif-inapp-desc"
              />
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <span className={styles.toggleLabelText}>Daily digest</span>
                <span id="notif-digest-desc" className={styles.toggleDescription}>
                  Receive a daily summary of activity
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="dailyDigest"
                checked={notifPrefs.dailyDigest}
                onChange={handleNotificationChange}
                className={styles.toggle}
                aria-describedby="notif-digest-desc"
              />
            </label>

            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <span className={styles.toggleLabelText}>Marketing emails</span>
                <span id="notif-marketing-desc" className={styles.toggleDescription}>
                  Receive product updates and promotional content
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                name="marketingEmails"
                checked={notifPrefs.marketingEmails}
                onChange={handleNotificationChange}
                className={styles.toggle}
                aria-describedby="notif-marketing-desc"
              />
            </label>
            {/* eslint-enable jsx-a11y/label-has-associated-control */}
          </div>
        ) : null}
      </div>
    </section>
  );
}
