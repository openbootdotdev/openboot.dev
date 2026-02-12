/**
 * Vitest global setup file
 * Runs before all test files
 */

import { expect } from 'vitest';

// Add custom matchers if needed
// expect.extend({ ... });

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-32-chars-long';
process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
