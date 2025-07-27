// flashbots-revoke.js
const { ethers } = require("ethers");
const {
    FlashbotsBundleProvider,
    FlashbotsBundleResolution,
} = require("@flashbots/ethers-provider-bundle");
const dotenv = require("dotenv");
dotenv.config();

// -------- CONFIGURATION --------
const ETHEREUM_RPC = process.env.ETHEREUM_RPC || "https://mainnet.gateway.tenderly.co";
const FLASHBOTS_RELAY = "https://relay.flashbots.net";

const COMPROMISED_PRIVATE_KEY = process.env.COMPROMISED_PRIVATE_KEY;
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;

const REVOKE_TARGET_CONTRACT = "0xE51eD17a26A0e88c5CA7b962a2271deA4548Ca13";
const PRIORITY_GAS_PRICE = ethers.parseUnits("40", "gwei"); // 40 gwei

// -------- SCRIPT --------

async function main() {
    if (!COMPROMISED_PRIVATE_KEY || !SPONSOR_PRIVATE_KEY) {
        console.error("Please provide COMPROMISED_PRIVATE_KEY and SPONSOR_PRIVATE_KEY in your .env file");
        return;
    }

    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
    const sponsorWallet = new ethers.Wallet(SPONSOR_PRIVATE_KEY, provider);
    const compromisedWallet = new ethers.Wallet(COMPROMISED_PRIVATE_KEY, provider);

    console.log(`Sponsor address: ${sponsorWallet.address}`);
    console.log(`Compromised address: ${compromisedWallet.address}`);

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        sponsorWallet,
        FLASHBOTS_RELAY
    );

    const [blockNumber, feeData, sponsorNonce, compromisedNonce] = await Promise.all([
        provider.getBlockNumber(),
        provider.getFeeData(),
        provider.getTransactionCount(sponsorWallet.address),
        provider.getTransactionCount(compromisedWallet.address)
    ]);

    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        console.error("Could not fetch fee data from RPC. Check your ETHEREUM_RPC provider.");
        return;
    }
    
    console.log(`Current Block: ${blockNumber}`);
    console.log(`Gas Info: maxFeePerGas=${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} gwei`);

    // **FIX**: We manually convert all BigInt/number values to hexadecimal strings
    // to prevent JSON serialization errors.

    // Define gas limit as a BigInt for calculation
    const rescueGasLimit = ethers.toBigInt(50000);

    // Calculate the exact ETH needed to fund (using BigInts for safety)
    const gasCost = rescueGasLimit * feeData.maxFeePerGas;
    console.log(`Required funding for rescue tx: ${ethers.formatEther(gasCost)} ETH`);

    // 1. Define the Rescue Transaction (from compromised account)
    const rescueTx = {
        to: compromisedWallet.address,
        type: 2,
        nonce: ethers.toBeHex(compromisedNonce),
        maxFeePerGas: ethers.toBeHex(feeData.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(feeData.maxPriorityFeePerGas),
        gasLimit: ethers.toBeHex(rescueGasLimit),
        value: ethers.toBeHex(0), // No ETH is sent in the tx, only for gas
        data: "0x", // <-- !!! REPLACE THIS WITH YOUR ACTUAL CALLDATA !!!
    };
  const gasEstimates = [rescueTx.gasLimit];
  const gasEstimateTotal = gasEstimates.reduce((acc, cur) => acc + (cur), ethers.toBigInt(0));
    // 2. Define the Funding Transaction (from sponsor account)
    const fundingTx = {
        to: compromisedWallet.address,
        type: 2,
        chainId: 1,
        nonce: ethers.toBeHex(sponsorNonce),
        maxFeePerGas: ethers.toBeHex(feeData.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(feeData.maxPriorityFeePerGas),
        gasLimit: ethers.toBeHex(21000),
        value: ethers.toBeHex(gasCost), // Funding enough ETH to cover the rescue tx
    };

    // 3. Sign both transactions
    const signedTransactions = await Promise.all([
        sponsorWallet.signTransaction(fundingTx),
        compromisedWallet.signTransaction(rescueTx)
    ]);
    console.log("Transactions signed successfully.", signedTransactions);
    // 4. Create the Flashbots bundle
    const bundle = [
        { signedTransaction: signedTransactions[0] }, // funding tx
        { signedTransaction: signedTransactions[1] }  // rescue tx
    ];

    // 5. Simulate the bundle
    console.log("\nSimulating bundle...");
    try {
        const simulation = await flashbotsProvider.simulate(signedTransactions, blockNumber + 1);

        // if ("error" in simulation) {
        //     console.error("Simulation Error:", simulation.error.message);
        //     return;
        // } else if (simulation.results.length !== 2 || simulation.results[1].revert) {
        //     console.error("Simulation failed or rescue transaction reverted:", simulation.results);
        //     return;
        // }
        console.log("Simulation successful!", JSON.stringify(simulation, null, 2));
    } catch (e) {
        console.error("An error occurred during simulation:", e);
        return;
    }


    // 6. Send the bundle for the next 3 blocks
    console.log("\nSending bundle to Flashbots for the next 3 blocks...");
    for (let i = 1; i <= 3; i++) {
        const targetBlock = blockNumber + i;
        const bundleResponse = await flashbotsProvider.sendBundle(bundle, targetBlock);
        
        if ("error" in bundleResponse) {
            console.error(`Error sending bundle for block ${targetBlock}:`, bundleResponse.error.message);
            continue;
        }

        console.log(`Bundle submitted for block ${targetBlock}. Waiting for inclusion...`);
        const waitResponse = await bundleResponse.wait();
        console.log(`Wait response for block ${targetBlock}: ${waitResponse}`, FlashbotsBundleResolution[waitResponse]);

        if (waitResponse === FlashbotsBundleResolution.BundleIncluded) {
            console.log("✅ Bundle included! Your transaction has been executed.");
            const receipts = await bundleResponse.receipts();
            console.log("Transaction Receipts:", receipts);
            break; 
        } else if (waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
            console.log("Nonce too high, account may have been used. Exiting.");
            break;
        }
    }
    console.log("Script finished.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});