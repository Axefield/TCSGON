# Plan — Phase 5: Settings Feature

> Profile settings with avatar support, notification preferences, and full-stack integration.

**Scope:** README.md § Phase 5 — Settings Feature. Profile settings (name, email, avatar), password change, notification preferences.

**Branch:** `feat/phase-5-settings`

**Status:** 🔴 Remediation in progress — 6 blocking issues from review must be resolved before merge.

**Base commit:** `2817937` (HEAD of `main`)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SettingsPage (lazy route)                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Section 1: Profile                                          │    │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐    │    │
│  │  │   Avatar preview │  │  Name field                     │    │    │
│  │  │   (img/initials) │  │  Email field                    │    │    │
│  │  │   + URL input    │  │  Save button                    │    │    │
│  │  └─────────────────┘  └────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Section 2: Password                                         │    │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐    │    │
│  │  │ Current password │  │ New password + confirm         │    │    │
│  │  │ field            │  │ Change password button          │    │    │
│  │  └─────────────────┘  └────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Section 3: Notification Preferences                         │    │
│  │                                                              │    │
│  │  ☑ Email notifications    — "Receive notifications via..."   │    │
│  │  ☑ Push notifications     — "Receive push notifications..."  │    │
│  │  ☑ In-app notifications   — "Show notifications within..."   │    │
│  │  ☑ Daily digest           — "Receive a daily summary..."     │    │
│  │  ☐ Marketing emails       — "Receive product updates..."     │    │
│  │                                                              │    │
│  │  Each toggle → individual mutation → toast + cache refetch   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Data flow:                                                         │
│    User toggle → mutation.mutate → apiClient.request → Express      │
│         ↓                              ↓                            │
│    toast.success                Prisma → PostgreSQL                 │
│         ↓                                                            │
│    invalidateQueries → GET re-fetches updated state                  │
└─────────────────────────────────────────────────────────────────────┘
```

### State decision

| State | Mechanism | Justification |
|---|---|---|
| Profile form values | `react-hook-form` with `values` prop | Local form state, no cross-tree need |
| Password form values | `react-hook-form` with `defaultValues` | Local form state, one-shot mutation |
| Profile data (server) | React Query `useProfileQuery` | Server state, cached 5 min |
| Notification prefs (server) | React Query `useNotificationPreferences` | Server state, cached 5 min |
| Profile update mutation | React Query `useMutation` + Redux `updateProfile` | Redux dispatch needed for `useAuth()` consumers (crosses 3+ trees) |
| Password change mutation | React Query `useMutation` | One-shot, no cross-tree state |
| Notification prefs mutation | React Query `useMutation` | Only consumed within SettingsPage |
| Toast notifications | Redux `uiSlice` (via `useToast`) | Crosses 3+ trees (any feature can trigger) |

### Key design decisions

1. **Individual toggle mutations** — each notification toggle fires a separate `PUT /api/users/me/notification-preferences` with a single field. Rationale: instant feedback, no form submit pattern needed for toggles. Trade-off: 5 API calls if user rapidly toggles everything (acceptable for settings page).

2. **Partial update input** — `UpdateNotificationPreferencesInputSchema` has all optional fields. Server merges with existing prefs. Rationale: individual toggles send only the changed field.

3. **Server-side defaults** — if no `NotificationPreference` row exists for a user, the GET endpoint creates one with all defaults (`true`). GET creates, PUT updates.

4. **Avatar URL as string** — stored directly as `avatarUrl: string | null` on the `User` model. No file upload in Phase 5 — future Phase can add multipart upload. Avatar is a URL to an external image.

5. **Profile update → Redux dispatch** — `useUpdateProfile` dispatches `authActions.updateProfile` on success so `useAuth()` and the TopBar/ProfileMenu reflect changes immediately without refetch.

---

## Folder Structure

### New files

```
src/
└── features/
    └── auth/
        └── api/
            └── userApi.ts            # EXTENDED: +useNotificationPreferences,
                                      #          +useUpdateNotificationPreferences hooks

