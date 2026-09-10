import { Ranking } from "../domain/ranking.types";

export interface RankingRepository {
  getAll(): Promise<Ranking[]>;

  getById(id: string): Promise<Ranking | null>;

  save(ranking: Ranking): Promise<Ranking>;

  delete(id: string): Promise<void>;
}