/**
 * Integration tests for receiving data from API
 * Tests that Redux state is updated correctly when receiving messages from the server
 */
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

import { simulateServerMessage } from '../testUtils';

// Mock the API module
jest.mock('../api/action-cable');

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

describe('Server to Client Communication Tests', () => {
  let store;

  beforeEach(() => {
    store = createTestStore({
      app: {
        isReady: false,
        readOnly: false,
        contest_name: '',
        task_name: ''
      },
      criteria: [],
      users: [],
      results: {},
      locks: {}
    });
  });

  test('should update app state when receiving ready action', () => {
    const readyMessage = {
      type: 'app/ready',
      payload: {
        read_only: false,
        contest_name: 'Programming Contest',
        task_name: 'Algorithm Problem'
      }
    };

    simulateServerMessage(readyMessage);
    store.dispatch(readyMessage);

    const state = store.getState();
    expect(state.app.isReady).toBe(true);
    expect(state.app.readOnly).toBe(false);
    expect(state.app.contest_name).toBe('Programming Contest');
    expect(state.app.task_name).toBe('Algorithm Problem');
  });

  test('should load criteria when receiving load action', () => {
    const loadCriteriaMessage = {
      type: 'criteria/load',
      payload: [
        { id: 'c1', name: 'Correctness', limit: 50, position: 0 },
        { id: 'c2', name: 'Performance', limit: 30, position: 1 },
        { id: 'c3', name: 'Code Quality', limit: 20, position: 2 }
      ]
    };

    store.dispatch(loadCriteriaMessage);

    const state = store.getState();
    expect(state.criteria).toHaveLength(3);
    expect(state.criteria[0].name).toBe('Correctness');
    expect(state.criteria[1].limit).toBe(30);
    expect(state.criteria[2].id).toBe('c3');
  });

  test('should add criterion when receiving add action', () => {
    // First load some criteria
    store.dispatch({
      type: 'criteria/load',
      payload: [
        { id: 'c1', name: 'Correctness', limit: 50, position: 0 }
      ]
    });

    // Then add a new one
    const addCriterionMessage = {
      type: 'criteria/add',
      payload: { id: 'c2', name: 'Performance', limit: 30, position: 1 }
    };

    store.dispatch(addCriterionMessage);

    const state = store.getState();
    expect(state.criteria).toHaveLength(2);
    expect(state.criteria[1].name).toBe('Performance');
  });

  test('should update criterion when receiving cleanUpdate action', () => {
    // Load initial criteria
    store.dispatch({
      type: 'criteria/load',
      payload: [
        { id: 'c1', name: 'Correctness', limit: 50, position: 0, dirty: 'token123' }
      ]
    });

    // Receive clean update
    const updateMessage = {
      type: 'criteria/cleanUpdate',
      payload: {
        id: 'c1',
        token: 'token123',
        value: { name: 'Correctness Updated', limit: 60 }
      }
    };

    store.dispatch(updateMessage);

    const state = store.getState();
    expect(state.criteria[0].name).toBe('Correctness Updated');
    expect(state.criteria[0].limit).toBe(60);
    expect(state.criteria[0].dirty).toBeNull();
  });

  test('should delete criterion when receiving delete action', () => {
    // Load initial criteria
    store.dispatch({
      type: 'criteria/load',
      payload: [
        { id: 'c1', name: 'Correctness', limit: 50, position: 0 },
        { id: 'c2', name: 'Performance', limit: 30, position: 1 }
      ]
    });

    // Delete a criterion
    const deleteMessage = {
      type: 'criteria/delete',
      payload: 'c1'
    };

    store.dispatch(deleteMessage);

    const state = store.getState();
    expect(state.criteria).toHaveLength(1);
    expect(state.criteria[0].id).toBe('c2');
  });

  test('should load users when receiving load action', () => {
    const loadUsersMessage = {
      type: 'users/load',
      payload: ['user-001', 'user-002', 'user-003']
    };

    store.dispatch(loadUsersMessage);

    const state = store.getState();
    expect(state.users).toHaveLength(3);
    expect(state.users).toContain('user-001');
    expect(state.users).toContain('user-002');
  });

  test('should load results when receiving load action', () => {
    const loadResultsMessage = {
      type: 'results/load',
      payload: [
        { user: 'user-001', criterion: 'c1', value: 45 },
        { user: 'user-001', criterion: 'c2', value: 28 },
        { user: 'user-002', criterion: 'c1', value: 50 }
      ]
    };

    store.dispatch(loadResultsMessage);

    const state = store.getState();
    expect(state.results['user-001']['c1'].value).toBe(45);
    expect(state.results['user-001']['c2'].value).toBe(28);
    expect(state.results['user-002']['c1'].value).toBe(50);
  });

  test('should reset result when receiving reset action', () => {
    // Load initial results
    store.dispatch({
      type: 'results/load',
      payload: [
        { user: 'user-001', criterion: 'c1', value: 45 }
      ]
    });

    // Mark as dirty
    store.dispatch({
      type: 'results/dirtyUpdate',
      payload: { user: 'user-001', criterion: 'c1', value: 30 }
    });

    // Reset
    const resetMessage = {
      type: 'results/reset',
      payload: { user: 'user-001', criterion: 'c1', value: 45 }
    };

    store.dispatch(resetMessage);

    const state = store.getState();
    expect(state.results['user-001']['c1'].value).toBe(45);
    expect(state.results['user-001']['c1'].dirty).toBeUndefined();
  });

  test('should update result when receiving cleanUpdate action', () => {
    // Set a dirty result
    store.dispatch({
      type: 'results/dirtyUpdate',
      payload: { user: 'user-001', criterion: 'c1', value: 40 }
    });

    const dirtyToken = store.getState().results['user-001']['c1'].dirty;

    // Clean update with matching token
    const cleanUpdateMessage = {
      type: 'results/cleanUpdate',
      payload: { user: 'user-001', criterion: 'c1', value: 40, token: dirtyToken }
    };

    store.dispatch(cleanUpdateMessage);

    const state = store.getState();
    expect(state.results['user-001']['c1'].value).toBe(40);
    expect(state.results['user-001']['c1'].dirty).toBeUndefined();
  });

  test('should acquire lock when receiving acquire action', () => {
    const acquireLockMessage = {
      type: 'locks/acquire',
      payload: { lock: 'task:user-001:c1', client_id: 'client-123' }
    };

    store.dispatch(acquireLockMessage);

    const state = store.getState();
    expect(state.locks['task:user-001:c1']).toBe('client-123');
  });

  test('should release lock when receiving release action', () => {
    // First acquire a lock
    store.dispatch({
      type: 'locks/acquire',
      payload: { lock: 'task:user-001:c1', client_id: 'client-123' }
    });

    // Then release it
    const releaseLockMessage = {
      type: 'locks/release',
      payload: { lock: 'task:user-001:c1' }
    };

    store.dispatch(releaseLockMessage);

    const state = store.getState();
    expect(state.locks['task:user-001:c1']).toBeUndefined();
  });

  test('should load comments when receiving load action', () => {
    const loadCommentsMessage = {
      type: 'comments/load',
      payload: [
        { user: 'user-001', value: 'Good work' },
        { user: 'user-002', value: 'Needs improvement' }
      ]
    };

    store.dispatch(loadCommentsMessage);

    const state = store.getState();
    expect(state.comments['user-001'].value).toBe('Good work');
    expect(state.comments['user-002'].value).toBe('Needs improvement');
  });

  test('should mark app as finished when receiving finish action', () => {
    // Initialize app as ready
    store.dispatch({
      type: 'app/ready',
      payload: {
        read_only: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      }
    });

    // Finish the task
    const finishMessage = {
      type: 'app/finish'
    };

    store.dispatch(finishMessage);

    const state = store.getState();
    expect(state.app.readOnly).toBe(true);
  });
});
