import { useLocalSearchParams } from "expo-router";

import { EditRankingScreen } from "@/features/rankings/screens/EditRankingScreen";

export default function EditRankingRoute() {
  const { rankingId } =
    useLocalSearchParams<{
      rankingId: string;
    }>();

  return (
    <EditRankingScreen
      rankingId={rankingId}
    />
  );
}