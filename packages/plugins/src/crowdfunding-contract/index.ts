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
const CrowdfundingContractSchema = z.object({
    contractAddress: z
        .string()
        .regex(/^0x[0-9a-fA-F]{40}$/)
        .default('0x96bBBef124fe87477244D8583F771fdF6C2f0ED6'),
});

// ── Plugin class ─────────────────────────────────────────────────────
export class CrowdfundingContractPlugin extends BasePlugin<z.infer<typeof CrowdfundingContractSchema>> {
    readonly metadata: PluginMetadata = {
        id: 'crowdfunding-contract',
        name: 'Crowdfunding Contract',
        version: '0.1.0',
        description: 'Interact with a CrowdfundingDApp.sol contract on BNB Smart Chain Testnet',
        category: 'contracts',
        tags: ['crowdfunding', 'fundraising', 'campaigns', 'bnb', 'testnet', 'contract'],
    };

    readonly configSchema = CrowdfundingContractSchema as unknown as z.ZodType<z.infer<typeof CrowdfundingContractSchema>>;

    readonly componentPath = 'packages/components/crowdfunding';
    readonly componentPackage = '@cradle/crowdfunding';

    readonly componentPathMappings: Record<string, PathCategory> = {
        'src/CrowdfundingInteractionPanel.tsx': 'frontend-components',
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
            id: 'crowdfunding-out',
            name: 'Crowdfunding Contract',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof CrowdfundingContractSchema>> {
        return {
            contractAddress: '0x96bBBef124fe87477244D8583F771fdF6C2f0ED6',
        };
    }

    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Note: Contract files (Crowdfunding.sol and crowdfunding-abi.json) are copied
        // from the component package via componentPathMappings, so we don't generate them here
        // to avoid duplication.

        // Provide a thin wrapper component that re-exports the shared panel
        this.addFile(
            output,
            'src/components/CrowdfundingInteractionPanel.tsx',
            generateCrowdfundingPanelWrapper(config.contractAddress),
            'frontend-components'
        );

        context.logger.info('Configured Crowdfunding contract', {
            nodeId: node.id,
            contractAddress: config.contractAddress,
        });

        return output;
    }
}

// ── ABI ──────────────────────────────────────────────────────────────
const CROWDFUNDING_ABI = [
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
				"name": "campaignId",
				"type": "uint256"
			}
		],
		"name": "CampaignCancelled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
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
				"name": "goalAmount",
				"type": "uint256"
			}
		],
		"name": "CampaignCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "backer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "CampaignFunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsWithdrawn",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "backer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "RefundClaimed",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "campaignCount",
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
			}
		],
		"name": "campaigns",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "creator",
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
				"name": "imageUrl",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "goalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "raisedAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "goalReached",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "fundsWithdrawn",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isCancelled",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "backerCount",
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
				"name": "_campaignId",
				"type": "uint256"
			}
		],
		"name": "cancelCampaign",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_campaignId",
				"type": "uint256"
			}
		],
		"name": "claimRefund",
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
				"name": "_imageUrl",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_goalAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_durationDays",
				"type": "uint256"
			}
		],
		"name": "createCampaign",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_campaignId",
				"type": "uint256"
			}
		],
		"name": "fundCampaign",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllCampaigns",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address payable",
						"name": "creator",
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
						"name": "imageUrl",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "goalAmount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "raisedAmount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "goalReached",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "fundsWithdrawn",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isCancelled",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "backerCount",
						"type": "uint256"
					}
				],
				"internalType": "struct CrowdfundingDApp.Campaign[]",
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
		"name": "getCampaign",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address payable",
						"name": "creator",
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
						"name": "imageUrl",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "goalAmount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "raisedAmount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deadline",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "goalReached",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "fundsWithdrawn",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isCancelled",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "backerCount",
						"type": "uint256"
					}
				],
				"internalType": "struct CrowdfundingDApp.Campaign",
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
				"name": "_campaignId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_backer",
				"type": "address"
			}
		],
		"name": "getContribution",
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
				"name": "_campaignId",
				"type": "uint256"
			}
		],
		"name": "withdrawFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

const CROWDFUNDING_ABI_JSON = JSON.stringify(CROWDFUNDING_ABI, null, 2);

