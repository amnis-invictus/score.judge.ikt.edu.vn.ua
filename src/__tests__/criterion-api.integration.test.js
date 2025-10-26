/**
 * Integration tests for Criterion API operations
 * Tests that correct data is sent to the API when performing criterion operations
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

import { clearPerformedActions, findAction } from '../testUtils';

// Create a mock API that tracks calls
const mockPerform = jest.fn();
const performedActions = [];

jest.mock('../api/action-cable', () => ({
  __esModule: true,
  default: {
    perform: (action, data) => {
      performedActions.push({ action, data });
      mockPerform(action, data);
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

describe('Criterion API Integration Tests', () => {
  let store;
  let CriterionForm;

  beforeAll(() => {
    // Import after mock is set up
    CriterionForm = require('../components/criterion-form').default;
  });

  beforeEach(() => {
    clearPerformed();
    mockPerform.mockClear();
    global.confirm = jest.fn();
    
    // Initialize store with test data
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        {
          id: 'criterion-1',
          name: 'Test Criterion',
          limit: 10,
          position: 0
        }
      ],
      users: [],
      results: {}
    });
  });

  test('should send update_criterion when criterion name is changed', async () => {
    render(
      <Provider store={store}>
        <CriterionForm id="criterion-1" />
      </Provider>
    );

    const nameInput = screen.getByDisplayValue('Test Criterion');
    
    // Change the name
    fireEvent.change(nameInput, { target: { value: 'Updated Criterion' } });

    // Wait for the update to be sent
    await waitFor(() => {
      const actions = getPerformedActions();
      const updateAction = actions.find(a => a.action === 'update_criterion');
      expect(updateAction).toBeDefined();
      expect(updateAction.data.id).toBe('criterion-1');
      expect(updateAction.data.params.name).toBe('Updated Criterion');
      expect(updateAction.data.params.limit).toBe(10);
      expect(updateAction.data.token).toBeDefined();
    });
  });

  test('should send update_criterion when criterion limit is changed', async () => {
    render(
      <Provider store={store}>
        <CriterionForm id="criterion-1" />
      </Provider>
    );

    const limitInput = screen.getByDisplayValue('10');
    
    // Change the limit
    fireEvent.change(limitInput, { target: { value: '15' } });

    // Wait for the update to be sent
    await waitFor(() => {
      const actions = getPerformedActions();
      const updateAction = actions.find(a => a.action === 'update_criterion');
      expect(updateAction).toBeDefined();
      expect(updateAction.data.id).toBe('criterion-1');
      expect(updateAction.data.params.name).toBe('Test Criterion');
      expect(updateAction.data.params.limit).toBe('15');
      expect(updateAction.data.token).toBeDefined();
    });
  });

  test('should send delete_criterion when delete button is clicked', async () => {
    global.confirm.mockReturnValue(true);
    
    render(
      <Provider store={store}>
        <CriterionForm id="criterion-1" />
      </Provider>
    );

    const deleteButton = screen.getByRole('button');
    
    // Click delete button
    fireEvent.click(deleteButton);

    // Wait for the delete action
    await waitFor(() => {
      const actions = getPerformedActions();
      const deleteAction = actions.find(a => a.action === 'delete_criterion');
      expect(deleteAction).toBeDefined();
      expect(deleteAction.data.id).toBe('criterion-1');
    });
    
    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete criterion "Test Criterion"?'
    );
  });

  test('should not send delete_criterion when user cancels confirmation', async () => {
    global.confirm.mockReturnValue(false);
    
    render(
      <Provider store={store}>
        <CriterionForm id="criterion-1" />
      </Provider>
    );

    const deleteButton = screen.getByRole('button');
    
    // Click delete button
    fireEvent.click(deleteButton);

    // Wait a bit to ensure no action is sent
    await waitFor(() => {
      const actions = getPerformedActions();
      const deleteAction = actions.find(a => a.action === 'delete_criterion');
      expect(deleteAction).toBeUndefined();
    });
  });

  test('should disable delete button when criterion has results', async () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        {
          id: 'criterion-1',
          name: 'Test Criterion',
          limit: 10,
          position: 0
        }
      ],
      users: [],
      results: {
        'user-1': {
          'criterion-1': { value: 5 }
        }
      }
    });
    
    render(
      <Provider store={store}>
        <CriterionForm id="criterion-1" />
      </Provider>
    );

    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toBeDisabled();
  });

  test('should disable inputs when app is read-only', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: true,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        {
          id: 'criterion-1',
          name: 'Test Criterion',
          limit: 10,
          position: 0
        }
      ],
      users: [],
      results: {}
    });
    
    render(
      <Provider store={store}>
        <CriterionForm id="criterion-1" />
      </Provider>
    );

    const nameInput = screen.getByDisplayValue('Test Criterion');
    const limitInput = screen.getByDisplayValue('10');
    const deleteButton = screen.getByRole('button');
    
    expect(nameInput).toBeDisabled();
    expect(limitInput).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });
});
