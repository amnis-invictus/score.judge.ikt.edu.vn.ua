// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.prompt for tests
global.prompt = jest.fn();

// Mock window.confirm for tests
global.confirm = jest.fn();

// Mock window.scrollTo
global.scrollTo = jest.fn();
