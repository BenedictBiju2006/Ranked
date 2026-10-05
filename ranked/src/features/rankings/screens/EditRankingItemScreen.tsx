import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  } = useRanking(rankingId);

  const updateRankingItem =
    useUpdateRankingItem(
      rankingId,
      itemId
    );

  if (isPending) {
    return (
      <View style={styles.stateContainer}>
        <Text>Loading item...</Text>
      </View>
    );
  }

  if (isError || !ranking) {
    return (
      <View style={styles.stateContainer}>
        <Text>Ranking not found.</Text>
      </View>
    );
  }

  const item = ranking.items.find(
    (item) => item.id === itemId
  );

  if (!item) {
    return (
      <View style={styles.stateContainer}>
        <Text>Item not found.</Text>
      </View>
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
      scoringMode={ranking.scoringMode}
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

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    padding: 24,
  },
});