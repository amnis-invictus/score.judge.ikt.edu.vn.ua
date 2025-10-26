/**
 * Integration tests for ResultsEditPage component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('ResultsEditPage Integration Tests', () => {
  let store;
  let ResultsEditPage;

  beforeAll(() => {
    // Import after mock is set up
    ResultsEditPage = require('../pages/results-edit-page').default;
  });

  beforeEach(() => {
    clearPerformed();
    global.confirm = jest.fn();
  });

  test('should render contest and task names', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'National Programming Contest',
        task_name: 'Algorithm Challenge'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 10, position: 0 }
      ],
      users: [],
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    expect(screen.getByText(/National Programming Contest/)).toBeInTheDocument();
    expect(screen.getByText(/Algorithm Challenge/)).toBeInTheDocument();
  });

  test('should render table with users and criteria', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Correctness', limit: 50, position: 0 },
        { id: 'c2', name: 'Performance', limit: 30, position: 1 }
      ],
      users: ['user-001', 'user-002'],
      results: {},
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    // Check users are rendered
    expect(screen.getByText('user-001')).toBeInTheDocument();
    expect(screen.getByText('user-002')).toBeInTheDocument();

    // Check table structure exists
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  test('should show warning when read-only mode is active', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: true,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 10, position: 0 }
      ],
      users: [],
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    expect(screen.getByText('Перевірку завершено')).toBeInTheDocument();
  });

  test('should show action buttons when not read-only', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 10, position: 0 }
      ],
      users: [],
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    expect(screen.getByText('Заповнити 0 для відсутніх робіт')).toBeInTheDocument();
    expect(screen.getByText('Завершити перевірку')).toBeInTheDocument();
  });

  test('should hide action buttons when read-only', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: true,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 10, position: 0 }
      ],
      users: [],
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    expect(screen.queryByText('Заповнити 0 для відсутніх робіт')).not.toBeInTheDocument();
    expect(screen.queryByText('Завершити перевірку')).not.toBeInTheDocument();
  });

  test('should call finish action with confirmation', () => {
    global.confirm.mockReturnValue(true);
    
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 10, position: 0 }
      ],
      users: [],
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    const finishButton = screen.getByText('Завершити перевірку');
    fireEvent.click(finishButton);

    expect(global.confirm).toHaveBeenCalled();
    const actions = getPerformedActions();
    const finishAction = actions.find(a => a.action === 'finish');
    expect(finishAction).toBeDefined();
  });

  test('should not call finish action when confirmation is cancelled', () => {
    global.confirm.mockReturnValue(false);
    
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 10, position: 0 }
      ],
      users: [],
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    const finishButton = screen.getByText('Завершити перевірку');
    fireEvent.click(finishButton);

    const actions = getPerformedActions();
    const finishAction = actions.find(a => a.action === 'finish');
    expect(finishAction).toBeUndefined();
  });

  test('should call zero_no_solution action with confirmation', () => {
    global.confirm.mockReturnValue(true);
    
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 10, position: 0 }
      ],
      users: [],
      resultMultiplier: '1/1'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    const zeroButton = screen.getByText('Заповнити 0 для відсутніх робіт');
    fireEvent.click(zeroButton);

    expect(global.confirm).toHaveBeenCalled();
    const actions = getPerformedActions();
    const zeroAction = actions.find(a => a.action === 'zero_no_solution');
    expect(zeroAction).toBeDefined();
  });

  test('should handle result multiplier correctly', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        { id: 'c1', name: 'Test', limit: 100, position: 0 }
      ],
      users: [],
      resultMultiplier: '3/5'
    });

    render(
      <Provider store={store}>
        <ResultsEditPage />
      </Provider>
    );

    // The page should render without errors with multiplier
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  test('should render DataX component with users and criteria', () => {
    const DataX = require('../pages/results-edit-page').DataX;
    
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: [],
      resultMultiplier: '1/1',
      results: {},
      locks: {}
    });

    const criteria = [
      { id: 'c1', limit: 50, className: 'bg-primary' }
    ];
    const users = ['user-1', 'user-2'];

    render(
      <Provider store={store}>
        <table>
          <tbody>
            <DataX users={users} criteria={criteria} />
          </tbody>
        </table>
      </Provider>
    );

    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('user-2')).toBeInTheDocument();
  });
});
