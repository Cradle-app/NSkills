import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { type PathCategory } from '@dapp-forge/blueprint-schema';

/**
 * BNB Voting Contract Plugin
 *
 * Wires a pre-deployed Voting.sol contract on BNB Smart Chain Testnet
 * into generated projects and exposes an interaction panel component.
 */
const BnbVotingContractSchema = z.object({
  contractAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/).default('0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD'),
});

export class BnbVotingContractPlugin extends BasePlugin<z.infer<typeof BnbVotingContractSchema>> {
  readonly metadata: PluginMetadata = {
    id: 'bnb-voting-contract',
    name: 'BNB Voting Contract',
    version: '0.1.0',
    description: 'Interact with a Voting.sol governance contract on BNB Smart Chain Testnet',
    category: 'contracts',
    tags: ['voting', 'governance', 'bnb', 'testnet', 'contract'],
  };

  readonly configSchema = BnbVotingContractSchema as unknown as z.ZodType<z.infer<typeof BnbVotingContractSchema>>;

  /**
   * Path to the pre-built component package for the voting panel.
   * (Implemented in packages/components/bnb-voting.)
   */
  readonly componentPath = 'packages/components/bnb-voting';

  /**
   * Package name for the component library.
   */
  readonly componentPackage = '@cradle/bnb-voting';

  /**
   * Path mappings for intelligent routing when a frontend scaffold is present.
   * These ensure the interaction panel and helpers land in the right places
   * inside the generated Next.js app.
   */
  readonly componentPathMappings: Record<string, PathCategory> = {
    'src/VotingInteractionPanel.tsx': 'frontend-components',
    'src/cn.ts': 'frontend-lib',
    'src/Select.tsx': 'frontend-lib',
    'src/index.ts': 'frontend-lib',
    'contract/**': 'contract-source',
  };

  readonly ports: PluginPort[] = [
    {
      id: 'wallet-in',
      name: 'Wallet Connection',
      type: 'input',
      dataType: 'config',
      required: true,
    },
    {
      id: 'voting-out',
      name: 'Voting Contract',
      type: 'output',
      dataType: 'contract',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof BnbVotingContractSchema>> {
    return {
      contractAddress: '0x8a64dFb64A71AfD00F926064E1f2a0B9a7cBe7dD',
    };
  }

  async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Ship Solidity source into the generated repo
    this.addFile(
      output,
      'contracts/voting/Voting.sol',
      VOTING_SOL_SOURCE,
      'contract-source'
    );

    // Ship ABI JSON for integrations and tooling
    this.addFile(
      output,
      'contracts/voting/voting-abi.json',
      VOTING_ABI_JSON,
      'contract-source'
    );

    // Provide a thin wrapper component that re-exports the shared panel
    this.addFile(
      output,
      'src/components/VotingInteractionPanel.tsx',
      generateVotingPanelWrapper(config.contractAddress),
      'frontend-components'
    );

    context.logger.info('Configured BNB Voting contract', {
      nodeId: node.id,
      contractAddress: config.contractAddress,
    });

    return output;
  }
}

const VOTING_ABI = [
  {
    inputs: [],
    name: 'endVoting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'startVoting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'candidateIndex',
        type: 'uint256',
      },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'candidates',
    outputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'voteCount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCandidates',
    outputs: [
      {
        components: [
          {
            internalType: 'string',
            name: 'name',
            type: 'string',
          },
          {
            internalType: 'uint256',
            name: 'voteCount',
            type: 'uint256',
          },
        ],
        internalType: 'struct Voting.Candidate[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWinner',
    outputs: [
      {
        internalType: 'string',
        name: 'winnerName',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'winnerVotes',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'hasVoted',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalVotes',
    outputs: [
      {
        internalType: 'uint256',
        name: 'total',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingOpen',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const VOTING_ABI_JSON = JSON.stringify(VOTING_ABI, null, 2);

// Solidity source for the Voting contract, as provided in voting.sol
const VOTING_SOL_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title  Voting
 * @notice A simple on-chain voting contract.
 *
 * HOW IT WORKS:
 *  1. Owner deploys with a list of candidate names.
 *  2. Owner opens voting via startVoting().
 *  3. Any address can cast exactly ONE vote for any candidate.
 *  4. Owner closes voting via endVoting().
 *  5. Anyone can call getWinner() to see the winner.
 *
 * DEPLOY ON REMIX:
 *  Constructor arg: ["Alice", "Bob", "Charlie"]  ← string array
 */
contract Voting {

    // ─── State ────────────────────────────────────────────────
    address public owner;
    bool    public votingOpen;

    struct Candidate {
        string  name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    // ─── Events ───────────────────────────────────────────────
    event VotingStarted();
    event VotingEnded();
    event Voted(address indexed voter, uint256 candidateIndex, string candidateName);

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────
    constructor(string[] memory _candidateNames) {
        require(_candidateNames.length >= 2, "Need at least 2 candidates");
        owner = msg.sender;

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                name:      _candidateNames[i],
                voteCount: 0
            }));
        }
    }

    // ─── Owner Functions ──────────────────────────────────────

    function startVoting() external onlyOwner {
        require(!votingOpen, "Already open");
        votingOpen = true;
        emit VotingStarted();
    }

    function endVoting() external onlyOwner whenOpen {
        votingOpen = false;
        emit VotingEnded();
    }

    // ─── Voter Functions ──────────────────────────────────────

    /**
     * @notice Cast your vote for a candidate by their index.
     * @param candidateIndex Index from getCandidates() list (0-based)
     */
    function vote(uint256 candidateIndex) external whenOpen {
        require(!hasVoted[msg.sender], "You already voted");
        require(candidateIndex < candidates.length, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[candidateIndex].voteCount++;

        emit Voted(msg.sender, candidateIndex, candidates[candidateIndex].name);
    }

    // ─── View Functions ───────────────────────────────────────

    /// @notice Returns all candidates with their vote counts.
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /// @notice Returns total number of votes cast.
    function totalVotes() external view returns (uint256 total) {
        for (uint256 i = 0; i < candidates.length; i++) {
            total += candidates[i].voteCount;
        }
    }

    /// @notice Returns the current winner (leading candidate).
    ///         If tied, returns the first one with highest votes.
    function getWinner() external view returns (string memory winnerName, uint256 winnerVotes) {
        require(candidates.length > 0, "No candidates");
        uint256 maxVotes = 0;
        uint256 winIdx   = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winIdx   = i;
            }
        }

        return (candidates[winIdx].name, candidates[winIdx].voteCount);
    }
}
`;

function generateVotingPanelWrapper(defaultAddress: string | undefined): string {
  return `'use client';

/**
 * VotingInteractionPanel
 * Thin wrapper that re-exports the shared BNB Voting panel component.
 * This lets generated projects import from a local path without installing
 * the original monorepo packages.
 */

import React from 'react';
import { VotingInteractionPanel as SharedVotingInteractionPanel } from '@cradle/bnb-voting';

export interface VotingInteractionPanelProps {
  contractAddress?: string;
}

export function VotingInteractionPanel(props: VotingInteractionPanelProps) {
  return (
    <SharedVotingInteractionPanel
      contractAddress={props.contractAddress ?? '${defaultAddress ?? ''}'}
    />
  );
}
`;
}


