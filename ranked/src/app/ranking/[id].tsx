import { useLocalSearchParams } from "expo-router";

import { RankingDetailScreen } from "@/features/rankings/screens/RankingDetailScreen";

export default function RankingDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RankingDetailScreen rankingId={id} />;
}