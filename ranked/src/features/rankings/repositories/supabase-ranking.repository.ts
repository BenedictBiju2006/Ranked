import {
  QueryData,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

import {
  Ranking,
  RankingItem,
  RankingScoringMode,
} from "../domain/ranking.types";
import { RankingRepository } from "./ranking.repository";

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

const rankingQuery =
  supabase
    .from("rankings")
    .select(rankingSelect);

type RankingQueryData =
  QueryData<typeof rankingQuery>;

type RankingRow =
  RankingQueryData[number];

type RankingItemRow =
  NonNullable<
    RankingRow["ranking_items"]
  >[number];

type RankingInsert =
  Database["public"]["Tables"]["rankings"]["Insert"];

type RankingItemInsert =
  Database["public"]["Tables"]["ranking_items"]["Insert"];

function mapScoringMode(
  value: string
): RankingScoringMode {
  if (
    value === "binary" ||
    value === "stars_5" ||
    value === "score_10"
  ) {
    return value;
  }

  throw new Error(
    `Unknown scoring mode: ${value}`
  );
}

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
  const items =
    (row.ranking_items ?? [])
      .map(mapRankingItem)
      .sort(
        (a, b) =>
          a.position - b.position
      );

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    scoringMode: mapScoringMode(
      row.scoring_mode
    ),
    category: row.category,
    context: row.context,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRankingRow(
  ranking: Ranking
): RankingInsert {
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
): RankingItemInsert {
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

    return data.map(mapRanking);
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

    return mapRanking(data);
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
      const itemRows =
        ranking.items.map(
          toRankingItemRow
        );

      const { error: itemsError } =
        await supabase
          .from("ranking_items")
          .upsert(
            itemRows,
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
            !currentItemIds.has(
              item.id
            )
        )
        .map(
          (item) => item.id
        );

    if (
      removedItemIds.length > 0
    ) {
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