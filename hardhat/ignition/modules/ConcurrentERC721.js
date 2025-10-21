import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const ConcurrentERC721Module = buildModule('ConcurrentERC721Module', (m) => {
  // Parameters with defaults
  const name = m.getParameter('name', 'Test NFT');
  const symbol = m.getParameter('symbol', 'TNFT');

  const nft = m.contract('ConcurrentERC721', [name, symbol]);

  return { nft };
});

export default ConcurrentERC721Module;
