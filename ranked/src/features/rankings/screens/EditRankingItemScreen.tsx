import { router } from "expo-router";

import { ScreenState } from "../components/ui/ScreenState";

import {
  RankingItemForm,
  RankingItemFormValues,
} from "../components/RankingItemForm";
import { useRanking } from "../hooks/useRankings";
import { useUpdateRankingItem } from "../hooks/useUpdateRankingItem";

type EditRankingItemScreenProps = {
  rankingId: string;
  itemId: string;
};

export function EditRankingItemScreen({
  rankingId,
  itemId,
}: EditRankingItemScreenProps) {
  const {
    data: ranking,
    isPending,
    isError,
    refetch,
  } = useRanking(rankingId);

  const updateRankingItem =
    useUpdateRankingItem(
      rankingId,
      itemId
    );

  if (isPending) {
    return (
      <ScreenState
        loading
        title="Loading item"
      />
    );
  }

  if (isError) {
    return (
      <ScreenState
        title="Couldn't load item"
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

  const item = ranking.items.find(
    (item) =>
      item.id === itemId
  );

  if (!item) {
    return (
      <ScreenState
        title="Item not found"
        message="It may have been deleted."
      />
    );
  }

  async function handleSubmit(
    values: RankingItemFormValues
  ) {
    await updateRankingItem.mutateAsync(
      values
    );

    router.back();
  }

  return (
    <RankingItemForm
      scoringMode={
        ranking.scoringMode
      }
      initialName={item.name}
      initialDescription={
        item.description ?? ""
      }
      initialScore={item.score}
      submitLabel="Save Changes"
      isPending={
        updateRankingItem.isPending
      }
      onSubmit={handleSubmit}
    />
  );
}