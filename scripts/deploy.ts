import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy PatentRegistry
  const PatentRegistry = await ethers.getContractFactory("PatentRegistry");
  const registry = await PatentRegistry.deploy();
  await registry.waitForDeployment();
  console.log("PatentRegistry deployed to:", await registry.getAddress());

  // Deploy PatentFactory
  const PatentFactory = await ethers.getContractFactory("PatentFactory");
  const factory = await PatentFactory.deploy(await registry.getAddress());
  await factory.waitForDeployment();
  console.log("PatentFactory deployed to:", await factory.getAddress());

  // Deploy PatentStaking
  const PatentStaking = await ethers.getContractFactory("PatentStaking");
  const staking = await PatentStaking.deploy(await factory.getAddress());
  await staking.waitForDeployment();
  console.log("PatentStaking deployed to:", await staking.getAddress());

  // Print all addresses in format ready to copy
  console.log("\nContract Addresses:");
  console.log("===================");
  console.log(`export const CONTRACT_ADDRESSES = {`);
  console.log(`  PatentRegistry: "${await registry.getAddress()}",`);
  console.log(`  PatentFactory: "${await factory.getAddress()}",`);
  console.log(`  PatentStaking: "${await staking.getAddress()}"`);
  console.log(`};`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });