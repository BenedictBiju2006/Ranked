import type { CatalogProfileField, CatalogProfileNode, InheritedCatalogField } from "./profile-catalog.types";

export function parseCatalogChoice<const Choices extends readonly string[]>(value: unknown, choices: Choices, label: string): Choices[number] {
  if (typeof value !== "string" || !choices.includes(value)) throw new Error(`Invalid ${label}: ${String(value)}`);
  return value;
}

export function parseCatalogFields(value: unknown, label: string): CatalogProfileField[] {
  if (!Array.isArray(value)) throw new Error(`${label} must contain an array of fields.`);
  const propertyIds = new Set<string>();

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`${label}[${index}] must be an object.`);
    const field = entry as Record<string, unknown>;
    if (typeof field.propertyId !== "string" || !field.propertyId.trim()) throw new Error(`${label}[${index}] needs a propertyId.`);
    if (propertyIds.has(field.propertyId)) throw new Error(`${label} repeats property ${field.propertyId}.`);
    propertyIds.add(field.propertyId);
    if (!Array.isArray(field.roles) || !field.roles.length) throw new Error(`${label}.${field.propertyId} needs at least one role.`);
    for (const flag of ["filterable", "comparable", "scopeCandidate"]) {
      if (typeof field[flag] !== "boolean") throw new Error(`${label}.${field.propertyId}.${flag} must be boolean.`);
    }

    return {
      propertyId: field.propertyId,
      priority: parseCatalogChoice(field.priority, ["required", "preferred", "optional"], "property priority"),
      roles: [...new Set(field.roles.map(role => parseCatalogChoice(role, ["identity", "descriptive", "connective", "analytical", "display"], "property role")))],
      filterable: field.filterable as boolean,
      comparable: field.comparable as boolean,
      scopeCandidate: field.scopeCandidate as boolean,
    };
  });
}

function fieldsAgree(left: CatalogProfileField, right: CatalogProfileField): boolean {
  const signature = (field: CatalogProfileField) => JSON.stringify([field.priority, [...field.roles].sort(), field.filterable, field.comparable, field.scopeCandidate]);
  return signature(left) === signature(right);
}

export function mergeCatalogProfiles(typeId: string, nodes: ReadonlyMap<string, CatalogProfileNode>): InheritedCatalogField[] {
  const resolved = new Map<string, Map<string, InheritedCatalogField>>();
  const active = new Set<string>();

  function isAncestor(ancestorId: string, descendantId: string): boolean {
    const visited = new Set<string>();
    const pending = [...(nodes.get(descendantId)?.type.parentTypeIds ?? [])];
    while (pending.length) {
      const current = pending.pop()!;
      if (current === ancestorId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      pending.push(...(nodes.get(current)?.type.parentTypeIds ?? []));
    }
    return false;
  }

  function resolve(currentTypeId: string): Map<string, InheritedCatalogField> {
    if (active.has(currentTypeId)) throw new Error(`Profile inheritance cycle at ${currentTypeId}.`);
    const cached = resolved.get(currentTypeId);
    if (cached) return cached;
    const node = nodes.get(currentTypeId);
    if (!node) throw new Error(`Missing profile node: ${currentTypeId}.`);
    if (node.type.id !== currentTypeId || node.profile.typeId !== currentTypeId) throw new Error(`Profile/type mismatch: ${currentTypeId}.`);
    if (!Number.isSafeInteger(node.profile.version) || node.profile.version < 1) throw new Error(`Invalid profile version: ${currentTypeId}.`);
    active.add(currentTypeId);
    const localFields = parseCatalogFields(node.profile.fields, currentTypeId);
    const localIds = new Set(localFields.map(field => field.propertyId));
    const fields = new Map<string, InheritedCatalogField>();
    const candidates = new Map<string, Map<string, InheritedCatalogField>>();

    for (const parentId of [...node.type.parentTypeIds].sort()) {
      for (const inherited of resolve(parentId).values()) {
        if (localIds.has(inherited.propertyId)) continue;
        const declarations = candidates.get(inherited.propertyId) ?? new Map<string, InheritedCatalogField>();
        declarations.set(inherited.definedOn, inherited);
        candidates.set(inherited.propertyId, declarations);
      }
    }

    for (const [propertyId, declarations] of candidates) {
      const inherited = [...declarations.values()];
      const mostSpecific = inherited.filter(candidate => !inherited.some(other => isAncestor(candidate.definedOn, other.definedOn)));
      const selected = mostSpecific[0];
      if (mostSpecific.some(candidate => !fieldsAgree(selected, candidate))) {
        throw new Error(`${currentTypeId} must override conflicting property ${propertyId} from ${mostSpecific.map(candidate => candidate.definedOn).join(" and ")}.`);
      }
      fields.set(propertyId, selected);
    }

    for (const field of localFields) fields.set(field.propertyId, { ...field, definedOn: currentTypeId });
    active.delete(currentTypeId);
    resolved.set(currentTypeId, fields);
    return fields;
  }

  return [...resolve(typeId).values()].sort((left, right) => left.propertyId.localeCompare(right.propertyId));
}
