import { useQuery } from "@tanstack/react-query";

import { fetchAccount } from "../api/client";
import { useAppSelector } from "../store";

export const ACCOUNT_QUERY_KEY = ["account"] as const;

/**
 * The signed-in account from the server: the models it offers and this
 * month's usage. The server decides both; the app only shows them.
 */
export const useAccount = () => {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return useQuery({
    queryKey: [...ACCOUNT_QUERY_KEY, userId],
    queryFn: ({ signal }) => fetchAccount(signal),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
};
