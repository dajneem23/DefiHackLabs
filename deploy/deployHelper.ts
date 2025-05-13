import { createDeployFunction } from "../utils/deploy";

const constructorContracts = {
	Reader: -1,
	Pyth: -1,
	DataStore: -1,
	Oracle: -1,
	Name: "Relative",
	Version: "1.0",
};

const func = createDeployFunction({
	contractName: "Helper",
	dependencyNames: Object.keys(constructorContracts).filter((name) => constructorContracts[name] == -1),
	getDeployArgs: async ({ dependencyContracts }) => {
		return Object.keys(constructorContracts).map((dependencyName) =>
			constructorContracts[dependencyName] === -1 ? dependencyContracts[dependencyName].address : constructorContracts[dependencyName]
		);
	},
	libraryNames: ["BytesLib", "MathLite"],
	afterDeploy: async ({ deployedContract }) => {},
});

export default func;
