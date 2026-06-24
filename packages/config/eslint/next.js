/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["./base.js", "next/core-web-vitals"],
  rules: {
    // React specific rules
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/display-name": "off",

    // Next.js specific
    "@next/next/no-html-link-for-pages": "off",

    // Import rules for Next.js
    "import/no-anonymous-default-export": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
