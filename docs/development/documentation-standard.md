# Markdown Documentation Standard

- Status: Accepted
- Scope: all Markdown files under `docs/` and repository-level guidance
- Last reviewed: 2026-10-24

## 1. Required structure for normative documents
Use the following structure where applicable:
1. Title
2. Metadata: status, scope, last reviewed, owner/team if assigned
3. Purpose and non-goals
4. Normative rules using MUST / MUST NOT / SHOULD / SHOULD NOT / MAY
5. Examples or workflows
6. Acceptance criteria
7. Related documents and external references

Short reference pages MAY omit sections that do not apply.

## 2. Markdown rules
- Use one H1 per document; headings MUST follow a logical hierarchy.
- Use relative links for files within this repository.
- Use fenced code blocks with a language identifier when known.
- Use tables only when comparison is clearer than prose or lists.
- Keep paragraphs focused and lists parallel.
- Use checkboxes for actionable, verifiable work only.
- Prefer stable terms; define acronyms on first use.
- Dates use ISO 8601 format (`YYYY-MM-DD`); timestamps should include timezone when time matters.
- Avoid duplicated normative rules; link to the canonical policy instead.

## 3. Accuracy and maintenance
- Distinguish accepted rules from proposals and implementation status.
- Do not include secrets, credentials, customer personal data, or unredacted production logs.
- External links SHOULD point to official primary documentation.
- Update the index when adding a new normative document.
- Update affected docs in the same PR as the behavior change.

## Review checklist
- [ ] Scope and status are clear.
- [ ] Headings and links are valid.
- [ ] Rules are testable and not contradictory.
- [ ] Planned features are not described as implemented.
- [ ] Security-sensitive examples use synthetic values.
