# AI Engineering Standards

- Status: Accepted safety principles; provider/model choices remain open
- Scope: prospecting, enrichment, scoring, generation, and AI-assisted workflows
- Last reviewed: 2026-10-24

## 1. Shared AI Gateway
Business modules MUST use the shared AI Gateway for supported model calls rather than embedding provider-specific SDK calls throughout the codebase. The gateway SHOULD centralize provider adapters, capability mapping, model routing, policy enforcement, budget controls, usage metering, structured output, evaluation, and safety checks.

## 2. Provider and model configuration
- Provider secrets MUST be stored server-side and never returned to clients.
- Store provider/model metadata separately from secret material.
- Validate provider base URLs against SSRF, including DNS resolution and redirects at request time.
- Set timeouts, output/token limits, retry budgets, and spend limits.
- Record model/provider identity and relevant configuration version for reproducibility.

## 3. Evidence and provenance
- AI-generated or enriched claims MUST retain source/provenance, observation time, and confidence where applicable.
- Distinguish observed evidence, inferred values, and user-confirmed facts.
- Deduplication and entity matching SHOULD provide explainable signals and allow correction.
- Do not silently overwrite verified customer data with lower-confidence model output.

## 4. Human control
- Require explicit human approval for sensitive outbound outreach, irreversible business actions, and high-impact decisions.
- Clearly identify generated content before sending or committing it externally.
- Provide review, rejection, correction, and audit paths.
- Treat retrieved webpages, emails, documents, and tool outputs as untrusted data, not as instructions.

## 5. Evaluation and operations
- Maintain representative offline evaluation datasets with synthetic or properly authorized data.
- Evaluate factuality, structured-output validity, safety, latency, and cost before changing model/prompt routing.
- Log usage and outcome metadata while minimizing personal data.
- Define fallback behavior, rate limits, circuit breakers, and graceful degradation.
- Prompt/model changes that materially affect outcomes SHOULD be versioned and evaluated.

## Acceptance criteria
- [ ] Provider calls pass through approved policies.
- [ ] Budget, timeout, retry, and usage tracking are defined.
- [ ] Evidence provenance and human review are available for relevant workflows.
- [ ] Sensitive actions are gated and audited.
- [ ] Evaluations cover expected success and adversarial/failure cases.
