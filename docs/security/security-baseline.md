# Security baseline

- Enforce tenant and organization scoping in server-side authorization and database RLS.
- Never return provider secrets or full API tokens to the browser; display masked metadata only.
- Apply least privilege, expiry, revocation, scopes, rate limits, and audit to API keys.
- Validate external provider URLs and block private/internal network targets to mitigate SSRF.
- Validate and normalize all user input; custom fields must not produce dynamic SQL identifiers or executable code.
- Use explicit approvals for sensitive outreach and business actions.
- Record provenance and confidence for AI-generated/enriched facts; support human review and correction.
- Add tests for tenant isolation, RLS, authorization boundaries, webhook signatures, retries, and idempotency.
- Do not commit real secrets, production data, or personal data in fixtures.
- Database migrations and infrastructure deployments require review and an explicit rollout/rollback plan.
