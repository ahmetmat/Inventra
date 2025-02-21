import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy PatentRegistry
  const PatentRegistry = await ethers.getContractFactory("PatentRegistry");
  const registry = await PatentRegistry.deploy();
  await registry.waitForDeployment();  // <- Burada değişiklik yaptık
  console.log("PatentRegistry deployed to:", await registry.getAddress());

  // Deploy PatentFactory
  const PatentFactory = await ethers.getContractFactory("PatentFactory");
  const factory = await PatentFactory.deploy(await registry.getAddress());
  await factory.waitForDeployment();  // <- Burada değişiklik yaptık
  console.log("PatentFactory deployed to:", await factory.getAddress());

  // Contract addresses'leri kaydet
  console.log("\nContract Addresses:");
  console.log("===================");
  console.log(`export const CONTRACT_ADDRESSES = {`);
  console.log(`  registry: "${await registry.getAddress()}",`);
  console.log(`  factory: "${await factory.getAddress()}"`);
  console.log(`};`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });