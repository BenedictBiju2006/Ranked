import type { SourceEntityLookup, SourceEntityRecord, SourceJson, SourceJsonObject, SourceText } from "../../domain/knowledge-source.types";
import type { KnowledgeSource } from "../../services/knowledge-source.port";
import type { WikidataApiClient } from "./wikidata.client";
import { WikidataRequestError } from "./wikidata.client";

function invalidResponse(message: string): never {
  throw new WikidataRequestError(message, "invalid_response");
}

function objectValue(value: SourceJson | undefined, label: string): SourceJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalidResponse(`Invalid Wikidata ${label}.`);
  return value;
}

function dictionary(value: SourceJson | undefined, label: string): SourceJsonObject {
  if (value === undefined || (Array.isArray(value) && !value.length)) return {};
  return objectValue(value, label);
}

function sourceText(value: SourceJson | undefined): SourceText | null {
  if (value === undefined) return null;
  const term = objectValue(value, "language value");
  if (typeof term.value !== "string") invalidResponse("Wikidata language value has no text.");
  return { value: term.value, language: typeof term.language === "string" ? term.language : null };
}

function entityText(value: SourceJson | undefined, language: string): SourceText | null {
  const terms = dictionary(value, "language dictionary");
  const selected = terms[language] ?? terms.en ?? terms.mul ?? Object.values(terms)[0];
  return sourceText(selected);
}

function validateId(externalId: string): void {
  if (!/^[QP][1-9]\d*$/.test(externalId)) throw new Error(`Invalid Wikidata entity ID: ${externalId}.`);
}

function sourceUrl(externalId: string): string {
  return `https://www.wikidata.org/wiki/${externalId.startsWith("P") ? "Property:" : ""}${externalId}`;
}

function checkLanguage(language: string): string {
  if (!/^[a-z][a-z0-9-]*$/.test(language)) throw new Error("Use a Wikidata language code such as en or zh-hans.");
  return language;
}

function readClaims(value: SourceJson | undefined, selectedProperties?: ReadonlySet<string>): Record<string, SourceJsonObject[]> {
  const claims = dictionary(value, "claims");
  const result: Record<string, SourceJsonObject[]> = {};
  for (const [propertyId, statements] of Object.entries(claims)) {
    if (selectedProperties && !selectedProperties.has(propertyId)) continue;
    if (!/^P[1-9]\d*$/.test(propertyId) || !Array.isArray(statements)) invalidResponse(`Invalid Wikidata claims for ${propertyId}.`);
    result[propertyId] = statements.map(statement => objectValue(statement, `${propertyId} statement`));
  }
  return result;
}

function readEntity(requestedId: string, value: SourceJson, language: string, retrievedAt: string, selectedProperties?: ReadonlySet<string>): SourceEntityLookup {
  const entity = objectValue(value, "entity record");
  if ("missing" in entity) return { requestedId, status: "missing", provider: "wikidata", sourceUrl: sourceUrl(requestedId), retrievedAt };
  if (typeof entity.id !== "string" || !/^[QP][1-9]\d*$/.test(entity.id) || typeof entity.type !== "string") invalidResponse(`Invalid Wikidata entity record for ${requestedId}.`);
  if (entity.id !== requestedId) {
    const redirect = objectValue(entity.redirects, "redirect");
    if (redirect.from !== requestedId || redirect.to !== entity.id) invalidResponse(`Unexplained Wikidata entity ID change for ${requestedId}.`);
  }

  const sourceRevision = typeof entity.lastrevid === "number" && Number.isSafeInteger(entity.lastrevid) ? String(entity.lastrevid) : null;
  const record: SourceEntityRecord = {
    provider: "wikidata",
    externalId: entity.id,
    entityKind: entity.type,
    label: entityText(entity.labels, language),
    description: entityText(entity.descriptions, language),
    claims: readClaims(entity.claims, selectedProperties),
    sourceRevision,
    sourceUrl: sourceUrl(entity.id),
    retrievedAt,
  };
  return { requestedId, status: "found", entity: record };
}

