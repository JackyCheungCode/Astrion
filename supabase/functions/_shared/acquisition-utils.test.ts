import { resolveActiveWorkspace, scoreEvidenceQuality } from "./acquisition-utils.ts";

Deno.test("single active workspace is selected when no ID is provided", () => {
  const result = resolveActiveWorkspace([{ workspace_id: "ws-a", role_key: "owner" }], "");
  if (!result.ok || result.membership.workspace_id !== "ws-a") throw new Error("Expected the sole workspace to be selected");
});

Deno.test("requested workspace must match an active membership", () => {
  const result = resolveActiveWorkspace([
    { workspace_id: "ws-a", role_key: "owner" },
    { workspace_id: "ws-b", role_key: "sales_rep" },
  ], "ws-b");
  if (!result.ok || result.membership.role_key !== "sales_rep") throw new Error("Expected the requested membership to be selected");
});

Deno.test("multiple workspaces require an explicit selection", () => {
  const result = resolveActiveWorkspace([
    { workspace_id: "ws-a", role_key: "owner" },
    { workspace_id: "ws-b", role_key: "sales_rep" },
  ], "");
  if (result.ok || result.reason !== "selection_required") throw new Error("Expected selection_required");
});

Deno.test("unrecognized workspace IDs are rejected", () => {
  const result = resolveActiveWorkspace([{ workspace_id: "ws-a", role_key: "owner" }], "ws-unknown");
  if (result.ok || result.reason !== "not_member") throw new Error("Expected not_member");
});

Deno.test("evidence quality score is bounded and increases with corroboration", () => {
  const basic = scoreEvidenceQuality({
    providers: ["serper"],
    title: "Company",
    snippet: "Short description",
    url: "https://example.com",
  });
  const corroborated = scoreEvidenceQuality({
    providers: ["serper", "tavily"],
    title: "Example company product and services",
    snippet: "A detailed company description. ".repeat(12),
    score: 0.9,
    url: "https://example.com",
  });
  if (basic < 0 || basic > 100 || corroborated < basic || corroborated > 100) {
    throw new Error("Evidence score should be bounded and reward corroborating evidence");
  }
});
