/**
 * Mock ActionCable implementation for testing
 * This mocks the ActionCable consumer and subscription
 */

class MockSubscription {
  constructor(params, callbacks) {
    this.params = params;
    this.callbacks = callbacks;
    this.performedActions = [];
    
    // Store callbacks for later use
    this.connected = callbacks.connected;
    this.disconnected = callbacks.disconnected;
    this.rejected = callbacks.rejected;
    this.received = callbacks.received;
  }

  perform(action, data) {
    // Store the performed action for assertions
    this.performedActions.push({ action, data });
  }

  simulateConnected() {
    if (this.connected) {
      this.connected();
    }
  }

  simulateDisconnected() {
    if (this.disconnected) {
      this.disconnected();
    }
  }

  simulateRejected() {
    if (this.rejected) {
      this.rejected();
    }
  }

  simulateReceived(data) {
    if (this.received) {
      this.received(data);
    }
  }

  getPerformedActions() {
    return this.performedActions;
  }

  clearPerformedActions() {
    this.performedActions = [];
  }
}

class MockConsumer {
  constructor() {
    this.subscriptions = {
      subscriptionInstances: [],
      create: (params, callbacks) => {
        const subscription = new MockSubscription(params, callbacks);
        this.subscriptions.subscriptionInstances.push(subscription);
        return subscription;
      }
    };
  }

  getSubscriptions() {
    return this.subscriptions.subscriptionInstances;
  }

  getLastSubscription() {
    const subs = this.subscriptions.subscriptionInstances;
    return subs[subs.length - 1];
  }
}

let mockConsumerInstance = null;

export const createMockConsumer = (url) => {
  mockConsumerInstance = new MockConsumer();
  return mockConsumerInstance;
};

export const getMockConsumer = () => mockConsumerInstance;

export const getMockSubscription = () => {
  return mockConsumerInstance?.getLastSubscription();
};

export const createConsumer = createMockConsumer;

const actionCableMock = {
  createConsumer: createMockConsumer,
  getMockConsumer,
  getMockSubscription
};

export default actionCableMock;
