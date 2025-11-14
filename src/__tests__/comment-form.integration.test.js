/**
 * Integration tests for CommentForm component
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

describe('CommentForm Integration Tests', () => {
  let store;
  let CommentForm;

  beforeAll(() => {
    // Import after mock is set up
    CommentForm = require('../components/comment-form').default;
  });

  beforeEach(() => {
    clearPerformed();
    
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      comments: {},
      locks: {}
    });
  });

  test('should render textarea for comment input', () => {
    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  test('should send acquire_lock when textarea is focused', async () => {
    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);

    await waitFor(() => {
      const actions = getPerformedActions();
      const lockAction = actions.find(a => a.action === 'acquire_lock');
      expect(lockAction).toBeDefined();
      expect(lockAction.data.lock).toContain('user-1');
      expect(lockAction.data.lock).toContain('comment');
    });
  });

  test('should send release_lock when textarea loses focus', async () => {
    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    await waitFor(() => {
      const actions = getPerformedActions();
      const releaseAction = actions.find(a => a.action === 'release_lock');
      expect(releaseAction).toBeDefined();
      expect(releaseAction.data.lock).toContain('user-1');
      expect(releaseAction.data.lock).toContain('comment');
    });
  });

  test('should send write_comment when value changes', async () => {
    // Set lock to current client
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      comments: {},
      locks: {
        'test-task:user-1:comment': 'test-client-id'
      }
    });

    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Good work!' } });

    await waitFor(() => {
      const actions = getPerformedActions();
      const writeAction = actions.find(a => a.action === 'write_comment');
      expect(writeAction).toBeDefined();
      expect(writeAction.data.user).toBe('user-1');
      expect(writeAction.data.value).toBe('Good work!');
      expect(writeAction.data.token).toBeDefined();
    }, { timeout: 3000 });
  });

  test('should display dropdown with default comments when empty', () => {
    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    // Look for dropdown toggle button
    const dropdownButton = screen.getByRole('button', { name: '' });
    expect(dropdownButton).toBeInTheDocument();
    expect(dropdownButton).toHaveClass('dropdown-toggle');
  });

  test('should hide dropdown when comment has value', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      comments: {
        'user-1': { value: 'Some comment' }
      },
      locks: {}
    });

    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Some comment');
    
    // Dropdown toggle should not be visible
    const dropdownButtons = screen.queryAllByRole('button');
    const dropdownToggle = dropdownButtons.find(btn => btn.classList.contains('dropdown-toggle'));
    expect(dropdownToggle).toBeUndefined();
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
      comments: {
        'user-1': { value: 'Final comment' }
      },
      locks: {}
    });

    const { container } = render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    expect(container.textContent).toBe('Final comment');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('should disable textarea when locked by another client', () => {
    store = createTestStore({
      app: {
        isReady: true,
        readOnly: false,
        contest_name: 'Test Contest',
        task_name: 'Test Task'
      },
      criteria: [],
      users: ['user-1'],
      comments: {},
      locks: {
        'test-task:user-1:comment': 'other-client-id'
      }
    });

    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  test('should show status indicators when focused', async () => {
    render(
      <Provider store={store}>
        <CommentForm user="user-1" />
      </Provider>
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);

    // Should show status notice
    await waitFor(() => {
      expect(screen.getByText(/Acquiring lock|Saving|Ready/)).toBeInTheDocument();
    });
  });
});
