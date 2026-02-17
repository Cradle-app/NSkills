import type { z } from 'zod';
import type { RobinhoodContractsConfig } from '@dapp-forge/blueprint-schema';
import { dedent } from '@dapp-forge/plugin-sdk';

type Config = z.infer<typeof RobinhoodContractsConfig>;

// Contract addresses from robinhood-chain-contracts.md
const TOKEN_CONTRACTS = {
  WETH: '0x7943e237c7F95DA44E0301572D358911207852Fa',
  TSLA: '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E',
  AMZN: '0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02',
  PLTR: '0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0',
  NFLX: '0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93',
  AMD: '0x71178BAc73cBeb415514eB542a8995b82669778d',
} as const;

const L1_CORE_CONTRACTS = {
  Rollup: '0xdc5F8E399DBd8a9F5F87AeC4C23Beb12431b386D',
  SequencerInbox: '0xA0D9dB3DC9791D54b5183C1C1866eFe1eCA7D414',
  CoreProxyAdmin: '0x20d5d542c1bF0a3c295524Eaef336fC07e890622',
} as const;

const L1_MESSAGING_CONTRACTS = {
  DelayedInbox: '0xF2939afA86F6f933A3CE17fCAB007907B6b0B7a4',
  Bridge: '0x96295BDad104eaD97cC08797b3dC68efF59CcF30',
  Outbox: '0x8D180Caf588f3Da027BEf1F42a106Da93F90b166',
} as const;

const FRAUD_PROOF_CONTRACTS = {
  ChallengeManager: '0xE877c5d3a6829d1D8b06badf309Fc294f3F51ed6',
  OneStepProver0: '0x6fE84aC811EBEcd888Eca93757fEa378Bb03b00c',
  OneStepProverMemory: '0x665CEA1cA6C36aB701f4C6AE895b156f79C51c35',
  OneStepProverMath: '0x4B15E064d5d55705E89080bDEA4BFe4cF20D6114',
  OneStepProverHostIo: '0xe1aAfAfBde42f043495B39d1a15a58E91c894Fbf',
  OneStepProofEntry: '0x5087a6fD526eFD5c6770d94D0c325de0e2A2c44D',
} as const;

const L1_BRIDGE_CONTRACTS = {
  L1GatewayRouter: '0xF6F11aAEE80875776C264d93B37B34cE437382D1',
  L1ERC20Gateway: '0x52C2976cbDEf48BcC51d07d3c523769F76ECBd09',
  L1ArbCustomGateway: '0xFB4aa8024F70B00121723A9C923BaD0Dd2dFaf8F',
  L1WethGateway: '0x8f8A6799F2b1978c6586318543c73D8Fb12f218f',
  L1Weth: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  L1ProxyAdmin: '0x20d5d542c1bF0a3c295524Eaef336fC07e890622',
} as const;

const L2_BRIDGE_CONTRACTS = {
  L2GatewayRouter: '0x77bF00A6A90c600f214b34BAFBB7918c0cF113A8',
  L2ERC20Gateway: '0x8689aFB9086734e12beA6b5DF541a1da252Ea32a',
  L2ArbCustomGateway: '0xE4EE9C15e2cA44136796342e31b67d953E67a70b',
  L2WethGateway: '0x5A8F55202A625D12FFCb76F857FE4563bC8Ce413',
  L2Weth: '0x7943e237c7F95DA44E0301572D358911207852Fa',
  L2ProxyAdmin: '0xE743e696B00789Ef489cF617477771764E9283a0',
} as const;

const PRECOMPILES = {
  ArbAddressTable: '0x0000000000000000000000000000000000000066',
  ArbAggregator: '0x000000000000000000000000000000000000006D',
  ArbFunctionTable: '0x0000000000000000000000000000000000000068',
  ArbGasInfo: '0x000000000000000000000000000000000000006C',
  ArbInfo: '0x0000000000000000000000000000000000000065',
  ArbOwner: '0x0000000000000000000000000000000000000070',
  ArbOwnerPublic: '0x000000000000000000000000000000000000006b',
  ArbRetryableTx: '0x000000000000000000000000000000000000006E',
  ArbStatistics: '0x000000000000000000000000000000000000006F',
  ArbSys: '0x0000000000000000000000000000000000000064',
  ArbWasm: '0x0000000000000000000000000000000000000071',
  ArbWasmCache: '0x0000000000000000000000000000000000000072',
  NodeInterface: '0x00000000000000000000000000000000000000C8',
} as const;

const MISC_CONTRACTS = {
  L2Multicall: '0xa432504b6F04Cafe775b09D8AA92e8dbe41Ec7a8',
} as const;

