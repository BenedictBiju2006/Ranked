import { useMutation, useQueryClient } from "@tanstack/react-query";

import { UpdateRankingItemInput } from "../domain/ranking.types";
import { rankingService } from "../services/ranking.service";
import { rankingKeys } from "./useRankings";

export function useUpdateRankingItem(
  rankingId: string,
  itemId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRankingItemInput) =>
      rankingService.updateItem(
        rankingId,
        itemId,
        input
      ),

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