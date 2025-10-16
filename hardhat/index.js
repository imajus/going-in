// Auto-import all ABIs using Vite's glob import feature
const abiModules = import.meta.glob('./abi/*.json', {
  eager: true,
  import: 'default',
});

// Auto-import all deployment files across all chains
const deploymentModules = import.meta.glob(
  './ignition/deployments/chain-*/deployed_addresses.json',
  {
    eager: true,
    import: 'default',
  }
);

// Build ABIs object from imported modules
export const abis = {};
for (const path in abiModules) {
  // Extract contract name from path: './abi/NFTMarketplace.json' -> 'NFTMarketplace'
  const match = path.match(/\/([^/]+)\.json$/);
  if (match) {
    const contractName = match[1];
    abis[contractName] = abiModules[path];
  }
}

// Build deployments object from imported modules
const deployments = {};
for (const path in deploymentModules) {
  // Extract chain ID from path: './ignition/deployments/chain-31337/...' -> '31337'
  const match = path.match(/chain-(\d+)/);
  if (match) {
    const chainId = match[1];
    deployments[chainId] = deploymentModules[path];
  }
}

/**
 * Get contract deployments for a specific chain
 * @param {string|number} chainId - The chain ID to get deployments for
 * @returns {Object} Object mapping contract names to their deployment info
 */
export function getDeployments(chainId) {
  const addresses = deployments[String(chainId)] || {};
  const contracts = {};

  // Build deployment info for each contract
  for (const contractName in abis) {
    // Try to find deployment address using common naming patterns
    // Pattern 1: ContractNameModule#ContractName (Hardhat Ignition default)
    const moduleKey = `${contractName}Module#${contractName}`;
    // Pattern 2: Just the contract name
    const directKey = contractName;

    contracts[contractName] = {
      abi: abis[contractName],
      address: addresses[moduleKey] || addresses[directKey] || null,
      name: contractName,
      description: `${contractName} contract`,
    };
  }

  return contracts;
}
