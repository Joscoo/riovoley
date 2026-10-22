// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// CRA's jsdom predates Web Crypto; use Node's real implementation in tests.
Object.defineProperty(globalThis, 'crypto', { configurable: true, value: require('crypto').webcrypto });