export function generateContractConstants(config: Config): string {
  const addAs = config.generateTypes ? ' as Address' : '';
  const tokenBlock = config.includeTokenContracts
    ? dedent(`
    const TOKEN_CONTRACTS = {
      WETH: '${TOKEN_CONTRACTS.WETH}'${addAs},
      TSLA: '${TOKEN_CONTRACTS.TSLA}'${addAs},
      AMZN: '${TOKEN_CONTRACTS.AMZN}'${addAs},
      PLTR: '${TOKEN_CONTRACTS.PLTR}'${addAs},
      NFLX: '${TOKEN_CONTRACTS.NFLX}'${addAs},
      AMD: '${TOKEN_CONTRACTS.AMD}'${addAs},
    } as const;
  `)
    : '';

  const coreBlock = config.includeCoreContracts
    ? dedent(`
    const CORE_CONTRACTS = {
      Rollup: '${L1_CORE_CONTRACTS.Rollup}'${addAs},
      SequencerInbox: '${L1_CORE_CONTRACTS.SequencerInbox}'${addAs},
      CoreProxyAdmin: '${L1_CORE_CONTRACTS.CoreProxyAdmin}'${addAs},
      DelayedInbox: '${L1_MESSAGING_CONTRACTS.DelayedInbox}'${addAs},
      Bridge: '${L1_MESSAGING_CONTRACTS.Bridge}'${addAs},
      Outbox: '${L1_MESSAGING_CONTRACTS.Outbox}'${addAs},
      ChallengeManager: '${FRAUD_PROOF_CONTRACTS.ChallengeManager}'${addAs},
      OneStepProver0: '${FRAUD_PROOF_CONTRACTS.OneStepProver0}'${addAs},
      OneStepProverMemory: '${FRAUD_PROOF_CONTRACTS.OneStepProverMemory}'${addAs},
      OneStepProverMath: '${FRAUD_PROOF_CONTRACTS.OneStepProverMath}'${addAs},
      OneStepProverHostIo: '${FRAUD_PROOF_CONTRACTS.OneStepProverHostIo}'${addAs},
      OneStepProofEntry: '${FRAUD_PROOF_CONTRACTS.OneStepProofEntry}'${addAs},
    } as const;
  `)
    : '';

  const bridgeBlock = config.includeBridgeContracts
    ? dedent(`
    const BRIDGE_CONTRACTS = {
      L1GatewayRouter: '${L1_BRIDGE_CONTRACTS.L1GatewayRouter}'${addAs},
      L1ERC20Gateway: '${L1_BRIDGE_CONTRACTS.L1ERC20Gateway}'${addAs},
      L1ArbCustomGateway: '${L1_BRIDGE_CONTRACTS.L1ArbCustomGateway}'${addAs},
      L1WethGateway: '${L1_BRIDGE_CONTRACTS.L1WethGateway}'${addAs},
      L1Weth: '${L1_BRIDGE_CONTRACTS.L1Weth}'${addAs},
      L1ProxyAdmin: '${L1_BRIDGE_CONTRACTS.L1ProxyAdmin}'${addAs},
      L2GatewayRouter: '${L2_BRIDGE_CONTRACTS.L2GatewayRouter}'${addAs},
      L2ERC20Gateway: '${L2_BRIDGE_CONTRACTS.L2ERC20Gateway}'${addAs},
      L2ArbCustomGateway: '${L2_BRIDGE_CONTRACTS.L2ArbCustomGateway}'${addAs},
      L2WethGateway: '${L2_BRIDGE_CONTRACTS.L2WethGateway}'${addAs},
      L2Weth: '${L2_BRIDGE_CONTRACTS.L2Weth}'${addAs},
      L2ProxyAdmin: '${L2_BRIDGE_CONTRACTS.L2ProxyAdmin}'${addAs},
    } as const;
  `)
    : '';

  const precompilesBlock = config.includePrecompiles
    ? dedent(`
    const PRECOMPILES = {
      ArbAddressTable: '${PRECOMPILES.ArbAddressTable}'${addAs},
      ArbAggregator: '${PRECOMPILES.ArbAggregator}'${addAs},
      ArbFunctionTable: '${PRECOMPILES.ArbFunctionTable}'${addAs},
      ArbGasInfo: '${PRECOMPILES.ArbGasInfo}'${addAs},
      ArbInfo: '${PRECOMPILES.ArbInfo}'${addAs},
      ArbOwner: '${PRECOMPILES.ArbOwner}'${addAs},
      ArbOwnerPublic: '${PRECOMPILES.ArbOwnerPublic}'${addAs},
      ArbRetryableTx: '${PRECOMPILES.ArbRetryableTx}'${addAs},
      ArbStatistics: '${PRECOMPILES.ArbStatistics}'${addAs},
      ArbSys: '${PRECOMPILES.ArbSys}'${addAs},
      ArbWasm: '${PRECOMPILES.ArbWasm}'${addAs},
      ArbWasmCache: '${PRECOMPILES.ArbWasmCache}'${addAs},
      NodeInterface: '${PRECOMPILES.NodeInterface}'${addAs},
    } as const;
  `)
    : '';

  const miscBlock = config.includeMiscContracts
    ? dedent(`
    const MISC_CONTRACTS = {
      L2Multicall: '${MISC_CONTRACTS.L2Multicall}'${addAs},
    } as const;
  `)
    : '';

  const importLine = config.generateTypes ? "import type { Address } from 'viem';\n\n" : '';

  const exportBlock = ['TOKEN_CONTRACTS', 'CORE_CONTRACTS', 'BRIDGE_CONTRACTS', 'PRECOMPILES', 'MISC_CONTRACTS']
    .filter(name => {
      if (name === 'TOKEN_CONTRACTS') return config.includeTokenContracts;
      if (name === 'CORE_CONTRACTS') return config.includeCoreContracts;
      if (name === 'BRIDGE_CONTRACTS') return config.includeBridgeContracts;
      if (name === 'PRECOMPILES') return config.includePrecompiles;
      if (name === 'MISC_CONTRACTS') return config.includeMiscContracts;
      return false;
    })
    .join(', ');

  return dedent(`
    // Robinhood Chain Contract Addresses
    // Generated by [N]skills - https://www.nskills.xyz
    // Source: robinhood-chain-contracts.md

    ${importLine}${tokenBlock}${coreBlock}${bridgeBlock}${precompilesBlock}${miscBlock}

    /** All Robinhood Chain contracts (testnet) */
    export const ROBINHOOD_CONTRACTS = {
      ${config.includeTokenContracts ? '...TOKEN_CONTRACTS,' : ''}
      ${config.includeCoreContracts ? '...CORE_CONTRACTS,' : ''}
      ${config.includeBridgeContracts ? '...BRIDGE_CONTRACTS,' : ''}
      ${config.includePrecompiles ? '...PRECOMPILES,' : ''}
      ${config.includeMiscContracts ? '...MISC_CONTRACTS,' : ''}
    } as const;

    export { ${exportBlock} };
  `);
}

