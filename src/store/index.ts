import { configureStore } from '@reduxjs/toolkit';

import { uiReducer } from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
  // Phase 0: keep devtools on for DX; tighten in Phase 7 (CI).
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;