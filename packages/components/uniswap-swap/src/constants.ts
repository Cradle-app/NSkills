import type { SupportedUniswapChain } from './types';

export interface UniswapChainContracts {
  uniswapRouter: string;
  uniswapFactory: string;
  uniswapQuoter: string;
  weth: string;
}

export interface UniswapChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: UniswapChainContracts;
}

export const UNISWAP_CONFIG: Record<SupportedUniswapChain, UniswapChainConfig> = {
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      // Uniswap V3 - mainnet Arbitrum
      uniswapRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
      uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // V3 Factory
      uniswapQuoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // QuoterV2
      weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    },
  },
  'arbitrum-sepolia': {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl:
      process.env.ARBITRUM_SEPOLIA_RPC_URL ||
      'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      // Uniswap V3 - Arbitrum Sepolia testnet
      uniswapRouter: '0x101F443B4d1b059569D643917553c771E1b9663E', // SwapRouter02 (testnet)
      uniswapFactory: '0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e', // V3 Factory (testnet)
      uniswapQuoter: '0x2779a0CC1c3e0E44D2542EC3e79e3864Ae93Ef0B', // QuoterV2 (testnet)
      weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73', // WETH
    },
  },
  'ethereum-sepolia': {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl:
      process.env.ETHEREUM_SEPOLIA_RPC_URL ||
      'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      // Uniswap V3 - Ethereum Sepolia testnet
      uniswapRouter: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E', // SwapRouter02 (testnet)
      uniswapFactory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c', // V3 Factory (testnet)
      uniswapQuoter: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3', // QuoterV2 (testnet)
      weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // WETH
    },
  },
};

export const SUPPORTED_UNISWAP_CHAINS: SupportedUniswapChain[] = [
  'arbitrum',
  'arbitrum-sepolia',
  'ethereum-sepolia',
];

export const DEFAULT_FEE_TIER = 3000; // 0.3%

