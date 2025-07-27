import { ethers } from "ethers";
import {
    FlashbotsBundleProvider,
    FlashbotsBundleResolution,
} from "@flashbots/ethers-provider-bundle";
import dotenv from "dotenv";

dotenv.config();

const ETHEREUM_RPC = process.env.ETHEREUM_RPC || "https://mainnet.gateway.tenderly.co";
const FLASHBOTS_RELAY = "https://relay.flashbots.net";
const BLOCKS_IN_FUTURE = 2;

const COMPROMISED_PRIVATE_KEY = process.env.COMPROMISED_PRIVATE_KEY;
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
const COMPROMISED_ADDRESS = process.env.COMPROMISED_ADDRESS;
if (!COMPROMISED_PRIVATE_KEY || !SPONSOR_PRIVATE_KEY || !COMPROMISED_ADDRESS) {
    console.error("Please provide COMPROMISED_PRIVATE_KEY, SPONSOR_PRIVATE_KEY, and COMPROMISED_ADDRESS in your .env file");
    process.exit(1);
}
let gasFeeBoost = 3;

async function main() {
    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
    const sponsorWallet = new ethers.Wallet(SPONSOR_PRIVATE_KEY, provider);
    const compromisedWallet = new ethers.Wallet(COMPROMISED_PRIVATE_KEY, provider);
    
    console.log(`Sponsor address: ${sponsorWallet.address}`);
    console.log(`Compromised address: ${compromisedWallet.address}`);
    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        ethers.Wallet.createRandom()
    );


    console.log(`Ready to send bundle from sponsor → compromised → revoke`);
    let currentRetryCount = 0;


    provider.on("block", async (blockNumber) => {

        const targetBlock = blockNumber + BLOCKS_IN_FUTURE;
        console.log(`⏳ New block ${blockNumber}, targeting ${targetBlock}...`);
        const block = await provider.getBlock(blockNumber)

        const feeData = await provider.getFeeData();
        const currentGasFee = feeData.maxPriorityFeePerGas || ethers.utils.parseUnits("2", "gwei");
        const currentGasGwei = parseFloat(ethers.formatUnits(currentGasFee, "gwei"));

        console.log(`⛽ Current gas price: ${currentGasGwei.toFixed(2)} GWEI`);
        console.log(`⛽ Initial gas boost: +${gasFeeBoost} GWEI`);
        const gasBoostForThisAttempt = gasFeeBoost + Math.floor(currentRetryCount / 2);
        const gasGwei = parseFloat(ethers.formatUnits(currentGasFee, "gwei")) + gasBoostForThisAttempt;
        const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, BLOCKS_IN_FUTURE);
        const maxFeePerGas = ethers.parseUnits(gasGwei.toString(), "gwei") + maxBaseFeeInFutureBlock;
        const maxPriorityFeePerGas =  ethers.parseUnits(gasGwei.toString(), "gwei");
        console.log(`⛽ Target gas price: ${gasGwei.toFixed(2)} GWEI (boosted by ${gasFeeBoost} GWEI)`);
        console.log(`⛽ Max Fee Per Gas: ${ethers.formatUnits(maxFeePerGas, "gwei")} GWEI`);
        console.log(`⛽ Max Priority Fee Per Gas: ${ethers.formatUnits(maxPriorityFeePerGas, "gwei")} GWEI`);
        // const ethNeeded = totalGasLimit.mul(maxFeePerGas);
        const ethNeeded = ethers.parseUnits("0.003", "ether"); // 0.01 ETH for funding

        // const fundingTx = await sponsorWallet.populateTransaction({
        //     to: COMPROMISED_ADDRESS,
        //     value: ethNeeded, // enough for the rescue tx
        //     gasLimit: 21000n,
        //     maxFeePerGas,
        //     maxPriorityFeePerGas,
        //     nonce: await provider.getTransactionCount(sponsorWallet.address),
        //     chainId: 1,
        //     type: 2,
        // });
        const fundingTx = {
            to: COMPROMISED_ADDRESS,
            value: ethNeeded, // enough for the rescue tx
            gasLimit: 21000n,
            maxFeePerGas,
            maxPriorityFeePerGas,
            nonce: await provider.getTransactionCount(sponsorWallet.address),
            chainId: 1,
            type: 2,
        };

        // const revokeTx = await compromisedWallet.populateTransaction({
        //     to: COMPROMISED_ADDRESS, // or some actual contract
        //     data: "0x", // your calldata goes here
        //     value: 0,
        //     gasLimit: 50000n,
        //     maxFeePerGas,
        //     maxPriorityFeePerGas,
        //     nonce: await provider.getTransactionCount(compromisedWallet.address),
        //     chainId: 1,
        //     type: 2,
        // });
        const revokeTx = {
            to: COMPROMISED_ADDRESS, // or some actual contract
            data: "0x", // your calldata goes here
            value: 0,
            gasLimit: 91170n,
            maxFeePerGas,
            maxPriorityFeePerGas,
            nonce: await provider.getTransactionCount(compromisedWallet.address),
            chainId: 1,
            type: 2,
        };


        const signedFundingTx = await sponsorWallet.signTransaction(fundingTx);
        const signedRevokeTx = await compromisedWallet.signTransaction(revokeTx);

        const signedBundle = await flashbotsProvider.signBundle([
            { signedTransaction: signedFundingTx },
            { signedTransaction: signedRevokeTx },
        ]);

        const simulation1 = await flashbotsProvider.simulate(
            [
                signedFundingTx,
                signedRevokeTx
            ],
            targetBlock
        );
        console.log(`Simulation result for block ${targetBlock}:`, simulation1);

        // if ("error" in simulation) {
        //     console.error(`❌ Simulation Error:`, simulation.error.message);
        //     // return;
        // }

        // const bundleResponse = await flashbotsProvider.sendBundle(
        //     [
        //         { signedTransaction: signedFundingTx },
        //         { signedTransaction: signedRevokeTx },
        //     ],
        //     targetBlock
        // );

        const bundleResponse = await flashbotsProvider.sendBundle(
            [
                {
                    transaction: fundingTx,
                    signer: sponsorWallet,
                },
                {
                    transaction: revokeTx,
                    signer: compromisedWallet,
                }
            ],
            targetBlock
        );

        const simulation = await bundleResponse.simulate();
        console.log(`Simulation result for block ${targetBlock}:`, simulation);

        if ("error" in bundleResponse) {
            console.error(`❌ Flashbots Error:`, bundleResponse.error.message);
            process.exit(1);
        }

        console.log(`🚀 Bundle sent for block ${targetBlock}`);

        const result = await bundleResponse.wait();
        console.log(`Bundle wait result for block ${targetBlock}:`, result);
        if (result === FlashbotsBundleResolution.BundleIncluded) {
            console.log(`✅ Bundle INCLUDED in block ${targetBlock}`);
            process.exit(0);
        } else if (result === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
            console.log(`⚠️ Not included in block ${targetBlock}, retrying...`);
        } else if (result === FlashbotsBundleResolution.AccountNonceTooHigh) {
            console.error(`❌ Nonce too high, exiting`);
            process.exit(1);
        }
        currentRetryCount++;
    });
}

main();