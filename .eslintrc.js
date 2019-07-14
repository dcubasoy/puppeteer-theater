module.exports = {
  "extends": "airbnb-base",
  "plugins": [
    "import",
  ],
  "rules": {
    "no-bitwise": ["error", { "allow": ["~"] }],
    "no-underscore-dangle": ["error", { "allowAfterThis": true, "allowAfterSuper": true }],
    "no-restricted-properties": false,
  },
  "globals": {
    "document": true,
  },
};
