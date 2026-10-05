import {
  AddRankingItemInput,
  CreateRankingInput,
  Ranking,
  RankingItem,
  RankingScoringMode,
  UpdateRankingItemInput
} from "./ranking.types";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function createRanking(input: CreateRankingInput): Ranking {
  const now = new Date().toISOString();

  return {
    id: generateId(),

    title: input.title.trim(),
    description: input.description?.trim() || null,

    scoringMode: input.scoringMode,

    category: null,
    context: null,

    items: [],

    createdAt: now,
    updatedAt: now,
  };
}

export function addRankingItem(
  ranking: Ranking,
  input: AddRankingItemInput
): Ranking {
  const now = new Date().toISOString();

  if (input.score !== undefined) {
    validateScore(ranking.scoringMode, input.score);
  }

  const item: RankingItem = {
    id: generateId(),
    rankingId: ranking.id,

    name: input.name.trim(),
    description: input.description?.trim() || null,
    imageUrl: input.imageUrl ?? null,

    score: input.score ?? null,
    position: ranking.items.length,

    createdAt: now,
    updatedAt: now,
  };

  return {
    ...ranking,
    items: [...ranking.items, item],
    updatedAt: now,
  };
}

export function updateRankingItem(
  ranking: Ranking,
  itemId: string,
  input: UpdateRankingItemInput
): Ranking {
  validateScore(ranking.scoringMode, input.score);

  const itemExists = ranking.items.some(
    (item) => item.id === itemId
  );

  if (!itemExists) {
    throw new Error(`Ranking item ${itemId} was not found.`);
  }

  const now = new Date().toISOString();

  return {
    ...ranking,

    items: ranking.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            score: input.score,
            updatedAt: now,
          }
        : item
    ),

    updatedAt: now,
  };
}

export function removeRankingItem(
  ranking: Ranking,
  itemId: string
): Ranking {
  const items = ranking.items
    .filter((item) => item.id !== itemId)
    .map((item, index) => ({
      ...item,
      position: index,
    }));

  return {
    ...ranking,
    items,
    updatedAt: new Date().toISOString(),
  };
}

export function setRankingItemScore(
  ranking: Ranking,
  itemId: string,
  score: number
): Ranking {
  validateScore(ranking.scoringMode, score);

  const now = new Date().toISOString();

  return {
    ...ranking,

    items: ranking.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            score,
            updatedAt: now,
          }
        : item
    ),

    updatedAt: now,
  };
}

export function reorderRankingItem(
  ranking: Ranking,
  fromIndex: number,
  toIndex: number
): Ranking {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= ranking.items.length ||
    toIndex >= ranking.items.length
  ) {
    throw new Error("Invalid ranking position.");
  }

  const items = [...ranking.items];

  const [item] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, item);

  return {
    ...ranking,

    items: items.map((currentItem, index) => ({
      ...currentItem,
      position: index,
    })),

    updatedAt: new Date().toISOString(),
  };
}

export function changeScoringMode(
  ranking: Ranking,
  scoringMode: RankingScoringMode
): Ranking {
  return {
    ...ranking,
    scoringMode,

    // Scores may no longer be valid under the new scale.
    items: ranking.items.map((item) => ({
      ...item,
      score: null,
    })),

    updatedAt: new Date().toISOString(),
  };
}

function validateScore(
  scoringMode: RankingScoringMode,
  score: number
): void {
  switch (scoringMode) {
    case "binary":
      if (score !== 0 && score !== 1) {
        throw new Error("Binary rankings only support 0 or 1.");
      }
      break;

    case "stars_5":
      if (score < 0 || score > 5) {
        throw new Error("Star ratings must be between 0 and 5.");
      }
      break;

    case "score_10":
      if (score < 0 || score > 10) {
        throw new Error("Scores must be between 0 and 10.");
      }
      break;
  }
}

export function getOrderedRankingItems(ranking: Ranking): RankingItem[] {
  if (ranking.scoringMode === "binary") {
    return [...ranking.items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }

  return [...ranking.items].sort((a, b) => {
    if (a.score === null && b.score === null) {
      return a.position - b.position;
    }

    if (a.score === null) {
      return 1;
    }

    if (b.score === null) {
      return -1;
    }

    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.position - b.position;
  });
}