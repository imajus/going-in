import { network } from 'hardhat';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to Arcology network and get ethers instance
const { ethers } = await network.connect();

console.log('Deploying ParallelLike contract to Arcology network...');

// Get the deployer signer
const [deployer] = await ethers.getSigners();
console.log('Deploying with account:', deployer.address);

// Get account balance
const balance = await ethers.provider.getBalance(deployer.address);
console.log('Account balance:', ethers.formatEther(balance), 'ETH');

// Deploy the ParallelLike contract
const ParallelLike = await ethers.getContractFactory('ParallelLike');
const parallelLike = await ParallelLike.deploy();

// Wait for deployment to complete
await parallelLike.waitForDeployment();

const contractAddress = await parallelLike.getAddress();
console.log('ParallelLike deployed to:', contractAddress);

// Verify deployment by calling getTotal()
const totalLikes = await parallelLike.getTotal();
console.log('Initial total likes:', totalLikes.toString());

console.log('\nDeployment complete!');
console.log('Contract address:', contractAddress);
const chainId = (await ethers.provider.getNetwork()).chainId;
console.log('Chain ID:', String(chainId));

// Combine contract ABI and deployment address
const contractArtifact = await import(
  '../artifacts/contracts/ParallelLike.sol/ParallelLike.json',
  {
    assert: { type: 'json' },
  }
);

const deploymentData = {
  address: contractAddress,
  abi: contractArtifact.default.abi,
  chainId: Number(chainId),
  network: network.name,
  deployedAt: new Date().toISOString(),
};

// Write to dist/ParallelLike.json
const distDir = join(__dirname, '..', 'dist');
mkdirSync(distDir, { recursive: true });

const outputPath = join(distDir, 'ParallelLike.json');
writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));

console.log('\nDeployment data saved to:', outputPath);
