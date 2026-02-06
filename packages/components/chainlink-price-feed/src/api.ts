import { createPublicClient, http, type Address } from 'viem';
import { arbitrum, arbitrumSepolia } from 'viem/chains';
import type { ChainlinkPriceOptions, ChainlinkPriceResult, ChainlinkPriceRaw } from './types';

const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Fetch latest price from a Chainlink Data Feed (AggregatorV3Interface).
 *
 * Docs: https://docs.chain.link/data-feeds/price-feeds
 */
export async function getChainlinkPrice(
  options: ChainlinkPriceOptions
): Promise<ChainlinkPriceResult> {
  const { chain, feedAddress, staleAfterSeconds, rpcUrl } = options;

  if (!feedAddress.startsWith('0x') || feedAddress.length !== 42) {
    throw new Error(
      'Invalid Chainlink feed address. Expected 20-byte hex string (0x + 40 hex chars).'
    );
  }

  const viemChain = chain === 'arbitrum-sepolia' ? arbitrumSepolia : arbitrum;
  const transport = rpcUrl ? http(rpcUrl) : http();

  const client = createPublicClient({
    chain: viemChain,
    transport,
  });

  const [decimals, roundData] = await Promise.all([
    client.readContract({
      address: feedAddress as Address,
      abi: AGGREGATOR_V3_ABI,
      functionName: 'decimals',
    }),
    client.readContract({
      address: feedAddress as Address,
      abi: AGGREGATOR_V3_ABI,
      functionName: 'latestRoundData',
    }),
  ]);

  const [roundId, answer, startedAt, updatedAt, answeredInRound] = roundData as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  const raw: ChainlinkPriceRaw = {
    roundId,
    answer,
    startedAt: Number(startedAt),
    updatedAt: Number(updatedAt),
    answeredInRound,
    decimals: Number(decimals),
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const isStale =
    staleAfterSeconds !== undefined
      ? nowSeconds - raw.updatedAt > staleAfterSeconds
      : false;

  const formattedPrice = formatChainlinkPrice(raw.answer, raw.decimals);

  return {
    formattedPrice,
    raw,
    isStale,
  };
}

export function formatChainlinkPrice(answer: bigint, decimals: number): string {
  const factor = 10 ** decimals;
  const integer = Number(answer) / factor;
  return integer.toFixed(Math.min(decimals, 6));
}
