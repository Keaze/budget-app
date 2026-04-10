import '@testing-library/jest-dom'

// Ensure localStorage has all required methods for tests
if (global.localStorage && !global.localStorage.clear) {
  const store = {}
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(key => delete store[key]) },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] || null,
  }
}
