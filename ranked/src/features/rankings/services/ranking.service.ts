import {
  addRankingItem,
  changeScoringMode,
  createRanking,
  removeRankingItem,
  reorderRankingItem,
  setRankingItemScore,
} from "../domain/ranking.rules";

import {
  AddRankingItemInput,
  CreateRankingInput,
  Ranking,
  RankingScoringMode,
} from "../domain/ranking.types";

import { rankingRepository } from "../repositories/in-memory-ranking.repository";

async function requireRanking(id: string): Promise<Ranking> {
  const ranking = await rankingRepository.getById(id);

  if (!ranking) {
    throw new Error(`Ranking ${id} was not found.`);
  }

  return ranking;
}

export const rankingService = {
  getAll() {
    return rankingRepository.getAll();
  },

  getById(id: string) {
    return rankingRepository.getById(id);
  },

  async create(input: CreateRankingInput) {
    const ranking = createRanking(input);

    return rankingRepository.save(ranking);
  },

  async delete(id: string) {
    return rankingRepository.delete(id);
  },

  async addItem(
    rankingId: string,
    input: AddRankingItemInput
  ) {
    const ranking = await requireRanking(rankingId);

    const updated = addRankingItem(ranking, input);

    return rankingRepository.save(updated);
  },

  async removeItem(
    rankingId: string,
    itemId: string
  ) {
    const ranking = await requireRanking(rankingId);

    const updated = removeRankingItem(
      ranking,
      itemId
    );

    return rankingRepository.save(updated);
  },

  async setScore(
    rankingId: string,
    itemId: string,
    score: number
  ) {
    const ranking = await requireRanking(rankingId);

    const updated = setRankingItemScore(
      ranking,
      itemId,
      score
    );

    return rankingRepository.save(updated);
  },

  async reorder(
    rankingId: string,
    fromIndex: number,
    toIndex: number
  ) {
    const ranking = await requireRanking(rankingId);

    const updated = reorderRankingItem(
      ranking,
      fromIndex,
      toIndex
    );

    return rankingRepository.save(updated);
  },

  async changeScoringMode(
    rankingId: string,
    scoringMode: RankingScoringMode
  ) {
    const ranking = await requireRanking(rankingId);

    const updated = changeScoringMode(
      ranking,
      scoringMode
    );

    return rankingRepository.save(updated);
  },
};