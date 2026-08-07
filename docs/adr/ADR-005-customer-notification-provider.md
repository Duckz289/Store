# ADR-005: Customer password-recovery notification boundary

## Context

Medusa 2.18.0 owns customer auth identities, reset-token generation, expiry,
single-use validation, and password update. The storefront needs a real reset
message, but the workspace does not yet have a production email credential or
provider contract. Medusa's local notification provider logs notification
data, which would expose reset material during development.

## Decision

- Keep the Medusa Auth Module and native `auth.password_reset` event as the
  source of truth. Do not create custom token, password, session, or order
  tables and do not modify Medusa core.
- Register one official Notification Module provider extension. The default
  sandbox provider writes a private ignored JSONL outbox for local tests and
  never logs notification data. It accepts only the email channel and the
  password-reset templates required by this milestone.
- Keep the subscriber vendor-neutral. It resolves the Notification Module,
  builds the reset URL from `STOREFRONT_URL` and country configuration, and
  calls `createNotifications`. A deployment may select Medusa's official
  SendGrid provider through backend-only environment variables without
  changing the subscriber or source code.
- Add route middleware only for the native customer reset/update endpoints:
  generic non-enumerating responses remain owned by Medusa, while the custom
  middleware adds a bounded local rate limit and redacted audit events.
- Audit records use a SHA-256 identifier hash and correlation ID; raw email,
  password, reset token, reset URL, and provider secret are excluded.

## Consequences

The implementation is testable without production credentials and preserves
Medusa's one-time 15-minute reset primitive. The local rate limiter is not a
multi-instance production control; deployment must add a shared edge/Redis
limiter and provider delivery monitoring. Production email delivery remains a
deployment decision and is not approved by the sandbox outbox.

## Verification

Frozen install, lint, backend/storefront typecheck, unit tests, HTTP integration
tests, production builds, Store API smoke, account recovery runtime smoke,
guest checkout regression, Admin auth/MFA smoke, and the dependency audit all
passed on 2026-08-07. No dependency or lockfile resolution changed.
