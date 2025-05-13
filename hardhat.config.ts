import dotenv from "dotenv";
dotenv.config();

import path from "path";
import fs from "fs";
import { ethers } from "ethers";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-deploy";

import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

// for harhat-foundry plugin
//@doc: https://hardhat.org/hardhat-runner/docs/advanced/hardhat-and-foundry
import "@nomicfoundation/hardhat-foundry";

import "./config";

// add test helper methods
import "./utils/test";

const getRpcUrl = (network) => {
	const defaultRpcs = {
		arbitrum: "https://arb1.arbitrum.io/rpc",
		avalanche: "https://api.avax.network/ext/bc/C/rpc",
		arbitrumGoerli: "https://goerli-rollup.arbitrum.io/rpc",
		arbitrumSepolia: "https://sepolia-rollup.arbitrum.io/rpc",
		avalancheFuji: "https://api.avax-test.network/ext/bc/C/rpc",
		zkSyncSepolia: "https://sepolia.era.zksync.dev/",
	};

	let rpc = defaultRpcs[network];

	try {
		const filepath = path.join("./.rpcs.json");
		if (fs.existsSync(filepath)) {
			const data = JSON.parse(fs.readFileSync(filepath).toString());
			if (data[network]) {
				rpc = data[network];
			}
		}
	} catch (error) {
		console.error("Error getting rpc url", error);
	}
	return rpc;
};

const getEnvAccounts = () => {
	try {
		const { ACCOUNT_KEY, ACCOUNT_KEY_FILE } = process.env;

		if (ACCOUNT_KEY) {
			return [ACCOUNT_KEY];
		}

		if (ACCOUNT_KEY_FILE) {
			const filepath = path.join("./keys/", ACCOUNT_KEY_FILE);
			const data = JSON.parse(fs.readFileSync(filepath).toString());
			if (!data) {
				throw new Error("Invalid key file");
			}

			if (data.key) {
				return [data.key];
			}

			if (!data.mnemonic) {
				throw new Error("Invalid mnemonic");
			}

			const wallet = ethers.Wallet.fromMnemonic(data.mnemonic);
			return [wallet.privateKey];
		}
	} catch (error) {
		console.error("Error getting accounts", error);
	}
	return [];
};

export const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.20",
		settings: {
			optimizer: {
				enabled: true,
				runs: 10,
				details: {
					constantOptimizer: true,
				},
			},
		},
	},
	networks: {
		hardhat: {
			saveDeployments: true,
			// forking: {
			//   url: `https://rpc.ankr.com/avalanche`,
			//   blockNumber: 33963320,
			// },
		},
		localhost: {
			saveDeployments: true,
		},
		arbitrum: {
			url: getRpcUrl("arbitrum"),
			chainId: 42161,
			accounts: getEnvAccounts(),
			verify: {
				etherscan: {
					apiUrl: "https://api.arbiscan.io/",
					apiKey: process.env.ARBISCAN_API_KEY,
				},
			},
			blockGasLimit: 20_000_000,
		},
		avalanche: {
			url: getRpcUrl("avalanche"),
			chainId: 43114,
			accounts: getEnvAccounts(),
			verify: {
				etherscan: {
					apiUrl: "https://api.snowtrace.io/",
					apiKey: process.env.SNOWTRACE_API_KEY,
				},
			},
			blockGasLimit: 15_000_000,
		},
		arbitrumGoerli: {
			url: getRpcUrl("arbitrumGoerli"),
			chainId: 421613,
			accounts: getEnvAccounts(),
			verify: {
				etherscan: {
					apiUrl: "https://api-goerli.arbiscan.io/",
					apiKey: process.env.ARBISCAN_API_KEY,
				},
			},
			blockGasLimit: 10000000,
		},
		arbitrumSepolia: {
			url: getRpcUrl("arbitrumSepolia"),
			chainId: 421614,
			accounts: getEnvAccounts(),
			verify: {
				etherscan: {
					apiUrl: "https://api-sepolia.arbiscan.io/",
					apiKey: process.env.ARBISCAN_API_KEY,
				},
			},
			blockGasLimit: 10000000,
		},
		avalancheFuji: {
			url: getRpcUrl("avalancheFuji"),
			chainId: 43113,
			accounts: getEnvAccounts(),
			verify: {
				etherscan: {
					apiUrl: "https://api-testnet.snowtrace.io/",
					apiKey: process.env.SNOWTRACE_API_KEY,
				},
			},
			blockGasLimit: 2500000,
			// gasPrice: 50000000000,
		},
		zkSyncSepolia: {
			url: getRpcUrl("zkSyncSepolia"),
			ethNetwork: "sepolia",
			zksync: true,
			// verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
			chainId: 300,
			accounts: getEnvAccounts(),
			blockGasLimit: 10000000,
		},
	},
	zksolc: {
		version: "1.3.22",
		settings: {},
	},
	// hardhat-deploy has issues with some contracts
	// https://github.com/wighawag/hardhat-deploy/issues/264
	etherscan: {
		apiKey: {
			// hardhat-etherscan plugin uses "avalancheFujiTestnet" name
			arbitrumOne: process.env.ARBISCAN_API_KEY,
			avalanche: process.env.SNOWTRACE_API_KEY,
			arbitrumGoerli: process.env.ARBISCAN_API_KEY,
			arbitrumSepolia: process.env.ARBISCAN_API_KEY,
			avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY,
			zkSyncSepolia: process.env.ZKSYNC_API_KEY,
		},
		customChains: [
			{
				network: "arbitrumSepolia",
				chainId: 421614,
				urls: {
					apiURL: "https://api-sepolia.arbiscan.io//api",
					browserURL: "https://api-sepolia.arbiscan.io/",
				},
			},
			{
				network: "zkSyncSepolia",
				chainId: 300,
				urls: {
					apiURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
					browserURL: "https://sepolia.explorer.zksync.io/",
				},
			},
		],
	},
	gasReporter: {
		enabled: process.env.REPORT_GAS ? true : false,
	},
	namedAccounts: {
		deployer: 0,
	},
	mocha: {
		timeout: 100000000,
	},
};

export default config;
