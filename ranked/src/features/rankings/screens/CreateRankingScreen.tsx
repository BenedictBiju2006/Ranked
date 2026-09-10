import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCreateRanking } from "../hooks/useCreateRanking";

export function CreateRankingScreen() {
  const [title, setTitle] = useState("");

  const createRanking = useCreateRanking();

  async function handleCreate() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    const ranking =
      await createRanking.mutateAsync({
        title: cleanTitle,
        scoringMode: "score_10",
      });

    router.push({
                pathname: "/ranking/[id]",
                params: { id: ranking.id },
              });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        What are we ranking?
      </Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Movies, games, food..."
        autoFocus
        style={styles.input}
      />

      <Pressable
        style={styles.button}
        onPress={handleCreate}
      >
        <Text style={styles.buttonText}>
          Create Ranking
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
  },

  label: {
    fontSize: 24,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
  },

  button: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "black",
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
});