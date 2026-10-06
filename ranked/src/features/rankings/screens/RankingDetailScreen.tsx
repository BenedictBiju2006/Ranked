import { router } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { ScreenState } from "../components/ui/ScreenState";

import { RatingControl } from "../components/RatingControl";
import { getOrderedRankingItems } from "../domain/ranking.rules";
import {
  RankingItem,
  RankingScoringMode,
} from "../domain/ranking.types";
import { useRemoveRankingItem } from "../hooks/useRemoveRankingItem";
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
    isRefetching,
    refetch,
  } = useRanking(rankingId);

  const removeRankingItem =
    useRemoveRankingItem(rankingId);

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

  const orderedItems =
    getOrderedRankingItems(ranking);

  function handleAddItem() {
    router.push({
      pathname: "/ranking/add-item",
      params: {
        rankingId,
      },
    });
  }

  function handleEditRanking() {
    router.push({
      pathname: "/ranking/edit",
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
            {getScoringModeLabel(
              ranking.scoringMode
            )}
            {" · "}
            {ranking.items.length}{" "}
            {ranking.items.length === 1
              ? "item"
              : "items"}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.editButton}
            onPress={handleEditRanking}
          >
            <Text
              style={styles.editButtonText}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={styles.addButton}
            onPress={handleAddItem}
          >
            <Text
              style={styles.addButtonText}
            >
              +
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={orderedItems}
        keyExtractor={(item) =>
          item.id
        }
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={() => {
          void refetch();
        }}
        ListEmptyComponent={
          <ScreenState
            compact
            title="No items yet"
            message="Add your first item to this ranking."
            actionLabel="Add Item"
            onAction={handleAddItem}
          />
        }
        renderItem={({ item, index }) => (
          <RankingItemRow
            item={item}
            index={index}
            rankingId={rankingId}
            scoringMode={
              ranking.scoringMode
            }
            onDelete={() => {
              removeRankingItem.mutate(
                item.id
              );
            }}
          />
        )}
      />
    </View>
  );
}

type RankingItemRowProps = {
  item: RankingItem;
  index: number;
  rankingId: string;
  scoringMode: RankingScoringMode;
  onDelete: () => void;
};

function RankingItemRow({
  item,
  index,
  rankingId,
  scoringMode,
  onDelete,
}: RankingItemRowProps) {
  function handleEdit() {
    router.push({
      pathname: "/ranking/edit-item",
      params: {
        rankingId,
        itemId: item.id,
      },
    });
  }

  return (
    <View style={styles.swipeClip}>
      <Swipeable
        friction={2}
        rightThreshold={70}
        overshootRight={false}
        containerStyle={styles.swipeable}
        renderRightActions={() => (
          <View
            style={styles.deleteAction}
          >
            <Text
              style={
                styles.deleteActionText
              }
            >
              Delete
            </Text>
          </View>
        )}
        onSwipeableOpen={onDelete}
      >
        <Pressable
          style={styles.item}
          onLongPress={handleEdit}
          delayLongPress={450}
        >
          {scoringMode !== "binary" && (
            <Text
              style={styles.position}
            >
              {index + 1}
            </Text>
          )}

          <View
            style={styles.itemContent}
          >
            <View
              style={styles.itemHeader}
            >
              <Text
                style={styles.itemName}
              >
                {item.name}
              </Text>

              {renderScore(
                item.score,
                scoringMode
              )}
            </View>

            {item.description && (
              <Text
                style={
                  styles.itemDescription
                }
              >
                {item.description}
              </Text>
            )}
          </View>
        </Pressable>
      </Swipeable>
    </View>
  );
}

function renderScore(
  score: number | null,
  scoringMode: RankingScoringMode
) {
  if (
    scoringMode === "score_10"
  ) {
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

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  editButton: {
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 22,
  },

  editButtonText: {
    fontWeight: "600",
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
    flexGrow: 1,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 12,
  },

  swipeClip: {
    borderRadius: 14,
    overflow: "hidden",
  },

  swipeable: {
    backgroundColor: "#D92D20",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "white",
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
    alignItems: "center",
    justifyContent: "space-between",
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

  deleteAction: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D92D20",
  },

  deleteActionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});