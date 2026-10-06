import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { UpdateRankingInput } from "../domain/ranking.types";
import { rankingService } from "../services/ranking.service";
import { rankingKeys } from "./useRankings";

export function useUpdateRanking(
  rankingId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: UpdateRankingInput
    ) =>
      rankingService.update(
        rankingId,
        input
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
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