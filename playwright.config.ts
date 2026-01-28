import { defineConfig, devices } from '@playwright/test';

const env = ((globalThis as any)?.process?.env ?? {}) as Record<string, string | undefined>;

const shouldStart = env.PLAYWRIGHT_WEB_SERVER !== 'false';
const runAllBrowsers = env.PLAYWRIGHT_ALL_BROWSERS === 'true';
const authBypass = env.PLAYWRIGHT_AUTH_BYPASS === 'true';
const baseURL = env.BASE_URL || 'http://localhost:3102';

const allProjects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 12'] },
  },
  {
    name: 'Microsoft Edge',
    use: { ...devices['Desktop Edge'], channel: 'msedge' },
  },
  {
    name: 'Google Chrome',
    use: { ...devices['Desktop Chrome'], channel: 'chrome' },
  },
];

const projects = runAllBrowsers
  ? allProjects
  : allProjects.filter((p) => p.name === 'chromium' || p.name === 'Mobile Chrome');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!env.CI,
  /* Retry on CI only */
  retries: env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    ...(authBypass ? { extraHTTPHeaders: { 'x-auth-dev-bypass': '1' } } : {}),

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects,

  /* Run your local dev server before starting the tests */
  webServer: shouldStart ? {
    command: 'NEXT_PUBLIC_AUTH_DEV_BYPASS=false AUTH_DEV_BYPASS=false node -e "require(\'fs\').rmSync(\'.next\',{recursive:true,force:true})" && next dev -p 3102',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
  } : undefined as any,

  /* Test timeout */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
});
