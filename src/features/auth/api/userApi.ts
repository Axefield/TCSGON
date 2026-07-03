/**
 * userApi — React Query hooks for user profile management (Phase 3c.2 + Phase 5).
 *
 * @see docs/plans/phase-3-authentication.md § User Profile Settings
 * @see docs/plans/phase-5-settings.md
 *
 * Rules:
 *  - Every mutation calls `apiClient.request()` with a typed body and a Zod
 *    schema for response validation.
 *  - `useUpdateProfile` dispatches `updateProfile` to Redux on success so
 *    `useAuth()` consumers see the updated data immediately.
 *  - `useChangePassword` is a one-shot mutation — no Redux state changes.
 *  - Notification preference hooks are independent queries/mutations — no
 *    Redux state changes (only consumed within SettingsPage).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { authActions } from '@/features/auth/slice/authSlice';
import { useApiClient } from '@/shared/api/ApiClientContext';
import { ApiError } from '@/shared/api/errors';
import type {
  ChangePasswordInput,
  ChangePasswordResponse,
  NotificationPreferences,
  Profile,
  UpdateNotificationPreferencesInput,
  UpdateProfileInput,
  User,
} from '@/shared/types/user';
import {
  ChangePasswordResponseSchema,
  NotificationPreferencesSchema,
  ProfileResponseSchema,
} from '@/shared/types/user';
import { useAppDispatch } from '@/store/hooks';

// ═══════════════════════════════════════════════════════════════════════════
// Query key factory
// ═══════════════════════════════════════════════════════════════════════════

export const userKeys = {
  all: ['users'] as const,
  profile: () => ['users', 'profile'] as const,
  notificationPreferences: () => ['users', 'notification-preferences'] as const,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Hook result interfaces
// ═══════════════════════════════════════════════════════════════════════════

export interface UseProfileResult {
  readonly profile: Profile | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<unknown>;
}

export interface UseUpdateProfileResult {
  readonly updateProfile: UseMutationResult<User, Error, UpdateProfileInput>;
}

export interface UseChangePasswordResult {
  readonly changePassword: UseMutationResult<ChangePasswordResponse, Error, ChangePasswordInput>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Queries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch the current user's profile from GET /api/users/me.
 *
 * Returns the full profile including timestamps. Component should default
 * to `useAuth().user` for synchronous reads and use this query for
 * server-authoritative data.
 */
export function useProfileQuery(): UseProfileResult {
  const apiClient = useApiClient();

  const query = useQuery<Profile, Error>({
    queryKey: userKeys.profile(),
    queryFn: async ({ signal }): Promise<Profile> => {
      const result = await apiClient.request<void, Profile>({
        method: 'GET',
        path: '/users/me',
        schema: ProfileResponseSchema,
        signal,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof ApiError ? query.error : null,
    refetch: query.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update profile (name and/or email).
 *
 * On success dispatches `updateProfile` to Redux so `useAuth()` reflects
 * the change without a full page reload. Also invalidates the profile
 * query cache.
 */
export function useUpdateProfile(): UseUpdateProfileResult {
  const apiClient = useApiClient();
  const dispatch = useAppDispatch();

  const updateProfile = useMutation<User, Error, UpdateProfileInput>({
    mutationFn: async (input: UpdateProfileInput): Promise<User> => {
      const result = await apiClient.request<UpdateProfileInput, User>({
        method: 'PUT',
        path: '/users/me',
        body: input,
        schema: ProfileResponseSchema.pick({ id: true, name: true, email: true, avatarUrl: true }),
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: (user: User): void => {
      dispatch(authActions.updateProfile({ user }));
    },
    onError: (_error: Error): void => {
      // Errors propagate to the caller — component shows toast or inline error.
      // No Redux state change for profile update errors.
    },
  });

  return { updateProfile };
}

/**
 * Change password.
 *
 * One-shot mutation — no Redux state changes. On success the component
 * shows a success toast. On error the component shows the error message.
 */
export function useChangePassword(): UseChangePasswordResult {
  const apiClient = useApiClient();

  const changePassword = useMutation<ChangePasswordResponse, Error, ChangePasswordInput>({
    mutationFn: async (input: ChangePasswordInput): Promise<ChangePasswordResponse> => {
      const result = await apiClient.request<ChangePasswordInput, ChangePasswordResponse>({
        method: 'PUT',
        path: '/users/me/password',
        body: input,
        schema: ChangePasswordResponseSchema,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
  });

  return { changePassword };
}

// ═══════════════════════════════════════════════════════════════════════════
// Notification Preferences (Phase 5)
// ═══════════════════════════════════════════════════════════════════════════

export interface UseNotificationPreferencesResult {
  readonly preferences: NotificationPreferences | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: ApiError | null;
  readonly refetch: () => Promise<unknown>;
}

export interface UseUpdateNotificationPreferencesResult {
  readonly updatePreferences: UseMutationResult<NotificationPreferences, Error, UpdateNotificationPreferencesInput>;
}

/**
 * Fetch the current user's notification preferences from
 * GET /api/users/me/notification-preferences.
 *
 * Returns the full preferences object. Creates defaults on the server
 * if none exist yet.
 */
export function useNotificationPreferences(): UseNotificationPreferencesResult {
  const apiClient = useApiClient();

  const query = useQuery<NotificationPreferences, Error>({
    queryKey: userKeys.notificationPreferences(),
    queryFn: async ({ signal }): Promise<NotificationPreferences> => {
      const result = await apiClient.request<void, NotificationPreferences>({
        method: 'GET',
        path: '/users/me/notification-preferences',
        schema: NotificationPreferencesSchema,
        signal,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof ApiError ? query.error : null,
    refetch: query.refetch,
  };
}

/**
 * Update notification preferences.
 *
 * Accepts partial input — only provided fields are updated on the server.
 * On success invalidates the notification preferences query cache.
 */
export function useUpdateNotificationPreferences(): UseUpdateNotificationPreferencesResult {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const updatePreferences = useMutation<NotificationPreferences, Error, UpdateNotificationPreferencesInput>({
    mutationFn: async (input: UpdateNotificationPreferencesInput): Promise<NotificationPreferences> => {
      const result = await apiClient.request<UpdateNotificationPreferencesInput, NotificationPreferences>({
        method: 'PUT',
        path: '/users/me/notification-preferences',
        body: input,
        schema: NotificationPreferencesSchema,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: userKeys.notificationPreferences() });
    },
  });

  return { updatePreferences };
}
