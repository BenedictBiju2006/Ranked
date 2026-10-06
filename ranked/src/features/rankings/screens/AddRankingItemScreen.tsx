import { router } from "expo-router";

import { ScreenState } from "../components/ui/ScreenState";

import {
  RankingItemForm,
  RankingItemFormValues,
} from "../components/RankingItemForm";
import { useAddRankingItem } from "../hooks/useAddRankingItem";
import { useRanking } from "../hooks/useRankings";

type AddRankingItemScreenProps = {
  rankingId: string;
};

export function AddRankingItemScreen({
  rankingId,
}: AddRankingItemScreenProps) {
  const {
    data: ranking,
    isPending,
    isError,
    refetch,
  } = useRanking(rankingId);

  const addRankingItem =
    useAddRankingItem(rankingId);

  if (isPending) {
    return (
      <ScreenState
        loading
        title="Loading ranking"
      />
    );
  }

  if (isError) {
    return (
      <ScreenState
        title="Couldn't load ranking"
        message="Check your connection and try again."
        actionLabel="Try Again"
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  if (!ranking) {
    return (
      <ScreenState
        title="Ranking not found"
        message="It may have been deleted."
      />
    );
  }

  async function handleSubmit(
    values: RankingItemFormValues
  ) {
    await addRankingItem.mutateAsync(
      values
    );

    router.back();
  }

  return (
    <RankingItemForm
      scoringMode={
        ranking.scoringMode
      }
      submitLabel="Add Item"
      isPending={
        addRankingItem.isPending
      }
      onSubmit={handleSubmit}
    />
  );
}