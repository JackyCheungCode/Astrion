# Astrion target directory structure (V2)

This is a target architecture, not a claim that every module is implemented. Keep the current stack and deployment constraints after repository inspection; avoid creating empty layers that do not yet serve a use case.

```text
astrion/
├── apps/
│   ├── web/src/{app,layouts,pages,navigation,providers,hooks,lib,styles,tests}
│   ├── api/src/{bootstrap,routes,middleware,controllers,presenters,errors,health,tests}
│   └── worker/src/{jobs,schedules,consumers,retries,tests}
├── modules/
│   ├── ai-prospecting/
│   ├── lead-management/
│   ├── contacts/
│   ├── companies/
│   ├── accounts/
│   ├── opportunities/
│   ├── activities/
│   ├── tasks/
│   ├── products/
│   ├── pricing/
│   ├── quotes/
│   ├── sales-orders/
│   ├── fulfillment/
│   ├── receivables/
│   ├── payments/
│   ├── documents/
│   ├── campaigns/
│   ├── automation/
│   ├── approvals/
│   ├── notifications/
│   ├── search/
│   ├── imports-exports/
│   ├── reports/
│   ├── dashboard/
│   └── settings/
├── packages/
│   ├── design-system/
│   │   ├── foundations/{colors,typography,spacing,grid,motion,icons,accessibility}
│   │   ├── themes/{white,g10,g90,g100}
│   │   ├── components/{carbon-core,carbon-products,astrion}
│   │   ├── patterns/
│   │   ├── guidelines/
│   │   ├── tokens/
│   │   └── tests/
│   ├── ui/
│   ├── auth/
│   ├── permissions/
│   ├── database/
│   ├── validation/
│   ├── contracts/
│   ├── domain/
│   ├── ai-core/
│   ├── integrations/
│   ├── email/
│   ├── storage/
│   ├── observability/
│   ├── feature-flags/
│   └── config/
├── supabase/{migrations,functions,templates,seed,tests}
├── config/{eslint,typescript,prettier,testing,tooling,design-system}
├── infra/{cloudflare,environments,monitoring,scripts}
├── docs/{architecture,business,data-model,api,ai,security,deployment,design,decisions}
├── tests/{unit,integration,end-to-end,security,performance,fixtures}
├── scripts/
├── .github/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
├── README.md
└── CHANGELOG.md
```

## Standard business module layout

```text
modules/<module-name>/
├── domain/{entities,value-objects,services,policies,events,errors}
├── application/{commands,queries,handlers,dto,workflows}
├── infrastructure/{repositories,providers,mappers,jobs}
├── api/{routes,schemas,serializers}
├── ui/{pages,components,hooks,forms}
├── tests/{unit,integration,fixtures}
└── index.ts
```

Use only the layers a module needs. Cross-module dependencies must go through public exports/contracts; do not import another module's private internals.

## AI Gateway

```text
packages/ai-core/
├── gateway/
├── providers/{adapters,credentials,capability-mapping}
├── model-routing/
├── task-policies/
├── prompt-management/
├── structured-output/
├── usage-metering/
├── budget-controls/
├── evaluations/
├── safety/
└── tests/
```

Business-specific prospecting workflows stay in `modules/ai-prospecting`; provider normalization, routing, budgets, and shared safety controls stay in `packages/ai-core`.

## Settings module

```text
modules/settings/
├── domain/{entities,policies,events}
├── application/{commands,queries,workflows}
├── ui/
│   ├── settings-home/
│   ├── general/
│   ├── organization/
│   ├── users-roles/
│   ├── custom-fields/
│   ├── api-management/
│   ├── ai-providers/
│   ├── ai-models/
│   ├── ai-policies/
│   ├── integrations/
│   ├── notifications/
│   ├── business-rules/
│   ├── workflows/
│   ├── security/
│   ├── data-management/
│   ├── audit-logs/
│   └── appearance/
├── infrastructure/{repositories,encryption,providers}
├── api/{routes,schemas}
└── tests/
```

Separate system, organization, and user preferences. Custom field definitions and values are separate; never turn user-provided field names into SQL identifiers. Store credentials in server-side secret storage or encrypted server-side storage; expose only masked metadata to the browser. Validate custom API base URLs against SSRF.

## Carbon design system

```text
packages/design-system/
├── foundations/{colors,typography,spacing,grid,motion,icons,accessibility}
├── themes/{white,g10,g90,g100}
├── components/{carbon-core,carbon-products,astrion}
├── patterns/{application-shell,data-management,forms,search-and-filter,approval-workflows,feedback}
├── guidelines/
├── tokens/
├── migrations/
└── tests/
```

Use Carbon React and Carbon Icons where compatible with the existing frontend. Include the official component catalogue relevant to the app, themes, tokens, keyboard/focus behavior, accessibility checks, and visual regression. Add Astrion components only where Carbon has no suitable control. Verify version compatibility and licenses before adding product extensions.

## Core business data domains

- Identity and tenancy: organizations, users, memberships, roles, permissions.
- Customer identity: companies, contacts, company-contact relationships, lead source and conversion history.
- AI research: prospecting campaigns/jobs, evidence, enrichment provenance, scoring explanations, review decisions.
- Sales: opportunities, activities, tasks, products, price lists, quotes and quote items.
- Execution: sales orders/items, shipments/items, receivables, payments, allocations, refunds and reconciliation.
- Configuration: organization settings, user preferences, custom field definitions/options/values, AI provider/model metadata, API keys, integration connections, webhook endpoints/deliveries, automation rules and audit logs.

Names above are logical suggestions, not approved migrations. Final schema must be reconciled with the existing Supabase project, data, indexes, RLS, and deployment configuration.
