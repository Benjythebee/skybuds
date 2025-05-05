import { ethers, network, run } from "hardhat";
import { SkyBuds } from "../typechain-types";

async function main() {
  console.log(`Deploying SkyBuds contract to ${network.name}...`);

  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with account: ${deployer.address}`);
    console.log(`Account balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

    // Deploy the contract
    const SkyBudsFactory = await ethers.getContractFactory("SkyBuds");
    const skyBuds = await SkyBudsFactory.deploy();
    
    // Wait for deployment to complete
    await skyBuds.waitForDeployment();
    const skyBudsAddress = await skyBuds.getAddress();
    
    console.log(`SkyBuds deployed to: ${skyBudsAddress}`);
    
    // Verify the contract on Etherscan (for public networks excluding localhost and hardhat)
    if (network.name !== "localhost" && network.name !== "hardhat") {
      console.log("Waiting for block confirmations...");
      
      // Wait for 6 block confirmations to ensure the contract is mined
      await skyBuds.deploymentTransaction()?.wait(6);
      
      console.log("Verifying contract on Etherscan...");
      try {
        await run("verify:verify", {
          address: skyBudsAddress,
          constructorArguments: [],
        });
        console.log("Contract verified on Etherscan!");
      } catch (error: any) {
        if (error.message.includes("already verified")) {
          console.log("Contract is already verified!");
        } else {
          console.error("Error verifying contract:", error);
        }
      }
    }
    
    // Log deployment information for future reference
    console.log("\nDeployment Summary:");
    console.log("--------------------");
    console.log(`Network: ${network.name}`);
    console.log(`Contract Address: ${skyBudsAddress}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Deployment Timestamp: ${new Date().toISOString()}`);
    
    return skyBudsAddress;
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Execute the deployment function
main()
  .then((address) => {
    console.log(`Deployment completed successfully! Contract address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment script failed:", error);
    process.exit(1);
  });