# Customer account notifications

## Boundary and source of truth

Customer password recovery uses the Medusa 2.18.0 Auth and Notification
Modules. The native auth flow owns token generation, expiry, single-use
validation, and password update. The custom code only subscribes to
`auth.password_reset` and asks the Notification Module to deliver a
`password-reset` template. It does not create a password table, token table,
commerce order, or replacement auth route.

The reset token is the token issued by Medusa. It expires after the native
15-minute TTL and a newer request invalidates the previous token. The forgot
password route keeps Medusa's non-enumerating response for both known and
unknown identifiers. The reset page is UX only; the backend update route is
the authority.

## Providers

The default local provider is `src/modules/notification-provider`. It is an
official Notification Module provider extension, selected with
`NOTIFICATION_PROVIDER=sandbox`. It writes a JSONL delivery record to the
ignored `.local/notification-outbox.jsonl` path so local tests can inspect a
message without sending mail. It never logs the recipient, reset URL, reset
token, or message body. The local provider retries a file write once and
returns a generic failure if both attempts fail.

Deployments that have a real sandbox account may select the official Medusa
SendGrid provider with `NOTIFICATION_PROVIDER=sendgrid`,
`SENDGRID_API_KEY`, and `SENDGRID_FROM` in backend-only environment storage.
No production credential is committed. Provider selection is configuration;
the subscriber remains vendor-neutral.

Reset links use `STOREFRONT_URL` and `STOREFRONT_DEFAULT_COUNTRY`. The origin
is validated by the provider and is never hard-coded in backend source. The
email contains an expiry warning, does not contain a password, and does not
reveal whether an account exists.

## Abuse and audit controls

The workspace adds a bounded in-memory limiter for the two customer recovery
routes (five requests per client key in fifteen minutes). This is a local
development guard only. Production must enforce a shared limiter at the edge
or with Redis before exposing multiple backend instances.

Recovery request, update, delivery success, and delivery failure audit events
store a SHA-256 identifier hash and correlation ID. They do not store raw
email, password, reset token, reset URL, or provider secret. Provider failures
are observable as generic backend errors and generic provider logs.

There is intentionally no welcome or password-reset-confirmation delivery in
this milestone: the native reset flow does not require it, and adding another
message would expand the provider contract without a product requirement.

## Verification and deployment status

Unit tests cover provider template validation, outbox delivery, bounded retry,
failure mode, URL construction, and identifier redaction. HTTP/runtime tests
cover non-enumerating reset requests, one-time token use, invalid/reused
tokens, and password replacement. The sandbox provider is suitable for local
development and test verification; production approval still requires a
real provider sandbox/credential, shared rate limiting, delivery monitoring,
and a deployment-specific template review.
