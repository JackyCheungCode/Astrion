# API Conventions

- Status: Proposed until the current API framework and transport are confirmed
- Scope: externally or internally consumed HTTP APIs and webhooks
- Last reviewed: 2026-10-24

## 1. Contract design
- Define request and response schemas at every boundary; reject invalid input before business processing.
- Use consistent resource naming and the repository's established casing conventions.
- Use explicit pagination, sorting, and filtering contracts; cap page sizes.
- Distinguish omitted fields from explicit `null` where update semantics require it.
- Do not expose database rows directly as public response contracts.
- Document breaking changes and use a versioning strategy appropriate to the actual API.

## 2. HTTP behavior
- Use HTTP methods and status codes consistently with their semantics.
- Use stable machine-readable error codes and safe human-readable messages.
- Do not expose stack traces, SQL details, provider responses containing secrets, or internal topology.
- Return correlation identifiers when supported.
- Apply authentication, authorization, rate limiting, and tenant scope before accessing protected resources.

## 3. Reliability
- Critical create/execute operations SHOULD support idempotency keys and define key scope and retention.
- Webhook receivers MUST verify signatures and timestamps where the provider supports them.
- Retries MUST be bounded and limited to retryable failures.
- Use optimistic concurrency or equivalent safeguards for edits to quotes, orders, and other versioned records.

## 4. Security
- Validate outbound URLs and block loopback, private, link-local, and metadata-service targets; revalidate redirects to mitigate SSRF.
- Apply least-privilege API scopes, expiry, revocation, and audit.
- Never return full API secrets after creation; reveal a secret only at the narrowest justified moment.
- CORS is not an authorization mechanism.

## 5. Acceptance criteria
- [ ] Request, response, error, auth, and pagination behavior are documented.
- [ ] Authorization and tenant isolation tests cover the endpoint.
- [ ] Invalid input and unexpected provider/database failures are handled safely.
- [ ] Idempotency, rate limiting, and audit needs are addressed.
- [ ] OpenAPI or equivalent contract artifacts are updated if used by the project.
