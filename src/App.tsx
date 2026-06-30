/**
 * Root application component — wraps RouterProvider in error boundary.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §10, §31
 *
 * Top-level RootErrorBoundary catches render errors that escape React Router's
 * route-level errorElement (i.e., errors in AppShell itself).
 *
 * Accepts an optional router override for testing (use `createMemoryRouter`
 * in tests to avoid browser API dependencies).
 */
import { RouterProvider } from 'react-router-dom';
import type { RouterProviderProps } from 'react-router-dom';

import { RootErrorBoundary } from '@/routes/RootErrorBoundary';
import { createAppRouter } from '@/routes';

export interface AppProps {
  readonly router?: RouterProviderProps['router'];
}

let productionRouter: RouterProviderProps['router'] | undefined;

function getDefaultRouter(): RouterProviderProps['router'] {
  if (!productionRouter) {
    productionRouter = createAppRouter();
  }
  return productionRouter;
}

export function App({ router }: AppProps): JSX.Element {
  return (
    <RootErrorBoundary>
      <RouterProvider router={router ?? getDefaultRouter()} />
    </RootErrorBoundary>
  );
}
