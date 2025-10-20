import hre from 'hardhat';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import ParallelLikeModule from '../ignition/modules/ParallelLike.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Deploying ParallelLike contract to Arcology network...');

// Connect to network and get ethers instance
const connection = await hre.network.connect();
const { ethers } = connection;

// Get the deployer signer
const [deployer] = await ethers.getSigners();
console.log('Deploying with account:', deployer.address);

// Get account balance
const balance = await ethers.provider.getBalance(deployer.address);
console.log('Account balance:', ethers.formatEther(balance), 'ETH');

// Deploy the ParallelLike contract using Hardhat Ignition
const { parallelLike } = await connection.ignition.deploy(ParallelLikeModule);

// Get contract address (assuming getAddress() method exists on deployed instance)
const contractAddress = await parallelLike.getAddress();
console.log('ParallelLike deployed to:', contractAddress);

// Verify deployment by calling getTotal()
const totalLikes = await parallelLike.getTotal();
console.log('Initial total likes:', totalLikes.toString());

console.log('\nDeployment complete!');
console.log('Contract address:', contractAddress);
const chainId = (await ethers.provider.getNetwork()).chainId;
console.log('Chain ID:', String(chainId));

// Extract ABI directly from the deployed contract instance
const deploymentData = {
  address: contractAddress,
  abi: JSON.parse(parallelLike.interface.formatJson()),
  chainId: Number(chainId),
  deployedAt: new Date().toISOString(),
};

// Write to dist/ParallelLike.json
const distDir = join(__dirname, '..', 'dist');
mkdirSync(distDir, { recursive: true });

const outputPath = join(distDir, 'ParallelLike.json');
writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

console.log('\nDeployment data saved to:', outputPath);
