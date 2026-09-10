import { StyleSheet, Text, View } from "react-native";

export function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ranked.</Text>
      <Text style={styles.subtitle}>Rank anything.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 48,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 18,
  },
});