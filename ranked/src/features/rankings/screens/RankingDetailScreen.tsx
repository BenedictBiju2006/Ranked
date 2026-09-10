import { StyleSheet, Text, View } from "react-native";

type RankingDetailScreenProps = {
  rankingId: string;
};

export function RankingDetailScreen({
  rankingId,
}: RankingDetailScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ranking</Text>
      <Text>{rankingId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
  },
});