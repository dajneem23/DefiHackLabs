import { createDeployFunction } from "../utils/deploy";

const func = createDeployFunction({
	contractName: "MathLite",
	dependencyNames: [],
	libraryNames: [],
});

export default func;
