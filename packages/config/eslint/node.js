/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["./base.js"],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Node.js specific rules
    "no-process-exit": "warn",
    "@typescript-eslint/no-require-imports": "warn",
  },
};
