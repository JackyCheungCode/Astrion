# Astrion Documentation Index

> Status: architecture and development standards baseline. This documentation does not imply that planned features are implemented.

## Normative language
**MUST / MUST NOT** are mandatory; **SHOULD / SHOULD NOT** are strong recommendations that require a recorded rationale to deviate from; **MAY** is optional.

## Start here
- [Development standards](development/standards.md)
- [Architecture and module boundaries](architecture/module-boundaries.md)
- [API conventions](api/conventions.md)
- [Data and database conventions](data/data-conventions.md)
- [AI engineering standards](ai/engineering-standards.md)
- [UI and Carbon governance](../design/carbon-governance.md)
- [Security baseline](../security/security-baseline.md)
- [Testing standards](testing/standards.md)
- [Git and pull request workflow](development/git-workflow.md)
- [Implementation progress](../architecture/implementation-progress.md)

## Document lifecycle
Each normative document MUST state scope, status, owner/team (when assigned), last-reviewed date, rules, acceptance criteria, and related references. Decisions that materially constrain architecture SHOULD be recorded as an ADR under `docs/decisions/`.

## Status vocabulary
- **Proposed** — under discussion; not binding until approved.
- **Accepted** — normative for new work.
- **Deprecated** — avoid for new work; migration guidance is required.
- **Superseded** — replaced by a linked document or ADR.
- **Implemented** — only when code and verification evidence exist; never use this status for plans alone.

## Baseline guardrail
Inspect the actual repository, manifests, deployed services, and Supabase state before choosing packages or changing runtime architecture. Do not run migrations or deploy infrastructure without explicit review.
