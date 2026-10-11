export type PropertyRole = "identity" | "descriptive" | "connective" | "analytical" | "display";
export type PropertyPriority = "required" | "preferred" | "optional";
export type PropertyValueType = "text" | "number" | "boolean" | "date" | "duration" | "entity" | "url";

export interface PropertyDefinition {
  id: string;
  schemaProperty: string | null;
  valueType: PropertyValueType;
  cardinality: "one" | "many";
  unit?: string;
}

export interface SourceBinding {
  propertyId: string;
  provider: string;
  sourcePropertyId: string;
  extractor: string;
  applicableTypeIds?: string[];
}

export interface ProfileProperty {
  propertyId: string;
  priority: PropertyPriority;
  roles: PropertyRole[];
  filterable: boolean;
  comparable: boolean;
  scopeCandidate: boolean;
}

export interface TypeProfile {
  typeId: string;
  version: number;
  parentTypeIds: string[];
  properties: ProfileProperty[];
}

export interface EffectiveProfile {
  typeId: string;
  versions: Record<string, number>;
  properties: Array<ProfileProperty & { definition: PropertyDefinition; bindings: SourceBinding[] }>;
}

export interface RankingSemanticInput {
  rankingId: string;
  revision: string;
  title: string;
  description: string | null;
  context: string | null;
  items: Array<{ itemId: string; label: string; score: number | null; position: number; private?: boolean }>;
}

export interface CanonicalEntity {
  id: string;
  label: string;
  externalIds: Record<string, string>;
}

export interface EntityResolution {
  status: "resolved" | "ambiguous" | "unresolved" | "private";
  entity: CanonicalEntity | null;
  candidates: Array<{ entity: CanonicalEntity; reason: string }>;
}

export interface TypeDecision {
  typeId: string;
  evidence: string[];
}

export type FactValue = string | number | boolean | { date: string; precision?: string } | { entityId: string; label: string };

export interface FactAssertion {
  propertyId: string;
  value: FactValue;
  source: { provider: string; entityId: string; sourcePropertyId: string; statementId?: string; retrievedAt?: string };
}

export interface SemanticItem {
  itemId: string;
  label: string;
  score: number | null;
  position: number;
  resolution: EntityResolution;
  type: TypeDecision | null;
  facts: FactAssertion[];
  profileVersions: Record<string, number>;
}

export interface ScopeDecision {
  status: "inferred" | "confirmed" | "undetermined";
  label: string | null;
  predicate?: { propertyId: string; operator: "contains_entity" | "equals"; value: FactValue };
  evidence: string[];
}

export interface SemanticResult {
  rankingId: string;
  revision: string;
  generalTypeId: string | null;
  typeStatus: "inferred" | "incomplete";
  items: SemanticItem[];
  scope: ScopeDecision;
}
