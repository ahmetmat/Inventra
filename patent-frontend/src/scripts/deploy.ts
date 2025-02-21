// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  try {
    // Deploy PatentRegistry
    console.log("\nDeploying PatentRegistry...");
    const PatentRegistry = await hre.ethers.getContractFactory("PatentRegistry");
    const registry = await PatentRegistry.deploy();
    await registry.deployed();
    console.log("PatentRegistry deployed to:", registry.address);

    // Deploy PatentFactory
    console.log("\nDeploying PatentFactory...");
    const PatentFactory = await hre.ethers.getContractFactory("PatentFactory");
    const factory = await PatentFactory.deploy(registry.address);
    await factory.deployed();
    console.log("PatentFactory deployed to:", factory.address);

    // Deploy PatentStaking with factory address
        // Deploy PatentStaking
        console.log("\nDeploying PatentStaking...");
        const PatentStaking = await hre.ethers.getContractFactory("PatentStaking");
        const staking = await PatentStaking.deploy(factory.address);
        await staking.deployed();
        console.log("PatentStaking deployed to:", staking.address);

    // Contract addresses
    console.log("\nContract Addresses:");
    console.log("===================");
    console.log(`export const CONTRACT_ADDRESSES = {`);
    console.log(`  PatentRegistry: "${registry.address}",`);
    console.log(`  PatentFactory: "${factory.address}",`);
    console.log(`  PatentStaking: "${staking.address}"`);
    console.log(`};`);

  } catch (error) {
    console.error("\nDeployment failed!");
    console.error("Error details:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });