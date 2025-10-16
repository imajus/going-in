import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const ParallelLikeModule = buildModule('ParallelLikeModule', (m) => {
  const parallelLike = m.contract('ParallelLike');
  return { parallelLike };
});

export default ParallelLikeModule;
