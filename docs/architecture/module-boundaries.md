# Architecture and Module Boundaries

- Status: Accepted architectural direction; implementation details subject to repository inspection
- Scope: applications, business modules, shared packages, and infrastructure
- Last reviewed: 2026-10-24

## 1. Architectural direction
Astrion SHOULD start as a modular monolith with explicit domain boundaries. The target directory layout in [target-directory-structure.md](../architecture/target-directory-structure.md) is a planning map, not a requirement to create every directory immediately.

## 2. Responsibility layers
- **Domain:** entities, value objects, invariants, policies, domain events, and domain errors. MUST NOT depend on UI frameworks or vendor SDKs.
- **Application:** commands, queries, orchestration, authorization checks, transactions, and use-case DTOs.
- **Infrastructure:** persistence adapters, external providers, queues, storage, and vendor-specific mapping.
- **API:** transport schemas, authentication middleware, serializers, and stable error mapping.
- **UI:** pages, forms, interaction state, and presentation. UI MUST NOT be the sole enforcement point for business rules.

A module SHOULD include only the layers needed by its use cases.

## 3. Dependency rules
1. Cross-module calls MUST use documented public exports or versioned contracts.
2. A module MUST NOT import another module's private internals.
3. Shared packages contain genuinely reusable capabilities, not a dumping ground for business logic.
4. Domain packages MUST NOT depend on app-specific UI or infrastructure packages.
5. External integrations MUST be behind adapters so vendor changes do not leak into domain code.
6. Avoid synchronous cross-module cycles; coordinate workflows through application services or explicit events.

## 4. Key boundaries
- `modules/ai-prospecting`: prospect discovery, research workflow, evidence review, qualification and scoring use cases.
- `packages/ai-core`: provider adapters, model routing, common policies, budget metering, structured output, evaluations and safety controls.
- `modules/settings`: configuration workflows and policy-controlled management UI; secrets remain in secure server-side storage.
- Sales order, fulfillment, receivables, payments, allocations, refunds, and reconciliation are separate business concepts and MUST NOT be collapsed into a single status field.
- `packages/design-system` owns Carbon alignment and Astrion-specific design extensions; product modules consume it rather than inventing competing primitives.

## 5. Integration pattern
External calls SHOULD define timeouts, bounded retries, idempotency where relevant, safe error mapping, observability, and contract tests. Async jobs MUST define retry policy, terminal failure handling, and duplicate-delivery behavior.

## Acceptance criteria
- [ ] Public exports are explicit and documented.
- [ ] No forbidden private cross-module imports or circular dependencies.
- [ ] Business invariants are enforced server-side.
- [ ] Vendor-specific types are mapped at integration boundaries.
- [ ] Architecture changes include an ADR when they materially alter boundaries.
