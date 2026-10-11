import type { SourceEntityLookup } from "../domain/knowledge-source.types";
import type { EntityResolutionRequest, EntityResolutionResult, EntityResolverOptions, ResolutionBase, ResolutionCandidate } from "../domain/entity-resolution.types";
import { normalizeIdentityText, validateResolutionRequest } from "../domain/entity-resolution.rules";
import type { KnowledgeSource } from "./knowledge-source.port";
import type { EntityResolutionPolicy, EntityResolver, IdentityEvidenceReader } from "./entity-resolution.ports";

function validateLookups(lookups: readonly SourceEntityLookup[], ids: readonly string[], provider: string): Map<string, SourceEntityLookup> {
  const mapped = new Map<string, SourceEntityLookup>();
  for (const lookup of lookups) {
    if (!ids.includes(lookup.requestedId) || mapped.has(lookup.requestedId)) throw new Error("Source returned an unexpected or repeated entity lookup.");
    if (lookup.status === "found" && (lookup.entity.provider !== provider || lookup.entity.entityKind !== "item")) throw new Error("Source returned an incompatible entity.");
    if (lookup.status === "missing" && lookup.provider !== provider) throw new Error("Source returned an incompatible missing-entity lookup.");
    mapped.set(lookup.requestedId, lookup);
  }
  if (mapped.size !== ids.length) throw new Error("Source omitted a requested entity lookup.");
  return mapped;
}

function updateNameMatch(candidate: ResolutionCandidate, label: string): void {
  const names = [candidate.search.label?.value, candidate.search.matchedText, candidate.entity?.label?.value];
  candidate.nameMatch = names.some(name => name !== undefined && name !== null && normalizeIdentityText(name) === normalizeIdentityText(label)) ? "exact" : "different";
}

