import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ranked.</Text>
      <Text style={styles.subtitle}>Rank anything.</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/rankings")}
      >
        <Text style={styles.buttonText}>
          View Rankings
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 48,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 18,
  },

  button: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "black",
  },

  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});