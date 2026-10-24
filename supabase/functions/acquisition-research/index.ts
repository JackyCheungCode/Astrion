import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProviderName = "serper" | "tavily";
type SearchResult = {
  provider: ProviderName;
  providers: ProviderName[];
  title: string;
  url: string;
  snippet: string;
  score?: number;
  domain: string;
};

const APP_ORIGIN = Deno.env.get("APP_ORIGIN") ?? "http://localhost:5173";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getDomain(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function normalizeSerper(payload: Record<string, unknown>, maxResults: number): SearchResult[] {
  const organic = Array.isArray(payload.organic) ? payload.organic : [];
  return organic.slice(0, maxResults).flatMap((item: Record<string, unknown>) => {
    const url = typeof item.link === "string" ? item.link : "";
    const domain = getDomain(url);
    if (!domain) return [];
    return [{
      provider: "serper" as const,
      providers: ["serper"] as ProviderName[],
      title: String(item.title ?? domain).slice(0, 240),
      url,
      snippet: String(item.snippet ?? "").slice(0, 1200),
      domain,
    }];
  });
}

function normalizeTavily(payload: Record<string, unknown>, maxResults: number): SearchResult[] {
  const results = Array.isArray(payload.results) ? payload.results : [];
  return results.slice(0, maxResults).flatMap((item: Record<string, unknown>) => {
    const url = typeof item.url === "string" ? item.url : "";
    const domain = getDomain(url);
    if (!domain) return [];
    const score = typeof item.score === "number" ? item.score : undefined;
    return [{
      provider: "tavily" as const,
      providers: ["tavily"] as ProviderName[],
      title: String(item.title ?? domain).slice(0, 240),
      url,
      snippet: String(item.content ?? "").slice(0, 1200),
      ...(score === undefined ? {} : { score }),
      domain,
    }];
  });
}

async function searchSerper(query: string, maxResults: number): Promise<SearchResult[]> {
  const apiKey = Deno.env.get("SERPER_API_KEY");
  if (!apiKey) throw new Error("Serper provider is not configured");
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num: maxResults }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Serper request failed (HTTP ${response.status})`);
  return normalizeSerper(await response.json(), maxResults);
}

async function searchTavily(query: string, maxResults: number): Promise<SearchResult[]> {
  const apiKey = Deno.env.get("TAVILY_API_KEY");
  if (!apiKey) throw new Error("Tavily provider is not configured");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      topic: "general",
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Tavily request failed (HTTP ${response.status})`);
  return normalizeTavily(await response.json(), maxResults);
}

function mergeResults(results: SearchResult[]): SearchResult[] {
  const merged = new Map<string, SearchResult>();
  for (const result of results) {
    const key = result.url.split("#")[0].replace(/\/$/, "").toLowerCase();
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, result);
      continue;
    }
    previous.providers = [...new Set([...previous.providers, ...result.providers])];
    if (result.snippet.length > previous.snippet.length) previous.snippet = result.snippet;
    if (result.score !== undefined) previous.score = Math.max(previous.score ?? 0, result.score);
  }
  return [...merged.values()];
}

