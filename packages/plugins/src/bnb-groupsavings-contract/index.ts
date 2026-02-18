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
const BnbGroupSavingsContractSchema = z.object({
    contractAddress: z
        .string()
        .regex(/^0x[0-9a-fA-F]{40}$/)
        .default('0x0000000000000000000000000000000000000000'),
});

// ── Plugin class ─────────────────────────────────────────────────────
export class BnbGroupSavingsContractPlugin extends BasePlugin<z.infer<typeof BnbGroupSavingsContractSchema>> {
    readonly metadata: PluginMetadata = {
        id: 'bnb-groupsavings-contract',
        name: 'BNB Group Savings Contract',
        version: '0.1.0',
        description: 'Interact with a GroupSavings.sol contract on BNB Smart Chain Testnet',
        category: 'contracts',
        tags: ['savings', 'crowdfunding', 'bnb', 'testnet', 'contract'],
    };

    readonly configSchema = BnbGroupSavingsContractSchema as unknown as z.ZodType<z.infer<typeof BnbGroupSavingsContractSchema>>;

    readonly componentPath = 'packages/components/bnb-groupsavings';
    readonly componentPackage = '@cradle/bnb-groupsavings';

    readonly componentPathMappings: Record<string, PathCategory> = {
        'src/GroupSavingsInteractionPanel.tsx': 'frontend-components',
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
            id: 'savings-out',
            name: 'Group Savings Contract',
            type: 'output',
            dataType: 'contract',
        },
    ];

    getDefaultConfig(): Partial<z.infer<typeof BnbGroupSavingsContractSchema>> {
        return {
            contractAddress: '0x0000000000000000000000000000000000000000',
        };
    }

    async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
        const config = this.configSchema.parse(node.config);
        const output = this.createEmptyOutput();

        // Ship Solidity source into the generated repo
        this.addFile(
            output,
            'contracts/groupsavings/GroupSavings.sol',
            GROUP_SAVINGS_SOL_SOURCE,
            'contract-source'
        );

        // Ship ABI JSON for integrations and tooling
        this.addFile(
            output,
            'contracts/groupsavings/groupsavings-abi.json',
            GROUP_SAVINGS_ABI_JSON,
            'contract-source'
        );

        // Provide a thin wrapper component that re-exports the shared panel
        this.addFile(
            output,
            'src/components/GroupSavingsInteractionPanel.tsx',
            generateGroupSavingsPanelWrapper(config.contractAddress),
            'frontend-components'
        );

        context.logger.info('Configured BNB Group Savings contract', {
            nodeId: node.id,
            contractAddress: config.contractAddress,
        });

        return output;
    }
}

