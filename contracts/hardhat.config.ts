require('dotenv').config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
    defaultNetwork: "sepolia",
    etherscan:{
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
    sourcify: {
      enabled: true
    },
    networks: {
      hardhat: {
      },
      sepolia: {
        chainId: 84532,
        url: "https://base-sepolia.g.alchemy.com/v2/a-OpOV_vIsDB5YpKzCcX58joIMNvMWSs",
        accounts: {
          mnemonic: process.env.MNEMONIC,
          path: "m/44'/60'/0'/0",
          initialIndex: 0,
          count: 20,
          passphrase: "",
        }
      },
      mainnet: {
        chainId:8453,
        url: "https://base-mainnet.g.alchemy.com/v2/a-OpOV_vIsDB5YpKzCcX58joIMNvMWSs",
        accounts: {
          mnemonic: process.env.MNEMONIC,
          path: "m/44'/60'/0'/0",
          initialIndex: 0,
          count: 20,
          passphrase: "",
        }
      
      }
    },
    solidity: {
      version: "0.8.28",
      settings: {
        optimizer: {
          enabled: true,
          runs: 100
        },
        viaIR: true,
      }
    },
    paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
    },
    mocha: {
      timeout: 40000
    },
    typechain: {
      outDir: "typechain-types",
      target: "ethers-v6",
    }
  }
export default config;