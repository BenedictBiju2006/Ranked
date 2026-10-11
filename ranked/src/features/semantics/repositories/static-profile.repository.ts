import type { PropertyDefinition, SourceBinding, TypeProfile } from "../domain/semantic.types";
import type { ProfileRepository } from "./profile.repository";

export interface ProfileCatalog {
  typeProfiles: TypeProfile[];
  properties: PropertyDefinition[];
  bindings: SourceBinding[];
}

export class StaticProfileRepository implements ProfileRepository {
  private readonly profiles: Map<string, TypeProfile>;
  private readonly properties: Map<string, PropertyDefinition>;
  private readonly catalog: ProfileCatalog;

  constructor(catalog: ProfileCatalog) {
    this.catalog = catalog;
    this.profiles = new Map(catalog.typeProfiles.map(profile => [profile.typeId, profile]));
    this.properties = new Map(catalog.properties.map(property => [property.id, property]));
    if (this.profiles.size !== catalog.typeProfiles.length || this.properties.size !== catalog.properties.length) throw new Error("Duplicate profile or property ID");
    for (const binding of catalog.bindings) if (!this.properties.has(binding.propertyId)) throw new Error(`Binding references missing property: ${binding.propertyId}`);
  }

  async getTypeProfile(typeId: string): Promise<TypeProfile | null> {
    return this.profiles.get(typeId) ?? null;
  }

  async getPropertyDefinition(propertyId: string): Promise<PropertyDefinition | null> {
    return this.properties.get(propertyId) ?? null;
  }

  async getSourceBindings(propertyId: string): Promise<SourceBinding[]> {
    return this.catalog.bindings.filter(binding => binding.propertyId === propertyId);
  }
}
