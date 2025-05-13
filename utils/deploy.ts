import { DeployFunction, DeployResult, DeploymentsExtension } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getExistingContractAddresses } from "../config/overwrite";

import dotenv from "dotenv";
import { Wallet } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export async function deployContract(name, args, contractOptions = {}) {
	const contractFactory = await ethers.getContractFactory(name, contractOptions);
	return await contractFactory.deploy(...args);
}

export async function contractAt(name, address, provider) {
	let contractFactory = await ethers.getContractFactory(name);
	if (provider) {
		contractFactory = contractFactory.connect(provider);
	}
	return await contractFactory.attach(address);
}

export function createDeployFunction({
	contractName,
	dependencyNames = [],
	getDeployArgs = null,
	libraryNames = [],
	afterDeploy = null,
	id,
	extend,
}: {
	contractName: string;
	dependencyNames?: string[];
	getDeployArgs?: (args: { dependencyContracts: any; network?: any; get?: any; getNamedAccounts?: any }) => Promise<any[]>;
	libraryNames?: string[];
	afterDeploy?: (args: {
		deployedContract: DeployResult;
		deployer: string;
		getNamedAccounts: () => Promise<Record<string, string>>;
		deployments: DeploymentsExtension;
		network: any;
	}) => Promise<void>;
	id?: string;
	extend?: string;
}): DeployFunction {
	const func = async ({ getNamedAccounts, deployments, network }: HardhatRuntimeEnvironment) => {
		const { deploy, get, save, getOrNull } = deployments;
		const { deployer } = await getNamedAccounts();

		const dependencyContracts = getExistingContractAddresses(network);

		if (dependencyNames) {
			for (let i = 0; i < dependencyNames.length; i++) {
				const dependencyName = dependencyNames[i];
				if (dependencyContracts[dependencyName] === undefined) {
					dependencyContracts[dependencyName] = await get(dependencyName);
				}
			}
		}

		let deployArgs = [];
		if (getDeployArgs) {
			deployArgs = await getDeployArgs({ dependencyContracts, network, get, getNamedAccounts });
		}

		const libraries = {};

		if (libraryNames) {
			for (let i = 0; i < libraryNames.length; i++) {
				const libraryName = libraryNames[i];
				libraries[libraryName] = (await get(libraryName)).address;
			}
		}

		let deployedContract: DeployResult;
		try {
			if (network.zksync) {
				// comment out to redeploy contracts
				const deployed = await getOrNull(contractName);
				if (deployed) {
					console.log(`reusing ${contractName} at ${deployed.address}`);
					return;
				}

				// eslint-disable-next-line
				const hre = require("hardhat");

				dotenv.config();
				const ACCOUNT_KEY = process.env.ACCOUNT_KEY || "";
				if (!ACCOUNT_KEY) throw "No private key";

				const wallet = new Wallet(ACCOUNT_KEY);
				const deployer = new Deployer(hre, wallet);
				const artifact = await deployer.loadArtifact(contractName);

				const contract = await deployer.deploy(artifact, deployArgs);
				console.log(`deployed at ${contract.address}`);
				process.stdout.write(`deploying "${contractName}" (tx: ${contract.deployTransaction.hash})...: `);
				await contract.deployTransaction.wait();

				console.log(`deployed at ${contract.address}`);

				await save(extend ? `${contractName}_${extend}` : contractName, {
					address: contract.address,
					abi: artifact.abi,
					transactionHash: contract.deployTransaction.hash,
					args: deployArgs,
					libraries: libraries,
				});

				deployedContract = {} as DeployResult;
				deployedContract.address = contract.address;
			} else {
				deployedContract = await deploy(contractName, {
					from: deployer,
					log: true,
					args: deployArgs,
					libraries,
				});
			}
		} catch (e) {
			// console.error(`Deploy failed with error ${e}`);
			// the caught error might not be very informative
			// e.g. if some library dependency is missing, which library it is
			// is not shown in the error
			// attempt a deploy using hardhat so that a more detailed error
			// would be thrown
			await deployContract(contractName, deployArgs, {
				libraries,
			});

			// throw an error even if the hardhat deploy works
			// because the actual deploy did not succeed
			throw new Error(`Deploy failed with error ${e}`);
		}

		if (afterDeploy) {
			await afterDeploy({ deployedContract, deployer, getNamedAccounts, deployments, network });
		}

		if (id) {
			// hardhat-deploy would not redeploy a contract if it already exists with the same id
			// with `id` it's possible to control whether a contract should be redeployed
			return true;
		}
	};

	let dependencies = [];
	if (dependencyNames) {
		dependencies = dependencies.concat(dependencyNames);
	}
	if (libraryNames) {
		dependencies = dependencies.concat(libraryNames);
	}

	if (id) {
		func.id = id;
	}
	func.tags = [contractName];
	func.dependencies = dependencies;

	return func;
}
