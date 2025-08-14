/**
 * Platform detection and system validation utilities
 */

import * as os from 'os';
import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'cross-spawn';
import * as semver from 'semver';
import { PlatformInfo } from '../types/index';

/**
 * Get current platform information
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  const platform = os.platform();
  const arch = os.arch();
  
  let osType: 'windows' | 'macos' | 'linux';
  switch (platform) {
    case 'win32':
      osType = 'windows';
      break;
    case 'darwin':
      osType = 'macos';
      break;
    default:
      osType = 'linux';
      break;
  }
  
  const nodeVersion = process.version;
  const npmVersion = await getNpmVersion();
  
  return {
    os: osType,
    arch,
    nodeVersion,
    npmVersion
  };
}

/**
 * Get NPM version
 */
async function getNpmVersion(): Promise<string> {
  return new Promise((resolve) => {
    const npm = spawn('npm', ['--version'], { stdio: 'pipe' });
    let version = '';
    
    npm.stdout.on('data', (data) => {
      version += data.toString();
    });
    
    npm.on('close', () => {
      resolve(version.trim() || 'unknown');
    });
    
    npm.on('error', () => {
      resolve('unknown');
    });
  });
}

/**
 * Validate Node.js version requirement (>=18.0.0)
 */
export function validateNodeVersion(): { valid: boolean; message: string } {
  const currentVersion = process.version;
  const minVersion = '18.0.0';
  
  try {
    if (semver.gte(currentVersion, minVersion)) {
      return {
        valid: true,
        message: `Node.js version ${currentVersion} meets requirements`
      };
    } else {
      return {
        valid: false,
        message: `Node.js version ${currentVersion} is below minimum required version ${minVersion}`
      };
    }
  } catch (error) {
    return {
      valid: false,
      message: `Failed to validate Node.js version: ${error}`
    };
  }
}

/**
 * Check if npm is available
 */
export async function validateNpmAvailability(): Promise<{ valid: boolean; message: string }> {
  return new Promise((resolve) => {
    const npm = spawn('npm', ['--version'], { stdio: 'pipe' });
    
    npm.on('close', (code) => {
      if (code === 0) {
        resolve({
          valid: true,
          message: 'NPM is available and functional'
        });
      } else {
        resolve({
          valid: false,
          message: 'NPM is not available or not functional'
        });
      }
    });
    
    npm.on('error', (error) => {
      resolve({
        valid: false,
        message: `NPM validation failed: ${error.message}`
      });
    });
  });
}

/**
 * Get system configuration directory
 */
export function getConfigDirectory(): string {
  const homeDir = os.homedir();
  
  switch (os.platform()) {
    case 'win32':
      return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'agent11');
    case 'darwin':
      return path.join(homeDir, '.agent11');
    default:
      return path.join(homeDir, '.agent11');
  }
}

/**
 * Ensure configuration directory exists
 */
export async function ensureConfigDirectory(): Promise<string> {
  const configDir = getConfigDirectory();
  await fs.ensureDir(configDir);
  return configDir;
}

/**
 * Get temporary directory for operations
 */
export function getTempDirectory(): string {
  return path.join(os.tmpdir(), 'mcp-11');
}

/**
 * Check if running with sufficient permissions
 */
export async function checkPermissions(): Promise<{ valid: boolean; message: string }> {
  try {
    const configDir = await ensureConfigDirectory();
    const testFile = path.join(configDir, '.permission-test');
    
    await fs.writeFile(testFile, 'test');
    await fs.remove(testFile);
    
    return {
      valid: true,
      message: 'Sufficient permissions for configuration directory'
    };
  } catch (error) {
    return {
      valid: false,
      message: `Insufficient permissions: ${error}`
    };
  }
}

/**
 * Get environment variable value with fallback
 */
export function getEnvVar(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

/**
 * Check if running in a CI environment
 */
export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER ||
    process.env.JENKINS_URL
  );
}

/**
 * Get system memory information
 */
export function getMemoryInfo(): { total: number; free: number; usage: number } {
  const total = os.totalmem();
  const free = os.freemem();
  const usage = total - free;
  
  return {
    total: Math.round(total / 1024 / 1024), // MB
    free: Math.round(free / 1024 / 1024),   // MB
    usage: Math.round(usage / 1024 / 1024)  // MB
  };
}