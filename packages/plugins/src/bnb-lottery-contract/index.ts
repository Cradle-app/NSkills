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
const BnbLotteryContractSchema = z.object({
    contractAddress: z
        .string()
        .regex(/^0x[0-9a-fA-F]{40}$/)
        .default('0x9bb658a999a46d149262fe74d37894ac203ca493'),
});

// ── Plugin class ─────────────────────────────────────────────────────
export class BnbLotteryContractPlugin extends BasePlugin<z.infer<typeof BnbLotteryContractSchema>> {
    readonly metadata: PluginMetadata = {
        id: 'bnb-lottery-contract',
        name: 'BNB Lottery Contract',
        version: '0.1.0',
        description: 'Interact with a Lottery.sol contract on BNB Smart Chain Testnet',
        category: 'contracts',
        tags: ['lottery', 'raffle', 'bnb', 'testnet', 'contract'],
    };

    readonly configSchema = BnbLotteryContractSchema as unknown as z.ZodType<z.infer<typeof BnbLotteryContractSchema>>;

    readonly componentPath = 'packages/components/bnb-lottery';
    readonly componentPackage = '@cradle/bnb-lottery';

    readonly componentPathMappings: Record<string, PathCategory> = {
        'src/LotteryInteractionPanel.tsx': 'frontend-components',
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
            id: 'lottery-out',
            name: 'Lottery Contract',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof BnbLotteryContractSchema>> {
        return {
            contractAddress: '0x9bb658a999a46d149262fe74d37894ac203ca493',
        };
    }

    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Ship Solidity source into the generated repo
        this.addFile(
            output,
            'contracts/lottery/Lottery.sol',
            LOTTERY_SOL_SOURCE,
            'contract-source'
        );

        // Ship ABI JSON for integrations and tooling
        this.addFile(
            output,
            'contracts/lottery/lottery-abi.json',
            LOTTERY_ABI_JSON,
            'contract-source'
        );

        // Provide a thin wrapper component that re-exports the shared panel
        this.addFile(
            output,
            'src/components/LotteryInteractionPanel.tsx',
            generateLotteryPanelWrapper(config.contractAddress),
            'frontend-components'
        );

        context.logger.info('Configured BNB Lottery contract', {
            nodeId: node.id,
            contractAddress: config.contractAddress,
        });

        return output;
    }
}

// ── ABI ──────────────────────────────────────────────────────────────
const LOTTERY_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "roundId",
				"type": "uint256"
			}
		],
		"name": "RoundClosed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "roundId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "ticketPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			}
		],
		"name": "RoundCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "roundId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "tickets",
				"type": "uint256"
			}
		],
		"name": "TicketPurchased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "roundId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "prize",
				"type": "uint256"
			}
		],
		"name": "WinnerPicked",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_quantity",
				"type": "uint256"
			}
		],
		"name": "buyTickets",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			}
		],
		"name": "closeRound",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_ticketPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_durationSeconds",
				"type": "uint256"
			}
		],
		"name": "createRound",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_player",
				"type": "address"
			}
		],
		"name": "getMyTickets",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			}
		],
		"name": "getParticipantCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			}
		],
		"name": "getRound",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "ticketPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "prizePool",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "startTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "endTime",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "winner",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "isOpen",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isPaid",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "totalTickets",
						"type": "uint256"
					}
				],
				"internalType": "struct BNBLottery.Round",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			}
		],
		"name": "getTimeLeft",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_player",
				"type": "address"
			}
		],
		"name": "getWinChance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "numerator",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "denominator",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ownerFeePercent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_roundId",
				"type": "uint256"
			}
		],
		"name": "pickWinner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "roundCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "roundParticipants",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "rounds",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "ticketPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "prizePool",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isOpen",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isPaid",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "totalTickets",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_percent",
				"type": "uint256"
			}
		],
		"name": "setOwnerFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "ticketsBought",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
] as const;

const LOTTERY_ABI_JSON = JSON.stringify(LOTTERY_ABI, null, 2);

// ── Solidity source ──────────────────────────────────────────────────
const LOTTERY_SOL_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BNBLottery
 * @notice A decentralized lottery DApp on BNB Chain
 * @dev Deploy on Remix IDE | Compiler: 0.8.19+
 *      Players buy tickets with BNB, owner picks winner
 */
