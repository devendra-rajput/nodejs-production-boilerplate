module.exports = {
    // Environment settings
    env: {
        commonjs: true, // Support CommonJS (require/module.exports)
        es2021: true, // Support ES2021 globals and syntax
        node: true, // Support Node.js global variables (process, __dirname, etc.)
    },
    // Extend the Airbnb Base style guide and Security plugin (legacy config for ESLint 8)
    extends: ['airbnb-base', 'plugin:security/recommended-legacy'],
    // Parser options
    parserOptions: {
        ecmaVersion: 2022, // Parse modern ECMA features
    },
    // Custom rule overrides
    rules: {
        // Disable console.log warning (Logging is common in backend services)
        'no-console': 'off',

        // Disable object-injection warning (Common in Node/Express when handling keys)
        'security/detect-object-injection': 'off',

        // Disable camelCase enforcement (Database fields often use snake_case)
        camelcase: 'off',

        // Allow leading underscores (Common for MongoDB _id or unused variables like _req)
        'no-underscore-dangle': 'off',

        // Allow class methods that don't use 'this' (Common in Controller classes)
        'class-methods-use-this': 'off',

        // Allow inconsistent returns (e.g., returning early vs returning at end)
        'consistent-return': 'off',

        // Disable extraneous dependencies check (Can be flaky in monorepos)
        'import/no-extraneous-dependencies': 'off',

        // Warn on unused vars, but ignore args starting with underscore (e.g. _req, _next)
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
};
