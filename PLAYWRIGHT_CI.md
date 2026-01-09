# Playwright CI/CD Integration

This document explains how to integrate Playwright tests into your CI/CD pipeline.

## GitHub Actions

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-node@v4
      with:
        node-version: 18
    
    - name: Install dependencies
      working-directory: ./frontend
      run: npm ci
    
    - name: Install Playwright Browsers
      working-directory: ./frontend
      run: npx playwright install --with-deps
    
    - name: Run Playwright tests
      working-directory: ./frontend
      run: npm run test:e2e
    
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: frontend/playwright-report/
        retention-days: 30
```

## GitLab CI

Create `.gitlab-ci.yml`:

```yaml
image: mcr.microsoft.com/playwright:v1.40.0-focal

e2e-tests:
  stage: test
  script:
    - cd frontend
    - npm ci
    - npx playwright install
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - frontend/playwright-report/
    expire_in: 30 days
```

## CircleCI

Create `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  node: circleci/node@5.1.0

jobs:
  e2e-tests:
    docker:
      - image: mcr.microsoft.com/playwright:v1.40.0-focal
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
          app-dir: ./frontend
      - run:
          name: Install Playwright
          command: cd frontend && npx playwright install
      - run:
          name: Run tests
          command: cd frontend && npm run test:e2e
      - store_artifacts:
          path: frontend/playwright-report
          destination: playwright-report

workflows:
  test:
    jobs:
      - e2e-tests
```

## Jenkins

Create `Jenkinsfile`:

```groovy
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0-focal'
        }
    }
    stages {
        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npx playwright install'
                }
            }
        }
        stage('Run E2E Tests') {
            steps {
                dir('frontend') {
                    sh 'npm run test:e2e'
                }
            }
        }
    }
    post {
        always {
            publishHTML([
                reportDir: 'frontend/playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
        }
    }
}
```

## Vercel

Add to `vercel.json`:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "ignoreCommand": "cd frontend && npm run test:e2e"
}
```

Or in your `package.json`, add a vercel-build script:

```json
{
  "scripts": {
    "vercel-build": "npm run test:e2e && npm run build"
  }
}
```

## Environment Variables

For CI environments, you may need to set:

```bash
CI=true
PLAYWRIGHT_BROWSERS_PATH=0
```

## Docker

Example `Dockerfile` for running tests:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend ./frontend

WORKDIR /app/frontend

CMD ["npm", "run", "test:e2e"]
```

## Running Tests in CI

### Best Practices

1. **Use Official Images**: Use Playwright's official Docker images
2. **Cache Dependencies**: Cache node_modules for faster builds
3. **Parallel Execution**: Run tests in parallel where possible
4. **Store Artifacts**: Always store test reports and screenshots
5. **Fail Fast**: Configure to stop on first failure in CI
6. **Retry Logic**: Enable retries for flaky tests

### Configuration for CI

Update `playwright.config.ts`:

```typescript
export default defineConfig({
  // Use 1 worker on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,
  
  // Fail fast on CI
  forbidOnly: !!process.env.CI,
  
  // Use different reporter on CI
  reporter: process.env.CI ? 'github' : 'html',
});
```

## Notifications

### Slack Notification (GitHub Actions)

```yaml
- name: Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Playwright tests completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notification (GitLab)

```yaml
e2e-tests:
  script:
    - npm run test:e2e
  notify:
    - email:
        to: team@example.com
        on_failure: true
```

## Performance Tips

1. **Shard Tests**: Split tests across multiple machines
   ```yaml
   strategy:
     matrix:
       shard: [1, 2, 3, 4]
   steps:
     - run: npx playwright test --shard=${{ matrix.shard }}/4
   ```

2. **Selective Testing**: Only run tests for changed files
3. **Use Fixtures**: Reuse authentication state
4. **Optimize Waits**: Use proper waiting strategies

## Monitoring

Consider integrating with:
- **Datadog**: For test metrics
- **Grafana**: For visualization
- **Sentry**: For error tracking
- **Playwright Trace Viewer**: For debugging

## Resources

- [Playwright CI Guide](https://playwright.dev/docs/ci)
- [GitHub Actions](https://playwright.dev/docs/ci-intro#github-actions)
- [Docker Images](https://playwright.dev/docs/docker)