src/
└── shared/
    └── types/
        └── user.ts                   # EXTENDED: +avatarUrl on UpdateProfileInputSchema,
                                      #          +NotificationPreferencesSchema,
                                      #          +UpdateNotificationPreferencesInputSchema

server/
├── prisma/
│   └── migrations/
│       └── 20260703163043_add_avatar_and_notification_prefs/  # NEW migration
└── src/
    └── services/
        └── notification.ts           # NEW notification preference service
```

### Modified files

```
src/
├── routes/
│   └── index.tsx                     # UPDATED: SettingsPageStub → SettingsPage (lazy)
├── features/
│   └── auth/
│       ├── api/
│       │   └── userApi.ts            # EXTENDED: notification preference hooks
│       ├── components/
│       │   ├── ProfileMenu.tsx        # UPDATED: avatar with fallback initials
│       │   └── ProfileMenu.module.css # UPDATED: avatar styles
│       └── pages/
│           ├── SettingsPage.tsx        # UPDATED: avatar, notification prefs
│           ├── SettingsPage.test.tsx   # UPDATED: new tests
│           └── SettingsPage.module.css # NEW: all settings styles
├── shared/
│   └── types/
│       ├── user.ts                   # EXTENDED: notification schemas
│       └── index.ts                  # EXTENDED: re-exports for notification types

server/
├── prisma/
│   └── schema.prisma                 # UPDATED: +avatarUrl, +NotificationPreference model
│   └── seed.ts                       # UPDATED: +notification preferences seed
├── src/
│   ├── routes/
│   │   ├── users.ts                  # UPDATED: +avatarUrl handling, +notif pref endpoints
│   │   └── __tests__/
│   │       └── users.test.ts         # UPDATED: +notification preference tests
│   ├── services/
│   │   ├── user.ts                   # UPDATED: +avatarUrl handling
│   │   └── notification.ts           # NEW: notification preference service
│   └── test-setup.ts                 # UPDATED: test helpers
```

---

## Data Contracts

### Entity: `UpdateProfileInput` (extended)

```typescript
// In src/shared/types/user.ts
export const UpdateProfileInputSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().nullable().optional(),  // NEW in Phase 5
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
```

### Entity: `NotificationPreferences`

```typescript
// In src/shared/types/user.ts
export const NotificationPreferencesSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),              // 🔴 Should be branded as UserId
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
  dailyDigest: z.boolean(),
  marketingEmails: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
```

### Entity: `UpdateNotificationPreferencesInput`

```typescript
export const UpdateNotificationPreferencesInputSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});
export type UpdateNotificationPreferencesInput = z.infer<
  typeof UpdateNotificationPreferencesInputSchema
>;
```

### HTTP Contract

| Method | URL | Request | Response | UI Hook |
|---|---|---|---|---|
| `GET` | `/api/users/me` | — | `Profile` | `useProfileQuery()` |
| `PUT` | `/api/users/me` | `UpdateProfileInput` | `User` (200) | `useUpdateProfile()` |
| `PUT` | `/api/users/me/password` | `ChangePasswordInput` | `{ message }` (200) | `useChangePassword()` |
| `GET` | `/api/users/me/notification-preferences` | — | `NotificationPreferences` (200) | `useNotificationPreferences()` |
| `PUT` | `/api/users/me/notification-preferences` | `UpdateNotificationPreferencesInput` | `NotificationPreferences` (200) | `useUpdateNotificationPreferences()` |

### Server models (Prisma)

```prisma
model User {
  // ... existing fields ...
  avatarUrl           String?                  // NEW — URL to external avatar image
  notificationPref    NotificationPreference?  // NEW — one-to-one relation
}