contract BNBLottery {

    // ─────────────────────────────────────────────
    //  STRUCTS & STATE
    // ─────────────────────────────────────────────

    struct Round {
        uint256 id;
        uint256 ticketPrice;
        uint256 prizePool;
        uint256 startTime;
        uint256 endTime;
        address winner;
        bool    isOpen;
        bool    isPaid;
        uint256 totalTickets;
    }

    address public owner;
    uint256 public roundCount;
    uint256 public ownerFeePercent = 5; // 5% platform fee

    mapping(uint256 => Round)              public rounds;
    mapping(uint256 => address[])          public roundParticipants;
    mapping(uint256 => mapping(address => uint256)) public ticketsBought;

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────

    event RoundCreated(uint256 indexed roundId, uint256 ticketPrice, uint256 endTime);
    event TicketPurchased(uint256 indexed roundId, address indexed player, uint256 tickets);
    event WinnerPicked(uint256 indexed roundId, address indexed winner, uint256 prize);
    event RoundClosed(uint256 indexed roundId);

    // ─────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier roundExists(uint256 _roundId) {
        require(_roundId > 0 && _roundId <= roundCount, "Round does not exist");
        _;
    }

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────
    //  OWNER FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Create a new lottery round
     * @param _ticketPrice Price per ticket in wei (e.g. 0.01 BNB = 10000000000000000)
     * @param _durationSeconds How long the round lasts in seconds
     */
    function createRound(uint256 _ticketPrice, uint256 _durationSeconds)
        external
        onlyOwner
    {
        require(_ticketPrice > 0,       "Ticket price must be > 0");
        require(_durationSeconds >= 60, "Duration must be at least 60 seconds");

        roundCount++;
        rounds[roundCount] = Round({
            id:           roundCount,
            ticketPrice:  _ticketPrice,
            prizePool:    0,
            startTime:    block.timestamp,
            endTime:      block.timestamp + _durationSeconds,
            winner:       address(0),
            isOpen:       true,
            isPaid:       false,
            totalTickets: 0
        });

        emit RoundCreated(roundCount, _ticketPrice, block.timestamp + _durationSeconds);
    }

    /**
     * @notice Pick a winner using pseudo-random hash (for production use Chainlink VRF)
     */
    function pickWinner(uint256 _roundId)
    external
    onlyOwner
    roundExists(_roundId)
{
    Round storage round = rounds[_roundId];
    require(round.isOpen,                        "Round already closed");
    require(block.timestamp >= round.endTime,    "Round has not ended yet");
    require(roundParticipants[_roundId].length > 0, "No participants");

    // Pseudo-random — good for testnet; use Chainlink VRF for mainnet
    uint256 randomIndex = uint256(
        keccak256(abi.encodePacked(block.timestamp, block.prevrandao, roundParticipants[_roundId].length))
    ) % roundParticipants[_roundId].length;

    address winner = roundParticipants[_roundId][randomIndex];
    uint256 fee    = (round.prizePool * ownerFeePercent) / 100;
    uint256 prize  = round.prizePool - fee;

    round.winner  = winner;
    round.isOpen  = false;
    round.isPaid  = true;

    (bool success1, ) = payable(owner).call{value: fee}("");
    (bool success2, ) = payable(winner).call{value: prize}("");

    require(success1 && success2, "Transfer failed");

    emit WinnerPicked(_roundId, winner, prize);
}

    /**
     * @notice Close a round early (refunds not included — for emergency use)
     */
    function closeRound(uint256 _roundId)
        external
        onlyOwner
        roundExists(_roundId)
    {
        rounds[_roundId].isOpen = false;
        emit RoundClosed(_roundId);
    }

    function setOwnerFee(uint256 _percent) external onlyOwner {
        require(_percent <= 20, "Fee cannot exceed 20%");
        ownerFeePercent = _percent;
    }

    // ─────────────────────────────────────────────
    //  PLAYER FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Buy one or more tickets for a lottery round
     * @param _roundId  The round to enter
     * @param _quantity Number of tickets to buy
     */
    function buyTickets(uint256 _roundId, uint256 _quantity)
        external
        payable
        roundExists(_roundId)
    {
        Round storage round = rounds[_roundId];
        require(round.isOpen,                  "Round is closed");
        require(block.timestamp < round.endTime, "Round has ended");
        require(_quantity > 0 && _quantity <= 50, "Buy between 1 and 50 tickets");
        require(msg.value == round.ticketPrice * _quantity, "Incorrect BNB sent");

        // Add address for each ticket to increase winning chance
        for (uint256 i = 0; i < _quantity; i++) {
            roundParticipants[_roundId].push(msg.sender);
        }

        if (ticketsBought[_roundId][msg.sender] == 0) {
            // first time entering this round — nothing extra needed
        }
        ticketsBought[_roundId][msg.sender] += _quantity;
        round.prizePool    += msg.value;
        round.totalTickets += _quantity;

        emit TicketPurchased(_roundId, msg.sender, _quantity);
    }

    // ─────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    function getRound(uint256 _roundId)
        external
        view
        roundExists(_roundId)
        returns (Round memory)
    {
        return rounds[_roundId];
    }

    function getMyTickets(uint256 _roundId, address _player)
        external
        view
        returns (uint256)
    {
        return ticketsBought[_roundId][_player];
    }

    function getParticipantCount(uint256 _roundId)
        external
        view
        returns (uint256)
    {
        return roundParticipants[_roundId].length;
    }

    function getWinChance(uint256 _roundId, address _player)
        external
        view
        roundExists(_roundId)
        returns (uint256 numerator, uint256 denominator)
    {
        uint256 total = roundParticipants[_roundId].length;
        if (total == 0) return (0, 1);
        return (ticketsBought[_roundId][_player], total);
    }

    function getTimeLeft(uint256 _roundId)
        external
        view
        roundExists(_roundId)
        returns (uint256)
    {
        if (block.timestamp >= rounds[_roundId].endTime) return 0;
        return rounds[_roundId].endTime - block.timestamp;
    }
}
`;

// ── Wrapper generator ────────────────────────────────────────────────
function generateLotteryPanelWrapper(defaultAddress: string | undefined): string {
    const addr = defaultAddress ?? '0x9bb658a999a46d149262fe74d37894ac203ca493';
    return `'use client';

import { LotteryInteractionPanel } from '@cradle/bnb-lottery';

export default function LotteryPanel() {
  return <LotteryInteractionPanel contractAddress="${addr}" />;
}
`;
}
