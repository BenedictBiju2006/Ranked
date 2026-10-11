//import process from "node:process";
import { createWikidataClient } from "./adapters/wikidata/wikidata.client";
import { createWikidataSource } from "./adapters/wikidata/wikidata.adapter";

async function main(): Promise<void> {
  const source = createWikidataSource(createWikidataClient());
  const search = await source.searchEntities("Interstellar", { limit: 5 });
  console.log("Search candidates:");
  console.table(search.candidates.map(candidate => ({ position: candidate.position, id: candidate.externalId, label: candidate.label?.value, description: candidate.description?.value })));
  console.log("Next search cursor:", search.nextCursor);

  const sourcePropertyIds = ["P31", "P57", "P136", "P577", "P2047", "P364", "P179"];
  const [lookup] = await source.getEntities(["Q13417189"], { sourcePropertyIds });
  if (lookup.status !== "found") throw new Error("The known Interstellar film entity was not found.");
  const entity = lookup.entity;
  console.log("Known film lookup:", { requestedId: lookup.requestedId, id: entity.externalId, label: entity.label?.value, revision: entity.sourceRevision });
  console.table(sourcePropertyIds.map(propertyId => ({ propertyId, statements: entity.claims[propertyId]?.length ?? 0 })));

  const [director] = await source.getEntities(["Q25191"], { sourcePropertyIds: [] });
  console.log("Label-only lookup:", director.status === "found" ? director.entity.label?.value : director.status);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Wikidata check failed.");
  process.exitCode = 1;
});
