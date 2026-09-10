import { useQuery } from "@tanstack/react-query";

import { rankingService } from "../services/ranking.service";

export const rankingKeys = {
  all: ["rankings"] as const,

  detail: (id: string) =>
    ["rankings", id] as const,
};

export function useRankings() {
  return useQuery({
    queryKey: rankingKeys.all,
    queryFn: () => rankingService.getAll(),
  });
}