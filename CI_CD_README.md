# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for continuous integration and deployment. The pipeline is designed to ensure code quality, run tests, and deploy to different environments automatically.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:** Push to `main`/`develop` branches, Pull Requests

**Jobs:**
- **Lint & Type Check**: Runs ESLint and TypeScript type checking
- **Test Suite**: Executes Jest tests with proper React Native/Expo mocking
- **Build Check**: Validates Expo build configuration
- **Security Audit**: Runs npm audit for security vulnerabilities
- **Database Migration Check**: Validates migration files

**Features:**
- Parallel job execution for faster feedback
- Dependency caching for improved performance
- Comprehensive error reporting
- Job dependencies to ensure proper execution order

### 2. Deploy (`deploy.yml`)

**Triggers:** Push to `main` branch, after CI pipeline completion

**Jobs:**
- **Supabase Staging**: Deploys database changes to staging environment
- **Supabase Production**: Deploys database changes to production environment
- **Web App Deployment**: Builds and deploys web version to GitHub Pages

## Setup Requirements

### 1. Repository Secrets

Add these secrets in your GitHub repository settings:

```bash
# Supabase Configuration
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_STAGING_PROJECT_REF=your_staging_project_ref
SUPABASE_PRODUCTION_PROJECT_REF=your_production_project_ref

# Optional: Additional deployment tokens
VERCEL_TOKEN=your_vercel_token
NETLIFY_TOKEN=your_netlify_token
```

### 2. Branch Protection Rules

Set up branch protection for `main` and `develop`:

- Require status checks to pass before merging
- Require branches to be up to date
- Restrict direct pushes to protected branches
- Require pull request reviews

### 3. Environment Setup

#### Local Development
```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test

# Start development server
npm start
```

#### CI Environment
The pipeline automatically:
- Sets up Node.js 20
- Installs dependencies with `npm ci`
- Runs all quality checks
- Executes tests in CI mode
- Validates build configuration

## Pipeline Stages

### Stage 1: Code Quality
- ESLint validation
- TypeScript type checking
- Code formatting validation

### Stage 2: Testing
- Unit tests execution
- Integration tests (if configured)
- Test coverage reporting

### Stage 3: Build Validation
- Expo configuration validation
- Dependency compatibility check
- Build process verification

### Stage 4: Security
- Dependency vulnerability scanning
- Security audit execution
- License compliance checking

### Stage 5: Deployment
- Staging environment deployment
- Production environment deployment
- Web app build and deployment

## Troubleshooting

### Common Issues

#### 1. npm ci Fails
**Problem:** Missing package-lock.json
**Solution:** Run `npm install` locally and commit package-lock.json

#### 2. TypeScript Errors
**Problem:** Type configuration issues
**Solution:** Check tsconfig.json and ensure all paths are correct

#### 3. Test Failures
**Problem:** Missing mocks or test setup
**Solution:** Verify jest.setup.js and mock configurations

#### 4. Build Failures
**Problem:** Expo configuration issues
**Solution:** Check expo configuration and dependencies

### Debugging

#### Enable Debug Logging
```yaml
# In workflow file
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

#### Local Testing
```bash
# Test TypeScript compilation
npx tsc --noEmit

# Test ESLint
npx eslint "project/**/*.{ts,tsx}"

# Test Jest
npx jest --verbose
```

## Performance Optimization

### Caching Strategy
- **npm cache**: Reduces dependency installation time
- **Build cache**: Stores build artifacts between runs
- **Test cache**: Caches test results for unchanged files

### Parallel Execution
- Independent jobs run in parallel
- Job dependencies ensure proper order
- Resource allocation optimization

### Resource Management
- Ubuntu-latest runners for optimal performance
- Timeout limits to prevent hanging jobs
- Resource cleanup after job completion

## Monitoring and Alerts

### Status Checks
- GitHub status checks integration
- Required status checks for merging
- Real-time pipeline status updates

### Notifications
- GitHub notifications for pipeline events
- Slack/Discord integration (configurable)
- Email notifications for critical failures

### Metrics
- Pipeline execution time tracking
- Success/failure rate monitoring
- Resource usage analytics

## Best Practices

### 1. Code Quality
- Always run linting before committing
- Fix TypeScript errors promptly
- Maintain test coverage above 80%

### 2. Pipeline Management
- Keep workflows simple and focused
- Use reusable actions when possible
- Document complex pipeline logic

### 3. Security
- Never commit secrets to code
- Use least-privilege access for tokens
- Regular security audits and updates

### 4. Performance
- Optimize job dependencies
- Use appropriate caching strategies
- Monitor and optimize execution times

## Future Enhancements

### Planned Features
- [ ] Automated dependency updates
- [ ] Performance regression testing
- [ ] Advanced security scanning
- [ ] Multi-environment testing
- [ ] Automated rollback capabilities

### Integration Opportunities
- [ ] Slack/Discord notifications
- [ ] Jira issue linking
- [ ] Performance monitoring dashboards
- [ ] Automated documentation generation

## Support

For pipeline issues or questions:
1. Check this documentation
2. Review GitHub Actions logs
3. Check repository issues
4. Contact the development team

## Contributing

To improve the CI/CD pipeline:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

*Last updated: August 2025*
*Pipeline version: 2.0*
