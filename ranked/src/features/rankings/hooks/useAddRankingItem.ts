import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AddRankingItemInput } from "../domain/ranking.types";
import { rankingService } from "../services/ranking.service";
import { rankingKeys } from "./useRankings";

export function useAddRankingItem(rankingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddRankingItemInput) =>
      rankingService.addItem(rankingId, input),

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