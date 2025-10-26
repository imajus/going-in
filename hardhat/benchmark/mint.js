import hre from 'hardhat';
import frontendUtil from '@arcologynetwork/frontend-util/utils/util';
import ProgressBar from 'progress';
import accounts from './accounts.json';
import TicketingCoreModule from '../ignition/modules/TicketingCore.js';

// Connect to network and get ethers instance (Hardhat v3)
const connection = await hre.network.connect();
const { ethers } = connection;

// Deploy contracts using Hardhat Ignition
const { token } = await connection.ignition.deploy(TicketingCoreModule, {
  deploymentId: 'benchmark',
  displayUi: true,
});

const tokenAddress = await token.getAddress();

console.log('\n======Benchmark: Mint ConcurrentERC20 Tokens======');
console.log(`Token address: ${tokenAddress}`);
console.log(`Number of accounts: ${accounts.length}`);
console.log(`Amount per account: 1,000,000 tokens (1e24 wei)`);
console.log('');

// Set up transaction output directory
const txbase = 'benchmark/txs';
frontendUtil.ensurePath(txbase);
const handle_mint = frontendUtil.newFile(txbase + '/01-mint.out');

console.log('======Generating mint transactions======');
const bar = new ProgressBar('Generating Tx data [:bar] :percent :etas', {
  total: 100,
  width: 40,
  complete: '*',
  incomplete: ' ',
});

const percent = accounts.length / 100;
const mintAmount = ethers.parseUnits('1000000', 18); // 1M tokens with 18 decimals

// Generate transactions for each account
for (let i = 0; i < accounts.length; i++) {
  const pk = accounts[i];
  const wallet = new ethers.Wallet(pk, ethers.provider);
  const accountAddress = wallet.address;

  // Generate mint transaction
  const tx = await token
    .connect(wallet)
    .mint.populateTransaction(accountAddress, mintAmount);

  await frontendUtil.writePreSignedTxFile(handle_mint, wallet, tx);

  if (i > 0 && i % percent === 0) {
    bar.tick(1);
  }
}
bar.tick(1);

if (bar.complete) {
  console.log(
    `Transaction generation completed: ${accounts.length} mint transactions`
  );
  console.log(`Total tokens to mint: ${accounts.length * 1_000_000} tokens`);
  console.log(`Output file: ${txbase}/mint.out`);
  console.log('');
  console.log('Next step: Execute transactions with:');
  console.log(
    `npx arcology.net-tx-sender ${hre.network.config.url} ${txbase}/`
  );
}
