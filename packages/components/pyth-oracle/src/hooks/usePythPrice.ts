import { useState, useEffect } from 'react';
import type { PythPriceOptions, PythPriceResult, AsyncState } from '../types';
import { getPythPrice } from '../api';

export interface UsePythPriceOptions extends PythPriceOptions {
  /** Optional auto-refresh interval in milliseconds */
  refreshMs?: number;
}

export interface UsePythPriceReturn extends AsyncState<PythPriceResult> {
  refetch: () => Promise<void>;
}

export function usePythPrice(options: UsePythPriceOptions): UsePythPriceReturn {
  const [data, setData] = useState<PythPriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { refreshMs, ...query } = options;

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPythPrice(query);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();

    if (!refreshMs) return;
    const id = setInterval(fetchPrice, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.chain, query.priceFeedId, query.staleAfterSeconds, refreshMs]);

  return {
    data,
    loading,
    error,
    refetch: fetchPrice,
  };
}

