import { useLocalSearchParams } from "expo-router";

import { AddRankingItemScreen } from "@/features/rankings/screens/AddRankingItemScreen";

export default function AddRankingItemRoute() {
  const { rankingId } =
    useLocalSearchParams<{ rankingId: string }>();

  return (
    <AddRankingItemScreen
      rankingId={rankingId}
    />
  );
}