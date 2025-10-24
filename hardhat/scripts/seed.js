import hre from 'hardhat';
import TicketingCoreModule from '../ignition/modules/TicketingCore.js';
import accounts from '../accounts.json';

console.log('=== Funding Test Accounts ===');
console.log(
  `Minting 1M tokens and approving unlimited spending for ${accounts.length} accounts...`
);

// Connect to network and get ethers instance
const connection = await hre.network.connect();
const { ethers } = connection;

const MINT_AMOUNT = ethers.parseUnits('1000000', 18); // 1 million tokens per account
const MAX_UINT256 = ethers.MaxUint256; // Unlimited approval

// Deploy the TicketingCore contract using Hardhat Ignition
// This will also deploy ConcurrentERC20 as a dependency
const { ticketingCore, token } = await connection.ignition.deploy(
  TicketingCoreModule
);

// Process accounts
let processedAccounts = 0;
for (const pk of accounts) {
  // Create wallets for this batch
  const wallet = new ethers.Wallet(pk, ethers.provider);
  // Mint tokens in parallel for this batch
  const tx1 = await token.mint(wallet.address, MINT_AMOUNT);
  await tx1.wait();
  // Approve unlimited spending in parallel for this batch
  const tx2 = await token.connect(wallet).approve(ticketingCore, MAX_UINT256);
  await tx2.wait();
  processedAccounts++;
  console.log(
    `  Processed ${processedAccounts}/${accounts.length} accounts...`
  );
}

console.log('✓ All test accounts funded and approved!');
