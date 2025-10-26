import hre from 'hardhat';
import frontendUtil from '@arcologynetwork/frontend-util/utils/util';
import ProgressBar from 'progress';
import accounts from './accounts.json';
import TicketingCoreModule from '../ignition/modules/TicketingCore.js';

// Connect to network and get ethers instance (Hardhat v3)
const connection = await hre.network.connect();
const { ethers } = connection;

// Get deployer signer for event creation
const [deployer] = await ethers.getSigners();

// Deploy contracts using Hardhat Ignition
const { ticketingCore } = await connection.ignition.deploy(
  TicketingCoreModule,
  { deploymentId: 'benchmark', displayUi: true }
);

console.log('\n======Benchmark: Purchase Tickets======');
console.log(`TicketingCore address: ${await ticketingCore.getAddress()}`);
console.log(`Number of accounts: ${accounts.length}`);
console.log('');

// Create a test event with large capacity for benchmarking
console.log('======Creating test event for benchmark======');
const eventTimestamp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
const tierCapacity = accounts.length; // Capacity = number of test accounts
const ticketPrice = ethers.parseUnits('10', 18); // 10 tokens per ticket

const tierConfigs = [
  {
    name: 'General Admission',
    capacity: tierCapacity,
    price: ticketPrice,
  },
];

const createTx = await ticketingCore
  .connect(deployer)
  .createEvent(
    'Benchmark Test Event',
    'Arcology Network',
    eventTimestamp,
    tierConfigs
  );
const receipt = await createTx.wait();

// Extract eventId from EventCreated event
const eventCreatedEvent = receipt.logs.find(
  (log) =>
    log.topics[0] === ticketingCore.interface.getEvent('EventCreated').topicHash
);
const eventId = BigInt(eventCreatedEvent.topics[1]);

console.log(`✓ Test event created with ID: ${eventId}`);
console.log(`  Tier capacity: ${tierCapacity} tickets`);
console.log(`  Ticket price: ${ethers.formatUnits(ticketPrice, 18)} tokens`);
console.log('');

// Set up transaction output directory
const txbase = 'benchmark/txs';
frontendUtil.ensurePath(txbase);
const handle_purchase = frontendUtil.newFile(txbase + '/03-purchase.out');

console.log('======Generating purchase transactions======');
const bar = new ProgressBar('Generating Tx data [:bar] :percent :etas', {
  total: 100,
  width: 40,
  complete: '*',
  incomplete: ' ',
});

const percent = accounts.length / 100;
const tierIdx = 0; // First tier (General Admission)

// Generate transactions for each account
for (let i = 0; i < accounts.length; i++) {
  const pk = accounts[i];
  const wallet = new ethers.Wallet(pk, ethers.provider);

  // Generate purchaseTicket transaction
  const tx = await ticketingCore
    .connect(wallet)
    .purchaseTicket.populateTransaction(eventId, tierIdx);

  await frontendUtil.writePreSignedTxFile(handle_purchase, wallet, tx);

  if (i > 0 && i % percent === 0) {
    bar.tick(1);
  }
}
bar.tick(1);

if (bar.complete) {
  console.log(
    `Transaction generation completed: ${accounts.length} purchase transactions`
  );
  console.log(`Event ID: ${eventId}`);
  console.log(`Output file: ${txbase}/purchase.out`);
  console.log('');
  console.log('Next step: Execute transactions with:');
  console.log(
    `npx arcology.net-tx-sender ${hre.network.config.url} ${txbase}/`
  );
  console.log('');
  console.log(
    'This will test parallel ticket purchases - all accounts buying simultaneously!'
  );
}
