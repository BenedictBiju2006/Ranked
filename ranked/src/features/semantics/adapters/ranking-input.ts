import type { Ranking } from "@/features/rankings/domain/ranking.types";
import type { RankingSemanticInput } from "../domain/semantic.types";

export function toRankingSemanticInput(ranking: Ranking): RankingSemanticInput {
  return {
    rankingId: ranking.id,
    revision: ranking.updatedAt,
    title: ranking.title,
    description: ranking.description,
    context: ranking.context,
    items: ranking.items.map(item => ({ itemId: item.id, label: item.name, score: item.score, position: item.position }))
  };
}
