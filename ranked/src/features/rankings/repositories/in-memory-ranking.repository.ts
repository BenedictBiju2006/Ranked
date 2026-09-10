import { Ranking } from "../domain/ranking.types";
import { RankingRepository } from "./ranking.repository";

function cloneRanking(ranking: Ranking): Ranking {
  return {
    ...ranking,
    items: ranking.items.map((item) => ({ ...item })),
  };
}

class InMemoryRankingRepository implements RankingRepository {
  private rankings = new Map<string, Ranking>();

  async getAll(): Promise<Ranking[]> {
    return Array.from(this.rankings.values()).map(cloneRanking);
  }

  async getById(id: string): Promise<Ranking | null> {
    const ranking = this.rankings.get(id);

    return ranking ? cloneRanking(ranking) : null;
  }

  async save(ranking: Ranking): Promise<Ranking> {
    const stored = cloneRanking(ranking);

    this.rankings.set(ranking.id, stored);

    return cloneRanking(stored);
  }

  async delete(id: string): Promise<void> {
    this.rankings.delete(id);
  }
}

export const rankingRepository =
  new InMemoryRankingRepository();