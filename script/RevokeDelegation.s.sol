// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";

contract RevokeDelegation is Script {
    function run() external {
        address compromised = vm.envAddress("COMPROMISED_ADDRESS");
        uint256 compromisedNonce = vm.envUint("COMPROMISED_NONCE");
        uint256 compromisedKey = vm.envUint("COMPROMISED_PRIVATE_KEY");

        // Craft the raw transaction
        bytes memory txData = ""; // Empty callData to revoke
        uint256 gasLimit = 50000;
        uint256 gasPrice = 1 gwei; // Flashbots bundles don't care about this, set any
         vm.broadcast(); // Uses --private-key (sponsor)
        (bool success, ) = payable(compromised).call{value: 0.0002 ether}("");
        require(success, "Failed to call from relayer");

        vm.broadcast(compromisedKey);
        (bool success2, ) = compromised.call{gas: gasLimit, value: 0}(txData);
        require(success2, "Failed to call from relayer");
    }
}