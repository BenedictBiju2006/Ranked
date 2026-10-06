import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { rankingService } from "../services/ranking.service";
import { rankingKeys } from "./useRankings";

export function useDeleteRanking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rankingId: string) =>
      rankingService.delete(rankingId),

    onSuccess: (_, rankingId) => {
      queryClient.removeQueries({
        queryKey:
          rankingKeys.detail(
            rankingId
          ),
      });

      queryClient.invalidateQueries({
        queryKey: rankingKeys.all,
      });
    },
  });
}