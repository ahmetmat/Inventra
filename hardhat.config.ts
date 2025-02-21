import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-gas-reporter";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      // Stack too deep için ek ayarlar
      evmVersion: "paris"
    }
  },
  networks: {
    hardhat: {
      chainId: 88817
    },
    unit0: {
      url: " https://rpc-testnet.unit0.dev",
      accounts: ["8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"],
      chainId: 88817
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "UNIT0"
  }
};

export default config;