import { router } from "expo-router";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { useDeleteRanking } from "../hooks/useDeleteRanking";
import { useRankings } from "../hooks/useRankings";
import { ScreenState } from "../components/ui/ScreenState";

export function RankingsScreen() {
  const {
    data: rankings = [],
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useRankings();

  const deleteRanking = useDeleteRanking();

  function handleOpen(rankingId: string) {
    router.push({
      pathname: "/ranking/[id]",
      params: {
        id: rankingId,
      },
    });
  }

  function handleEdit(rankingId: string) {
    router.push({
      pathname: "/ranking/edit",
      params: {
        rankingId,
      },
    });
  }

  function handleDelete(
    rankingId: string,
    title: string
  ) {
    Alert.alert(
      "Delete ranking?",
      `"${title}" and all of its items will be deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRanking.mutate(rankingId);
          },
        },
      ]
    );
  }

  if (isPending) {
    return (
      <ScreenState
        loading
        title="Loading rankings"
      />
    );
  }

  if (isError) {
    return (
      <ScreenState
        title="Couldn't load rankings"
        message="Check your connection and try again."
        actionLabel="Try Again"
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Your Rankings
        </Text>

        <Pressable
          style={styles.createButton}
          onPress={() =>
            router.push("/ranking/new")
          }
        >
          <Text style={styles.createButtonText}>
            +
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={rankings}
        keyExtractor={(ranking) =>
          ranking.id
        }
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={() => {
          void refetch();
        }}
        ListEmptyComponent={
          <ScreenState
            compact
            title="No rankings yet"
            message="Create your first ranking to get started."
            actionLabel="Create Ranking"
            onAction={() =>
              router.push("/ranking/new")
            }
          />
        }
        renderItem={({ item }) => (
          <View style={styles.swipeClip}>
            <Swipeable
              overshootRight={false}
              containerStyle={styles.swipeable}
              renderRightActions={() => (
                <Pressable
                  style={styles.deleteAction}
                  onPress={() =>
                    handleDelete(
                      item.id,
                      item.title
                    )
                  }
                >
                  <Text
                    style={
                      styles.deleteActionText
                    }
                  >
                    Delete
                  </Text>
                </Pressable>
              )}
            >
              <Pressable
                style={styles.card}
                onPress={() =>
                  handleOpen(item.id)
                }
                onLongPress={() =>
                  handleEdit(item.id)
                }
                delayLongPress={450}
              >
                <Text style={styles.cardTitle}>
                  {item.title}
                </Text>

                {item.description && (
                  <Text
                    style={
                      styles.cardDescription
                    }
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}

                <Text style={styles.cardMeta}>
                  {item.items.length}{" "}
                  {item.items.length === 1
                    ? "item"
                    : "items"}
                </Text>
              </Pressable>
            </Swipeable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    fontSize: 36,
    lineHeight: 38,
  },

  list: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
  },

  swipeClip: {
    borderRadius: 16,
    overflow: "hidden",
  },

  swipeable: {
    backgroundColor: "#D92D20",
  },

  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "white",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
  },

  cardMeta: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.5,
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