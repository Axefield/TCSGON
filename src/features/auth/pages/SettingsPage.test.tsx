/**
 * SettingsPage tests.
 *
 * Covers loading, error, profile editing, and password change states.
 *
 * NOTE: Uses vi.spyOn(globalThis, 'fetch') instead of MSW because MSW's
 * setupServer does not intercept native `fetch` on Node.js 24 in the jsdom
 * environment (see DashboardPage.test.tsx for the same approach).
 *
 * @see docs/plans/phase-3-authentication.md § User Profile Settings
 */
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth/authState';
import { authReducer } from '@/features/auth/slice/authSlice';
import { RootErrorBoundary } from '@/routes/RootErrorBoundary';
import { ApiClientProvider } from '@/shared/api/ApiClientContext';
import { createApiClient } from '@/shared/api/client';
import { buildFetchResponse } from '@/shared/test/mockFetch';
import { asSessionId, asUserId } from '@/shared/types/brand';
import { uiReducer } from '@/store/slices/uiSlice';

import { SettingsPage } from './SettingsPage';

const testBaseUrl = 'http://test.local';
const testApiClient = createApiClient({ baseUrl: testBaseUrl });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function createAuthStore(auth: AuthState) {
  return configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState: {
      auth,
      ui: {
        theme: 'light' as const,
        sidebar: 'closed' as const,
        toasts: [],
        modals: [],
        reducedMotion: false,
      },
    },
  });
}

const alice = {
  id: asUserId('user-001'),
  email: 'admin@tcsgon.dev',
  name: 'Admin User',
};
const authedStore = createAuthStore({
  kind: 'authenticated',
  user: alice,
  session: {
    id: asSessionId('s-1'),
    token: 't'.repeat(20),
    expiresAt: '2027-01-01T00:00:00Z',
    user: alice,
  },
});

