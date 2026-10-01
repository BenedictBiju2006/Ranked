import { useQuery } from "@tanstack/react-query";

import { rankingService } from "../services/ranking.service";

export const rankingKeys = {
  all: ["rankings"] as const,

  detail: (id: string) =>
    ["rankings", "detail", id] as const,
};

export function useRankings() {
  return useQuery({
    queryKey: rankingKeys.all,
    queryFn: () => rankingService.getAll(),
  });
}

export function useRanking(id: string) {
  return useQuery({
    queryKey: rankingKeys.detail(id),
    queryFn: () => rankingService.getById(id),
  });
}