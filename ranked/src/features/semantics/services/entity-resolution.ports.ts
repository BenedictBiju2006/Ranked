import type { SourceEntityRecord } from "../domain/knowledge-source.types";
import type { EntityResolutionRequest, EntityResolutionResult, IdentityHint, IdentityHintEvidence, ResolutionDecision, ResolutionDecisionInput } from "../domain/entity-resolution.types";

export interface IdentityEvidenceReader {
  readonly provider: string;
  read(entity: SourceEntityRecord, hints: readonly IdentityHint[]): IdentityHintEvidence[];
}

export interface EntityResolutionPolicy {
  readonly id: string;
  decide(input: ResolutionDecisionInput, signal?: AbortSignal): Promise<ResolutionDecision>;
}

export interface EntityResolver {
  resolve(request: EntityResolutionRequest, signal?: AbortSignal): Promise<EntityResolutionResult>;
}
