# Git and Pull Request Workflow

- Status: Accepted working agreement
- Scope: repository branches, commits, pull requests, and releases
- Last reviewed: 2026-10-24

## 1. Branching
- Do not work directly on `main` for ordinary changes.
- Use short, descriptive branches such as `docs/<topic>`, `feat/<topic>`, `fix/<topic>`, or `chore/<topic>`.
- Keep each branch focused on one coherent change.
- Do not force-push shared branches unless explicitly coordinated and justified.

## 2. Commits
Use concise imperative messages with a conventional prefix when appropriate:
- `docs:` documentation
- `feat:` user-visible capability
- `fix:` defect correction
- `test:` test-only change
- `refactor:` behavior-preserving restructuring
- `chore:` tooling or maintenance
- `security:` security improvement

Do not claim tests or deployments in commit messages unless they actually occurred.

## 3. Pull requests
A PR SHOULD include:
- problem and scope;
- summary of key changes;
- relevant docs/ADR links;
- test commands and actual outcomes;
- security, data migration, rollout, and rollback notes;
- screenshots or recordings for material UI changes.

Reviewers SHOULD verify scope, maintainability, boundary rules, security, test evidence, and docs. Resolve or explicitly record outstanding blockers before merge.

## 4. Merge and release
- Use the repository's required CI and branch protections.
- Do not bypass required checks without explicit authorization and a documented reason.
- Database migrations and infrastructure changes require explicit review and rollout planning.
- Keep CHANGELOG aligned with user-visible or operationally significant changes.
- Never claim a PR is merged until the GitHub result confirms it.

## Acceptance criteria
- [ ] Changes are on a focused branch.
- [ ] PR explains behavior, risks, and verification.
- [ ] Required checks/reviews are satisfied.
- [ ] Merge state is verified after the operation.