export function createWikidataSource(client: WikidataApiClient): KnowledgeSource {
  return {
    provider: "wikidata",

    async searchEntities(query, options = {}) {
      const language = checkLanguage(options.language ?? "en");
      const limit = options.limit ?? 5;
      const cursor = options.cursor ?? "0";
      const kind = options.kind ?? "item";
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("Search limit must be between 1 and 50.");
      if (!/^\d+$/.test(cursor) || Number(cursor) > 10_000) throw new Error("Invalid Wikidata search cursor.");
      if (!["item", "property"].includes(kind)) throw new Error("Unsupported Wikidata search kind.");
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return { provider: "wikidata", query: normalizedQuery, language, candidates: [], nextCursor: null, retrievedAt: new Date().toISOString() };
      const data = await client.get({ action: "wbsearchentities", search: normalizedQuery, language, uselang: language, type: kind, limit: String(limit), continue: cursor }, options.signal);
      if (!Array.isArray(data.search)) invalidResponse("Wikidata response has no search result array.");

      const candidates = data.search.map((value, index) => {
        const candidate = objectValue(value, "search candidate");
        if (typeof candidate.id !== "string" || !/^[QP][1-9]\d*$/.test(candidate.id)) invalidResponse("Invalid Wikidata search candidate ID.");
        const display = dictionary(candidate.display, "search display");
        const match = dictionary(candidate.match, "search match");
        const label = sourceText(display.label) ?? (typeof candidate.label === "string" ? { value: candidate.label, language: null } : null);
        const description = sourceText(display.description) ?? (typeof candidate.description === "string" ? { value: candidate.description, language: null } : null);
        return { externalId: candidate.id, label, description, matchedText: typeof match.text === "string" ? match.text : null, position: Number(cursor) + index + 1, sourceUrl: sourceUrl(candidate.id) };
      });

      const continuation = data["search-continue"];
      if (continuation !== undefined && (typeof continuation !== "number" || !Number.isInteger(continuation) || continuation < 0 || continuation > 10_000)) invalidResponse("Invalid Wikidata search continuation.");
      return { provider: "wikidata", query: normalizedQuery, language, candidates, nextCursor: continuation === undefined ? null : String(continuation), retrievedAt: new Date().toISOString() };
    },

    async getEntities(externalIds, options = {}) {
      const language = checkLanguage(options.language ?? "en");
      for (const externalId of externalIds) validateId(externalId);
      const selectedProperties = options.sourcePropertyIds === undefined ? undefined : new Set(options.sourcePropertyIds);
      if (selectedProperties) {
        for (const propertyId of selectedProperties) {
          if (!/^P[1-9]\d*$/.test(propertyId)) throw new Error(`Invalid Wikidata property ID: ${propertyId}.`);
        }
      }
      const uniqueIds = [...new Set(externalIds)];
      const lookups = new Map<string, SourceEntityLookup>();
      const includeClaims = selectedProperties === undefined || selectedProperties.size > 0;

      for (let offset = 0; offset < uniqueIds.length; offset += 50) {
        const batch = uniqueIds.slice(offset, offset + 50);
        const data = await client.get({ action: "wbgetentities", ids: batch.join("|"), props: includeClaims ? "info|labels|descriptions|claims" : "info|labels|descriptions", languages: language, languagefallback: "1", redirects: "yes" }, options.signal);
        const entities = objectValue(data.entities, "entities dictionary");
        const retrievedAt = new Date().toISOString();
        for (const requestedId of batch) {
          const entity = entities[requestedId];
          if (entity === undefined) invalidResponse(`Wikidata omitted requested entity ${requestedId}.`);
          lookups.set(requestedId, readEntity(requestedId, entity, language, retrievedAt, selectedProperties));
        }
      }

      return externalIds.map(externalId => lookups.get(externalId)!);
    },
  };
}
