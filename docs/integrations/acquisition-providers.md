# AI acquisition provider configuration

The `acquisition-research` Supabase Edge Function is the server-side boundary for public-web research. Provider credentials must never be placed in `VITE_*` variables or committed files.

## Secrets

Create a local, ignored `.env.functions` file or set secrets in the Supabase project:

```dotenv
APP_ORIGIN=http://localhost:5173
SERPER_API_KEY=
TAVILY_API_KEY=
WORKS_API_URL=
WORKS_API_KEY=
```

For local development, load secrets with `supabase functions serve acquisition-research --env-file .env.functions`. For a deployed project, use `supabase secrets set --env-file .env.functions` and deploy with `supabase functions deploy acquisition-research`. Set `APP_ORIGIN` to the exact production web origin before deployment.

The Edge Function uses Serper's Google Search endpoint and Tavily's search endpoint from the server. It accepts only authenticated users with an active workspace membership, validates the selected workspace against that user's active memberships, caps a request at ten results per provider, applies timeouts, and records a minimal audit event. When the user has multiple workspaces, the request must include the selected workspace ID from the Carbon workspace selector. Lead persistence is opt-in and writes candidates to the lead review queue; it does not send outreach.

## Works API contract

The Works adapter is deliberately configured by a full `WORKS_API_URL` endpoint because the exact vendor product/API contract has not yet been confirmed. When both Serper and Tavily are selected and both Works secrets are present, the function sends a POST request with a bearer token and this JSON body:

- `query`: the research query
- `candidates`: up to ten `{ title, domain, url }` company candidates
- `requested_fields`: `company_profile` and `public_business_contact_channels`

The endpoint should return JSON. Its response is passed back to the authenticated user for review and is **not automatically written to contacts**. Confirm the actual Works API endpoint, authorization method, request schema, response schema, rate limits, and permitted use with the provider before configuring it. Do not point `WORKS_API_URL` at a URL supplied by an end user.

## Current limitations

- Search results are evidence candidates, not verified company facts. Review URLs and snippets before qualification. The 'traceable source' filter excludes results without a non-empty snippet; it does not independently fetch or verify the publisher's current page.
- The first release does not perform AI-based ICP/intent scoring, infer missing contact data, or automate email/call outreach. It can optionally show a transparent evidence-completeness heuristic based on source corroboration, title/snippet quality, and Tavily relevance; this is not a trained model and must not be interpreted as purchase intent.
- Deduplication is a conservative website-match check; use the CRM duplicate-review module for broader matching.
- The function does not store raw Works responses or personal contact details automatically.
Initial server-side limits are 20 searches per user and 200 per workspace per rolling hour. Provider-specific spend budgets, retry queues, usage dashboards, and retention cleanup remain to be implemented.