// ── Solidity source ──────────────────────────────────────────────────
const CROWDFUNDING_SOL_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CrowdfundingDApp {
    struct Campaign {
        uint256 id;
        address payable creator;
        string  title;
        string  description;
        string  imageUrl;
        uint256 goalAmount;       // in wei
        uint256 raisedAmount;
        uint256 deadline;         // unix timestamp
        bool    goalReached;
        bool    fundsWithdrawn;
        bool    isCancelled;
        uint256 backerCount;
    }

    address public owner;
    uint256 public campaignCount;
    uint256 public platformFeePercent = 2;   // 2 %

    mapping(uint256 => Campaign)                       public campaigns;
    mapping(uint256 => mapping(address => uint256))    private contributions;

    // ── Events ───────────────────────────────────────────────────────
    event CampaignCreated (uint256 indexed campaignId, address indexed creator, string title, uint256 goalAmount);
    event CampaignFunded  (uint256 indexed campaignId, address indexed backer,  uint256 amount);
    event FundsWithdrawn  (uint256 indexed campaignId, uint256 amount);
    event RefundClaimed   (uint256 indexed campaignId, address indexed backer,  uint256 amount);
    event CampaignCancelled(uint256 indexed campaignId);

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyOwner()               { require(msg.sender == owner, "Not owner");       _; }
    modifier campaignExists(uint256 _id) { require(_id > 0 && _id <= campaignCount, "No campaign"); _; }

    constructor() { owner = msg.sender; }

    // ── Create ───────────────────────────────────────────────────────
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _imageUrl,
        uint256 _goalAmount,
        uint256 _durationDays
    ) external {
        require(bytes(_title).length > 0, "Title required");
        require(_goalAmount > 0, "Goal must be > 0");
        require(_durationDays > 0, "Duration must be > 0");

        campaignCount++;
        campaigns[campaignCount] = Campaign({
            id:             campaignCount,
            creator:        payable(msg.sender),
            title:          _title,
            description:    _description,
            imageUrl:       _imageUrl,
            goalAmount:     _goalAmount,
            raisedAmount:   0,
            deadline:       block.timestamp + (_durationDays * 1 days),
            goalReached:    false,
            fundsWithdrawn: false,
            isCancelled:    false,
            backerCount:    0
        });
        emit CampaignCreated(campaignCount, msg.sender, _title, _goalAmount);
    }

    // ── Fund ─────────────────────────────────────────────────────────
    function fundCampaign(uint256 _campaignId) external payable campaignExists(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(!c.isCancelled,      "Campaign cancelled");
        require(block.timestamp < c.deadline, "Deadline passed");
        require(msg.value > 0,       "Send BNB");

        if (contributions[_campaignId][msg.sender] == 0) {
            c.backerCount++;
        }
        contributions[_campaignId][msg.sender] += msg.value;
        c.raisedAmount += msg.value;

        if (c.raisedAmount >= c.goalAmount) {
            c.goalReached = true;
        }
        emit CampaignFunded(_campaignId, msg.sender, msg.value);
    }

    // ── Withdraw (creator) ───────────────────────────────────────────
    function withdrawFunds(uint256 _campaignId) external campaignExists(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(msg.sender == c.creator, "Not creator");
        require(c.goalReached,           "Goal not reached");
        require(!c.fundsWithdrawn,       "Already withdrawn");

        c.fundsWithdrawn = true;
        uint256 fee    = (c.raisedAmount * platformFeePercent) / 100;
        uint256 payout = c.raisedAmount - fee;

        payable(owner).transfer(fee);
        c.creator.transfer(payout);
        emit FundsWithdrawn(_campaignId, payout);
    }

    // ── Refund (backer) ──────────────────────────────────────────────
    function claimRefund(uint256 _campaignId) external campaignExists(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(
            block.timestamp >= c.deadline && !c.goalReached || c.isCancelled,
            "Refund not available"
        );
        uint256 amount = contributions[_campaignId][msg.sender];
        require(amount > 0, "Nothing to refund");

        contributions[_campaignId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit RefundClaimed(_campaignId, msg.sender, amount);
    }

    // ── Cancel (creator) ─────────────────────────────────────────────
    function cancelCampaign(uint256 _campaignId) external campaignExists(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(msg.sender == c.creator, "Not creator");
        require(!c.fundsWithdrawn,       "Already withdrawn");
        c.isCancelled = true;
        emit CampaignCancelled(_campaignId);
    }

    // ── Views ────────────────────────────────────────────────────────
    function getCampaign(uint256 _id) external view campaignExists(_id) returns (Campaign memory) {
        return campaigns[_id];
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory all = new Campaign[](campaignCount);
        for (uint256 i = 1; i <= campaignCount; i++) {
            all[i - 1] = campaigns[i];
        }
        return all;
    }

    function getContribution(uint256 _campaignId, address _backer)
        external view campaignExists(_campaignId)
        returns (uint256)
    {
        return contributions[_campaignId][_backer];
    }
}
`;

// ── Wrapper generator ────────────────────────────────────────────────
function generateCrowdfundingPanelWrapper(defaultAddress: string | undefined): string {
    const addr = defaultAddress ?? '0x96bBBef124fe87477244D8583F771fdF6C2f0ED6';
    return `'use client';

import { CrowdfundingInteractionPanel } from '@cradle/crowdfunding';

export default function CrowdfundingPanel() {
  return <CrowdfundingInteractionPanel contractAddress="${addr}" />;
}
`;
}