model NotificationPreference {
  id                  String   @id @default(uuid())
  userId              String   @unique          // FK to User
  emailNotifications  Boolean  @default(true)
  pushNotifications   Boolean  @default(true)
  inAppNotifications  Boolean  @default(true)
  dailyDigest         Boolean  @default(true)
  marketingEmails     Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Implementation Status

### ✅ Implemented (working tree, uncommitted)

| Component | Lines | Status |
|---|---|---|
| `SettingsPage.tsx` — profile form | ~140 | Complete |
| `SettingsPage.tsx` — password form | ~100 | Complete (existing from Phase 3c) |
| `SettingsPage.tsx` — notification toggles | ~90 | Complete |
| `SettingsPage.module.css` | 254 | Complete |
| `userApi.ts` — `useProfileQuery` | ~25 | Complete |
| `userApi.ts` — `useUpdateProfile` | ~30 | Complete |
| `userApi.ts` — `useNotificationPreferences` | ~30 | Complete |
| `userApi.ts` — `useUpdateNotificationPreferences` | ~25 | Complete |
| `ProfileMenu.tsx` — avatar with fallback | ~30 | Complete |
| `server/prisma/schema.prisma` — `avatarUrl`, `NotificationPreference` | ~15 | Complete |
| `server/prisma/seed.ts` — notification prefs seed | ~30 | Complete |
| `server/src/routes/users.ts` — avatar + notif endpoints | ~40 | Complete |
| `server/src/services/user.ts` — avatarUrl handling | ~5 | Complete |
| `server/src/services/notification.ts` | ~50 | Complete |
| `server/src/routes/__tests__/users.test.ts` — notif tests | ~120 | Complete |
| `src/shared/types/user.ts` — notification schemas | ~40 | Complete |
| `src/shared/types/index.ts` — re-exports | ~8 | Complete |

### 📋 Tests already passing

```
npx vitest run → 395 tests passing (all existing + new)
```

### 🧪 Test coverage

| File | Lines | Branches | Status |
|---|---|---|---|
| `SettingsPage.tsx` | ~80%+ | ~75%+ | ✅ Meets gate (based on report) |
| `ProfileMenu.tsx` | ~85%+ | ~75%+ | ✅ Meets gate |
| `userApi.ts` | ~90%+ | ~80%+ | ✅ Meets gate |

---

## 🔴 Review Findings — Remediation Plan

### Blocking (must fix before merge)

#### B1. `userId` not branded as `UserId`
- **File:** `src/shared/types/user.ts:190`
- **Issue:** `NotificationPreferencesSchema.userId` uses `z.string().min(1)` but should use branded `UserId` type via `.transform(asUserId)`
- **Fix:** Apply `.transform(asUserId)` to match pattern used by all other user ID references
- **Risk:** TypeScript unsafety — could mix up with other string IDs

#### B2. Broken `aria-describedby` reference
- **File:** `src/features/auth/pages/SettingsPage.tsx:477`
- **Issue:** First notification toggle references `aria-describedby="notif-email-desc"` but no element with `id="notif-email-desc"` exists
- **Fix:** Add `id="notif-email-desc"` to the corresponding `.toggleDescription` span, or remove the attribute
- **Risk:** WCAG 4.1.2 — screen readers silently ignore dangling references

#### B3. Missing `aria-describedby` on toggles 2–5
- **File:** `src/features/auth/pages/SettingsPage.tsx:488–543`
- **Issue:** Only Email toggle links its description; Push, In-app, Daily digest, Marketing have no programmatic link
- **Fix:** Add unique `aria-describedby` references to all 5 toggles (e.g., `notif-push-desc`, `notif-inapp-desc`, etc.)
- **Risk:** Screen reader users navigating by form controls hear label but miss description

#### B4. Error summary contrast failure (WCAG 1.4.3)
- **File:** `src/features/auth/pages/SettingsPage.module.css:209`
- **Issue:** `.errorSummary` uses `color: var(--color-error, #dc2626)` on `background: var(--color-error-bg, #fef2f2)` → ~4.42:1 contrast, below 4.5:1 minimum
- **Fix:** Use `color: var(--color-danger-text, #991b1b)` (already defined in project tokens)
- **Risk:** WCAG 1.4.3 — text contrast below minimum for 14px text

#### B5. Unchecked toggle switch contrast failure (WCAG 1.4.11)
- **File:** `src/features/auth/pages/SettingsPage.module.css:132`
- **Issue:** `.toggle` unchecked uses `background: var(--color-border, #cbd5e1)` on white → ~1.48:1, far below 3:1 UI component minimum
- **Fix:** Darken to at least `#64748b` (~4.8:1) or add a visible border
- **Risk:** WCAG 1.4.11 — non-text contrast below minimum for UI components

#### B6. `defaultChecked` instead of `checked` — UI desync
- **File:** `src/features/auth/pages/SettingsPage.tsx:474`
- **Issue:** All 5 notification toggles use `defaultChecked={notifPrefs.*}` making them uncontrolled. After mutation succeeds and `refetchNotifPrefs` fires, the checkbox does NOT update because `defaultChecked` only applies on initial mount
- **Fix:** Change to `checked={notifPrefs.*}` (controlled) with `onChange` handlers
- **Risk:** UI desyncs from server state on rapid toggles or after error recovery

### 🟡 Moderate (should fix before merge)

#### M1. `defaultValues` AND `values` both passed to `useForm`
- **File:** `src/features/auth/pages/SettingsPage.tsx:81–91`
- **Issue:** When `values` is supplied, `defaultValues` is completely ignored (dead code). Also, inline object literal on lines 86–90 creates a new reference every render causing RHF to re-run comparison logic
- **Fix:** Remove `defaultValues`, keep only `values`, wrap in `useMemo` keyed on `profile`

#### M2. Unsafe `as HTMLImageElement` casts
- **Files:** `SettingsPage.tsx:341` and `ProfileMenu.tsx:189`
- **Issue:** Two `onError` handlers cast `e.target as HTMLImageElement` bypassing type safety
- **Fix:** Use `e.currentTarget` with `instanceof` narrowing

#### M3. Direct DOM manipulation for image fallback
- **File:** `ProfileMenu.tsx:187–199`
- **Issue:** Avatar `onError` handler mutates `style.display` and traverses `nextElementSibling` — couples behavior to DOM ordering, bypasses React reconciliation
- **Fix:** Use `useState<boolean>` to track error state and conditionally render `<img>` vs initials

#### M4. Double refetch on notification toggle
- **Files:** `userApi.ts:243` + `SettingsPage.tsx:137`
- **Issue:** Each toggle handler calls BOTH `queryClient.invalidateQueries(...)` (in mutation's `onSuccess`) AND `refetchNotifPrefs()` (in component's `onSuccess`) → two GET requests per toggle
- **Fix:** Remove the explicit `refetchNotifPrefs()` call — `invalidateQueries` already triggers a background refetch

### 💡 Non-blocking suggestions

#### S1. Consolidate 5 identical `useCallback` handlers
- **Files:** `SettingsPage.tsx:130–218`
- **Issue:** `handleEmailNotificationChange` through `handleMarketingEmailChange` differ only by the field key
- **Fix:** Use a single parameterized handler reading `e.target.name`

#### S2. Redundant re-exports
- **File:** `src/shared/types/index.ts:5–12`
- **Issue:** `export * from './user'` (line 4) already exports everything. Explicit `export type` + `export` blocks are noise
- **Fix:** Remove the redundant explicit exports

#### S3. No loading/error state for notification preferences
- **File:** `SettingsPage.tsx:460`
- **Issue:** If notification prefs query fails, entire section renders `null` with no error feedback
- **Fix:** Add error display for parity with profile section

#### S4. Stale JSDoc
- **File:** `src/routes/index.tsx:12`
- **Issue:** Comments still reference `SettingsPageStub` instead of `SettingsPage`
- **Fix:** Update JSDoc comment

#### S5. Missing test coverage
- **File:** `SettingsPage.test.tsx`
- **Issue:** No tests for avatar URL field rendering, avatar preview error state, or notification toggle interactions
- **Fix:** Add tests for these paths

#### S6. Plural inconsistency
- **File:** `server/prisma/schema.prisma:22`
- **Issue:** Relation field `notificationPref` (singular) while all others use plural (`sessions`, `activityLogs`)
- **Fix:** Rename to `notificationPreferences` for consistency

---

## Remediation Work Plan

```mermaid
gantt
    title Phase 5 Settings — Remediation
    dateFormat  YYYY-MM-DD
    section Blocking
    B1 Brand userId as UserId           : B1, 1d
    B2 Fix aria-describedby ref          : B2, after B1, 1d
    B3 Add aria-describedby toggles 2–5  : B3, after B2, 1d
    B4 Fix error summary contrast        : B4, after B3, 1d
    B5 Fix toggle switch contrast        : B5, after B4, 1d
    B6 defaultChecked → checked          : B6, after B5, 1d
    section Moderate
    M1 Remove dead defaultValues         : M1, after B6, 1d
    M2 Fix unsafe type casts             : M2, after M1, 1d
    M3 React-ify image fallback          : M3, after M2, 1d
    M4 Remove double refetch             : M4, after M3, 1d
    section Polish
    S1 Consolidate toggle handlers       : S1, after M4, 1d
    S2 Clean up redundant exports        : S2, after S1, 1d
    S3 Add notif prefs error state       : S3, after S2, 1d
    S4 Fix stale JSDoc                   : S4, after S3, 1d
    S5 Add missing tests                 : S5, after S4, 1d
    S6 Rename notificationPref           : S6, after S5, 1d
```

### Order of operations

1. **Fix type safety issues first** (B1, M1, M2) — changing type contracts may affect other files
2. **Fix React state bugs** (B6, M3, M4) — functional correctness
3. **Fix accessibility issues** (B2, B3, B4, B5) — WCAG compliance
4. **Polish** (S1–S6) — code quality, docs, tests

---

## Verification

### Before merge

```bash
pnpm lint                # ESLint — zero errors
pnpm typecheck           # tsc --noEmit — zero errors
pnpm test                # Vitest — all 395+ tests passing
pnpm test --coverage     # 80% lines / 75% branches / 80% functions
pnpm build               # bundle within budget
pnpm axe                 # zero critical/serious violations
```

### Manual checks

- [ ] Avatar URL input: valid URL → preview shows image; invalid URL → initials fallback
- [ ] Avatar URL input: empty → clear avatar, show initials
- [ ] Notification toggles: toggle on → mutation succeeds → toast → switch stays synced
- [ ] Notification toggles: toggle off → mutation succeeds → toast → switch stays synced
- [ ] Notification toggles: rapid toggle → no UI desync
- [ ] Error summary contrast checked via DevTools
- [ ] Toggle switch contrast checked via DevTools
- [ ] Keyboard: Tab through all toggles → visible focus ring
- [ ] Screen reader: NVDA/VoiceOver → toggles announce state + description

### Post-merge

- [ ] Update README.md — mark Phase 5 as ✅
- [ ] Update roadmap.md — mark Phase 5 items as complete
- [ ] CHANGELOG.md entry: `feat: Settings page with avatar and notification preferences`

---

## Risks

| Risk | Mitigation |
|---|---|
| Migration not committed | Verify `server/prisma/migrations/20260703163043_add_avatar_and_notification_prefs/` is committed |
| Uncommitted changes to main files | All changes are in working tree; ensure nothing is accidentally modified |
| Toggle UI desync if mutation fails | B6 fix ensures controlled component — error toast shown, switch returns to server value on refetch |
| Avatar URL XSS | URL is displayed in `<img src>` only — no injection vector. CSP blocks inline scripts |
