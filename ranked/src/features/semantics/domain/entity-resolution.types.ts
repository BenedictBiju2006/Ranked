import type { SourceCandidate, SourceEntityRecord } from "./knowledge-source.types";

export interface SourceReference {
  provider: string;
  externalId: string;
}

export type IdentityValue = { kind: "entity"; externalId: string } | { kind: "text"; text: string } | { kind: "year"; year: number };

export interface IdentityHint {
  id: string;
  sourcePropertyId: string;
  expected: IdentityValue;
}

export interface ResolutionContext {
  rankingTitle?: string;
  rankingContext?: string;
  surroundingLabels?: readonly string[];
}

export interface EntityResolutionRequest {
  itemId: string;
  label: string;
  externalLookupAllowed: boolean;
  language?: string;
  searchText?: string;
  confirmedReference?: SourceReference;
  identityHints?: readonly IdentityHint[];
  context?: ResolutionContext;
}

export interface IdentityHintEvidence {
  hintId: string;
  sourcePropertyId: string;
  state: "supports" | "different" | "unknown";
  observedValues: IdentityValue[];
  statementIds: string[];
}

export interface ResolutionCandidate {
  search: SourceCandidate;
  lookupStatus: "pending" | "found" | "missing";
  entity: SourceEntityRecord | null;
  nameMatch: "exact" | "different";
  evidence: IdentityHintEvidence[];
}

export interface ResolutionSearch {
  query: string;
  pagesFetched: number;
  complete: boolean;
  nextCursor: string | null;
}

export type ResolutionAbstention = "multiple_matches" | "insufficient_evidence" | "no_supported_match" | "search_incomplete";

export type ResolutionDecision = { kind: "propose"; externalId: string; reason: string } | { kind: "abstain"; reason: ResolutionAbstention };

export interface ResolutionDecisionInput {
  request: EntityResolutionRequest;
  candidates: readonly ResolutionCandidate[];
  search: ResolutionSearch;
}

export interface ResolutionBase {
  itemId: string;
  label: string;
  provider: string;
  policyId: string;
  confirmedReference: SourceReference | null;
  candidates: ResolutionCandidate[];
  search: ResolutionSearch | null;
}

export type EntityResolutionResult = ResolutionBase & (
  | { status: "proposed"; reference: SourceReference; entity: SourceEntityRecord; reason: string; reviewRequired: true }
  | { status: "confirmed"; reference: SourceReference; entity: SourceEntityRecord; reason: "user_confirmed" }
  | { status: "ambiguous"; reason: "multiple_matches" | "insufficient_evidence" | "search_incomplete" }
  | { status: "unresolved"; reason: "no_candidates" | "no_supported_match" | "confirmed_entity_missing" }
  | { status: "local"; reason: "external_lookup_disabled" }
  | { status: "incomplete"; failure: { stage: "search" | "fetch" | "evidence" | "decision"; message: string; retryable: boolean | null } }
);

export interface EntityResolverOptions {
  pageSize?: number;
  maxPages?: number;
}
