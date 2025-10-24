import { sampleSize } from 'lodash-es';
import accounts from './accounts.json';

// Auto-import all deployment JSON files from dist folder
const deploymentModules = import.meta.glob('./dist/*.json', {
  eager: true,
  import: 'default',
});

// Build contracts object from imported deployment files
// Each file contains: { address, abi, chainId, network, deployedAt }
const contracts = {};

for (const path in deploymentModules) {
  // Extract contract name from path: './dist/ParallelLike.json' -> 'ParallelLike'
  const match = path.match(/\/([^/]+)\.json$/);
  if (match) {
    const contractName = match[1];
    const deploymentData = deploymentModules[path];
    contracts[contractName] = {
      address: deploymentData.address,
      abi: deploymentData.abi,
    };
  }
}

export function getDeployments() {
  return contracts;
}

/**
 * Get a specific contract by name
 * @param {string} contractName - The name of the contract
 * @returns {Object|null} Contract object with address and abi, or null if not found
 */
export function getDeployment(contractName) {
  return contracts[contractName] || null;
}

/**
 * Get all contract names
 * @returns {string[]} Array of contract names
 */
export function getDeploymentNames() {
  return Object.keys(contracts);
}

/**
 * Get random sample of account private keys
 * @param {number} num - Number of random accounts to return
 * @returns {string[]} Array of private key strings
 */
export function getSampleAccounts(num) {
  return sampleSize(accounts, num);
}
