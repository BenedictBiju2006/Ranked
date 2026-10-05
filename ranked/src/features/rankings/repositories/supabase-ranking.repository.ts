import { supabase } from "@/lib/supabase";

import {
  Ranking,
  RankingItem,
  RankingScoringMode,
} from "../domain/ranking.types";
import { RankingRepository } from "./ranking.repository";

type RankingItemRow = {
  id: string;
  ranking_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  score: number | null;
  position: number;
  created_at: string;
  updated_at: string;
};

type RankingRow = {
  id: string;
  title: string;
  description: string | null;
  scoring_mode: RankingScoringMode;
  category: string | null;
  context: string | null;
  created_at: string;
  updated_at: string;
  ranking_items: RankingItemRow[] | null;
};

const rankingSelect = `
  id,
  title,
  description,
  scoring_mode,
  category,
  context,
  created_at,
  updated_at,
  ranking_items (
    id,
    ranking_id,
    name,
    description,
    image_url,
    score,
    position,
    created_at,
    updated_at
  )
`;

function mapRankingItem(
  row: RankingItemRow
): RankingItem {
  return {
    id: row.id,
    rankingId: row.ranking_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    score: row.score,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRanking(
  row: RankingRow
): Ranking {
  const items = (row.ranking_items ?? [])
    .map(mapRankingItem)
    .sort(
      (a, b) =>
        a.position - b.position
    );

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    scoringMode: row.scoring_mode,
    category: row.category,
    context: row.context,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRankingRow(
  ranking: Ranking
) {
  return {
    id: ranking.id,
    title: ranking.title,
    description: ranking.description,
    scoring_mode: ranking.scoringMode,
    category: ranking.category,
    context: ranking.context,
    created_at: ranking.createdAt,
    updated_at: ranking.updatedAt,
  };
}

function toRankingItemRow(
  item: RankingItem
) {
  return {
    id: item.id,
    ranking_id: item.rankingId,
    name: item.name,
    description: item.description,
    image_url: item.imageUrl,
    score: item.score,
    position: item.position,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

class SupabaseRankingRepository
  implements RankingRepository
{
  async getAll(): Promise<Ranking[]> {
    const { data, error } =
      await supabase
        .from("rankings")
        .select(rankingSelect)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    return (data as RankingRow[]).map(
      mapRanking
    );
  }

  async getById(
    id: string
  ): Promise<Ranking | null> {
    const { data, error } =
      await supabase
        .from("rankings")
        .select(rankingSelect)
        .eq("id", id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapRanking(
      data as RankingRow
    );
  }

  async save(
    ranking: Ranking
  ): Promise<Ranking> {
    const {
      data: existingItems,
      error: existingItemsError,
    } = await supabase
      .from("ranking_items")
      .select("id")
      .eq(
        "ranking_id",
        ranking.id
      );

    if (existingItemsError) {
      throw existingItemsError;
    }

    const { error: rankingError } =
      await supabase
        .from("rankings")
        .upsert(
          toRankingRow(ranking),
          {
            onConflict: "id",
          }
        );

    if (rankingError) {
      throw rankingError;
    }

    if (ranking.items.length > 0) {
      const { error: itemsError } =
        await supabase
          .from("ranking_items")
          .upsert(
            ranking.items.map(
              toRankingItemRow
            ),
            {
              onConflict: "id",
            }
          );

      if (itemsError) {
        throw itemsError;
      }
    }

    const currentItemIds =
      new Set(
        ranking.items.map(
          (item) => item.id
        )
      );

    const removedItemIds =
      (existingItems ?? [])
        .filter(
          (item) =>
            !currentItemIds.has(item.id)
        )
        .map(
          (item) => item.id
        );

    if (removedItemIds.length > 0) {
      const { error: deleteError } =
        await supabase
          .from("ranking_items")
          .delete()
          .eq(
            "ranking_id",
            ranking.id
          )
          .in(
            "id",
            removedItemIds
          );

      if (deleteError) {
        throw deleteError;
      }
    }

    const savedRanking =
      await this.getById(
        ranking.id
      );

    if (!savedRanking) {
      throw new Error(
        `Ranking ${ranking.id} could not be loaded after saving.`
      );
    }

    return savedRanking;
  }

  async delete(
    id: string
  ): Promise<void> {
    const { error } =
      await supabase
        .from("rankings")
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }
  }
}

export const supabaseRankingRepository =
  new SupabaseRankingRepository();