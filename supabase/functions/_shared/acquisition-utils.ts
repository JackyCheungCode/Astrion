export type WorkspaceMembership = {
  workspace_id: string;
  role_key: string;
};

export type WorkspaceResolution =
  | { ok: true; membership: WorkspaceMembership }
  | { ok: false; reason: "selection_required" | "not_member" };

export function resolveActiveWorkspace(
  memberships: WorkspaceMembership[],
  requestedWorkspaceId: string,
): WorkspaceResolution {
  if (requestedWorkspaceId) {
    const membership = memberships.find((item) => item.workspace_id === requestedWorkspaceId);
    return membership ? { ok: true, membership } : { ok: false, reason: "not_member" };
  }
  if (memberships.length === 1) return { ok: true, membership: memberships[0] };
  if (memberships.length > 1) return { ok: false, reason: "selection_required" };
  return { ok: false, reason: "not_member" };
}

export type EvidenceScoreInput = {
  providers: string[];
  title: string;
  snippet: string;
  score?: number;
  url: string;
};

export function scoreEvidenceQuality(result: EvidenceScoreInput): number {
  let score = 15;
  if (result.providers.length > 1) score += 25;
  if (result.title.trim().length >= 15) score += 10;
  if (result.snippet.trim().length >= 240) score += 25;
  else if (result.snippet.trim().length >= 100) score += 18;
  else if (result.snippet.trim().length >= 40) score += 10;
  if (result.score !== undefined) score += Math.round(Math.max(0, Math.min(1, result.score)) * 15);
  if (result.url.startsWith("https://")) score += 10;
  return Math.max(0, Math.min(100, score));
}