export function generateContractDocs(config: Config): string {
  return dedent(`
    # Robinhood Chain Contract Addresses

    Reference for official contract addresses on Robinhood Chain Testnet.

    ## Token Contracts (L2)

    | Contract | Address |
    |----------|---------|
    | WETH | \`${TOKEN_CONTRACTS.WETH}\` |
    | TSLA | \`${TOKEN_CONTRACTS.TSLA}\` |
    | AMZN | \`${TOKEN_CONTRACTS.AMZN}\` |
    | PLTR | \`${TOKEN_CONTRACTS.PLTR}\` |
    | NFLX | \`${TOKEN_CONTRACTS.NFLX}\` |
    | AMD | \`${TOKEN_CONTRACTS.AMD}\` |

    ## L2 Bridge & Gateways

    | Contract | Address |
    |----------|---------|
    | L2 Gateway Router | \`${L2_BRIDGE_CONTRACTS.L2GatewayRouter}\` |
    | L2 ERC20 Gateway | \`${L2_BRIDGE_CONTRACTS.L2ERC20Gateway}\` |
    | L2 WETH Gateway | \`${L2_BRIDGE_CONTRACTS.L2WethGateway}\` |
    | L2 WETH | \`${L2_BRIDGE_CONTRACTS.L2Weth}\` |
    | L2 Multicall | \`${MISC_CONTRACTS.L2Multicall}\` |

    ## Precompiles

    Arbitrum precompiles are at fixed addresses on every L2 chain.

    | Contract | Address |
    |----------|---------|
    | ArbSys | \`${PRECOMPILES.ArbSys}\` |
    | ArbInfo | \`${PRECOMPILES.ArbInfo}\` |
    | ArbGasInfo | \`${PRECOMPILES.ArbGasInfo}\` |
    | ArbRetryableTx | \`${PRECOMPILES.ArbRetryableTx}\` |
    | NodeInterface | \`${PRECOMPILES.NodeInterface}\` |
    | ... | See \`robinhood-contracts.ts\` for full list |

    ## Usage

    \`\`\`typescript
    import { ROBINHOOD_CONTRACTS } from './robinhood-contracts';

    const wethAddress = ROBINHOOD_CONTRACTS.WETH;
    \`\`\`
  `);
}
