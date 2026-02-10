# @cradle/uniswap-swap

Uniswap V3 swap integration for building swap transactions on Arbitrum and Ethereum Sepolia networks.

## Features

- Get exact-input swap quotes from Uniswap V3 Quoter
- Build swap transaction calldata for `exactInputSingle`
- Build ERC20 approval transactions for the Uniswap router
- Support for Arbitrum mainnet, Arbitrum Sepolia, and Ethereum Sepolia
- Configurable fee tiers (0.01%, 0.05%, 0.3%, 1%)
- Built with viem for type-safe blockchain interactions

## Installation

```bash
pnpm add @cradle/uniswap-swap
```

## Usage

### Get a Swap Quote

Use `getUniswapExactInputQuote` to get the expected output amount for a swap:

```ts
import { getUniswapExactInputQuote } from '@cradle/uniswap-swap';

const quote = await getUniswapExactInputQuote({
  chain: 'arbitrum',
  tokenIn: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
  tokenOut: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
  amountIn: '1000000000000000000', // 1 WETH (in wei)
  fee: 3000, // 0.3% fee tier (optional, defaults to 3000)
});

console.log('Expected output:', quote.amountOut); // USDC amount in wei
console.log('Fee tier used:', quote.fee); // 3000 (0.3%)
```

### Build a Swap Transaction

Use `buildUniswapExactInputTx` to create the transaction request:

```ts
import { buildUniswapExactInputTx } from '@cradle/uniswap-swap';

// Calculate minimum output with 0.5% slippage
const slippage = 0.005;
const minAmountOut = (BigInt(quote.amountOut) * BigInt(995)) / BigInt(1000);

const swapTx = buildUniswapExactInputTx({
  chain: 'arbitrum',
  tokenIn: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
  tokenOut: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
  amountIn: '1000000000000000000', // 1 WETH
  minAmountOut: minAmountOut.toString(), // slippage protection
  recipient: '0xYourWalletAddress',
  fee: 3000, // optional, defaults to 3000
});

// Use with viem or wagmi to send the transaction
// swapTx contains: { to, data, value }
```

### Build an ERC20 Approval Transaction

Before swapping, approve the Uniswap router to spend your tokens:

```ts
import { buildUniswapErc20ApproveTx, UNISWAP_CONFIG } from '@cradle/uniswap-swap';

const routerAddress = UNISWAP_CONFIG['arbitrum'].contracts.uniswapRouter;

const approveTx = buildUniswapErc20ApproveTx({
  tokenAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
  spender: routerAddress, // Uniswap router
  amount: '1000000000000000000', // 1 WETH
});

// Send approval transaction first, then execute the swap
```

### Complete Example

```ts
import {
  getUniswapExactInputQuote,
  buildUniswapExactInputTx,
  buildUniswapErc20ApproveTx,
  UNISWAP_CONFIG,
} from '@cradle/uniswap-swap';
import { createWalletClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

async function swapTokens() {
  const chain = 'arbitrum';
  const tokenIn = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'; // WETH
  const tokenOut = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC
  const amountIn = '1000000000000000000'; // 1 WETH

  // 1. Get quote
  const quote = await getUniswapExactInputQuote({
    chain,
    tokenIn,
    tokenOut,
    amountIn,
  });

  console.log('Expected output:', quote.amountOut);

  // 2. Calculate minimum output (0.5% slippage)
  const minAmountOut = (BigInt(quote.amountOut) * BigInt(995)) / BigInt(1000);

  // 3. Build approval transaction
  const routerAddress = UNISWAP_CONFIG[chain].contracts.uniswapRouter;
  const approveTx = buildUniswapErc20ApproveTx({
    tokenAddress: tokenIn,
    spender: routerAddress,
    amount: amountIn,
  });

  // 4. Build swap transaction
  const account = privateKeyToAccount('0xYourPrivateKey');
  const swapTx = buildUniswapExactInputTx({
    chain,
    tokenIn,
    tokenOut,
    amountIn,
    minAmountOut: minAmountOut.toString(),
    recipient: account.address,
  });

  // 5. Send transactions
  const client = createWalletClient({
    account,
    chain: arbitrum,
    transport: http(),
  });

  // Send approval
  const approvalHash = await client.sendTransaction({
    to: approveTx.to as `0x${string}`,
    data: approveTx.data,
  });
  console.log('Approval tx:', approvalHash);

  // Wait for approval, then send swap
  const swapHash = await client.sendTransaction({
    to: swapTx.to as `0x${string}`,
    data: swapTx.data,
    value: BigInt(swapTx.value || '0'),
  });
  console.log('Swap tx:', swapHash);
}
```

## Configuration Options

### Quote Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chain` | `'arbitrum' \| 'arbitrum-sepolia' \| 'ethereum-sepolia'` | required | Network to query |
| `tokenIn` | `string` | required | Input token address (0x...) |
| `tokenOut` | `string` | required | Output token address (0x...) |
| `amountIn` | `string` | required | Input amount in wei |
| `fee` | `number` | `3000` | Fee tier (100, 500, 3000, 10000) |
| `rpcUrl` | `string` | public RPC | Optional custom RPC URL |

### Build Transaction Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chain` | `'arbitrum' \| 'arbitrum-sepolia' \| 'ethereum-sepolia'` | required | Network to use |
| `tokenIn` | `string` | required | Input token address |
| `tokenOut` | `string` | required | Output token address |
| `amountIn` | `string` | required | Input amount in wei |
| `minAmountOut` | `string` | required | Minimum output (slippage protection) |
| `recipient` | `string` | required | Recipient wallet address |
| `fee` | `number` | `3000` | Fee tier (100, 500, 3000, 10000) |

## Fee Tiers

Uniswap V3 supports multiple fee tiers, specified in hundredths of a bip:

| Fee Value | Percentage | Common Use Case |
|-----------|------------|-----------------|
| `100` | 0.01% | Stablecoin pairs (USDC/USDT) |
| `500` | 0.05% | Correlated assets (ETH/stETH) |
| `3000` | 0.3% | Most pairs (default) |
| `10000` | 1% | Exotic or volatile pairs |

## Supported Networks

```ts
import { SUPPORTED_UNISWAP_CHAINS, UNISWAP_CONFIG } from '@cradle/uniswap-swap';

// Available networks
console.log(SUPPORTED_UNISWAP_CHAINS);
// ['arbitrum', 'arbitrum-sepolia', 'ethereum-sepolia']

// Network configurations
console.log(UNISWAP_CONFIG['arbitrum'].contracts);
// {
//   uniswapRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
//   uniswapFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
//   uniswapQuoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
//   weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
// }
```

## Environment Variables

```env
# Optional: Override default RPC URLs
ARBITRUM_RPC_URL=https://your-arbitrum-rpc-url
ARBITRUM_SEPOLIA_RPC_URL=https://your-arbitrum-sepolia-rpc-url
ETHEREUM_SEPOLIA_RPC_URL=https://your-ethereum-sepolia-rpc-url
```

## Important Notes

- **Quotes do not include slippage** - Always calculate `minAmountOut` based on your slippage tolerance
- **Approval required** - ERC20 tokens must be approved before swapping
- **Gas estimation** - Use viem's `estimateGas` to preview gas costs before sending
- **Price impact** - Large swaps may have significant price impact; check the quote carefully
- **Deadline** - For production, consider adding deadline protection to prevent stale transactions

## License

MIT
