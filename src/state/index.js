import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import app from './app';
import criteria from './criteria';
import users from './users';
import errors from './errors';
import locks from './locks';
import results from './results';

const store = configureStore({
  reducer: combineReducers({
    app: app.reducer,
    criteria: criteria.reducer,
    users: users.reducer,
    errors: errors.reducer,
    locks: locks.reducer,
    results: results.reducer,
  })
});

export default store;
