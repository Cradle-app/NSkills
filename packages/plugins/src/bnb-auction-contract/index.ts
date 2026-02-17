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

// ── Config schema ────────────────────────────────────────────────────
const BnbAuctionContractSchema = z.object({
    contractAddress: z
        .string()
        .regex(/^0x[0-9a-fA-F]{40}$/)
        .default('0x00320016Ad572264a64C98142e51200E60f73bCE'),
});

// ── Plugin class ─────────────────────────────────────────────────────
export class BnbAuctionContractPlugin extends BasePlugin<z.infer<typeof BnbAuctionContractSchema>> {
    readonly metadata: PluginMetadata = {
        id: 'bnb-auction-contract',
        name: 'BNB Auction Contract',
        version: '0.1.0',
        description: 'Interact with a SimpleAuction.sol contract on BNB Smart Chain Testnet',
        category: 'contracts',
        tags: ['auction', 'bidding', 'bnb', 'testnet', 'contract'],
    };

    readonly configSchema = BnbAuctionContractSchema as unknown as z.ZodType<z.infer<typeof BnbAuctionContractSchema>>;

    readonly componentPath = 'packages/components/bnb-auction';
    readonly componentPackage = '@cradle/bnb-auction';

    readonly componentPathMappings: Record<string, PathCategory> = {
        'src/AuctionInteractionPanel.tsx': 'frontend-components',
        'src/cn.ts': 'frontend-lib',
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
            id: 'auction-out',
            name: 'Auction Contract',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof BnbAuctionContractSchema>> {
        return {
            contractAddress: '0x00320016Ad572264a64C98142e51200E60f73bCE',
        };
    }

    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Ship Solidity source into the generated repo
        this.addFile(
            output,
            'contracts/auction/SimpleAuction.sol',
            AUCTION_SOL_SOURCE,
            'contract-source'
        );

        // Ship ABI JSON for integrations and tooling
        this.addFile(
            output,
            'contracts/auction/auction-abi.json',
            AUCTION_ABI_JSON,
            'contract-source'
        );

        // Provide a thin wrapper component that re-exports the shared panel
        this.addFile(
            output,
            'src/components/AuctionInteractionPanel.tsx',
            generateAuctionPanelWrapper(config.contractAddress),
            'frontend-components'
        );

        context.logger.info('Configured BNB Auction contract', {
            nodeId: node.id,
            contractAddress: config.contractAddress,
        });

        return output;
    }
}

// ── ABI ──────────────────────────────────────────────────────────────
const AUCTION_ABI = [
    {
        inputs: [
            { internalType: 'string', name: '_itemName', type: 'string' },
            { internalType: 'uint256', name: '_duration', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'winner', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'AuctionEnded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'bidder', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'BidWithdrawn',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'bidder', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'NewHighestBid',
        type: 'event',
    },
    {
        inputs: [],
        name: 'endEarly',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'endTime',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'ended',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getStatus',
        outputs: [
            { internalType: 'string', name: 'item', type: 'string' },
            { internalType: 'address', name: 'leader', type: 'address' },
            { internalType: 'uint256', name: 'leadingBid', type: 'uint256' },
            { internalType: 'uint256', name: 'secondsLeft', type: 'uint256' },
            { internalType: 'bool', name: 'isEnded', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'highestBid',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'highestBidder',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'itemName',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'pendingReturns',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'placeBid',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'timeLeft',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdrawProceeds',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

const AUCTION_ABI_JSON = JSON.stringify(AUCTION_ABI, null, 2);

// ── Solidity source ──────────────────────────────────────────────────
const AUCTION_SOL_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title  SimpleAuction
 * @notice A straightforward open English auction for any item.
 *
 * HOW IT WORKS:
 *  1. Owner deploys with an item name and duration (in seconds).
 *  2. Bidders send ETH to placeBid() - must exceed current highest bid.
 *  3. Outbid users can withdraw their ETH at any time.
 *  4. After the auction ends, winner is whoever holds the highest bid.
 *  5. Owner calls withdrawProceeds() to collect the winning ETH.
 */
contract SimpleAuction {

    // ─── State ────────────────────────────────────────────────
    address public owner;
    string  public itemName;
    uint256 public endTime;
    bool    public ended;

    address public highestBidder;
    uint256 public highestBid;

    // Tracks how much each outbid address can withdraw
    mapping(address => uint256) public pendingReturns;

    // ─── Events ───────────────────────────────────────────────
    event NewHighestBid(address indexed bidder, uint256 amount);
    event BidWithdrawn(address indexed bidder, uint256 amount);
    event AuctionEnded(address indexed winner, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier auctionActive() {
        require(block.timestamp < endTime, "Auction has ended");
        require(!ended, "Auction already closed");
        _;
    }

    modifier auctionOver() {
        require(block.timestamp >= endTime || ended, "Auction still active");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────
    constructor(string memory _itemName, uint256 _duration) {
        require(_duration > 0, "Duration must be > 0");
        owner    = msg.sender;
        itemName = _itemName;
        endTime  = block.timestamp + _duration;
    }

    // ─── Bidder Functions ─────────────────────────────────────

    function placeBid() external payable auctionActive {
        require(msg.value > highestBid, "Bid too low - must exceed current highest bid");

        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid    = msg.value;

        emit NewHighestBid(msg.sender, msg.value);
    }

    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingReturns[msg.sender] = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");

        emit BidWithdrawn(msg.sender, amount);
    }

    // ─── Owner Functions ──────────────────────────────────────

    function withdrawProceeds() external onlyOwner auctionOver {
        require(!ended, "Already withdrawn");
        ended = true;

        uint256 amount = highestBid;
        highestBid = 0;

        emit AuctionEnded(highestBidder, amount);

        (bool ok,) = payable(owner).call{value: amount}("");
        require(ok, "Transfer failed");
    }

    function endEarly() external onlyOwner auctionActive {
        endTime = block.timestamp;
    }

    // ─── View Functions ───────────────────────────────────────

    function timeLeft() external view returns (uint256) {
        if (block.timestamp >= endTime) return 0;
        return endTime - block.timestamp;
    }

    function getStatus() external view returns (
        string memory item,
        address leader,
        uint256 leadingBid,
        uint256 secondsLeft,
        bool    isEnded
    ) {
        uint256 left = block.timestamp >= endTime ? 0 : endTime - block.timestamp;
        return (itemName, highestBidder, highestBid, left, ended || block.timestamp >= endTime);
    }
}
`;

// ── Wrapper generator ────────────────────────────────────────────────
function generateAuctionPanelWrapper(defaultAddress: string | undefined): string {
    const addr = defaultAddress ?? '0x00320016Ad572264a64C98142e51200E60f73bCE';
    return `'use client';

import { AuctionInteractionPanel } from '@cradle/bnb-auction';

export default function AuctionPanel() {
  return <AuctionInteractionPanel contractAddress="${addr}" />;
}
`;
}
