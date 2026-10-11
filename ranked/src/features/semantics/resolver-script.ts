import process from "node:process";
import { createWikidataClient } from "./adapters/wikidata/wikidata.client";
import { createWikidataSource } from "./adapters/wikidata/wikidata.adapter";
import { createWikidataIdentityEvidenceReader } from "./adapters/wikidata/wikidata-identity-evidence";
import { createSupportedIdentityPolicy } from "./domain/entity-resolution.rules";
import { createEntityResolver } from "./services/entity-resolver.service";
import type { EntityResolutionResult } from "./domain/entity-resolution.types";

function printResult(name: string, result: EntityResolutionResult): void {
  console.log(name, { status: result.status, reason: "reason" in result ? result.reason : result.failure, reference: "reference" in result ? result.reference : null, searchComplete: result.search?.complete ?? null });
  if (result.candidates.length) console.table(result.candidates.map(candidate => ({ id: candidate.entity?.externalId ?? candidate.search.externalId, label: candidate.search.label?.value, nameMatch: candidate.nameMatch, hints: candidate.evidence.map(evidence => `${evidence.hintId}:${evidence.state}`).join(", ") })));
  if (result.status === "incomplete") throw new Error(`${name} failed during ${result.failure.stage}: ${result.failure.message}`);
}

async function main(): Promise<void> {
  const source = createWikidataSource(createWikidataClient());
  const resolver = createEntityResolver(source, createWikidataIdentityEvidenceReader(), createSupportedIdentityPolicy());
  const privateItem = await resolver.resolve({ itemId: "private-example", label: "My inside joke", externalLookupAllowed: false });
  printResult("Private item", privateItem);
  if (privateItem.status !== "local") throw new Error("Private items must stay local.");

  const unanchored = await resolver.resolve({ itemId: "film-example", label: "Interstellar", externalLookupAllowed: true });
  printResult("Name without identity hints", unanchored);
  if (unanchored.status === "proposed" || unanchored.status === "confirmed") throw new Error("A name alone must not establish identity.");

  const identityHints = [{ id: "source-class", sourcePropertyId: "P31", expected: { kind: "entity" as const, externalId: "Q11424" } }, { id: "director", sourcePropertyId: "P57", expected: { kind: "entity" as const, externalId: "Q25191" } }];
  const anchored = await resolver.resolve({ itemId: "film-example", label: "Interstellar", externalLookupAllowed: true, identityHints });
  printResult("Name with explicit source-class and director hints", anchored);
  if (anchored.status !== "proposed" || anchored.reference.externalId !== "Q13417189") throw new Error("The live example did not produce the expected Interstellar proposal; inspect candidates and source evidence.");

  const confirmed = await resolver.resolve({ itemId: "film-example", label: "My favorite space film", externalLookupAllowed: true, confirmedReference: anchored.reference });
  printResult("Explicit confirmed selection", confirmed);
  if (confirmed.status !== "confirmed" || confirmed.reference.externalId !== "Q13417189") throw new Error("A confirmed selection must retain its identity.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Resolver check failed.");
  process.exitCode = 1;
});
