export type RankingScoringMode =
  | "binary"
  | "stars_5"
  | "score_10";

export interface Ranking {
  id: string;
  title: string;
  description: string | null;

  scoringMode: RankingScoringMode;

  category: string | null;
  context: string | null;

  items: RankingItem[];

  createdAt: string;
  updatedAt: string;
}

export interface RankingItem {
  id: string;
  rankingId: string;

  name: string;
  description: string | null;
  imageUrl: string | null;

  score: number | null;
  position: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateRankingInput {
  title: string;
  description?: string;
  scoringMode: RankingScoringMode;
}

export interface AddRankingItemInput {
  name: string;
  description?: string;
  imageUrl?: string;
  score?: number;
}

export interface UpdateRankingItemInput {
  name: string;
  description?: string;
  score: number;
}