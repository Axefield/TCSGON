/**
 * uiSlice — Phase 1 extension.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §4, §21
 *
 * Holds UI-only state that crosses 3+ trees (sidebar, toasts, modals) plus
 * the theme token. Toast list is FIFO-capped at 4 to keep render cost bounded.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ModalId, ToastId } from '@/shared/types/brand';
import type { ModalEntry } from '@/shared/types/modal';
import type { ToastEntry } from '@/shared/types/toast';

export type Theme = 'light' | 'dark';
export type SidebarState = 'closed' | 'open' | 'pinned';

export interface UiState {
  readonly theme: Theme;
  readonly sidebar: SidebarState;
  readonly toasts: ReadonlyArray<ToastEntry>;
  readonly modals: ReadonlyArray<ModalEntry>;
  readonly reducedMotion: boolean;
}

const TOAST_CAP = 4;

const initialState: UiState = {
  theme: 'light',
  sidebar: 'closed',
  toasts: [],
  modals: [],
  reducedMotion: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setSidebar(state, action: PayloadAction<SidebarState>) {
      state.sidebar = action.payload;
    },
    toggleSidebar(state) {
      state.sidebar = state.sidebar === 'closed' ? 'open' : 'closed';
    },
    pinSidebar(state, action: PayloadAction<boolean>) {
      state.sidebar = action.payload ? 'pinned' : 'closed';
    },
    pushToast(state, action: PayloadAction<ToastEntry>) {
      const next = [...state.toasts, action.payload];
      // FIFO cap — evict oldest when over the limit.
      state.toasts = next.length > TOAST_CAP ? next.slice(next.length - TOAST_CAP) : next;
    },
    dismissToast(state, action: PayloadAction<ToastId>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
    openModal(state, action: PayloadAction<ModalEntry>) {
      // Idempotent: don't re-open an id that already exists.
      if (state.modals.some((m) => m.id === action.payload.id)) return;
      state.modals = [...state.modals, action.payload];
    },
    closeModal(state, action: PayloadAction<ModalId>) {
      state.modals = state.modals.filter((m) => m.id !== action.payload);
    },
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
  },
});

export const uiActions = uiSlice.actions;
export const {
  setTheme,
  toggleTheme,
  setSidebar,
  toggleSidebar,
  pinSidebar,
  pushToast,
  dismissToast,
  clearToasts,
  openModal,
  closeModal,
  setReducedMotion,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

// Selectors
export const selectTheme = (s: { ui: UiState }): Theme => s.ui.theme;
export const selectSidebar = (s: { ui: UiState }): SidebarState => s.ui.sidebar;
export const selectToasts = (s: { ui: UiState }): ReadonlyArray<ToastEntry> => s.ui.toasts;
export const selectModals = (s: { ui: UiState }): ReadonlyArray<ModalEntry> => s.ui.modals;
export const selectReducedMotion = (s: { ui: UiState }): boolean => s.ui.reducedMotion;
