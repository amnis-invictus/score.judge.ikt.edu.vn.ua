/**
 * Integration tests for Result API operations
 * Tests that correct data is sent to the API when performing result operations
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import app from '../state/app';
import criteria from '../state/criteria';
import users from '../state/users';
import errors from '../state/errors';
import notifications from '../state/notifications';
import locks from '../state/locks';
import results from '../state/results';
import comments from '../state/comments';
import judges from '../state/judges';
import resultMultiplier from '../state/result-multiplier';

// Create a mock API that tracks calls
const performedActions = [];

jest.mock('../api/action-cable', () => ({
  __esModule: true,
  default: {
    perform: (action, data) => {
      performedActions.push({ action, data });
    }
  },
  clientId: 'test-client-id',
  task: 'test-task'
}));

const getPerformedActions = () => performedActions;
const clearPerformed = () => { performedActions.length = 0; };

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: combineReducers({
      app: app.reducer,
      criteria: criteria.reducer,
      users: users.reducer,
      errors: errors.reducer,
      notifications: notifications.reducer,
      locks: locks.reducer,
      results: results.reducer,
      comments: comments.reducer,
      judges: judges.reducer,
      resultMultiplier: resultMultiplier.reducer,
    }),
    preloadedState: initialState
  });
};

describe('Result API Integration Tests', () => {
  let store;
  let ResultForm;

  beforeAll(() => {
    // Import after mock is set up
    ResultForm = require('../components/result-form').default;
  });

  beforeEach(() => {
    clearPerformed();
    
    // Initialize store with test data
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      results: {},
      locks: {}
    });
  });

  test('should send acquire_lock when input is focused', async () => {
    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    
    // Focus the input
    fireEvent.focus(input);

    // Wait for the lock acquisition
    await waitFor(() => {
      const actions = getPerformedActions();
      const lockAction = actions.find(a => a.action === 'acquire_lock');
      expect(lockAction).toBeDefined();
      expect(lockAction.data.lock).toContain('user-1');
      expect(lockAction.data.lock).toContain('criterion-1');
    });
  });

  test('should send release_lock when input loses focus', async () => {
    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    
    // Focus and then blur the input
    fireEvent.focus(input);
    fireEvent.blur(input);

    // Wait for the lock release
    await waitFor(() => {
      const actions = getPerformedActions();
      const releaseAction = actions.find(a => a.action === 'release_lock');
      expect(releaseAction).toBeDefined();
      expect(releaseAction.data.lock).toContain('user-1');
      expect(releaseAction.data.lock).toContain('criterion-1');
    });
  });

  test('should send write_result when value changes', async () => {
    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    
    // Change the value
    fireEvent.change(input, { target: { value: '8' } });

    // Wait for the result to be written
    await waitFor(() => {
      const actions = getPerformedActions();
      const writeAction = actions.find(a => a.action === 'write_result');
      expect(writeAction).toBeDefined();
      expect(writeAction.data.user).toBe('user-1');
      expect(writeAction.data.criterion).toBe('criterion-1');
      expect(writeAction.data.value).toBe('8');
      expect(writeAction.data.token).toBeDefined();
    }, { timeout: 3000 });
  });

  test('should not send write_result when value ends with dot', async () => {
    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    
    // Change the value to something ending with dot
    fireEvent.change(input, { target: { value: '8.' } });

    // Wait a bit to ensure no action is sent
    await waitFor(() => {
      const actions = getPerformedActions();
      const writeActions = actions.filter(a => a.action === 'write_result');
      expect(writeActions.length).toBe(0);
    }, { timeout: 1000 });
  });

  test('should check behavior when lock is not acquired and result is dirty', () => {
    // Set up a scenario where result is dirty but lock not acquired
    // This test verifies the component handles this state correctly
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      results: {
        'user-1': {
          'criterion-1': { value: '5', dirty: 'some-token' }
        }
      },
      locks: {
        'test-task:user-1:criterion-1': 'other-client-id'
      }
    });

    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    // Input is disabled when locked by another client
    expect(input).toBeDisabled();
    // Value is displayed correctly
    expect(input).toHaveValue(5);
  });

  test('should disable input when locked by another client', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      results: {},
      locks: {
        'test-task:user-1:criterion-1': 'other-client-id'
      }
    });

    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();
  });

  test('should render as plain text when app is read-only', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: true,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      results: {
        'user-1': {
          'criterion-1': { value: 7 }
        }
      },
      locks: {}
    });

    const { container } = render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    // Should render as div with value, not an input
    expect(container.textContent).toBe('7');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  test('should respect max value constraint', () => {
    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="criterion-1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('min', '0');
  });
});
