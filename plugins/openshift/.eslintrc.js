module.exports = require('@backstage/cli/config/eslint-factory')(__dirname, {
  rules: {
    // Use modern JSX transform; React does not need to be in scope
    'react/react-in-jsx-scope': 'off',
  },
});
