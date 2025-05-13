import { createDeployFunction } from "../utils/deploy";

const func = createDeployFunction({
	contractName: "BytesLib",
	dependencyNames: [],
	libraryNames: [],
});

export default func;