async function callWorksApi(query: string, results: SearchResult[]) {
  const endpoint = Deno.env.get("WORKS_API_URL");
  const apiKey = Deno.env.get("WORKS_API_KEY");
  if (!endpoint || !apiKey) {
    return { status: "skipped", message: "Works API endpoint/key is not configured" };
  }

  const parsed = new URL(endpoint);
  if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    throw new Error("Works API endpoint must use HTTPS");
  }
  const response = await fetch(parsed.toString(), {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      candidates: results.slice(0, 10).map(({ title, domain, url }) => ({ title, domain, url })),
      requested_fields: ["company_profile", "public_business_contact_channels"],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Works API request failed (HTTP ${response.status})`);
  return { status: "ok", data: await response.json() };
}

const NON_COMPANY_DOMAINS = new Set([
  "google.com", "bing.com", "yahoo.com", "youtube.com", "facebook.com",
  "instagram.com", "linkedin.com", "wikipedia.org", "reddit.com", "x.com",
  "twitter.com", "tiktok.com", "pinterest.com",
]);
const isNonCompanyDomain = (domain: string) =>
  [...NON_COMPANY_DOMAINS].some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== APP_ORIGIN) return jsonResponse({ error: "Origin is not allowed" }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return jsonResponse({ error: "Supabase function environment is incomplete" }, 500);

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return jsonResponse({ error: "Invalid or expired session" }, 401);
  const user = userData.user;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "A JSON request body is required" }, 400);
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (query.length < 3 || query.length > 400) {
    return jsonResponse({ error: "Search query must contain 3–400 characters" }, 400);
  }

  const requested = Array.isArray(body.providers) ? body.providers : ["serper", "tavily"];
  const providers = [...new Set(requested.filter((provider): provider is ProviderName => provider === "serper" || provider === "tavily"))];
  if (!providers.length) return jsonResponse({ error: "Choose Serper, Tavily, or both providers" }, 400);
  const maxResults = Math.min(10, Math.max(1, Number.isFinite(Number(body.maxResults)) ? Math.floor(Number(body.maxResults)) : 10));
  const persistCandidates = body.persistCandidates === true;

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_memberships")
    .select("workspace_id,role_key")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(2);
  if (membershipError) return jsonResponse({ error: "Could not verify workspace membership" }, 403);
  if (!memberships?.length) return jsonResponse({ error: "This user is not a member of a workspace" }, 403);
  if (memberships.length > 1) return jsonResponse({ error: "Workspace selection is required before searching" }, 409);

  const { workspace_id: workspaceId, role_key: role } = memberships[0];
  if (persistCandidates && !["owner", "admin", "sales_manager", "sales_rep", "marketing"].includes(role)) {
    return jsonResponse({ error: "Your workspace role cannot create lead records" }, 403);
  }

  const queryHash = await sha256Hex(query.toLowerCase().replace(/\\s+/g, " "));
  const usageProviders = [...providers, ...(providers.includes("serper") && providers.includes("tavily") && Deno.env.get("WORKS_API_URL") && Deno.env.get("WORKS_API_KEY") ? ["works"] : [])];
  const { data: requestId, error: reserveError } = await supabase.rpc("reserve_acquisition_request", {
    p_workspace_id: workspaceId,
    p_provider_keys: usageProviders,
    p_query_hash: queryHash,
  });
  if (reserveError || !requestId) {
    const rateLimited = reserveError?.code === "P0001" || reserveError?.message?.toLowerCase().includes("rate limit");
    return jsonResponse({ error: rateLimited ? "Search rate limit reached. Please retry after the one-hour window." : "Unable to reserve an acquisition request for this workspace." }, rateLimited ? 429 : 403);
  }

  const providerStatuses: Array<Record<string, unknown>> = [];
  const rawResults: SearchResult[] = [];
  const providerCalls = await Promise.all(providers.map(async (provider): Promise<{provider: ProviderName; status: 'ok' | 'error'; results: SearchResult[]; message?: string}> => {
    try {
      const results = provider === "serper"
        ? await searchSerper(query, maxResults)
        : await searchTavily(query, maxResults);
      return { provider, status: "ok", results };
    } catch (error) {
      return { provider, status: "error", results: [] as SearchResult[], message: error instanceof Error ? error.message : "Provider request failed" };
    }
  }));
  for (const result of providerCalls) {
    providerStatuses.push({
      provider: result.provider,
      status: result.status,
      count: result.results.length,
      ...(result.status === "error" ? { message: result.message } : {}),
    });
    rawResults.push(...result.results);
  }

  const results = mergeResults(rawResults);
  let works: Record<string, unknown> = { status: "skipped", message: "Works API is used only when both search providers are selected" };
  if (providers.includes("serper") && providers.includes("tavily")) {
    try {
      works = await callWorksApi(query, results);
    } catch (error) {
      works = { status: "error", message: error instanceof Error ? error.message : "Works API request failed" };
    }
    providerStatuses.push({ provider: "works", status: works.status, ...(works.message ? { message: works.message } : {}) });
  }

  let persistedCount = 0;
  let duplicatesSkipped = 0;
  const persistenceErrors: string[] = [];
  if (persistCandidates) {
    const candidates = results.filter((result) => !isNonCompanyDomain(result.domain)).slice(0, maxResults);
    for (const candidate of candidates) {
      try {
        const { data: duplicate, error: duplicateError } = await supabase
          .from("crm_leads").select("id")
          .eq("workspace_id", workspaceId)
          .in("website", [candidate.domain, `https://${candidate.domain}`, `http://${candidate.domain}`])
          .limit(1);
        if (duplicateError) throw duplicateError;
        if (duplicate?.length) {
          duplicatesSkipped++;
          continue;
        }

        const { data: leadNumber, error: numberError } = await supabase.rpc("next_crm_number", {
          p_workspace_id: workspaceId,
          p_prefix: "LEA",
        });
        if (numberError) throw numberError;

        const evidence = results.filter((item) => item.domain === candidate.domain).slice(0, 5).map((item) => ({
          provider: item.provider,
          title: item.title,
          url: item.url,
          snippet: item.snippet,
          observed_at: new Date().toISOString(),
        }));
        const { error: insertError } = await supabase.from("crm_leads").insert({
          workspace_id: workspaceId,
          lead_number: leadNumber,
          company_name: candidate.title.slice(0, 200),
          website: `https://${candidate.domain}`,
          lead_source: candidate.provider,
          source_detail: candidate.url,
          status: "new",
          enrichment_status: "needs_review",
          enrichment_evidence: evidence,
          owner_user_id: user.id,
          created_by: user.id,
          updated_by: user.id,
        });
        if (insertError) throw insertError;
        persistedCount++;
      } catch (error) {
        persistenceErrors.push(error instanceof Error ? error.message : "A candidate could not be saved");
      }
    }
  }

  const { error: auditError } = await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    actor_user_id: user.id,
    action_key: "acquisition_search",
    object_key: "ai_acquisition",
    metadata: {
      providers,
      result_count: results.length,
      persisted_count: persistedCount,
      duplicates_skipped: duplicatesSkipped,
      query_length: query.length,
    },
  });

  const successfulSearches = providerStatuses.filter((provider) =>
    (provider.provider === "serper" || provider.provider === "tavily") && provider.status === "ok"
  ).length;
  const usageStatus = successfulSearches === 0 ? "failed" : providerStatuses.some((provider) => provider.status === "error") ? "partial" : "completed";
  const { error: usageError } = await supabase.rpc("complete_acquisition_request", {
    p_request_id: requestId,
    p_workspace_id: workspaceId,
    p_status: usageStatus,
    p_result_count: results.length,
    p_persisted_count: persistedCount,
  });

  return jsonResponse({
    query,
    providers: providerStatuses,
    results: results.slice(0, maxResults * 2),
    works,
    persistedCount,
    duplicatesSkipped,
    persistenceErrors,
    auditLogged: !auditError,
    usageLogged: !usageError,
  });
});
