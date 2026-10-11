import type { SourceEntityLookup, SourceFetchOptions, SourceSearchOptions, SourceSearchResult } from "../domain/knowledge-source.types";

export interface KnowledgeSource {
  readonly provider: string;
  searchEntities(query: string, options?: SourceSearchOptions): Promise<SourceSearchResult>;
  getEntities(externalIds: readonly string[], options?: SourceFetchOptions): Promise<SourceEntityLookup[]>;
}
