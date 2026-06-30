/**
 * Branded primitive types — make IDs non-interchangeable at compile time.
 *
 * @see docs/plans/phase-1-core-infrastructure.md §17
 *
 * Pattern: a phantom `__brand` symbol prevents `UserId` from being assignable
 * to/from plain `string` or to other branded types. Construction happens only
 * through the `as*` functions (which cast a trusted `string`) or the `new*`
 * functions (which generate a fresh UUID). Casting literals in test fixtures
 * is allowed; assigning `string` to a branded type without going through
 * `as*` is a compile error.
 */
declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ToastId = Brand<string, 'ToastId'>;
export type ModalId = Brand<string, 'ModalId'>;

export function asUserId(s: string): UserId {
  return s as UserId;
}
export function asSessionId(s: string): SessionId {
  return s as SessionId;
}
export function asToastId(s: string): ToastId {
  return s as ToastId;
}
export function asModalId(s: string): ModalId {
  return s as ModalId;
}

export function newUserId(): UserId {
  return crypto.randomUUID() as UserId;
}
export function newSessionId(): SessionId {
  return crypto.randomUUID() as SessionId;
}
export function newToastId(): ToastId {
  return crypto.randomUUID() as ToastId;
}
export function newModalId(): ModalId {
  return crypto.randomUUID() as ModalId;
}
