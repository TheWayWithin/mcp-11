/**
 * InstallationOrchestrator - Core engine for MCP server installation and configuration
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn } from 'cross-spawn';
import chalk from 'chalk';
import ora from 'ora';
import { 
  MCPServer, 
  InstallationConfig, 
  InstallationResult, 
  InstallationError, 
  ValidationResult,
  RollbackPoint,
  ProgressCallback,
  EventHandler,
  InstallationEvent
} from '../types/index';
import { MCP_SERVER_REGISTRY, getRequiredServers } from '../config/mcp-registry';
import { getPlatformInfo, validateNodeVersion, validateNpmAvailability, getConfigDirectory } from '../utils/platform';

export class InstallationOrchestrator {
  private config: InstallationConfig;
  private rollbackPoints: RollbackPoint[] = [];
  private eventHandlers: EventHandler[] = [];
  private spinner: ReturnType<typeof ora>;
  
  constructor(config?: Partial<InstallationConfig>) {
    this.config = {
      servers: getRequiredServers(),
      configPath: path.join(getConfigDirectory(), 'mcp-config.json'),
      backupPath: path.join(getConfigDirectory(), 'backups'),
      logLevel: 'minimal',
      timeout: 300000, // 5 minutes
      retryAttempts: 3,
      ...config
    };
    
    this.spinner = ora();
  }

  /**
   * Main installation workflow
   */
  async install(progressCallback?: ProgressCallback): Promise<InstallationResult> {
    const startTime = Date.now();
    const result: InstallationResult = {
      success: false,
      installedServers: [],
      failedServers: [],
      errors: [],
      duration: 0
    };

    try {
      this.emitEvent('start', { servers: this.config.servers.length });
      
      // Phase 1: System validation
      await this.validateSystem(progressCallback);
      
      // Phase 2: Create rollback point
      await this.createRollbackPoint('pre-installation');
      
      // Phase 3: Install servers
      await this.installServers(result, progressCallback);
      
      // Phase 4: Validate installations
      await this.validateInstallations(result, progressCallback);
      
      // Phase 5: Update configuration
      await this.updateConfiguration(result, progressCallback);
      
      result.success = result.errors.length === 0;
      
      if (result.success) {
        this.emitEvent('success', result);
      } else {
        this.emitEvent('error', result);
      }
      
    } catch (error) {
      const installError: InstallationError = {
        server: 'system',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'INSTALLATION_FAILED',
        recoverable: true
      };
      
      result.errors.push(installError);
      result.success = false;
      
      this.emitEvent('error', { error: installError });
    }
    
    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Validate system requirements
   */
  private async validateSystem(progressCallback?: ProgressCallback): Promise<void> {
    this.updateProgress('Validating system requirements...', 0.1, progressCallback);
    
    // Check Node.js version
    const nodeValidation = validateNodeVersion();
    if (!nodeValidation.valid) {
      throw new Error(`Node.js validation failed: ${nodeValidation.message}`);
    }
    
    // Check NPM availability
    const npmValidation = await validateNpmAvailability();
    if (!npmValidation.valid) {
      throw new Error(`NPM validation failed: ${npmValidation.message}`);
    }
    
    // Get platform info
    const platform = await getPlatformInfo();
    
    if (this.config.logLevel === 'verbose') {
      console.log(chalk.gray(`Platform: ${platform.os} ${platform.arch}`));
      console.log(chalk.gray(`Node.js: ${platform.nodeVersion}`));
      console.log(chalk.gray(`NPM: ${platform.npmVersion}`));
    }
    
    this.updateProgress('System validation complete', 0.2, progressCallback);
  }

  /**
   * Install MCP servers
   */
  private async installServers(result: InstallationResult, progressCallback?: ProgressCallback): Promise<void> {
    const total = this.config.servers.length;
    
    for (let i = 0; i < total; i++) {
      const server = this.config.servers[i];
      const progress = 0.2 + (i / total) * 0.6;
      
      this.updateProgress(`Installing ${server.name}...`, progress, progressCallback);
      
      try {
        await this.installServer(server);
        result.installedServers.push(server.package);
        
        if (this.config.logLevel !== 'silent') {
          console.log(chalk.green(`✓ ${server.name} installed successfully`));
        }
        
      } catch (error) {
        const installError: InstallationError = {
          server: server.package,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'INSTALL_FAILED',
          recoverable: true
        };
        
        result.errors.push(installError);
        result.failedServers.push(server.package);
        
        if (this.config.logLevel !== 'silent') {
          console.log(chalk.red(`✗ ${server.name} installation failed: ${installError.message}`));
        }
      }
    }
  }

  /**
   * Install individual MCP server
   */
  private async installServer(server: MCPServer): Promise<void> {
    return new Promise((resolve, reject) => {
      const packageSpec = server.version ? `${server.package}@${server.version}` : server.package;
      const npm = spawn('npm', ['install', '-g', packageSpec], { 
        stdio: this.config.logLevel === 'verbose' ? 'inherit' : 'pipe' 
      });
      
      let stderr = '';
      
      if (npm.stderr) {
        npm.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      const timeout = setTimeout(() => {
        npm.kill('SIGTERM');
        reject(new Error(`Installation timeout for ${server.package}`));
      }, this.config.timeout);
      
      npm.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`NPM install failed with code ${code}: ${stderr}`));
        }
      });
      
      npm.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`NPM spawn failed: ${error.message}`));
      });
    });
  }

  /**
   * Validate installed servers
   */
  private async validateInstallations(result: InstallationResult, progressCallback?: ProgressCallback): Promise<void> {
    this.updateProgress('Validating installations...', 0.8, progressCallback);
    
    for (const packageName of result.installedServers) {
      try {
        const validation = await this.validateServerInstallation(packageName);
        if (!validation.valid) {
          const error: InstallationError = {
            server: packageName,
            message: validation.message || 'Validation failed',
            code: 'VALIDATION_FAILED',
            recoverable: true
          };
          result.errors.push(error);
        }
      } catch (error) {
        const validationError: InstallationError = {
          server: packageName,
          message: error instanceof Error ? error.message : 'Validation error',
          code: 'VALIDATION_ERROR',
          recoverable: true
        };
        result.errors.push(validationError);
      }
    }
  }

  /**
   * Validate individual server installation
   */
  private async validateServerInstallation(packageName: string): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const npm = spawn('npm', ['list', '-g', packageName], { stdio: 'pipe' });
      
      npm.on('close', (code) => {
        if (code === 0) {
          resolve({
            valid: true,
            server: packageName,
            message: 'Package installed and accessible'
          });
        } else {
          resolve({
            valid: false,
            server: packageName,
            message: 'Package not found in global installations'
          });
        }
      });
      
      npm.on('error', () => {
        resolve({
          valid: false,
          server: packageName,
          message: 'Failed to check package installation'
        });
      });
    });
  }

  /**
   * Update MCP configuration
   */
  private async updateConfiguration(result: InstallationResult, progressCallback?: ProgressCallback): Promise<void> {
    this.updateProgress('Updating configuration...', 0.9, progressCallback);
    
    const configDir = path.dirname(this.config.configPath);
    await fs.ensureDir(configDir);
    
    const config = {
      servers: result.installedServers.reduce((acc, packageName) => {
        const server = MCP_SERVER_REGISTRY.find(s => s.package === packageName);
        if (server) {
          acc[server.name] = {
            package: server.package,
            version: server.version,
            enabled: true,
            installedAt: new Date().toISOString()
          };
        }
        return acc;
      }, {} as Record<string, any>),
      version: '1.0.0',
      lastUpdated: Date.now()
    };
    
    await fs.writeFile(this.config.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Create rollback point
   */
  private async createRollbackPoint(action: string): Promise<void> {
    const timestamp = Date.now();
    const backupDir = path.join(this.config.backupPath, timestamp.toString());
    
    await fs.ensureDir(backupDir);
    
    // Backup existing configuration if it exists
    let configBackup: string | undefined;
    if (await fs.pathExists(this.config.configPath)) {
      configBackup = path.join(backupDir, 'mcp-config.json');
      await fs.copy(this.config.configPath, configBackup);
    }
    
    const rollbackPoint: RollbackPoint = {
      timestamp,
      configBackup,
      installedPackages: [],
      action
    };
    
    this.rollbackPoints.push(rollbackPoint);
  }

  /**
   * Rollback to previous state
   */
  async rollback(): Promise<void> {
    if (this.rollbackPoints.length === 0) {
      throw new Error('No rollback points available');
    }
    
    this.emitEvent('rollback', { message: 'Starting rollback operation' });
    
    const rollbackPoint = this.rollbackPoints[this.rollbackPoints.length - 1];
    
    // Restore configuration backup
    if (rollbackPoint.configBackup && await fs.pathExists(rollbackPoint.configBackup)) {
      await fs.copy(rollbackPoint.configBackup, this.config.configPath);
    }
    
    // Remove installed packages (in reverse order)
    for (const packageName of rollbackPoint.installedPackages.reverse()) {
      try {
        await this.uninstallServer(packageName);
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Failed to uninstall ${packageName} during rollback`));
      }
    }
  }

  /**
   * Uninstall server
   */
  private async uninstallServer(packageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['uninstall', '-g', packageName], { stdio: 'pipe' });
      
      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to uninstall ${packageName}`));
        }
      });
      
      npm.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Add event handler
   */
  on(handler: EventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Emit event to all handlers
   */
  private emitEvent(type: InstallationEvent['type'], data: any): void {
    const event: InstallationEvent = {
      type,
      timestamp: Date.now(),
      data
    };
    
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.warn('Event handler error:', error);
      }
    });
  }

  /**
   * Update progress with optional callback
   */
  private updateProgress(message: string, progress: number, callback?: ProgressCallback): void {
    if (callback) {
      callback(message, progress);
    }
    
    if (this.config.logLevel === 'verbose') {
      console.log(chalk.gray(`[${Math.round(progress * 100)}%] ${message}`));
    }
  }
}