/**
 * Platform utilities tests
 */

import { 
  getPlatformInfo, 
  validateNodeVersion, 
  getConfigDirectory,
  getEnvVar,
  isCI,
  getMemoryInfo
} from '../src/utils/platform';

describe('Platform Utilities', () => {
  test('should get platform info', async () => {
    const info = await getPlatformInfo();
    
    expect(info.os).toMatch(/^(windows|macos|linux)$/);
    expect(info.arch).toBeTruthy();
    expect(info.nodeVersion).toMatch(/^v?\d+\.\d+\.\d+/);
  });

  test('should validate Node.js version', () => {
    const validation = validateNodeVersion();
    
    expect(validation).toHaveProperty('valid');
    expect(validation).toHaveProperty('message');
    expect(typeof validation.valid).toBe('boolean');
  });

  test('should get config directory', () => {
    const configDir = getConfigDirectory();
    expect(configDir).toBeTruthy();
    expect(configDir).toContain('.agent11');
  });

  test('should get environment variable', () => {
    process.env.TEST_VAR = 'test_value';
    
    expect(getEnvVar('TEST_VAR')).toBe('test_value');
    expect(getEnvVar('NON_EXISTENT_VAR')).toBeUndefined();
    expect(getEnvVar('NON_EXISTENT_VAR', 'fallback')).toBe('fallback');
    
    delete process.env.TEST_VAR;
  });

  test('should detect CI environment', () => {
    const originalCI = process.env.CI;
    
    process.env.CI = 'true';
    expect(isCI()).toBe(true);
    
    delete process.env.CI;
    expect(isCI()).toBe(false);
    
    if (originalCI) {
      process.env.CI = originalCI;
    }
  });

  test('should get memory info', () => {
    const memInfo = getMemoryInfo();
    
    expect(memInfo.total).toBeGreaterThan(0);
    expect(memInfo.free).toBeGreaterThan(0);
    expect(memInfo.usage).toBeGreaterThan(0);
    expect(memInfo.total).toBeGreaterThanOrEqual(memInfo.free);
  });
});