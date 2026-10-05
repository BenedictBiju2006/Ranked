import { useMutation, useQueryClient } from "@tanstack/react-query";

import { rankingService } from "../services/ranking.service";
import { rankingKeys } from "./useRankings";

export function useRemoveRankingItem(rankingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      rankingService.removeItem(rankingId, itemId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rankingKeys.detail(rankingId),
      });

      queryClient.invalidateQueries({
        queryKey: rankingKeys.all,
      });
    },
  });
}