import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRanking } from "../hooks/useRankings";

type RankingDetailScreenProps = {
  rankingId: string;
};

export function RankingDetailScreen({
  rankingId,
}: RankingDetailScreenProps) {
  const {
    data: ranking,
    isPending,
    isError,
  } = useRanking(rankingId);

  if (isPending) {
    return (
      <View style={styles.container}>
        <Text>Loading ranking...</Text>
      </View>
    );
  }

  if (isError || !ranking) {
    return (
      <View style={styles.container}>
        <Text>Ranking not found.</Text>
      </View>
    );
  }

  function handleAddItem() {
    router.push({
      pathname: "/ranking/add-item",
      params: {
        rankingId,
      },
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {ranking.title}
        </Text>

        <Pressable onPress={handleAddItem}>
          <Text style={styles.createButton}>
            +
          </Text>
        </Pressable>
      </View>

      <Text>{ranking.scoringMode}</Text>
      <Text>{ranking.items.length} items</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
  },

  createButton: {
    fontSize: 36,
  },
});