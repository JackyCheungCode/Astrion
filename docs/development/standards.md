# Development Standards

- Status: Accepted for documentation and proposed implementation work
- Scope: all Astrion code, tests, configuration, and docs
- Last reviewed: 2026-10-24

## 1. General rules
1. Preserve existing working code and configuration; inspect before refactoring.
2. Prefer a modular monolith until measured scale or independent deployment needs justify service extraction.
3. Separate domain rules from framework, database, vendor SDK, and UI details.
4. Validate untrusted input at boundaries; do not rely on client-side validation for security.
5. Every material behavior change MUST include appropriate tests and documentation.
6. Never represent planned behavior as implemented; link claims to code or test evidence where practical.

## 2. Naming and code organization
- Use descriptive, consistent names; avoid unexplained abbreviations.
- Use the repository's established language, formatter, lint rules, and naming conventions after inspection.
- Keep files focused; split by cohesive responsibility, not arbitrary line count.
- Public module exports are intentional APIs. Internal files MUST NOT be imported across module boundaries.
- Avoid circular dependencies and hidden side effects during module import.

## 3. Error handling and observability
- Return stable, documented error codes at external boundaries.
- Do not swallow errors silently; attach safe context and preserve causal chains.
- Logs MUST NOT include passwords, tokens, provider secrets, payment credentials, or unnecessary personal data.
- Include correlation/request identifiers where supported; metrics must avoid unbounded high-cardinality labels.

## 4. Configuration
- Parse and validate configuration at startup or at the owning boundary.
- Provide a documented `.env.example` containing names and safe placeholders only.
- Fail closed for missing security-critical configuration.
- Never commit real secrets or production data.

## 5. Change acceptance
A change is ready for review when:
- [ ] Scope and behavior are documented.
- [ ] Relevant automated tests are added or updated.
- [ ] Lint, typecheck, and relevant test suites pass where configured.
- [ ] Authorization, tenant isolation, failure paths, and idempotency are considered.
- [ ] No secrets or unrelated generated files are included.
- [ ] Rollout and rollback implications are stated for risky changes.

## Exceptions
Exceptions MUST be narrow, justified in the PR, assigned an owner where possible, and time-bounded when the risk can be removed later.
