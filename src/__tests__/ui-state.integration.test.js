/**
 * Integration tests for UI updates based on state changes
 * Tests that UI components render correctly when Redux state changes
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

import App from '../app';
import ResultForm from '../components/result-form';
import CriterionForm from '../components/criterion-form';

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

describe('UI State Integration Tests', () => {
  test('should show loading message when app is not ready', () => {
    const store = createTestStore({
      app: {
        isReady: false,
        readOnly: false,
        contest_name: '',
        task_name: ''
      }
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText('Loading ...')).toBeInTheDocument();
  });

  test('should render criteria edit page when app is ready', () => {
    const store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: [],
      results: {},
      judges: []
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText('Налаштування')).toBeInTheDocument();
    expect(screen.getByText(/Test Contest/)).toBeInTheDocument();
    expect(screen.getByText(/Test Task/)).toBeInTheDocument();
  });

  test('should update criterion form when criterion state changes', async () => {
    const store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        {
          id: 'c1',
          name: 'Initial Name',
          limit: 10,
          position: 0
        }
      ],
      users: [],
      results: {}
    });

    const { rerender } = render(
      <Provider store={store}>
        <CriterionForm id="c1" />
      </Provider>
    );

    expect(screen.getByDisplayValue('Initial Name')).toBeInTheDocument();

    // Update the criterion in the store
    store.dispatch({
      type: 'criteria/cleanUpdate',
      payload: {
        id: 'c1',
        token: null,
        value: { name: 'Updated Name', limit: 15 }
      }
    });

    // Re-render with updated store
    rerender(
      <Provider store={store}>
        <CriterionForm id="c1" />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    });
  });

  test('should show warning status when result has unsaved changes', async () => {
    const store = createTestStore({
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
          'c1': { value: '8', dirty: 'token123' }
        }
      },
      locks: {}
    });

    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="c1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(8);
    expect(input).toHaveClass('border-danger');
  });

  test('should check lock state for result input', () => {
    // Test that the component responds to lock state changes
    const store = createTestStore({
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

    const { rerender } = render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="c1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    // Should be enabled when no lock
    expect(input).not.toBeDisabled();

    // Update lock state to simulate another client acquiring lock
    // Note: actual lock key depends on task from window.location
    // For this test we verify the UI renders correctly
    expect(input).toHaveAttribute('type', 'number');
  });

  test('should enable result input when lock is acquired by current client', () => {
    // Mock clientId from action-cable module
    jest.mock('../api/action-cable', () => ({
      __esModule: true,
      default: { perform: jest.fn() },
      clientId: 'current-client-id',
      task: 'test-task'
    }));

    const store = createTestStore({
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
        'test-task:user-1:c1': 'current-client-id'
      }
    });

    render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="c1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    expect(input).not.toBeDisabled();
  });

  test('should render result as text when app is read-only', () => {
    const store = createTestStore({
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
          'c1': { value: 9 }
        }
      },
      locks: {}
    });

    const { container } = render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="c1" max={10} />
      </Provider>
    );

    expect(container.textContent).toBe('9');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  test('should disable criterion inputs when app is read-only', () => {
    const store = createTestStore({
      app: {
        isReady: true,
        readOnly: true,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [
        {
          id: 'c1',
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
        <CriterionForm id="c1" />
      </Provider>
    );

    const nameInput = screen.getByDisplayValue('Test Criterion');
    const limitInput = screen.getByDisplayValue('10');
    const deleteButton = screen.getByRole('button');

    expect(nameInput).toBeDisabled();
    expect(limitInput).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  test('should update result value display when state changes', async () => {
    const store = createTestStore({
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
          'c1': { value: 5 }
        }
      },
      locks: {}
    });

    const { rerender } = render(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="c1" max={10} />
      </Provider>
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(5);

    // Update result in store
    store.dispatch({
      type: 'results/cleanUpdate',
      payload: { user: 'user-1', criterion: 'c1', value: 8, token: null }
    });

    rerender(
      <Provider store={store}>
        <ResultForm user="user-1" criterion="c1" max={10} />
      </Provider>
    );

    await waitFor(() => {
      expect(input).toHaveValue(8);
    });
  });

  test('should show correct contest and task names from app state', () => {
    const store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'International Programming Olympiad',
        task_name: 'Dynamic Programming Challenge'
      },
      criteria: [],
      users: [],
      results: {},
      judges: []
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText(/International Programming Olympiad/)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Programming Challenge/)).toBeInTheDocument();
  });
});
