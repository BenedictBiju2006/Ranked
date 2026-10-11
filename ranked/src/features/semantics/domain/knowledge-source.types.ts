export type SourceJson = string | number | boolean | null | SourceJson[] | SourceJsonObject;
export interface SourceJsonObject { [key: string]: SourceJson }

export interface SourceText {
  value: string;
  language: string | null;
}

export interface SourceCandidate {
  externalId: string;
  label: SourceText | null;
  description: SourceText | null;
  matchedText: string | null;
  position: number;
  sourceUrl: string;
}

export interface SourceSearchResult {
  provider: string;
  query: string;
  language: string;
  candidates: SourceCandidate[];
  nextCursor: string | null;
  retrievedAt: string;
}

export interface SourceEntityRecord {
  provider: string;
  externalId: string;
  entityKind: string;
  label: SourceText | null;
  description: SourceText | null;
  claims: Record<string, SourceJsonObject[]>;
  sourceRevision: string | null;
  sourceUrl: string;
  retrievedAt: string;
}

export type SourceEntityLookup =
  | { requestedId: string; status: "found"; entity: SourceEntityRecord }
  | { requestedId: string; status: "missing"; provider: string; sourceUrl: string; retrievedAt: string };

export interface SourceSearchOptions {
  language?: string;
  limit?: number;
  cursor?: string;
  kind?: "item" | "property";
  signal?: AbortSignal;
}

export interface SourceFetchOptions {
  language?: string;
  sourcePropertyIds?: readonly string[];
  signal?: AbortSignal;
}
