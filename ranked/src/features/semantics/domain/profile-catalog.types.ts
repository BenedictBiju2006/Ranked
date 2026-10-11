export type CatalogPropertyRole = "identity" | "descriptive" | "connective" | "analytical" | "display";
export type CatalogPropertyPriority = "required" | "preferred" | "optional";
export type CatalogPropertyValueType = "text" | "number" | "boolean" | "date" | "duration" | "entity" | "url" | "enum";

export interface CatalogType {
  id: string;
  label: string;
  parentTypeIds: string[];
}

export interface CatalogProfileField {
  propertyId: string;
  priority: CatalogPropertyPriority;
  roles: CatalogPropertyRole[];
  filterable: boolean;
  comparable: boolean;
  scopeCandidate: boolean;
}

export interface CatalogTypeProfile {
  typeId: string;
  version: number;
  fields: CatalogProfileField[];
}

export interface CatalogPropertyDefinition {
  id: string;
  schemaProperty: string | null;
  valueType: CatalogPropertyValueType;
  cardinality: "one" | "many";
  unit: string | null;
  normalizationStrategy: string | null;
}

export interface CatalogSourceBinding {
  propertyId: string;
  provider: string;
  sourcePropertyId: string;
  extractor: string;
  applicableTypeIds: string[];
}

export interface CatalogProfileNode {
  type: CatalogType;
  profile: CatalogTypeProfile;
}

export interface InheritedCatalogField extends CatalogProfileField {
  definedOn: string;
}

export interface EffectiveCatalogField extends InheritedCatalogField {
  definition: CatalogPropertyDefinition;
  sourceBindings: CatalogSourceBinding[];
}

export interface EffectiveCatalogProfile {
  typeId: string;
  label: string;
  profileVersions: Record<string, number>;
  fields: EffectiveCatalogField[];
}
