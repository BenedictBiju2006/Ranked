import { mergeCatalogProfiles } from "../domain/profile-catalog.rules";
import type { CatalogProfileNode, EffectiveCatalogProfile } from "../domain/profile-catalog.types";
import type { ProfileCatalogRepository } from "../repositories/profile-catalog.repository";

export function createProfileCatalogService(repository: ProfileCatalogRepository) {
  return {
    async getEffectiveProfile(typeId: string): Promise<EffectiveCatalogProfile> {
      const nodes = new Map<string, CatalogProfileNode>();

      async function collect(currentTypeId: string): Promise<void> {
        if (nodes.has(currentTypeId)) return;
        if (nodes.size >= 128) throw new Error("Profile inheritance exceeds 128 types.");
        const [type, profile] = await Promise.all([repository.getType(currentTypeId), repository.getPublishedProfile(currentTypeId)]);
        if (!type) throw new Error(`Type ${currentTypeId} is missing or not readable. Check the registry and authenticated session.`);
        if (!profile) throw new Error(`No readable published profile for ${currentTypeId}.`);
        nodes.set(currentTypeId, { type, profile });
        for (const parentId of [...type.parentTypeIds].sort()) await collect(parentId);
      }

      await collect(typeId);
      const inheritedFields = mergeCatalogProfiles(typeId, nodes);
      const propertyIds = inheritedFields.map(field => field.propertyId);
      const [definitions, bindings] = await Promise.all([repository.getProperties(propertyIds), repository.getSourceBindings(propertyIds)]);
      const propertyMap = new Map(definitions.map(definition => [definition.id, definition]));
      if (propertyMap.size !== definitions.length) throw new Error("The repository returned duplicate property definitions.");

      const fields = inheritedFields.map(field => {
        const definition = propertyMap.get(field.propertyId);
        if (!definition) throw new Error(`Missing property definition: ${field.propertyId}.`);
        const sourceBindings = bindings.filter(binding => binding.propertyId === field.propertyId && (!binding.applicableTypeIds.length || binding.applicableTypeIds.some(applicableTypeId => nodes.has(applicableTypeId))));
        return { ...field, definition: { ...definition }, sourceBindings: sourceBindings.map(binding => ({ ...binding, applicableTypeIds: [...binding.applicableTypeIds] })) };
      });

      return {
        typeId,
        label: nodes.get(typeId)!.type.label,
        profileVersions: Object.fromEntries([...nodes].map(([id, node]) => [id, node.profile.version])),
        fields,
      };
    },
  };
}
