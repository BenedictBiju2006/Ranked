import type { CatalogPropertyDefinition, CatalogSourceBinding, CatalogType, CatalogTypeProfile } from "../domain/profile-catalog.types";

export interface ProfileCatalogRepository {
  getType(typeId: string): Promise<CatalogType | null>;
  getPublishedProfile(typeId: string): Promise<CatalogTypeProfile | null>;
  getProperties(propertyIds: string[]): Promise<CatalogPropertyDefinition[]>;
  getSourceBindings(propertyIds: string[]): Promise<CatalogSourceBinding[]>;
}
