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
const BountyBoardContractSchema = z.object({
    contractAddress: z
        .string()
        .regex(/^0x[0-9a-fA-F]{40}$/)
        .default('0x54e583f445b5b4736628d04fcff66698977b4b00'),
});

// ── Plugin class ─────────────────────────────────────────────────────
export class BountyBoardContractPlugin extends BasePlugin<z.infer<typeof BountyBoardContractSchema>> {
    readonly metadata: PluginMetadata = {
        id: 'bounty-board-contract',
        name: 'Bounty Board Contract',
        version: '0.1.0',
        description: 'Interact with a BountyBoard.sol contract on BNB Smart Chain Testnet',
        category: 'contracts',
        tags: ['bounty', 'bounties', 'tasks', 'freelance', 'bnb', 'testnet', 'contract'],
    };

    readonly configSchema = BountyBoardContractSchema as unknown as z.ZodType<z.infer<typeof BountyBoardContractSchema>>;

    readonly componentPath = 'packages/components/bounty-board';
    readonly componentPackage = '@cradle/bounty-board';

    readonly componentPathMappings: Record<string, PathCategory> = {
        'src/BountyBoardInteractionPanel.tsx': 'frontend-components',
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
            id: 'bountyboard-out',
            name: 'Bounty Board Contract',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof BountyBoardContractSchema>> {
        return {
            contractAddress: '0x54e583f445b5b4736628d04fcff66698977b4b00',
        };
    }

    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Note: Contract files (BountyBoard.sol and bounty-board-abi.json) are copied
        // from the component package via componentPathMappings, so we don't generate them here
        // to avoid duplication.

        // Provide a thin wrapper component that re-exports the shared panel
        this.addFile(
            output,
            'src/components/BountyBoardInteractionPanel.tsx',
            generateBountyBoardPanelWrapper(config.contractAddress),
            'frontend-components'
        );

        context.logger.info('Configured Bounty Board contract', {
            nodeId: node.id,
            contractAddress: config.contractAddress,
        });

        return output;
    }
}

// ── ABI ──────────────────────────────────────────────────────────────
const BOUNTYBOARD_ABI = [
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
				"name": "bountyId",
				"type": "uint256"
			}
		],
		"name": "BountyCancelled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "bountyId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "poster",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "reward",
				"type": "uint256"
			}
		],
		"name": "BountyCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "bountyId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "poster",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "BountyReclaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "bountyId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "worker",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "submissionIdx",
				"type": "uint256"
			}
		],
		"name": "SubmissionApproved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "bountyId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "worker",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "submissionIdx",
				"type": "uint256"
			}
		],
		"name": "SubmissionRejected",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "bountyId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "worker",
				"type": "address"
			}
		],
		"name": "WorkSubmitted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_bountyId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_submissionIdx",
				"type": "uint256"
			}
		],
		"name": "approveSubmission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "bountyCount",
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
				"name": "_bountyId",
				"type": "uint256"
			}
		],
		"name": "cancelBounty",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_requirements",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_category",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_deadlineDays",
				"type": "uint256"
			}
		],
		"name": "createBounty",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_bountyId",
				"type": "uint256"
			}
		],
		"name": "getAllBounties",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "poster",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "requirements",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "category",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "reward",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					},
					{
						"internalType": "enum BountyBoard.BountyStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "submissionCount",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "winner",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					}
				],
				"internalType": "struct BountyBoard.Bounty[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getBounty",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "poster",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "requirements",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "category",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "reward",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					},
					{
						"internalType": "enum BountyBoard.BountyStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "submissionCount",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "winner",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					}
				],
				"internalType": "struct BountyBoard.Bounty",
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
				"name": "_bountyId",
				"type": "uint256"
			}
		],
		"name": "getSubmissions",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "worker",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "solutionUrl",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "notes",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "submittedAt",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "approved",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "rejected",
						"type": "bool"
					}
				],
				"internalType": "struct BountyBoard.Submission[]",
				"name": "",
				"type": "tuple[]"
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
		"name": "platformFeePercent",
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
				"name": "_bountyId",
				"type": "uint256"
			}
		],
		"name": "reclaimExpiredBounty",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_bountyId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_submissionIdx",
				"type": "uint256"
			}
		],
		"name": "rejectSubmission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_bountyId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_solutionUrl",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_notes",
				"type": "string"
			}
		],
		"name": "submitWork",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

