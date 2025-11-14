/**
 * Mock for api/action-cable module
 */

const performedActions = [];

const mockClient = {
  perform: jest.fn((action, data) => {
    performedActions.push({ action, data });
  }),
  getPerformedActions: () => performedActions,
  clearPerformedActions: () => {
    performedActions.length = 0;
  }
};

export const clientId = 'test-client-id';
export const task = 'test-task';

export default mockClient;
