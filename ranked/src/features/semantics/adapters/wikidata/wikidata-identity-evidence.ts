import type { SourceJson, SourceJsonObject } from "../../domain/knowledge-source.types";
import type { IdentityHintEvidence, IdentityValue } from "../../domain/entity-resolution.types";
import { identityValuesEqual } from "../../domain/entity-resolution.rules";
import type { IdentityEvidenceReader } from "../../services/entity-resolution.ports";

function object(value: SourceJson | undefined): SourceJsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function readValue(statement: SourceJsonObject, expected: IdentityValue, propertyId: string): IdentityValue | null {
  const snak = object(statement.mainsnak);
  if (!snak || snak.snaktype !== "value" || snak.property !== propertyId) return null;
  const datavalue = object(snak.datavalue);
  if (!datavalue) return null;
  const value = datavalue.value;
  const details = object(value);
  if (expected.kind === "entity" && snak.datatype === "wikibase-item" && datavalue.type === "wikibase-entityid" && details?.["entity-type"] === "item" && typeof details.id === "string" && /^Q[1-9]\d*$/u.test(details.id)) return { kind: "entity", externalId: details.id };
  if (expected.kind === "text" && snak.datatype === "string" && datavalue.type === "string" && typeof value === "string" && value.trim()) return { kind: "text", text: value };
  if (expected.kind !== "year" || snak.datatype !== "time" || datavalue.type !== "time" || !details) return null;
  if (typeof details.precision !== "number" || !Number.isInteger(details.precision) || details.precision < 9 || details.precision > 11 || details.before !== 0 || details.after !== 0) return null;
  if (details.calendarmodel !== "http://www.wikidata.org/entity/Q1985727" && details.calendarmodel !== "https://www.wikidata.org/entity/Q1985727") return null;
  const match = typeof details.time === "string" ? /^\+(\d{4,16})-\d{2}-\d{2}T00:00:00Z$/u.exec(details.time) : null;
  const year = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(year) && year > 0 ? { kind: "year", year } : null;
}

export function createWikidataIdentityEvidenceReader(): IdentityEvidenceReader {
  return {
    provider: "wikidata",
    read(entity, hints) {
      if (entity.provider !== "wikidata") throw new TypeError("The Wikidata evidence reader received another provider's entity.");
      return hints.map(hint => {
        if (!/^P[1-9]\d*$/u.test(hint.sourcePropertyId)) throw new TypeError("Wikidata identity hints require property IDs such as P57.");
        if (hint.expected.kind === "entity" && !/^Q[1-9]\d*$/u.test(hint.expected.externalId)) throw new TypeError("Wikidata entity hints require item IDs such as Q25191.");
        const evidence: IdentityHintEvidence = { hintId: hint.id, sourcePropertyId: hint.sourcePropertyId, state: "unknown", observedValues: [], statementIds: [] };
        let hasUnknown = false;
        for (const statement of entity.claims[hint.sourcePropertyId] ?? []) {
          if (statement.rank === "deprecated") continue;
          const qualifiers = object(statement.qualifiers);
          if ((statement.rank !== "normal" && statement.rank !== "preferred") || (statement.qualifiers !== undefined && !qualifiers) || (qualifiers && Object.keys(qualifiers).length)) { hasUnknown = true; continue; }
          const value = readValue(statement, hint.expected, hint.sourcePropertyId);
          if (!value) { hasUnknown = true; continue; }
          if (!evidence.observedValues.some(observed => identityValuesEqual(observed, value))) evidence.observedValues.push(value);
          if (typeof statement.id === "string") evidence.statementIds.push(statement.id);
        }
        if (evidence.observedValues.some(value => identityValuesEqual(value, hint.expected))) evidence.state = "supports";
        else if (evidence.observedValues.length && !hasUnknown) evidence.state = "different";
        return evidence;
      });
    }
  };
}
