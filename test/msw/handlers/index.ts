/**
 * Barrel — combines all MSW handler sets into one array.
 *
 * Import this in `test/msw/server.ts` to register all handlers, or
 * import individual handler sets in specific tests when overrides are needed.
 *
 * @example
 *   import { handlers } from '@/test/msw/handlers'; // if aliased
 *   import { handlers } from '../../test/msw/handlers';
 *   server.use(...handlers); // all handlers registered
 */
import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';
import { projectHandlers } from './projects';

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...projectHandlers,
];

export { authHandlers } from './auth';
export { dashboardHandlers } from './dashboard';
export { projectHandlers, resetProjectStore } from './projects';
