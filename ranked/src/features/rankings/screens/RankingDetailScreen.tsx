import { router } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RatingControl } from "../components/RatingControl";
import { getOrderedRankingItems } from "../domain/ranking.rules";
import {
  RankingItem,
  RankingScoringMode,
} from "../domain/ranking.types";
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

  const orderedItems = getOrderedRankingItems(ranking);

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
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {ranking.title}
          </Text>

          {ranking.description && (
            <Text style={styles.description}>
              {ranking.description}
            </Text>
          )}

          <Text style={styles.meta}>
            {getScoringModeLabel(ranking.scoringMode)}
            {" · "}
            {ranking.items.length}{" "}
            {ranking.items.length === 1 ? "item" : "items"}
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addButtonText}>
            +
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={orderedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              Nothing ranked yet
            </Text>

            <Text style={styles.emptyDescription}>
              Add your first item to get started.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <RankingItemRow
            item={item}
            index={index}
            scoringMode={ranking.scoringMode}
          />
        )}
      />
    </View>
  );
}

type RankingItemRowProps = {
  item: RankingItem;
  index: number;
  scoringMode: RankingScoringMode;
};

function RankingItemRow({
  item,
  index,
  scoringMode,
}: RankingItemRowProps) {
  return (
    <View style={styles.item}>
      {scoringMode !== "binary" && (
        <Text style={styles.position}>
          {index + 1}
        </Text>
      )}

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>
            {item.name}
          </Text>

          {renderScore(item.score, scoringMode)}
        </View>

        {item.description && (
          <Text style={styles.itemDescription}>
            {item.description}
          </Text>
        )}
      </View>
    </View>
  );
}

function renderScore(
  score: number | null,
  scoringMode: RankingScoringMode
) {
  if (scoringMode === "score_10") {
    return (
      <Text style={styles.score}>
        {score === null
          ? "Not rated"
          : `${score} / 10`}
      </Text>
    );
  }

  return (
    <RatingControl
      scoringMode={scoringMode}
      value={score}
    />
  );
}

function getScoringModeLabel(
  scoringMode: RankingScoringMode
): string {
  switch (scoringMode) {
    case "binary":
      return "Like / Dislike";

    case "stars_5":
      return "5 Stars";

    case "score_10":
      return "0–10";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
  },

  description: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.65,
  },

  meta: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.5,
  },

  addButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 22,
  },

  addButtonText: {
    fontSize: 28,
    lineHeight: 30,
  },

  list: {
    paddingTop: 28,
    paddingBottom: 40,
    gap: 12,
    flexGrow: 1,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderRadius: 14,
  },

  position: {
    width: 28,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  itemContent: {
    flex: 1,
  },

  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  itemName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },

  score: {
    fontSize: 16,
    fontWeight: "600",
  },

  itemDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.55,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  emptyDescription: {
    marginTop: 6,
    fontSize: 14,
    opacity: 0.5,
  },
});