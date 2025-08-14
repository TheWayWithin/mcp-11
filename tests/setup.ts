/**
 * Test setup configuration
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Create test temp directory
const testTempDir = path.join(os.tmpdir(), 'mcp-11-tests');

beforeAll(async () => {
  await fs.ensureDir(testTempDir);
});

afterAll(async () => {
  await fs.remove(testTempDir);
});

// Provide test utilities globally
(global as any).testTempDir = testTempDir;