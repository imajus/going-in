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

console.log('\n=== Deploying TicketingCore (will deploy ConcurrentERC20 as dependency) ===');
// Deploy the TicketingCore contract using Hardhat Ignition
// This will also deploy ConcurrentERC20 as a dependency
const { ticketingCore, token } = await connection.ignition.deploy(TicketingCoreModule);

// Get contract addresses
const ticketingCoreAddress = await ticketingCore.getAddress();
const tokenAddress = await token.getAddress();

console.log('\n=== Deployment Summary ===');
console.log('TicketingCore deployed to:', ticketingCoreAddress);
console.log('ConcurrentERC20 (Payment Token) deployed to:', tokenAddress);

// Verify deployment by checking payment token
const paymentToken = await ticketingCore.paymentToken();
console.log('Payment token configured in TicketingCore:', paymentToken);

const chainId = (await ethers.provider.getNetwork()).chainId;
console.log('Chain ID:', String(chainId));

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
const ConcurrentERC721Factory = await ethers.getContractFactory('ConcurrentERC721');
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
console.log('Frontend can now import contract ABIs and addresses from ethereum-scaffold-contracts package');
