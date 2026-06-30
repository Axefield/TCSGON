import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './index';

// Typed wrappers per AGENTS.md §3 — never use raw `useDispatch` / `useSelector`.
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector = <T,>(selector: (state: RootState) => T): T =>
  useSelector(selector);