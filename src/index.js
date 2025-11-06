import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import App from './app';
import Revision from './revision';
import store from './state';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <ToastContainer position='top-right' autoClose={false} closeOnClick={false} draggable={false} />
      <Revision />
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
