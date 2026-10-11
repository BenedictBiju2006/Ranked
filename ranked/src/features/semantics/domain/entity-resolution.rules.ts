import type { EntityResolutionRequest, IdentityValue, ResolutionDecision, ResolutionDecisionInput } from "./entity-resolution.types";
import type { EntityResolutionPolicy } from "../services/entity-resolution.ports";

export function normalizeIdentityText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

export function identityValuesEqual(left: IdentityValue, right: IdentityValue): boolean {
  if (left.kind === "entity" && right.kind === "entity") return left.externalId === right.externalId;
  if (left.kind === "text" && right.kind === "text") return normalizeIdentityText(left.text) === normalizeIdentityText(right.text);
  return left.kind === "year" && right.kind === "year" && left.year === right.year;
}

export function validateResolutionRequest(request: EntityResolutionRequest): void {
  if (!request.itemId.trim() || !request.label.trim()) throw new TypeError("Resolution requires an item ID and a nonempty label.");
  if (typeof request.externalLookupAllowed !== "boolean") throw new TypeError("External lookup permission must be explicit.");
  if (request.searchText !== undefined && !request.searchText.trim()) throw new TypeError("Search text cannot be empty.");
  if (request.confirmedReference && (!request.confirmedReference.provider.trim() || !request.confirmedReference.externalId.trim())) throw new TypeError("A confirmed reference requires a provider and external ID.");
  const hintIds = new Set<string>();
  for (const hint of request.identityHints ?? []) {
    if (!hint.id.trim() || !hint.sourcePropertyId.trim() || hintIds.has(hint.id)) throw new TypeError("Identity hints require unique IDs and source properties.");
    hintIds.add(hint.id);
    const expected = hint.expected;
    if (expected.kind === "entity" && expected.externalId.trim()) continue;
    if (expected.kind === "text" && expected.text.trim()) continue;
    if (expected.kind === "year" && Number.isSafeInteger(expected.year) && expected.year > 0) continue;
    throw new TypeError("Identity hints support entity IDs, nonempty text, and positive integer years.");
  }
}

function decideSupportedIdentity(input: ResolutionDecisionInput): ResolutionDecision {
  const candidates = input.candidates.filter(candidate => candidate.nameMatch === "exact" && candidate.lookupStatus === "found" && candidate.entity?.entityKind === "item");
  if (!candidates.length) return { kind: "abstain", reason: input.search.complete ? "no_supported_match" : "search_incomplete" };
  const hints = input.request.identityHints ?? [];
  if (!hints.length) return { kind: "abstain", reason: input.search.complete ? "insufficient_evidence" : "search_incomplete" };
  const supported = candidates.filter(candidate => hints.every(hint => candidate.evidence.some(evidence => evidence.hintId === hint.id && evidence.state === "supports")));
  const supportedIds = new Set(supported.map(candidate => candidate.entity!.externalId));
  if (supportedIds.size > 1) return { kind: "abstain", reason: "multiple_matches" };
  if (!supportedIds.size) return { kind: "abstain", reason: input.search.complete ? "insufficient_evidence" : "search_incomplete" };
  const [externalId] = supportedIds;
  const undecided = candidates.some(candidate => candidate.entity!.externalId !== externalId && !candidate.evidence.some(evidence => evidence.state === "different"));
  if (undecided) return { kind: "abstain", reason: "insufficient_evidence" };
  return { kind: "propose", externalId, reason: "Within the retrieved candidates, the exact name or alias and all supplied identity hints support this entity. Review the proposal before linking." };
}

export function createSupportedIdentityPolicy(): EntityResolutionPolicy {
  return { id: "supported-identity/v1", async decide(input, signal) { signal?.throwIfAborted(); return decideSupportedIdentity(input); } };
}
