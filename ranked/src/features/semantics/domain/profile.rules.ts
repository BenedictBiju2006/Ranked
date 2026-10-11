import type { EffectiveProfile, ProfileProperty, PropertyDefinition, SourceBinding, TypeProfile } from "./semantic.types";

export interface ProfileReader {
  getTypeProfile(typeId: string): Promise<TypeProfile | null>;
  getPropertyDefinition(propertyId: string): Promise<PropertyDefinition | null>;
  getSourceBindings(propertyId: string): Promise<SourceBinding[]>;
}

export async function loadEffectiveProfile(typeId: string, repository: ProfileReader): Promise<EffectiveProfile> {
  const versions: Record<string, number> = {};
  const fields = new Map<string, ProfileProperty>();
  const sources = new Map<string, string>();
  const visited = new Set<string>();
  const active = new Set<string>();

  async function visit(currentTypeId: string): Promise<void> {
    if (active.has(currentTypeId)) throw new Error(`Profile inheritance cycle at ${currentTypeId}`);
    if (visited.has(currentTypeId)) return;
    const profile = await repository.getTypeProfile(currentTypeId);
    if (!profile) throw new Error(`Missing type profile: ${currentTypeId}`);
    if (!Number.isInteger(profile.version) || profile.version < 1) throw new Error(`Invalid profile version: ${currentTypeId}`);
    active.add(currentTypeId);
    for (const parentId of profile.parentTypeIds) {
      const existing = new Map(fields);
      const origins = new Map(sources);
      await visit(parentId);
      for (const [propertyId, previous] of existing) {
        if (origins.get(propertyId) !== sources.get(propertyId) && JSON.stringify(previous) !== JSON.stringify(fields.get(propertyId)) && !profile.properties.some(field => field.propertyId === propertyId)) {
          throw new Error(`Conflicting inherited property ${propertyId} in ${currentTypeId}`);
        }
      }
    }
    for (const field of profile.properties) {
      if (fields.has(field.propertyId) && sources.get(field.propertyId) === currentTypeId) throw new Error(`Duplicate property ${field.propertyId} in ${currentTypeId}`);
      fields.set(field.propertyId, field);
      sources.set(field.propertyId, currentTypeId);
    }
    active.delete(currentTypeId);
    visited.add(currentTypeId);
    versions[currentTypeId] = profile.version;
  }

  await visit(typeId);
  const properties: EffectiveProfile["properties"] = [];
  for (const field of fields.values()) {
    const definition = await repository.getPropertyDefinition(field.propertyId);
    if (!definition) throw new Error(`Missing property definition: ${field.propertyId}`);
    const bindings = (await repository.getSourceBindings(field.propertyId)).filter(binding => !binding.applicableTypeIds || binding.applicableTypeIds.includes(typeId));
    properties.push({ ...field, definition, bindings });
  }
  return { typeId, versions, properties };
}
