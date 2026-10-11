import { loadEffectiveProfile } from "../domain/profile.rules";
import type { EffectiveProfile, EntityResolution, RankingSemanticInput, SemanticItem, SemanticResult } from "../domain/semantic.types";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { EntityClassifier, EntityResolver, FactEnricher, ScopeInferer, SemanticResultRepository } from "./semantic.ports";

export interface SemanticDependencies {
  profiles: ProfileRepository;
  resolver: EntityResolver;
  classifier: EntityClassifier;
  enricher: FactEnricher;
  scope: ScopeInferer;
  results: SemanticResultRepository;
}

export class SemanticService {
  constructor(private readonly dependencies: SemanticDependencies) {}

  async process(input: RankingSemanticInput): Promise<{ result: SemanticResult; persisted: boolean }> {
    if (!input.rankingId || !input.revision) throw new Error("Ranking ID and revision are required");
    const profiles = new Map<string, EffectiveProfile>();
    const items: SemanticItem[] = [];

    for (const item of input.items) {
      const resolution: EntityResolution = item.private ? { status: "private", entity: null, candidates: [] } : await this.dependencies.resolver.resolve(item, input);
      const entity = resolution.status === "resolved" ? resolution.entity : null;
      const type = entity ? await this.dependencies.classifier.classify(entity, input) : null;
      let profile = type ? profiles.get(type.typeId) : undefined;
      if (type && !profile && await this.dependencies.profiles.getTypeProfile(type.typeId)) {
        profile = await loadEffectiveProfile(type.typeId, this.dependencies.profiles);
        profiles.set(type.typeId, profile);
      }
      const facts = entity && profile ? await this.dependencies.enricher.enrich(entity, profile) : [];
      items.push({ itemId: item.itemId, label: item.label, score: item.score, position: item.position, resolution, type, facts, profileVersions: profile?.versions ?? {} });
    }

    const allTyped = items.every(item => item.type !== null);
    const generalTypeId = allTyped && items.length ? await this.dependencies.classifier.commonType(items.map(item => item.type!.typeId)) : null;
    const scope = await this.dependencies.scope.infer(input, items, profiles);
    const result: SemanticResult = { rankingId: input.rankingId, revision: input.revision, generalTypeId, typeStatus: allTyped && generalTypeId ? "inferred" : "incomplete", items, scope };
    const persisted = await this.dependencies.results.saveIfCurrent(result);
    return { result, persisted };
  }
}