const PROFILE_RESPONSE = {
  id: 'user-001',
  email: 'admin@tcsgon.dev',
  name: 'Admin User',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const NOTIFICATION_PREFS_RESPONSE = {
  id: 'np-1',
  userId: 'user-001',
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  dailyDigest: true,
  marketingEmails: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function Wrapper({ store }: { store?: ReturnType<typeof createAuthStore> }): ReactElement {
  return (
    <ReduxProvider store={store ?? authedStore}>
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={testApiClient}>
          <MemoryRouter initialEntries={['/settings']}>
            <Routes>
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </MemoryRouter>
        </ApiClientProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

describe('SettingsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  it('shows spinner while loading', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise<Response>(() => {
        /* never resolve — keep query loading */
      }),
    );
    render(<Wrapper />);
    expect(
      screen.getByRole('status', { name: /loading settings/i }),
    ).toBeInTheDocument();
  });

  it('shows error display on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    render(<Wrapper />);

    expect(
      await screen.findByText(/failed to load settings/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /retry/i }),
    ).toBeInTheDocument();
  });

  it('renders profile and password sections', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROFILE_RESPONSE),
    );
    render(<Wrapper />);

    expect(
      await screen.findByRole('heading', { name: /^settings$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^profile$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /change password/i }),
    ).toBeInTheDocument();
  });

  it('populates profile fields with current values', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROFILE_RESPONSE),
    );
    render(<Wrapper />);

    const nameInput = await screen.findByLabelText(/^name$/i);
    const emailInput = await screen.findByLabelText(/^email$/i);
    expect(nameInput).toHaveValue('Admin User');
    expect(emailInput).toHaveValue('admin@tcsgon.dev');
  });

  it('disables save button when no changes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROFILE_RESPONSE),
    );
    render(<Wrapper />);

    await screen.findByLabelText(/^name$/i);
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it('updates profile on save', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE))
      .mockResolvedValueOnce(buildFetchResponse(NOTIFICATION_PREFS_RESPONSE))
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE));

    const user = userEvent.setup();
    render(<Wrapper />);
    await screen.findByLabelText(/^name$/i);

    const nameInput = screen.getByLabelText(/^name$/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).not.toBeDisabled();

    await user.click(saveBtn);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save changes/i }),
      ).toBeDisabled();
    });
  });

  it('changes password on submit', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE))
      .mockResolvedValueOnce(buildFetchResponse(NOTIFICATION_PREFS_RESPONSE))
      .mockResolvedValueOnce(
        buildFetchResponse({ message: 'Password changed successfully.' }),
      );

    const user = userEvent.setup();
    render(<Wrapper />);
    await screen.findByLabelText(/^current password$/i);

    const currentPw = screen.getByLabelText(/^current password$/i);
    const newPw = screen.getByLabelText(/^new password$/i);
    await user.type(currentPw, 'correct-current-password');
    await user.type(newPw, 'new-password-123!');

    const changeBtn = screen.getByRole('button', { name: /change password/i });
    await user.click(changeBtn);

    await waitFor(() => {
      // Form resets on success
      expect(screen.getByLabelText(/^current password$/i)).toHaveValue('');
    });
  });

  it('shows error when current password is wrong', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE))
      .mockResolvedValueOnce(buildFetchResponse(NOTIFICATION_PREFS_RESPONSE))
      .mockResolvedValueOnce(
        buildFetchResponse(
          { error: { code: 'UNAUTHORIZED', message: 'Current password is incorrect.' } },
          { status: 401 },
        ),
      );

    const user = userEvent.setup();
    render(<Wrapper />);
    await screen.findByLabelText(/^current password$/i);

    const currentPw = screen.getByLabelText(/^current password$/i);
    const newPw = screen.getByLabelText(/^new password$/i);
    await user.type(currentPw, 'wrong-password');
    await user.type(newPw, 'new-password-123!');

    const changeBtn = screen.getByRole('button', { name: /change password/i });
    await user.click(changeBtn);

    // API client converts 401 to 'unauthorized' kind with generic message
    // ("Authentication required."). The page displays err.message directly.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /authentication required/i,
    );
  });

  it('shows validation error for short new password', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROFILE_RESPONSE),
    );

    const user = userEvent.setup();
    render(<Wrapper />);
    await screen.findByLabelText(/^current password$/i);

    const newPw = screen.getByLabelText(/^new password$/i);
    await user.type(newPw, 'short');

    const changeBtn = screen.getByRole('button', { name: /change password/i });
    await user.click(changeBtn);

    expect(
      await screen.findByText(/at least 8 characters/i),
    ).toBeInTheDocument();
  });

  // ── Phase 5: Avatar URL field ──────────────────────────────────

  it('renders avatar URL input field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROFILE_RESPONSE),
    );
    render(<Wrapper />);

    expect(
      await screen.findByLabelText(/avatar url/i),
    ).toBeInTheDocument();
  });

  it('shows avatar initials fallback when no avatar URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      buildFetchResponse(PROFILE_RESPONSE),
    );
    render(<Wrapper />);

    // Profile name is "Admin User" → initial "A"
    expect(await screen.findByText('A')).toBeInTheDocument();
  });

  it('shows avatar error state when image fails to load', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(
        buildFetchResponse({
          ...PROFILE_RESPONSE,
          avatarUrl: 'https://example.com/broken.jpg',
        }),
      )
      .mockResolvedValueOnce(buildFetchResponse(NOTIFICATION_PREFS_RESPONSE));

    render(<Wrapper />);

    // Wait for avatar URL field to appear
    await screen.findByLabelText(/avatar url/i);

    // Avatar preview image should be rendered (alt="" → presentation role, query by src)
    const img = document.querySelector('img[src="https://example.com/broken.jpg"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/broken.jpg');

    // Trigger onError — should hide the image
    img!.dispatchEvent(new Event('error'));
    expect(img).toHaveStyle('display: none');
  });

  // ── Phase 5: Notification preferences ──────────────────────────

  it('shows notification preferences loading spinner', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE))
      .mockReturnValueOnce(
        new Promise<Response>(() => {
          /* never resolve — keep notif prefs query loading */
        }),
      );

    render(<Wrapper />);

    expect(
      await screen.findByRole('status', { name: /loading notification preferences/i }),
    ).toBeInTheDocument();
  });

  it('shows notification preferences error state', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE))
      .mockRejectedValueOnce(new Error('Failed to fetch preferences'));

    render(<Wrapper />);

    expect(
      await screen.findByText(/failed to load notification preferences/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /retry/i }),
    ).toBeInTheDocument();
  });

  it('renders and toggles notification preference switches', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(buildFetchResponse(PROFILE_RESPONSE))
      .mockResolvedValueOnce(buildFetchResponse(NOTIFICATION_PREFS_RESPONSE));

    render(<Wrapper />);

    // Wait for notification section to render
    expect(
      await screen.findByRole('heading', { name: /^notifications$/i }),
    ).toBeInTheDocument();

    // All 5 toggles should be visible with their labels
    const emailToggle = screen.getByRole('switch', { name: /email notifications/i });
    const pushToggle = screen.getByRole('switch', { name: /push notifications/i });
    const inAppToggle = screen.getByRole('switch', { name: /in-app notifications/i });
    const digestToggle = screen.getByRole('switch', { name: /daily digest/i });
    const marketingToggle = screen.getByRole('switch', { name: /marketing emails/i });

    expect(emailToggle).toBeChecked();
    expect(pushToggle).toBeChecked();
    expect(inAppToggle).toBeChecked();
    expect(digestToggle).toBeChecked();
    expect(marketingToggle).not.toBeChecked();

    // Each toggle should have aria-describedby pointing to its description
    expect(emailToggle).toHaveAttribute('aria-describedby', 'notif-email-desc');
    expect(pushToggle).toHaveAttribute('aria-describedby', 'notif-push-desc');
    expect(inAppToggle).toHaveAttribute('aria-describedby', 'notif-inapp-desc');
    expect(digestToggle).toHaveAttribute('aria-describedby', 'notif-digest-desc');
    expect(marketingToggle).toHaveAttribute('aria-describedby', 'notif-marketing-desc');

    // Description elements should exist
    expect(screen.getByText('Receive notifications via email')).toBeInTheDocument();
    expect(screen.getByText('Receive push notifications in your browser')).toBeInTheDocument();
    expect(screen.getByText('Show notifications within the application')).toBeInTheDocument();
    expect(screen.getByText('Receive a daily summary of activity')).toBeInTheDocument();
    expect(screen.getByText('Receive product updates and promotional content')).toBeInTheDocument();
  });

  // ── Error boundary ─────────────────────────────────────────────

  it('shows error boundary fallback when a child component crashes', () => {
    const ThrowingChild = () => {
      throw new Error('Settings render crash');
    };

    render(
      <RootErrorBoundary>
        <ThrowingChild />
      </RootErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/settings render crash/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
