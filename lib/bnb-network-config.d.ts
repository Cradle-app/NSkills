export declare const BNB_NETWORKS: {
    readonly testnet: {
        readonly id: "testnet";
        readonly name: "BNB Smart Chain Testnet";
        readonly chainId: 97;
        readonly rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
        readonly explorerUrl: "https://testnet.bscscan.com";
        readonly label: "BNB Testnet";
        readonly description: "BNB Smart Chain Testnet (BSC Testnet)";
        readonly disabled: false;
        readonly symbol: "tBNB";
        readonly nativeCurrency: {
            readonly name: "BNB";
            readonly symbol: "tBNB";
            readonly decimals: 18;
        };
    };
    readonly mainnet: {
        readonly id: "mainnet";
        readonly name: "BSC Mainnet";
        readonly chainId: 56;
        readonly rpcUrl: "https://bsc-dataseed.bnbchain.org";
        readonly explorerUrl: "https://bscscan.com";
        readonly label: "BNB Mainnet";
        readonly description: "BNB Smart Chain Mainnet";
        readonly disabled: true;
        readonly symbol: "BNB";
        readonly nativeCurrency: {
            readonly name: "BNB";
            readonly symbol: "BNB";
            readonly decimals: 18;
        };
    };
    readonly opbnbTestnet: {
        readonly id: "opbnbTestnet";
        readonly name: "opBNB Testnet";
        readonly chainId: 5611;
        readonly rpcUrl: "https://opbnb-testnet-rpc.bnbchain.org";
        readonly explorerUrl: "https://testnet.opbnbscan.com";
        readonly label: "opBNB Testnet";
        readonly description: "opBNB L2 Testnet";
        readonly disabled: true;
        readonly symbol: "tBNB";
        readonly nativeCurrency: {
            readonly name: "BNB";
            readonly symbol: "tBNB";
            readonly decimals: 18;
        };
    };
    readonly opbnbMainnet: {
        readonly id: "opbnbMainnet";
        readonly name: "opBNB Mainnet";
        readonly chainId: 204;
        readonly rpcUrl: "https://opbnb-mainnet-rpc.bnbchain.org";
        readonly explorerUrl: "https://opbnbscan.com";
        readonly label: "opBNB Mainnet";
        readonly description: "opBNB L2 Mainnet";
        readonly disabled: true;
        readonly symbol: "BNB";
        readonly nativeCurrency: {
            readonly name: "BNB";
            readonly symbol: "BNB";
            readonly decimals: 18;
        };
    };
};
export type BnbNetworkKey = keyof typeof BNB_NETWORKS;
//# sourceMappingURL=bnb-network-config.d.ts.map