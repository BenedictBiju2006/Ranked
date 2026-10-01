import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAddRankingItem } from "../hooks/useAddRankingItem";

type AddRankingItemScreenProps = {
  rankingId: string;
};

export function AddRankingItemScreen({
  rankingId,
}: AddRankingItemScreenProps) {
  const [itemName, setItemName] = useState("");

  const addRankingItem = useAddRankingItem(rankingId);

  async function handleAdd() {
    const cleanItemName = itemName.trim();

    if (!cleanItemName) {
      return;
    }
    

    await addRankingItem.mutateAsync({
      name: cleanItemName,
    });

    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Add Item</Text>

      <TextInput
        value={itemName}
        onChangeText={setItemName}
        placeholder="Add an item..."
        autoFocus
        style={styles.input}
      />

      <Pressable
        style={styles.button}
        onPress={handleAdd}
        disabled={addRankingItem.isPending}
      >
        <Text style={styles.buttonText}>
          {addRankingItem.isPending ? "Adding..." : "Add Item"}
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