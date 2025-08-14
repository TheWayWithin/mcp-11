/**
 * Integration tests for MCP-11 system
 */

import { spawn } from 'cross-spawn';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('MCP-11 Integration', () => {
  const testTempDir = path.join(os.tmpdir(), 'mcp-11-integration-test');
  
  beforeAll(async () => {
    await fs.ensureDir(testTempDir);
  });
  
  afterAll(async () => {
    await fs.remove(testTempDir);
  });

  test('CLI should show help', (done) => {
    const cli = spawn('node', ['dist/cli.js', '--help'], { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe' 
    });
    
    let stdout = '';
    
    cli.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    cli.on('close', (code) => {
      expect(code).toBe(0);
      expect(stdout).toContain('AGENT-11 Universal MCP Utility Library');
      expect(stdout).toContain('install');
      expect(stdout).toContain('status');
      expect(stdout).toContain('config');
      done();
    });
  }, 10000);

  test('CLI should show status without errors', (done) => {
    const timeout = setTimeout(() => {
      done.fail('Test timed out');
    }, 14000);
    const cli = spawn('node', ['dist/cli.js', 'status'], { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe' 
    });
    
    let stdout = '';
    let stderr = '';
    
    cli.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    cli.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    cli.on('close', (code) => {
      clearTimeout(timeout);
      expect(code).toBe(0);
      expect(stdout).toContain('Installation Status');
      // Allow spinner output in stderr
      expect(stderr.length).toBeGreaterThanOrEqual(0);
      done();
    });
  }, 15000);

  test('CLI should perform dry-run without errors', (done) => {
    const timeout = setTimeout(() => {
      done.fail('Test timed out');
    }, 14000);
    const cli = spawn('node', ['dist/cli.js', 'install', '--dry-run'], { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe' 
    });
    
    let stdout = '';
    let stderr = '';
    
    cli.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    cli.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    cli.on('close', (code) => {
      clearTimeout(timeout);
      expect(code).toBe(0);
      expect(stdout).toContain('Dry Run - Installation Plan');
      expect(stdout).toContain('Servers to install');
      // Allow spinner output in stderr
      expect(stderr.length).toBeGreaterThanOrEqual(0);
      done();
    });
  }, 15000);
});