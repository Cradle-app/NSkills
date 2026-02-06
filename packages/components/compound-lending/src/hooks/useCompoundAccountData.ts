import { useState, useEffect, useCallback } from 'react';
import type {
  CompoundAccountDataOptions,
  CompoundAccountData,
  AsyncState,
} from '../types';
import { getCompoundAccountData } from '../api';

export interface UseCompoundAccountDataOptions extends CompoundAccountDataOptions {
  refreshMs?: number;
}

export interface UseCompoundAccountDataReturn extends AsyncState<CompoundAccountData> {
  refetch: () => Promise<void>;
}

export function useCompoundAccountData(
  options: UseCompoundAccountDataOptions
): UseCompoundAccountDataReturn {
  const [data, setData] = useState<CompoundAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refreshMs, ...query } = options;

  const fetchData = useCallback(async () => {
    if (!query.walletAddress || query.walletAddress.length !== 42) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCompoundAccountData(query);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query.chain, query.walletAddress, query.cometAddress, query.rpcUrl]);

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