const BOUNTYBOARD_ABI_JSON = JSON.stringify(BOUNTYBOARD_ABI, null, 2);

// ── Solidity source ──────────────────────────────────────────────────
const BOUNTYBOARD_SOL_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BountyBoard {
    enum BountyStatus { Open, UnderReview, Completed, Expired, Cancelled }

    struct Bounty {
        uint256      id;
        address      poster;
        string       title;
        string       description;
        string       requirements;
        string       category;
        uint256      reward;         // in wei (BNB sent on creation)
        uint256      deadline;       // unix timestamp
        BountyStatus status;
        uint256      submissionCount;
        address      winner;
        uint256      createdAt;
    }

    struct Submission {
        address worker;
        string  solutionUrl;
        string  notes;
        uint256 submittedAt;
        bool    approved;
        bool    rejected;
    }

    address public owner;
    uint256 public bountyCount;
    uint256 public platformFeePercent = 3;   // 3 %

    mapping(uint256 => Bounty)         public bounties;
    mapping(uint256 => Submission[])   private submissions;

    // ── Events ───────────────────────────────────────────────────────
    event BountyCreated     (uint256 indexed bountyId, address indexed poster, string title, uint256 reward);
    event WorkSubmitted     (uint256 indexed bountyId, address indexed worker);
    event SubmissionApproved(uint256 indexed bountyId, address indexed worker, uint256 submissionIdx);
    event SubmissionRejected(uint256 indexed bountyId, address indexed worker, uint256 submissionIdx);
    event BountyCancelled   (uint256 indexed bountyId);
    event BountyReclaimed   (uint256 indexed bountyId, address indexed poster, uint256 amount);

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyOwner()                 { require(msg.sender == owner, "Not owner");       _; }
    modifier bountyExists(uint256 _id)   { require(_id > 0 && _id <= bountyCount, "No bounty"); _; }

    constructor() { owner = msg.sender; }

    // ── Create bounty (poster sends reward as msg.value) ─────────────
    function createBounty(
        string memory _title,
        string memory _description,
        string memory _requirements,
        string memory _category,
        uint256       _deadlineDays
    ) external payable {
        require(bytes(_title).length > 0,  "Title required");
        require(msg.value > 0,             "Reward required");
        require(_deadlineDays > 0,         "Duration must be > 0");

        bountyCount++;
        bounties[bountyCount] = Bounty({
            id:              bountyCount,
            poster:          msg.sender,
            title:           _title,
            description:     _description,
            requirements:    _requirements,
            category:        _category,
            reward:          msg.value,
            deadline:        block.timestamp + (_deadlineDays * 1 days),
            status:          BountyStatus.Open,
            submissionCount: 0,
            winner:          address(0),
            createdAt:       block.timestamp
        });
        emit BountyCreated(bountyCount, msg.sender, _title, msg.value);
    }

    // ── Submit work (worker) ─────────────────────────────────────────
    function submitWork(
        uint256 _bountyId,
        string memory _solutionUrl,
        string memory _notes
    ) external bountyExists(_bountyId) {
        Bounty storage b = bounties[_bountyId];
        require(b.status == BountyStatus.Open, "Not open");
        require(block.timestamp < b.deadline,  "Deadline passed");
        require(msg.sender != b.poster,        "Poster can't submit");

        submissions[_bountyId].push(Submission({
            worker:      msg.sender,
            solutionUrl: _solutionUrl,
            notes:       _notes,
            submittedAt: block.timestamp,
            approved:    false,
            rejected:    false
        }));
        b.submissionCount++;
        b.status = BountyStatus.UnderReview;
        emit WorkSubmitted(_bountyId, msg.sender);
    }

    // ── Approve submission (poster) ──────────────────────────────────
    function approveSubmission(uint256 _bountyId, uint256 _submissionIdx)
        external bountyExists(_bountyId)
    {
        Bounty storage b = bounties[_bountyId];
        require(msg.sender == b.poster,                      "Not poster");
        require(b.status == BountyStatus.UnderReview,        "Not under review");
        require(_submissionIdx < submissions[_bountyId].length, "Bad index");

        Submission storage s = submissions[_bountyId][_submissionIdx];
        require(!s.approved && !s.rejected, "Already reviewed");

        s.approved = true;
        b.status   = BountyStatus.Completed;
        b.winner   = s.worker;

        // Pay worker minus platform fee
        uint256 fee    = (b.reward * platformFeePercent) / 100;
        uint256 payout = b.reward - fee;
        payable(owner).transfer(fee);
        payable(s.worker).transfer(payout);

        emit SubmissionApproved(_bountyId, s.worker, _submissionIdx);
    }

    // ── Reject submission (poster) ───────────────────────────────────
    function rejectSubmission(uint256 _bountyId, uint256 _submissionIdx)
        external bountyExists(_bountyId)
    {
        Bounty storage b = bounties[_bountyId];
        require(msg.sender == b.poster,          "Not poster");
        require(_submissionIdx < submissions[_bountyId].length, "Bad index");

        Submission storage s = submissions[_bountyId][_submissionIdx];
        require(!s.approved && !s.rejected, "Already reviewed");
        s.rejected = true;

        // If all submissions rejected, revert to Open
        bool allRejected = true;
        for (uint256 i = 0; i < submissions[_bountyId].length; i++) {
            if (!submissions[_bountyId][i].rejected) {
                allRejected = false;
                break;
            }
        }
        if (allRejected) b.status = BountyStatus.Open;

        emit SubmissionRejected(_bountyId, s.worker, _submissionIdx);
    }

    // ── Cancel (poster, only if Open) ────────────────────────────────
    function cancelBounty(uint256 _bountyId) external bountyExists(_bountyId) {
        Bounty storage b = bounties[_bountyId];
        require(msg.sender == b.poster, "Not poster");
        require(b.status == BountyStatus.Open, "Not open");

        b.status = BountyStatus.Cancelled;
        payable(b.poster).transfer(b.reward);
        emit BountyCancelled(_bountyId);
    }

    // ── Reclaim expired (poster) ─────────────────────────────────────
    function reclaimExpiredBounty(uint256 _bountyId) external bountyExists(_bountyId) {
        Bounty storage b = bounties[_bountyId];
        require(msg.sender == b.poster,       "Not poster");
        require(block.timestamp >= b.deadline, "Not expired");
        require(b.status == BountyStatus.Open || b.status == BountyStatus.UnderReview, "Cannot reclaim");

        b.status = BountyStatus.Expired;
        payable(b.poster).transfer(b.reward);
        emit BountyReclaimed(_bountyId, b.poster, b.reward);
    }

    // ── Views ────────────────────────────────────────────────────────
    function getBounty(uint256 _id) external view bountyExists(_id) returns (Bounty memory) {
        return bounties[_id];
    }

    function getSubmissions(uint256 _bountyId) external view returns (Submission[] memory) {
        return submissions[_bountyId];
    }

    function getAllBounties(uint256 _bountyId) external view returns (Bounty[] memory) {
        Bounty[] memory all = new Bounty[](bountyCount);
        for (uint256 i = 1; i <= bountyCount; i++) {
            all[i - 1] = bounties[i];
        }
        return all;
    }
}
`;

// ── Wrapper generator ────────────────────────────────────────────────
function generateBountyBoardPanelWrapper(defaultAddress: string | undefined): string {
    const addr = defaultAddress ?? '0x54e583f445b5b4736628d04fcff66698977b4b00';
    return `'use client';

import { BountyBoardInteractionPanel } from '@cradle/bounty-board';

export default function BountyBoardPanel() {
  return <BountyBoardInteractionPanel contractAddress="${addr}" />;
}
`;
}