// ── ABI ──────────────────────────────────────────────────────────────
const GROUP_SAVINGS_ABI = [
    {
        "inputs": [],
        "name": "contribute",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_goalAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_duration",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "contributor",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalRaised",
                "type": "uint256"
            }
        ],
        "name": "Contributed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
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
                "indexed": false,
                "internalType": "uint256",
                "name": "totalRaised",
                "type": "uint256"
            }
        ],
        "name": "GoalReached",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "refund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "contributor",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Refunded",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "withdrawFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "contributions",
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
        "name": "contributors",
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
        "name": "deadline",
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
        "name": "description",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getContributors",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "addrs",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "amounts",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getStatus",
        "outputs": [
            {
                "internalType": "string",
                "name": "desc",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "goal",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "raised",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "remaining",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "secondsLeft",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "goalMet",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isWithdrawn",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "goalAmount",
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
        "name": "myContribution",
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
        "name": "progressPercent",
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
        "name": "totalRaised",
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
        "name": "withdrawn",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const GROUP_SAVINGS_ABI_JSON = JSON.stringify(GROUP_SAVINGS_ABI, null, 2);

// ── Solidity source ──────────────────────────────────────────────────
// ── Solidity source ──────────────────────────────────────────────────
const GROUP_SAVINGS_SOL_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title  GroupSavings
 * @notice A shared savings pot where a group of people each
 *         contribute ETH toward a common goal amount.
 *         When the goal is reached, the owner can withdraw funds.
 *         If the deadline passes without reaching the goal,
 *         everyone gets a full refund.
 *
 * HOW IT WORKS:
 *  1. Owner deploys with a goal (in wei), a deadline, and a description.
 *  2. Any address can call contribute() and send ETH.
 *  3. If goal is met before deadline → owner can withdraw.
 *  4. If deadline passes without meeting goal → contributors call refund().
 *
 * DEPLOY ON REMIX:
 *  Constructor args:
 *   _description  e.g. "Team Offsite Trip Fund"
 *   _goalAmount   e.g. 100000000000000000  (0.1 ETH in wei)
 *   _duration     e.g. 600  (10 minutes in seconds)
 */
contract GroupSavings {

    // ─── State ────────────────────────────────────────────────
    address public owner;
    string  public description;
    uint256 public goalAmount;
    uint256 public deadline;
    uint256 public totalRaised;
    bool    public withdrawn;

    mapping(address => uint256) public contributions;
    address[] public contributors;
    mapping(address => bool) private hasContributed;

    // ─── Events ───────────────────────────────────────────────
    event Contributed(address indexed contributor, uint256 amount, uint256 totalRaised);
    event GoalReached(uint256 totalRaised);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event Refunded(address indexed contributor, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────
    constructor(
        string memory _description,
        uint256       _goalAmount,
        uint256       _duration
    ) {
        require(_goalAmount > 0,  "Goal must be > 0");
        require(_duration   > 0,  "Duration must be > 0");

        owner       = msg.sender;
        description = _description;
        goalAmount  = _goalAmount;
        deadline    = block.timestamp + _duration;
    }

    // ─── Contributor Functions ────────────────────────────────

    /**
     * @notice Contribute ETH toward the group savings goal.
     *         Can contribute multiple times - amounts accumulate.
     */
    function contribute() external payable {
        require(block.timestamp < deadline,  "Deadline has passed");
        require(!withdrawn,                  "Funds already withdrawn");
        require(msg.value > 0,              "Must send ETH");

        if (!hasContributed[msg.sender]) {
            hasContributed[msg.sender] = true;
            contributors.push(msg.sender);
        }

        contributions[msg.sender] += msg.value;
        totalRaised               += msg.value;

        emit Contributed(msg.sender, msg.value, totalRaised);

        if (totalRaised >= goalAmount) {
            emit GoalReached(totalRaised);
        }
    }

    /**
     * @notice Claim a full refund if the deadline passed without reaching the goal.
     */
    function refund() external {
        require(block.timestamp >= deadline,  "Deadline not yet passed");
        require(totalRaised < goalAmount,     "Goal was reached - no refunds");
        require(!withdrawn,                   "Already withdrawn");

        uint256 amount = contributions[msg.sender];
        require(amount > 0, "Nothing to refund");

        contributions[msg.sender] = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Refund transfer failed");

        emit Refunded(msg.sender, amount);
    }

    // ─── Owner Functions ──────────────────────────────────────

    /**
     * @notice Withdraw all funds once the goal is reached.
     *         Can withdraw before deadline if goal is already met.
     */
    function withdrawFunds() external onlyOwner {
        require(totalRaised >= goalAmount, "Goal not yet reached");
        require(!withdrawn,               "Already withdrawn");

        withdrawn       = true;
        uint256 amount  = address(this).balance;

        emit FundsWithdrawn(owner, amount);

        (bool ok,) = payable(owner).call{value: amount}("");
        require(ok, "Withdraw failed");
    }

    // ─── View Functions ───────────────────────────────────────

    /// @notice Returns full savings pot status.
    function getStatus() external view returns (
        string memory  desc,
        uint256        goal,
        uint256        raised,
        uint256        remaining,
        uint256        secondsLeft,
        bool           goalMet,
        bool           isWithdrawn
    ) {
        uint256 left    = block.timestamp >= deadline ? 0 : deadline - block.timestamp;
        uint256 needed  = totalRaised >= goalAmount   ? 0 : goalAmount - totalRaised;

        return (
            description,
            goalAmount,
            totalRaised,
            needed,
            left,
            totalRaised >= goalAmount,
            withdrawn
        );
    }

    /// @notice Returns all contributors and their amounts.
    function getContributors() external view returns (
        address[] memory addrs,
        uint256[] memory amounts
    ) {
        uint256 len     = contributors.length;
        uint256[] memory amts = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            amts[i] = contributions[contributors[i]];
        }

        return (contributors, amts);
    }

    /// @notice Returns a contributor's individual contribution.
    function myContribution() external view returns (uint256) {
        return contributions[msg.sender];
    }

    /// @notice Progress toward goal as a percentage (0–100).
    function progressPercent() external view returns (uint256) {
        if (goalAmount == 0) return 0;
        uint256 pct = (totalRaised * 100) / goalAmount;
        return pct > 100 ? 100 : pct;
    }
}
`;

// ── Wrapper generator ────────────────────────────────────────────────
function generateGroupSavingsPanelWrapper(defaultAddress: string | undefined): string {
    const addr = defaultAddress ?? '0x0000000000000000000000000000000000000000';
    return `'use client';

import { GroupSavingsInteractionPanel } from '@cradle/bnb-groupsavings';

export default function GroupSavingsPanel() {
    return <GroupSavingsInteractionPanel contractAddress="${addr}" />;
}
`;
}
