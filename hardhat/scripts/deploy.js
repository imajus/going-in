import hre from 'hardhat';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import TicketingCoreModule from '../ignition/modules/TicketingCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Deploying Going-In Ticketing System to Arcology network...');

// Connect to network and get ethers instance
const connection = await hre.network.connect();
const { ethers } = connection;

// Get the deployer signer
const [deployer] = await ethers.getSigners();
console.log('Deploying with account:', deployer.address);

// Get account balance
const balance = await ethers.provider.getBalance(deployer.address);
console.log('Account balance:', ethers.formatEther(balance), 'ETH');

console.log(
  '\n=== Deploying TicketingCore (will deploy ConcurrentERC20 as dependency) ==='
);
// Deploy the TicketingCore contract using Hardhat Ignition
// This will also deploy ConcurrentERC20 as a dependency
const { ticketingCore, token } = await connection.ignition.deploy(
  TicketingCoreModule
);

// Get contract addresses
const ticketingCoreAddress = await ticketingCore.getAddress();
const tokenAddress = await token.getAddress();

console.log('\n=== Deployment Summary ===');
console.log('TicketingCore deployed to:', ticketingCoreAddress);
console.log('ConcurrentERC20 (Payment Token) deployed to:', tokenAddress);

// Verify deployment by checking payment token
const paymentToken = await ticketingCore.paymentToken();
console.log('Payment token configured in TicketingCore:', paymentToken);

const { chainId } = await ethers.provider.getNetwork();
const latestBlock = await ethers.provider.getBlockNumber();
const { timestamp } = await ethers.provider.getBlock(latestBlock);
console.log('Chain ID:', String(chainId));
console.log('Latest block:', String(latestBlock));
console.log('Timestamp:', String(timestamp));

console.log('\n=== Seeding Sample Events ===');

// Event 1: Ethereum Global Summit 2025 - Tech Conference
// December 24, 2025 at 10:00 AM UTC (Unix: 1735034400)
const event1Tiers = [
  {
    name: 'Early Bird',
    capacity: 500n,
    price: ethers.parseEther('50'), // 50 tokens
  },
  {
    name: 'General Admission',
    capacity: 2000n,
    price: ethers.parseEther('100'), // 100 tokens
  },
  {
    name: 'VIP Pass',
    capacity: 100n,
    price: ethers.parseEther('500'), // 500 tokens
  },
];

console.log('Creating Event 1: Ethereum Global Summit 2025...');
const tx1 = await ticketingCore.createEvent(
  'Ethereum Global Summit 2025',
  'San Francisco Convention Center',
  timestamp + 60 * 60 * 24 * 12, // in 1 year
  event1Tiers
);
await tx1.wait();
console.log('✓ Event 1 created (Transaction:', tx1.hash, ')');

// Event 2: The Weekend World Tour - Concert
// February 19, 2026 at 8:00 PM UTC (Unix: 1740081600)
const event2Tiers = [
  {
    name: 'Nosebleed',
    capacity: 5000n,
    price: ethers.parseEther('75'), // 75 tokens
  },
  {
    name: 'Floor Section',
    capacity: 1000n,
    price: ethers.parseEther('200'), // 200 tokens
  },
  {
    name: 'VIP Meet & Greet',
    capacity: 50n,
    price: ethers.parseEther('1500'), // 1500 tokens
  },
];

console.log('Creating Event 2: The Weekend World Tour...');
const tx2 = await ticketingCore.createEvent(
  'The Weekend World Tour',
  'Madison Square Garden, New York',
  timestamp + 60 * 60 * 24 * 12, // in 1 year
  event2Tiers
);
await tx2.wait();
console.log('✓ Event 2 created (Transaction:', tx2.hash, ')');

// Event 3: Champions League Final - Sports Event
// April 16, 2026 at 7:00 PM UTC (Unix: 1744912800)
const event3Tiers = [
  {
    name: 'Upper Tier',
    capacity: 10000n,
    price: ethers.parseEther('100'), // 100 tokens
  },
  {
    name: 'Lower Tier',
    capacity: 3000n,
    price: ethers.parseEther('300'), // 300 tokens
  },
  {
    name: 'Club Seats',
    capacity: 500n,
    price: ethers.parseEther('800'), // 800 tokens
  },
];

console.log('Creating Event 3: Champions League Final...');
const tx3 = await ticketingCore.createEvent(
  'Champions League Final',
  'Wembley Stadium, London',
  timestamp + 60 * 60 * 24 * 12, // in 1 year
  event3Tiers
);
await tx3.wait();
console.log('✓ Event 3 created (Transaction:', tx3.hash, ')');

console.log('\n✓ All 3 sample events created successfully!');

// Prepare dist directory
const distDir = join(__dirname, '..', 'dist');
mkdirSync(distDir, { recursive: true });

// Save TicketingCore deployment data
const ticketingCoreData = {
  address: ticketingCoreAddress,
  abi: JSON.parse(ticketingCore.interface.formatJson()),
  chainId: Number(chainId),
  deployedAt: new Date().toISOString(),
};

const ticketingCorePath = join(distDir, 'TicketingCore.json');
writeFileSync(ticketingCorePath, JSON.stringify(ticketingCoreData, null, 2));
console.log('\nTicketingCore deployment data saved to:', ticketingCorePath);

// Save ConcurrentERC20 deployment data
const erc20Data = {
  address: tokenAddress,
  abi: JSON.parse(token.interface.formatJson()),
  chainId: Number(chainId),
  deployedAt: new Date().toISOString(),
};

const erc20Path = join(distDir, 'ConcurrentERC20.json');
writeFileSync(erc20Path, JSON.stringify(erc20Data, null, 2));
console.log('ConcurrentERC20 deployment data saved to:', erc20Path);

// Also export ConcurrentERC721 ABI (for dynamically created tier NFT contracts)
// We need to get the ABI from the contract factory
const ConcurrentERC721Factory = await ethers.getContractFactory(
  'ConcurrentERC721'
);
const erc721Abi = JSON.parse(ConcurrentERC721Factory.interface.formatJson());

const erc721Data = {
  address: null, // NFT contracts are created dynamically per tier
  abi: erc721Abi,
  chainId: Number(chainId),
  deployedAt: new Date().toISOString(),
  note: 'NFT contracts are deployed dynamically by TicketingCore for each event tier',
};

const erc721Path = join(distDir, 'ConcurrentERC721.json');
writeFileSync(erc721Path, JSON.stringify(erc721Data, null, 2));
console.log('ConcurrentERC721 ABI saved to:', erc721Path);

console.log('\n=== Deployment Complete! ===');
console.log('All deployment data exported to hardhat/dist/ directory');
console.log(
  'Frontend can now import contract ABIs and addresses from ethereum-scaffold-contracts package'
);
