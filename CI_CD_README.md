# CI/CD Setup

This project has been configured with a comprehensive CI/CD pipeline using GitHub Actions.

## 🚀 Available Scripts

### Development
```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Start web version
```

### CI/CD Pipeline
```bash
npm run type-check # TypeScript type checking
npm run lint       # ESLint code quality check
npm test           # Run Jest tests
```

## 🧪 Testing Setup

### Jest Configuration
- **Preset**: `ts-jest` for TypeScript support
- **Test Environment**: Node.js (suitable for React Native/Expo)
- **Coverage**: Collects coverage from `project/**/*.{ts,tsx}`
- **Timeout**: 10 seconds per test

### Test Structure
```
project/
├── __tests__/           # Test files directory
│   └── example.test.ts  # Example test file
├── jest.setup.js        # Jest configuration and mocks
└── jest.config.js       # Jest configuration file
```

### Mocked Dependencies
- **Expo Router**: Navigation functions
- **Expo Location**: Location permissions and services
- **Expo Notifications**: Push notification services
- **Expo Camera**: Camera functionality
- **AsyncStorage**: Local storage
- **Supabase**: Database and authentication

## 🔄 GitHub Actions Workflow

### Trigger
- Runs on every `push` and `pull_request`
- Uses Ubuntu latest runner
- Node.js version 20

### Steps
1. **Checkout**: Clone repository
2. **Setup Node**: Install Node.js 20
3. **Install Dependencies**: `npm ci`
4. **Type Check**: `npm run type-check`
5. **Lint**: `npm run lint`
6. **Test**: `npm test` (if tests exist)

### Workflow File
Location: `.github/workflows/ci.yml`

## 📋 Prerequisites

### Dependencies
The following packages have been added to `devDependencies`:
- `jest`: Testing framework
- `@types/jest`: TypeScript types for Jest
- `ts-jest`: Jest transformer for TypeScript

### Configuration Files
- `jest.config.js`: Jest configuration
- `project/jest.setup.js`: Jest setup and mocks
- `.github/workflows/ci.yml`: GitHub Actions workflow

## 🎯 Best Practices

### Writing Tests
1. Place test files in `project/__tests__/` directory
2. Use `.test.ts` or `.spec.ts` suffix
3. Follow Jest naming conventions
4. Mock external dependencies appropriately

### CI/CD
1. All tests must pass before merging
2. Type checking ensures code quality
3. Linting maintains consistent code style
4. Tests run in parallel for efficiency

### Code Quality
1. Fix all TypeScript errors
2. Resolve ESLint warnings
3. Maintain test coverage
4. Follow project coding standards

## 🚨 Troubleshooting

### Common Issues
1. **TypeScript Errors**: Run `npm run type-check` locally
2. **Linting Issues**: Run `npm run lint` and fix warnings
3. **Test Failures**: Check test output and fix failing tests
4. **CI Failures**: Ensure all checks pass locally first

### Local Development
```bash
# Install dependencies
npm install

# Run all checks
npm run type-check
npm run lint
npm test

# Start development
npm start
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [GitHub Actions](https://docs.github.com/en/actions)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html)
- [React Native Testing](https://reactnative.dev/docs/testing)
