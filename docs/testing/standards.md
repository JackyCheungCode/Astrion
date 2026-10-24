# Testing Standards

- Status: Accepted test strategy; commands and tools must match the inspected repository
- Scope: application code, data policies, integrations, UI, and infrastructure configuration
- Last reviewed: 2026-10-24

## 1. Test layers
- **Unit:** domain rules, value objects, pure functions, validators, and policy decisions.
- **Integration:** database adapters, RLS, queues, storage, provider adapters, and transaction boundaries.
- **Contract:** API schemas, webhook payloads, and external integration assumptions.
- **End-to-end:** critical user journeys and authorization boundaries.
- **Security:** tenant isolation, privilege escalation, SSRF, secret exposure, webhook signatures, and abuse limits.
- **Accessibility/visual:** keyboard navigation, focus, semantic labels, Carbon behavior, responsive layout, and critical-page visual regressions.
- **Performance:** representative query, list, search, and background-job workloads.

## 2. Test quality
- Tests MUST be deterministic and isolate mutable state.
- Use synthetic fixtures; never commit production customer data or secrets.
- Prefer behavior assertions over brittle implementation-detail assertions.
- Cover success, invalid input, permission denied, not found, conflict, timeout, retry, duplicate delivery, and partial failure where relevant.
- Avoid tests that pass by skipping the behavior under test.

## 3. Critical business invariants
- Lead conversion does not silently duplicate companies or contacts.
- Quote revisions preserve historical terms.
- Order, shipment, receivable, payment, allocation, and refund states remain distinct.
- Repeated critical requests/jobs do not create duplicate financial or outreach side effects.
- One tenant cannot read or mutate another tenant's data.
- AI facts retain provenance and sensitive actions require approval.

## 4. Delivery gates
Use the project's actual scripts after inspection. A PR SHOULD pass formatting/lint, type checking, relevant tests, build, dependency/security checks, and accessibility checks applicable to the change. Do not claim a check passed unless it was executed and its result observed.

## Acceptance criteria
- [ ] Tests cover changed behavior and relevant regressions.
- [ ] Security and tenant-boundary tests cover affected data paths.
- [ ] Flaky or skipped tests are disclosed and tracked.
- [ ] Test commands and environment requirements are documented.
