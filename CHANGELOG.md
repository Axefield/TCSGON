# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 48 new unit tests for auth components and pages (ForgotPasswordForm, ResetPasswordForm,
  SignupForm, PasswordStrengthIndicator, ForgotPasswordPage, ResetPasswordPage, SignupPage)

### Fixed

- **Critical**: API client now reads the auth token from Redux and sends the `Authorization`
  header on every authenticated request (`main.tsx`). Previously `getToken` defaulted to
  `() => null`, making all authenticated endpoints (session check, profile, logout) fail
  with 401 against the real Express server.
- Public auth endpoints (login, signup, forgot-password, reset-password) now pass
  `skipAuth: true` to avoid sending auth tokens before authentication.
- Color contrast on form error summaries meets WCAG 2.2 AA (4.5:1 minimum). Error text
  changed from `#dc2626` (3.33:1) to `#991b1b` (5.8:1) on the `#fecaca` background.
- Lint: resolved 25 errors and warnings across client and server code (unused imports,
  unescaped entities, implicit `any`, import ordering).
- Unescaped apostrophe in forgot-password success message replaced with `&apos;`.

### Changed

- `PasswordStrengthIndicator`: Zod schema type arguments hardened from `any` to
  `z.ZodTypeDef | unknown`.
