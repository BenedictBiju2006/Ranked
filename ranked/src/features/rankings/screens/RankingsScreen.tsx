import { router } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert
} from "react-native";

import { useRankings } from "../hooks/useRankings";
import { useDeleteRanking } from "../hooks/useDeleteRanking";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

export function RankingsScreen() {
  const { data: rankings = [] } = useRankings();

  const deleteRanking = useDeleteRanking();

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
          onPress: () =>
            deleteRanking.mutate(
              rankingId
            ),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Your Rankings
        </Text>

        <Pressable
          onPress={() =>
            router.push("/ranking/new")
          }
        >
          <Text style={styles.createButton}>
            +
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={rankings}
        keyExtractor={(ranking) => ranking.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No rankings yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.swipeClip}>
            <Swipeable
          overshootRight={false}
          renderRightActions={() => (
            <Pressable
              style={styles.deleteAction}
              onPress={() => 
                handleDelete(item.id, item.title)
              }            
            >
              <Text style={styles.deleteActionText}>
                Delete
              </Text>
            </Pressable>
          )}
          >
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/ranking/[id]",
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.cardTitle}>
                {item.title}
              </Text>

              <Text style={styles.cardMeta}>
                {item.items.length} items
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
    fontSize: 36,
  },

  list: {
    paddingTop: 24,
    gap: 12,
  },

  empty: {
    opacity: 0.5,
  },

  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

   deleteActionText: {
    fontSize: 20,
    fontWeight: "600",
  },

  cardMeta: {
    marginTop: 6,
    opacity: 0.5,
  },

  swipeClip: {
  borderRadius: 14,
  overflow: "hidden",
},

swipeable: {
  backgroundColor: "#D92D20",
},

deleteAction: {
  width: 100,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#D92D20",
},
});