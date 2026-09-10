import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { CreateRankingInput } from "../domain/ranking.types";
import { rankingService } from "../services/ranking.service";
import { rankingKeys } from "./useRankings";

export function useCreateRanking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRankingInput) =>
      rankingService.create(input),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rankingKeys.all,
      });
    },
  });
}