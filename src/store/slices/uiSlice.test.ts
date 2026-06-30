import { describe, expect, it } from 'vitest';

import { asModalId, asToastId, newToastId } from '@/shared/types/brand';
import type { ToastEntry } from '@/shared/types/toast';

import {
  clearToasts,
  closeModal,
  dismissToast,
  openModal,
  pinSidebar,
  pushToast,
  setReducedMotion,
  setSidebar,
  setTheme,
  toggleSidebar,
  toggleTheme,
  uiReducer,
  type UiState,
} from './uiSlice';

function createInitialState(overrides?: Partial<UiState>): UiState {
  return {
    theme: 'light',
    sidebar: 'closed',
    toasts: [],
    modals: [],
    reducedMotion: false,
    ...overrides,
  };
}

describe('uiSlice — theme', () => {
  it('exports documented initial state', () => {
    expect(uiReducer(undefined, { type: '@@INIT' })).toEqual(createInitialState());
  });

  it('toggleTheme flips light → dark', () => {
    const next = uiReducer(createInitialState(), toggleTheme());
    expect(next.theme).toBe('dark');
  });

  it('toggleTheme flips dark → light', () => {
    const next = uiReducer(createInitialState({ theme: 'dark' }), toggleTheme());
    expect(next.theme).toBe('light');
  });

  it('setTheme sets theme explicitly', () => {
    const next = uiReducer(createInitialState(), setTheme('dark'));
    expect(next.theme).toBe('dark');
    const back = uiReducer(createInitialState({ theme: 'dark' }), setTheme('light'));
    expect(back.theme).toBe('light');
  });
});

describe('uiSlice — sidebar', () => {
  it('setSidebar sets the sidebar state', () => {
    const next = uiReducer(createInitialState(), setSidebar('pinned'));
    expect(next.sidebar).toBe('pinned');
  });

  it('toggleSidebar flips closed ↔ open', () => {
    const open = uiReducer(createInitialState(), toggleSidebar());
    expect(open.sidebar).toBe('open');
    const closed = uiReducer(createInitialState({ sidebar: 'open' }), toggleSidebar());
    expect(closed.sidebar).toBe('closed');
  });

  it('pinSidebar sets pinned or closed', () => {
    const pinned = uiReducer(createInitialState(), pinSidebar(true));
    expect(pinned.sidebar).toBe('pinned');
    const closed = uiReducer(createInitialState({ sidebar: 'pinned' }), pinSidebar(false));
    expect(closed.sidebar).toBe('closed');
  });
});

describe('uiSlice — toasts', () => {
  const toast: ToastEntry = {
    id: newToastId(),
    kind: 'info',
    message: 'Hello',
    createdAt: Date.now(),
  };

  const toast2: ToastEntry = {
    id: newToastId(),
    kind: 'error',
    message: 'Error!',
    createdAt: Date.now(),
  };

  it('pushToast adds a toast', () => {
    const next = uiReducer(createInitialState(), pushToast(toast));
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0]?.id).toBe(toast.id);
  });

  it('pushToast FIFO caps at 4', () => {
    const t1: ToastEntry = { id: asToastId('1'), kind: 'info', message: '1', createdAt: 1 };
    const t2: ToastEntry = { id: asToastId('2'), kind: 'info', message: '2', createdAt: 2 };
    const t3: ToastEntry = { id: asToastId('3'), kind: 'info', message: '3', createdAt: 3 };
    const t4: ToastEntry = { id: asToastId('4'), kind: 'info', message: '4', createdAt: 4 };
    const t5: ToastEntry = { id: asToastId('5'), kind: 'info', message: '5', createdAt: 5 };

    let state = uiReducer(createInitialState(), pushToast(t1));
    state = uiReducer(state, pushToast(t2));
    state = uiReducer(state, pushToast(t3));
    state = uiReducer(state, pushToast(t4));
    expect(state.toasts).toHaveLength(4);
    expect(state.toasts[0]?.id).toBe(asToastId('1'));

    // 5th toast evicts the oldest (t1)
    state = uiReducer(state, pushToast(t5));
    expect(state.toasts).toHaveLength(4);
    expect(state.toasts[0]?.id).toBe(asToastId('2'));
    expect(state.toasts[3]?.id).toBe(asToastId('5'));
  });

  it('dismissToast removes a specific toast', () => {
    let state = uiReducer(createInitialState(), pushToast(toast));
    state = uiReducer(state, pushToast(toast2));
    expect(state.toasts).toHaveLength(2);

    state = uiReducer(state, dismissToast(toast.id));
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]?.id).toBe(toast2.id);
  });

  it('clearToasts removes all toasts', () => {
    let state = uiReducer(createInitialState(), pushToast(toast));
    state = uiReducer(state, pushToast(toast2));
    state = uiReducer(state, clearToasts());
    expect(state.toasts).toHaveLength(0);
  });
});

describe('uiSlice — modals', () => {
  const modal1 = { id: asModalId('modal-1'), kind: 'confirm', title: 'Confirm' };
  const modal2 = { id: asModalId('modal-2'), kind: 'settings', title: 'Settings' };

  it('openModal adds a modal entry', () => {
    const next = uiReducer(createInitialState(), openModal(modal1));
    expect(next.modals).toHaveLength(1);
    expect(next.modals[0]?.id).toBe(modal1.id);
  });

  it('openModal is idempotent — same id does not add duplicate', () => {
    let state = uiReducer(createInitialState(), openModal(modal1));
    state = uiReducer(state, openModal(modal1));
    expect(state.modals).toHaveLength(1);
  });

  it('closeModal removes a specific modal', () => {
    let state = uiReducer(createInitialState(), openModal(modal1));
    state = uiReducer(state, openModal(modal2));
    expect(state.modals).toHaveLength(2);

    state = uiReducer(state, closeModal(modal1.id));
    expect(state.modals).toHaveLength(1);
    expect(state.modals[0]?.id).toBe(modal2.id);
  });

  it('closeModal on non-existent id is a no-op', () => {
    const state = uiReducer(createInitialState({ modals: [modal1] }), closeModal(asModalId('nope')));
    expect(state.modals).toHaveLength(1);
  });
});

describe('uiSlice — accessibility', () => {
  it('setReducedMotion updates the flag', () => {
    const next = uiReducer(createInitialState(), setReducedMotion(true));
    expect(next.reducedMotion).toBe(true);
    const prev = uiReducer(next, setReducedMotion(false));
    expect(prev.reducedMotion).toBe(false);
  });
});
