import { useState, useEffect, useCallback } from 'react';
import type {
  ChainlinkPriceOptions,
  ChainlinkPriceResult,
  AsyncState,
} from '../types';
import { getChainlinkPrice } from '../api';

export interface UseChainlinkPriceOptions extends ChainlinkPriceOptions {
  /** Optional auto-refresh interval in milliseconds */
  refreshMs?: number;
}

export interface UseChainlinkPriceReturn extends AsyncState<ChainlinkPriceResult> {
  refetch: () => Promise<void>;
}

export function useChainlinkPrice(
  options: UseChainlinkPriceOptions
): UseChainlinkPriceReturn {
  const [data, setData] = useState<ChainlinkPriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refreshMs, ...query } = options;

  const fetchPrice = useCallback(async () => {
    if (!query.feedAddress || query.feedAddress.length !== 42) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getChainlinkPrice(query);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query.chain, query.feedAddress, query.staleAfterSeconds, query.rpcUrl]);

  useEffect(() => {
    fetchPrice();

    if (!refreshMs) return;
    const id = setInterval(fetchPrice, refreshMs);
    return () => clearInterval(id);
  }, [fetchPrice, refreshMs]);

  return {
    data,
    loading,
    error,
    refetch: fetchPrice,
  };
}
