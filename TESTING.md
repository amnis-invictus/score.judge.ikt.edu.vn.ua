# Integration Tests Documentation

This document describes the integration test suite for the IKT Judge Scoring application.

## Overview

The test suite includes 37 integration tests organized into 4 test files that verify:
1. **API communication** - Correct data is sent to the backend API
2. **State management** - Redux state updates correctly from server messages
3. **UI behavior** - Components render and respond correctly to state changes

## Test Files

### 1. `criterion-api.integration.test.js` (6 tests)
Tests criterion CRUD operations and validation.

**Tests:**
- ✓ Send `update_criterion` when criterion name is changed
- ✓ Send `update_criterion` when criterion limit is changed
- ✓ Send `delete_criterion` when delete button is clicked
- ✓ Don't send `delete_criterion` when user cancels confirmation
- ✓ Disable delete button when criterion has results
- ✓ Disable inputs when app is read-only

### 2. `result-api.integration.test.js` (8 tests)
Tests result input operations, locking mechanism, and validation.

**Tests:**
- ✓ Send `acquire_lock` when input is focused
- ✓ Send `release_lock` when input loses focus
- ✓ Send `write_result` when value changes
- ✓ Don't send `write_result` when value ends with dot
- ✓ Check behavior when lock is not acquired and result is dirty
- ✓ Disable input when locked by another client
- ✓ Render as plain text when app is read-only
- ✓ Respect max value constraint

### 3. `server-to-client.integration.test.js` (13 tests)
Tests Redux state updates from server messages.

**Tests:**
- ✓ Update app state when receiving `ready` action
- ✓ Load criteria when receiving `load` action
- ✓ Add criterion when receiving `add` action
- ✓ Update criterion when receiving `cleanUpdate` action
- ✓ Delete criterion when receiving `delete` action
- ✓ Load users when receiving `load` action
- ✓ Load results when receiving `load` action
- ✓ Reset result when receiving `reset` action
- ✓ Update result when receiving `cleanUpdate` action
- ✓ Acquire lock when receiving `acquire` action
- ✓ Release lock when receiving `release` action
- ✓ Load comments when receiving `load` action
- ✓ Mark app as finished when receiving `finish` action

### 4. `ui-state.integration.test.js` (10 tests)
Tests UI component behavior based on state changes.

**Tests:**
- ✓ Show loading message when app is not ready
- ✓ Render criteria edit page when app is ready
- ✓ Update criterion form when criterion state changes
- ✓ Show warning status when result has unsaved changes
- ✓ Check lock state for result input
- ✓ Enable result input when lock is acquired by current client
- ✓ Render result as text when app is read-only
- ✓ Disable criterion inputs when app is read-only
- ✓ Update result value display when state changes
- ✓ Show correct contest and task names from app state

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in CI mode (non-interactive)
```bash
CI=true npm test -- --watchAll=false
```

### Run specific test file
```bash
npm test criterion-api
```

### Run with coverage
```bash
npm test -- --coverage --watchAll=false
```

## Test Architecture

### Mocking Strategy

The tests use Jest mocks to simulate the ActionCable WebSocket connection:

1. **ActionCable Mock** (`src/__mocks__/@rails/actioncable.js`)
   - Mocks the Rails ActionCable library
   - Provides mock consumer and subscription implementations

2. **API Module Mock** (`src/__mocks__/api/action-cable.js`)
   - Mocks the application's API client
   - Tracks all `perform()` calls for verification
   - Exports test-friendly `clientId` and `task` values

### Test Utilities (`src/testUtils.js`)

Helper functions for integration tests:
- `getPerformedActions()` - Get all API calls made
- `clearPerformedActions()` - Reset API call history
- `findAction(name)` - Find specific action by name
- `findAllActions(name)` - Find all actions by name

### Test Setup (`src/setupTests.js`)

Global test configuration:
- Imports `@testing-library/jest-dom` matchers
- Mocks `window.prompt`, `window.confirm`, `window.scrollTo`

## Key Testing Patterns

### 1. Testing Outbound API Calls

```javascript
// Change component state
fireEvent.change(input, { target: { value: 'new value' } });

// Verify correct API call was made
await waitFor(() => {
  const actions = getPerformedActions();
  const action = actions.find(a => a.action === 'update_criterion');
  expect(action).toBeDefined();
  expect(action.data).toMatchObject({ ... });
});
```

### 2. Testing Inbound State Updates

```javascript
// Dispatch server message
store.dispatch({
  type: 'criteria/load',
  payload: [...]
});

// Verify state was updated
const state = store.getState();
expect(state.criteria).toHaveLength(3);
```

### 3. Testing UI Rendering

```javascript
// Render component with test store
render(
  <Provider store={store}>
    <Component />
  </Provider>
);

// Verify UI elements
expect(screen.getByText('Loading ...')).toBeInTheDocument();
```

## API Actions Covered

The tests verify correct usage of these API actions:

**Criterion Management:**
- `add_criterion` - Create new criterion
- `update_criterion` - Update criterion properties
- `delete_criterion` - Delete criterion
- `drag_drop` - Reorder criteria

**Result Management:**
- `write_result` - Update result value
- `reset_result` - Reset result to server value
- `zero_results` - Zero out all results
- `zero_no_solution` - Zero results for missing solutions

**Locking:**
- `acquire_lock` - Acquire edit lock
- `release_lock` - Release edit lock

**Other:**
- `finish` - Complete judging
- `add_judge` - Add judge
- `delete_judge` - Remove judge
- `write_comment` - Update comment
- `reset_comment` - Reset comment
- `write_result_multiplier` - Update multiplier

## Future Enhancements

Potential areas for additional test coverage:

1. **Comment Form Tests** - Test comment CRUD operations
2. **Judge Management Tests** - Test judge add/remove operations
3. **Drag and Drop Tests** - Test criterion reordering
4. **Error Handling Tests** - Test error states and recovery
5. **Connection Tests** - Test WebSocket connection lifecycle
6. **Performance Tests** - Test with large datasets
7. **E2E Tests** - Full user workflow tests with real backend

## Troubleshooting

### Tests timing out
If tests fail with timeout errors, check:
- Network delays (mocks should be instant)
- Missing `await` in async operations
- Incorrect `waitFor` conditions

### Mock not working
If mocks aren't being applied:
- Ensure `jest.mock()` is called before imports
- Check mock file path matches module path
- Clear Jest cache: `npm test -- --clearCache`

### State not updating
If state changes don't reflect in components:
- Verify Redux store is properly configured
- Check that actions are dispatched correctly
- Ensure component is wrapped in `<Provider>`
