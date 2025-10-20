import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';

const accounts = [
  '5bb1315c3ffa654c89f1f8b27f93cb4ef6b0474c4797cf2eb40d1bdd98dc26e7',
  '2289ae919f03075448d567c9c4a22846ce3711731c895f1bea572cef25bb346f',
  '19c439237a1e2c86f87b2d31438e5476738dd67297bf92d752b16bdb4ff37aa2',
  '236c7b430c2ea13f19add3920b0bb2795f35a969f8be617faa9629bc5f6201f1',
  'c4fbe435d6297959b0e326e560fdfb680a59807d75e1dec04d873fcd5b36597b',
  'f91fcd0784d0b2e5f88ec3ba6fe57fa7ef4fbf2fe42a8fa0aaa22625d2147a7a',
  '630549dc7564f9789eb4435098ca147424bcde3f1c14149a5ab18e826868f337',
  '2a31c00f193d4071adf4e45abaf76d7222d4af87ab30a7a4f7bae51e28aceb0a',
  'a2ffe69115c1f2f145297a4607e188775a1e56907ca882b7c6def550f218fa84',
  'd9815a0fa4f31172530f17a6ae64bf5f00a3a651f3d6476146d2c62ae5527dc4',
  '134aea740081ac7e0e892ff8e5d0a763ec400fcd34bae70bcfe6dae3aceeb7f0',
];

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
    arcology: {
      type: 'http',
      url: 'http://arco.vps.webdock.cloud:8545',
      accounts,
      chainId: 118,
    },
  },
};
