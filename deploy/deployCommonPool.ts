import { createDeployFunction } from "../utils/deploy";

const constructorContracts = {
	USDC: -1,
	name: "Relative Common Pool",
	symbol: "RFX",
	ExchangeRouter: -1,
	Router: -1,
	Helper: -1,
	WETH: -1,
	Pyth: -1,
	SwapHandler: -1,
};

const func = createDeployFunction({
	contractName: "CommonPool",
	dependencyNames: Object.keys(constructorContracts).filter((name) => constructorContracts[name] == -1),
	getDeployArgs: async ({ dependencyContracts }) => {
		return Object.keys(constructorContracts).map((dependencyName) =>
			constructorContracts[dependencyName] === -1 ? dependencyContracts[dependencyName].address : constructorContracts[dependencyName]
		);
	},
	libraryNames: [],
	afterDeploy: async ({ deployedContract }) => {},
});

export default func;
