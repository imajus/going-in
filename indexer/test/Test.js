
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, ConcurrentERC20 } = TestHelpers;

describe("ConcurrentERC20 contract Approval event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ConcurrentERC20 contract Approval event
  const event = ConcurrentERC20.Approval.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ConcurrentERC20_Approval is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ConcurrentERC20.Approval.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualConcurrentERC20Approval = mockDbUpdated.entities.ConcurrentERC20_Approval.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedConcurrentERC20Approval = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      owner: event.params.owner,
      spender: event.params.spender,
      value: event.params.value,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualConcurrentERC20Approval,
      expectedConcurrentERC20Approval,
      "Actual ConcurrentERC20Approval should be the same as the expectedConcurrentERC20Approval"
    );
  });
});
