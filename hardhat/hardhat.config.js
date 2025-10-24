import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';
import accounts from './accounts.json';

const DEPLOYER_KEY =
  '5bb1315c3ffa654c89f1f8b27f93cb4ef6b0474c4797cf2eb40d1bdd98dc26e7';

/** @type {import('hardhat/dist/src/types/config').HardhatConfig} */
export default {
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
      {
        version: '0.4.18',
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    ],
    overrides: {
      'contracts/WETH9.sol': {
        version: '0.4.18',
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    },
  },
  plugins: [hardhatToolboxMochaEthers],
  defaultNetwork: 'arcology',
  networks: {
    devnet: {
      type: 'http',
      url: 'http://localhost:8545',
      accounts: [DEPLOYER_KEY, ...accounts],
      chainId: 118,
    },
    testnet: {
      type: 'http',
      url: 'https://arcology.majus.app',
      accounts: [DEPLOYER_KEY, ...accounts],
      chainId: 118,
    },
  },
};
