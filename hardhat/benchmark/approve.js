import hre from 'hardhat';
import frontendUtil from '@arcologynetwork/frontend-util/utils/util';
import ProgressBar from 'progress';
import accounts from './accounts.json';
import TicketingCoreModule from '../ignition/modules/TicketingCore.js';

// Connect to network and get ethers instance (Hardhat v3)
const connection = await hre.network.connect();
const { ethers } = connection;

// Deploy contracts using Hardhat Ignition
const { ticketingCore, token } = await connection.ignition.deploy(
  TicketingCoreModule,
  { deploymentId: 'benchmark', displayUi: true }
);

const tokenAddress = await token.getAddress();
const ticketingCoreAddress = await ticketingCore.getAddress();

console.log('\n======Benchmark: Approve ConcurrentERC20 Token Spending======');
console.log(`Token address: ${tokenAddress}`);
console.log(`TicketingCore address: ${ticketingCoreAddress}`);
console.log(`Number of accounts: ${accounts.length}`);
console.log(`Approval amount: Unlimited (MaxUint256)`);
console.log('');

// Set up transaction output directory
const txbase = 'benchmark/txs';
frontendUtil.ensurePath(txbase);
const handle_approve = frontendUtil.newFile(txbase + '/02-approve.out');

console.log('======Generating approve transactions======');
const bar = new ProgressBar('Generating Tx data [:bar] :percent :etas', {
  total: 100,
  width: 40,
  complete: '*',
  incomplete: ' ',
});

const percent = accounts.length / 100;

// Generate transactions for each account
for (let i = 0; i < accounts.length; i++) {
  const pk = accounts[i];
  const wallet = new ethers.Wallet(pk, ethers.provider);

  // Generate approve transaction for unlimited spending
  const tx = await token
    .connect(wallet)
    .approve.populateTransaction(ticketingCoreAddress, ethers.MaxUint256);

  await frontendUtil.writePreSignedTxFile(handle_approve, wallet, tx);

  if (i > 0 && i % percent === 0) {
    bar.tick(1);
  }
}
bar.tick(1);

if (bar.complete) {
  console.log(
    `Transaction generation completed: ${accounts.length} approve transactions`
  );
  console.log(`Output file: ${txbase}/approve.out`);
  console.log('');
  console.log('Next step: Execute transactions with:');
  console.log(
    `npx arcology.net-tx-sender ${hre.network.config.url} ${txbase}/`
  );
}
