import { useState, useEffect, useCallback } from 'react';
import type { AaveAccountDataOptions, AaveAccountData, AsyncState } from '../types';
import { getAaveAccountData } from '../api';

export interface UseAaveAccountDataOptions extends AaveAccountDataOptions {
  refreshMs?: number;
}

export interface UseAaveAccountDataReturn extends AsyncState<AaveAccountData> {
  refetch: () => Promise<void>;
}

export function useAaveAccountData(
  options: UseAaveAccountDataOptions
): UseAaveAccountDataReturn {
  const [data, setData] = useState<AaveAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refreshMs, ...query } = options;

  const fetchData = useCallback(async () => {
    if (!query.walletAddress || query.walletAddress.length !== 42) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAaveAccountData(query);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    query.chain,
    query.walletAddress,
    query.poolAddress,
    query.poolDataProviderAddress,
    query.rpcUrl,
  ]);

  useEffect(() => {
    fetchData();
    if (!refreshMs) return;
    const id = setInterval(fetchData, refreshMs);
    return () => clearInterval(id);
  }, [fetchData, refreshMs]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
