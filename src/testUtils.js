/**
 * Test utilities for integration tests
 */
import mockApi from './__mocks__/api/action-cable';

/**
 * Get all actions performed on the API
 */
export const getPerformedActions = () => {
  return mockApi.getPerformedActions();
};

/**
 * Clear all performed actions (useful for test cleanup)
 */
export const clearPerformedActions = () => {
  mockApi.clearPerformedActions();
};

/**
 * Find an action by name in performed actions
 */
export const findAction = (actionName) => {
  return getPerformedActions().find(action => action.action === actionName);
};

/**
 * Find all actions by name in performed actions
 */
export const findAllActions = (actionName) => {
  return getPerformedActions().filter(action => action.action === actionName);
};

// For backward compatibility with ActionCable mock utilities
export const simulateServerMessage = (data) => {
  // This would be used if we need to simulate server messages
  // Not implemented for API mock approach
};

export const getSubscription = () => {
  // For backward compatibility
  return null;
};

export const simulateConnected = () => {
  // For backward compatibility
};

export const simulateDisconnected = () => {
  // For backward compatibility
};

export const simulateRejected = () => {
  // For backward compatibility
};
