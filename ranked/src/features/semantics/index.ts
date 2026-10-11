export type { CanonicalEntity, EffectiveProfile, EntityResolution, FactAssertion, FactValue, ProfileProperty, PropertyDefinition, RankingSemanticInput, ScopeDecision, SemanticItem, SemanticResult, SourceBinding, TypeDecision, TypeProfile } from "./domain/semantic.types";
export { loadEffectiveProfile } from "./domain/profile.rules";
export type { ProfileRepository } from "./repositories/profile.repository";
export { StaticProfileRepository } from "./repositories/static-profile.repository";
export type { ProfileCatalog } from "./repositories/static-profile.repository";
export type { EntityClassifier, EntityResolver, FactEnricher, ScopeInferer, SemanticResultRepository } from "./services/semantic.ports";
export { SemanticService } from "./services/semantic.service";
export type { SemanticDependencies } from "./services/semantic.service";
export { toRankingSemanticInput } from "./adapters/ranking-input";
