import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { parseCatalogChoice, parseCatalogFields } from "../domain/profile-catalog.rules";
import type { ProfileCatalogRepository } from "./profile-catalog.repository";

function checkDatabaseError(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

export function createSupabaseProfileCatalogRepository(client: SupabaseClient<Database>): ProfileCatalogRepository {
  return {
    async getType(typeId) {
      const [typeResult, parentResult] = await Promise.all([
        client.from("semantic_types").select("id,label").eq("id", typeId).maybeSingle(),
        client.from("semantic_type_parents").select("parent_type_id").eq("type_id", typeId).order("parent_type_id"),
      ]);
      checkDatabaseError(typeResult.error, `Load type ${typeId}`);
      checkDatabaseError(parentResult.error, `Load parents for ${typeId}`);
      if (!typeResult.data) return null;
      return { id: typeResult.data.id, label: typeResult.data.label, parentTypeIds: (parentResult.data ?? []).map(row => row.parent_type_id) };
    },

    async getPublishedProfile(typeId) {
      const { data, error } = await client.from("semantic_type_profiles").select("type_id,version,properties").eq("type_id", typeId).eq("status", "published").maybeSingle();
      checkDatabaseError(error, `Load published profile for ${typeId}`);
      if (!data) return null;
      return { typeId: data.type_id, version: data.version, fields: parseCatalogFields(data.properties, `${data.type_id}@${data.version}`) };
    },

    async getProperties(propertyIds) {
      if (!propertyIds.length) return [];
      const { data, error } = await client.from("semantic_properties").select("id,schema_property,value_type,cardinality,unit,normalization_strategy").in("id", propertyIds).order("id");
      checkDatabaseError(error, "Load property definitions");

      return (data ?? []).map(row => ({
        id: row.id,
        schemaProperty: row.schema_property,
        valueType: parseCatalogChoice(row.value_type, ["text", "number", "boolean", "date", "duration", "entity", "url", "enum"], "property value type"),
        cardinality: parseCatalogChoice(row.cardinality, ["one", "many"], "property cardinality"),
        unit: row.unit,
        normalizationStrategy: row.normalization_strategy,
      }));
    },

    async getSourceBindings(propertyIds) {
      if (!propertyIds.length) return [];
      const { data, error } = await client.from("semantic_source_bindings").select("property_id,provider,source_property_id,extractor,applicable_type_ids").in("property_id", propertyIds).order("id");
      checkDatabaseError(error, "Load source bindings");

      return (data ?? []).map(row => ({
        propertyId: row.property_id,
        provider: row.provider,
        sourcePropertyId: row.source_property_id,
        extractor: row.extractor,
        applicableTypeIds: row.applicable_type_ids,
      }));
    },
  };
}
