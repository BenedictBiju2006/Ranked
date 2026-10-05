import { useLocalSearchParams } from "expo-router";

import { EditRankingItemScreen } from "@/features/rankings/screens/EditRankingItemScreen";

export default function EditRankingItemRoute() {
  const {
    rankingId,
    itemId,
  } = useLocalSearchParams<{
    rankingId: string;
    itemId: string;
  }>();

  return (
    <EditRankingItemScreen
      rankingId={rankingId}
      itemId={itemId}
    />
  );
}