export function createEntityResolver(source: KnowledgeSource, evidenceReader: IdentityEvidenceReader, policy: EntityResolutionPolicy, options: EntityResolverOptions = {}): EntityResolver {
  if (source.provider !== evidenceReader.provider) throw new TypeError("Source and identity evidence reader providers must agree.");
  const pageSize = options.pageSize ?? 10;
  const maxPages = options.maxPages ?? 2;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50 || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 5) throw new TypeError("Resolver page size must be 1–50 and maximum pages must be 1–5.");
  return {
    async resolve(request, signal): Promise<EntityResolutionResult> {
      validateResolutionRequest(request);
      signal?.throwIfAborted();
      const base: ResolutionBase = { itemId: request.itemId, label: request.label, provider: source.provider, policyId: policy.id, confirmedReference: request.confirmedReference ?? null, candidates: [], search: null };
      if (!request.externalLookupAllowed) return { ...base, status: "local", reason: "external_lookup_disabled" };
      if (request.confirmedReference && request.confirmedReference.provider !== source.provider) throw new TypeError("Route the confirmed reference to its provider's resolver.");
      let stage: "search" | "fetch" | "evidence" | "decision" = "fetch";
      try {
        if (request.confirmedReference) {
          const id = request.confirmedReference.externalId;
          const lookups = validateLookups(await source.getEntities([id], { language: request.language, sourcePropertyIds: [], signal }), [id], source.provider);
          signal?.throwIfAborted();
          const lookup = lookups.get(id)!;
          if (lookup.status === "missing") return { ...base, status: "unresolved", reason: "confirmed_entity_missing" };
          return { ...base, status: "confirmed", reference: { provider: source.provider, externalId: lookup.entity.externalId }, entity: lookup.entity, reason: "user_confirmed" };
        }
        stage = "search";
        base.search = { query: request.searchText ?? request.label, pagesFetched: 0, complete: false, nextCursor: null };
        const seenIds = new Set<string>();
        const seenCursors = new Set<string>();
        let cursor: string | undefined;
        for (let page = 0; page < maxPages; page++) {
          signal?.throwIfAborted();
          const result = await source.searchEntities(base.search.query, { language: request.language, limit: pageSize, cursor, kind: "item", signal });
          if (result.provider !== source.provider || result.query !== base.search.query) throw new Error("Source search response does not match the request.");
          for (const candidate of result.candidates) {
            if (seenIds.has(candidate.externalId)) continue;
            if (seenIds.size >= pageSize * maxPages) throw new Error("Source exceeded the configured candidate budget.");
            seenIds.add(candidate.externalId);
            const resolved: ResolutionCandidate = { search: candidate, lookupStatus: "pending", entity: null, nameMatch: "different", evidence: [] };
            updateNameMatch(resolved, request.label);
            base.candidates.push(resolved);
          }
          base.search.pagesFetched++;
          base.search.nextCursor = result.nextCursor;
          if (result.nextCursor === null) { base.search.complete = true; break; }
          if (seenCursors.has(result.nextCursor)) throw new Error("Source search repeated a continuation cursor.");
          seenCursors.add(result.nextCursor);
          cursor = result.nextCursor;
        }
        signal?.throwIfAborted();
        if (!base.candidates.length) return base.search.complete ? { ...base, status: "unresolved", reason: "no_candidates" } : { ...base, status: "ambiguous", reason: "search_incomplete" };
        stage = "fetch";
        const ids = base.candidates.map(candidate => candidate.search.externalId);
        const hints = request.identityHints ?? [];
        const sourcePropertyIds = [...new Set(hints.map(hint => hint.sourcePropertyId))];
        const lookups = validateLookups(await source.getEntities(ids, { language: request.language, sourcePropertyIds, signal }), ids, source.provider);
        signal?.throwIfAborted();
        for (const candidate of base.candidates) {
          const lookup = lookups.get(candidate.search.externalId)!;
          candidate.lookupStatus = lookup.status;
          candidate.entity = lookup.status === "found" ? lookup.entity : null;
          updateNameMatch(candidate, request.label);
        }
        stage = "evidence";
        for (const candidate of base.candidates) {
          if (!candidate.entity) continue;
          candidate.evidence = evidenceReader.read(candidate.entity, hints);
          if (candidate.evidence.length !== hints.length || hints.some(hint => candidate.evidence.filter(evidence => evidence.hintId === hint.id && evidence.sourcePropertyId === hint.sourcePropertyId).length !== 1)) throw new Error("Evidence reader must return one assessment per requested identity hint.");
        }
        stage = "decision";
        const decision = await policy.decide({ request, candidates: base.candidates, search: base.search }, signal);
        signal?.throwIfAborted();
        if (decision.kind === "propose") {
          const candidate = base.candidates.find(candidate => candidate.lookupStatus === "found" && candidate.entity?.externalId === decision.externalId);
          if (!candidate?.entity || typeof decision.reason !== "string" || !decision.reason.trim()) throw new Error("Resolution policy proposed an unavailable entity or omitted its reason.");
          return { ...base, status: "proposed", reference: { provider: source.provider, externalId: candidate.entity.externalId }, entity: candidate.entity, reason: decision.reason, reviewRequired: true };
        }
        if (decision.kind !== "abstain" || !["multiple_matches", "insufficient_evidence", "no_supported_match", "search_incomplete"].includes(decision.reason)) throw new Error("Resolution policy returned an invalid decision.");
        if (decision.reason === "no_supported_match") return { ...base, status: "unresolved", reason: decision.reason };
        return { ...base, status: "ambiguous", reason: decision.reason };
      } catch (error: unknown) {
        signal?.throwIfAborted();
        if (error instanceof Error && error.name === "AbortError") throw error;
        const retryable = error instanceof Error && "retryable" in error && typeof error.retryable === "boolean" ? error.retryable : null;
        return { ...base, status: "incomplete", failure: { stage, message: error instanceof Error ? error.message : "Entity resolution failed.", retryable } };
      }
    }
  };
}
