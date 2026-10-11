import type { CanonicalEntity, EffectiveProfile, EntityResolution, FactAssertion, RankingSemanticInput, ScopeDecision, SemanticItem, SemanticResult, TypeDecision } from "@/features/semantics/domain/semantic.types";

export interface EntityResolver {
  resolve(item: RankingSemanticInput["items"][number], context: RankingSemanticInput): Promise<EntityResolution>;
}

export interface EntityClassifier {
  classify(entity: CanonicalEntity, context: RankingSemanticInput): Promise<TypeDecision | null>;
  commonType(typeIds: string[]): Promise<string | null>;
}

export interface FactEnricher {
  enrich(entity: CanonicalEntity, profile: EffectiveProfile): Promise<FactAssertion[]>;
}

export interface ScopeInferer {
  infer(context: RankingSemanticInput, items: SemanticItem[], profiles: ReadonlyMap<string, EffectiveProfile>): Promise<ScopeDecision>;
}

export interface SemanticResultRepository {
  saveIfCurrent(result: SemanticResult): Promise<boolean>;
}
