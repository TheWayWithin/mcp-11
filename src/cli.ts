#!/usr/bin/env node

/**
 * MCP-11 CLI - Command Line Interface for AGENT-11 Universal MCP Utility
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { InstallationOrchestrator } from './core/installation-orchestrator';
import { EnvironmentManager } from './config/env-manager';
import { MCP_SERVER_REGISTRY, validateRegistry } from './config/mcp-registry';
import { getPlatformInfo, validateNodeVersion } from './utils/platform';
import { CLIOptions } from './types/index';

const program = new Command();

// Package info
const packageJson = require('../package.json');

program
  .name('mcp-11')
  .description('AGENT-11 Universal MCP Utility Library - Transform complex MCP setup into a single command')
  .version(packageJson.version);

/**
 * Install command - Main installation workflow
 */
program
  .command('install')
  .description('Install and configure MCP servers')
  .option('-c, --config <path>', 'Custom configuration path')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --dry-run', 'Show what would be installed without executing')
  .option('-f, --force', 'Force installation even if servers exist')
  .option('--no-backup', 'Skip creating backup')
  .action(async (options: CLIOptions) => {
    console.log(chalk.bold.blue('🚀 MCP-11 Universal Installation'));
    console.log(chalk.gray('Transform complex MCP setup into a single command\n'));

    try {
      // System validation
      await performSystemCheck();

      if (options.dryRun) {
        await performDryRun();
        return;
      }

      // Interactive configuration if needed
      const shouldConfigure = await promptForConfiguration();
      
      if (shouldConfigure) {
        await configureEnvironment();
      }

      // Main installation
      await performInstallation(options);

    } catch (error) {
      console.error(chalk.red('Installation failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Status command - Check installation status
 */
program
  .command('status')
  .description('Check MCP server installation status')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options: CLIOptions) => {
    console.log(chalk.bold.blue('📊 MCP-11 Status Check\n'));

    try {
      await checkInstallationStatus(options.verbose || false);
    } catch (error) {
      console.error(chalk.red('Status check failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Config command - Manage configuration
 */
program
  .command('config')
  .description('Manage MCP configuration')
  .option('-e, --edit', 'Edit environment configuration')
  .option('-v, --validate', 'Validate current configuration')
  .option('-r, --reset', 'Reset configuration to defaults')
  .action(async (options) => {
    console.log(chalk.bold.blue('⚙️  MCP-11 Configuration\n'));

    try {
      if (options.edit) {
        await editConfiguration();
      } else if (options.validate) {
        await validateConfiguration();
      } else if (options.reset) {
        await resetConfiguration();
      } else {
        console.log(chalk.yellow('Please specify an action: --edit, --validate, or --reset'));
        console.log('Use: mcp-11 config --help for more information');
      }
    } catch (error) {
      console.error(chalk.red('Configuration failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Uninstall command - Remove MCP servers
 */
program
  .command('uninstall')
  .description('Uninstall MCP servers')
  .option('-a, --all', 'Uninstall all MCP servers')
  .option('-s, --servers <servers>', 'Comma-separated list of servers to uninstall')
  .action(async (options) => {
    console.log(chalk.bold.red('🗑️  MCP-11 Uninstall\n'));

    const confirmed = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Are you sure you want to uninstall MCP servers?',
      default: false
    }]);

    if (!confirmed.proceed) {
      console.log(chalk.gray('Uninstall cancelled'));
      return;
    }

    try {
      await performUninstall(options);
    } catch (error) {
      console.error(chalk.red('Uninstall failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * System check function
 */
async function performSystemCheck(): Promise<void> {
  const spinner = ora('Checking system requirements...').start();

  try {
    // Validate registry
    const registryValidation = validateRegistry();
    if (!registryValidation.valid) {
      spinner.fail('Registry validation failed');
      for (const error of registryValidation.errors) {
        console.error(chalk.red(`  - ${error}`));
      }
      throw new Error('Registry validation failed');
    }

    // Check Node.js version
    const nodeValidation = validateNodeVersion();
    if (!nodeValidation.valid) {
      spinner.fail('Node.js version check failed');
      throw new Error(nodeValidation.message);
    }

    // Get platform info
    const platform = await getPlatformInfo();
    
    spinner.succeed('System requirements validated');
    
    console.log(chalk.gray(`Platform: ${platform.os} ${platform.arch}`));
    console.log(chalk.gray(`Node.js: ${platform.nodeVersion}`));
    console.log(chalk.gray(`NPM: ${platform.npmVersion}\n`));
    
  } catch (error) {
    spinner.fail('System check failed');
    throw error;
  }
}

/**
 * Dry run function
 */
async function performDryRun(): Promise<void> {
  console.log(chalk.bold.yellow('📋 Dry Run - Installation Plan\n'));
  
  console.log(chalk.bold('Servers to install:'));
  for (const server of MCP_SERVER_REGISTRY) {
    const status = server.optional ? chalk.gray('[optional]') : chalk.green('[required]');
    console.log(`  ${status} ${server.name} (${server.package}@${server.version})`);
    console.log(`    ${chalk.gray(server.description)}`);
  }
  
  console.log(chalk.bold('\nConfiguration:'));
  const envManager = new EnvironmentManager();
  const templates = envManager.generateConfigTemplates();
  
  for (const template of templates) {
    console.log(`  ${template.server}:`);
    for (const envVar of Object.keys(template.envVars)) {
      console.log(`    ${chalk.cyan(envVar)}: ${chalk.gray('<requires configuration>')}`);
    }
  }
  
  console.log(chalk.yellow('\nRun without --dry-run to execute installation'));
}

/**
 * Configuration prompt
 */
async function promptForConfiguration(): Promise<boolean> {
  const envManager = new EnvironmentManager();
  const exists = await envManager.exists();
  
  if (!exists) {
    console.log(chalk.yellow('⚠️  No .env.mcp file found'));
    
    const response = await inquirer.prompt([{
      type: 'confirm',
      name: 'create',
      message: 'Would you like to create and configure environment variables?',
      default: true
    }]);
    
    return response.create;
  }
  
  // Validate existing config
  const validation = await envManager.validateEnvConfig();
  
  if (!validation.valid) {
    console.log(chalk.yellow(`⚠️  Configuration incomplete - ${validation.missing.length} variables need attention`));
    
    const response = await inquirer.prompt([{
      type: 'confirm',
      name: 'configure',
      message: 'Would you like to update the configuration now?',
      default: true
    }]);
    
    return response.configure;
  }
  
  return false;
}

/**
 * Environment configuration
 */
async function configureEnvironment(): Promise<void> {
  const spinner = ora('Setting up environment configuration...').start();
  
  try {
    const envManager = new EnvironmentManager();
    await envManager.ensureEnvFile();
    
    spinner.succeed('Environment configuration created');
    
    const validation = await envManager.validateEnvConfig();
    
    if (!validation.valid) {
      console.log(chalk.yellow('\n📝 Configuration Required'));
      console.log(`Please edit ${envManager.getEnvPath()} and configure:`);
      
      for (const missing of validation.missing) {
        console.log(`  ${chalk.cyan(missing)}: ${chalk.gray(validation.suggestions[missing])}`);
      }
    }
    
  } catch (error) {
    spinner.fail('Environment setup failed');
    throw error;
  }
}

/**
 * Main installation function
 */
async function performInstallation(options: CLIOptions): Promise<void> {
  console.log(chalk.bold.green('🔧 Starting MCP Server Installation\n'));
  
  const orchestrator = new InstallationOrchestrator({
    logLevel: options.verbose ? 'verbose' : 'minimal'
  });
  
  // Progress tracking
  let currentStep = '';
  const spinner = ora();
  
  const result = await orchestrator.install((stage, progress, message) => {
    if (stage !== currentStep) {
      if (currentStep) {
        spinner.succeed();
      }
      currentStep = stage;
      spinner.start(`[${Math.round(progress * 100)}%] ${stage}`);
    } else if (message) {
      spinner.text = `[${Math.round(progress * 100)}%] ${message}`;
    }
  });
  
  spinner.stop();
  
  // Results
  if (result.success) {
    console.log(chalk.bold.green('\n✅ Installation Completed Successfully!'));
    console.log(chalk.gray(`Duration: ${Math.round(result.duration / 1000)}s`));
    console.log(`\nInstalled servers (${result.installedServers.length}):`);
    
    for (const server of result.installedServers) {
      console.log(chalk.green(`  ✓ ${server}`));
    }
    
    if (result.failedServers.length > 0) {
      console.log(`\nFailed installations (${result.failedServers.length}):`);
      for (const server of result.failedServers) {
        console.log(chalk.red(`  ✗ ${server}`));
      }
    }
    
  } else {
    console.log(chalk.bold.red('\n❌ Installation Failed'));
    
    for (const error of result.errors) {
      console.log(chalk.red(`  ${error.server}: ${error.message}`));
    }
    
    throw new Error('Installation completed with errors');
  }
}

/**
 * Installation status check
 */
async function checkInstallationStatus(verbose: boolean): Promise<void> {
  const spinner = ora('Checking installation status...').start();
  
  try {
    // Check each server
    const statuses = await Promise.all(
      MCP_SERVER_REGISTRY.map(async (server) => {
        try {
          const { spawn } = require('cross-spawn');
          const result = await new Promise<boolean>((resolve) => {
            const npm = spawn('npm', ['list', '-g', server.package], { stdio: 'pipe' });
            npm.on('close', (code: number | null) => resolve(code === 0));
            npm.on('error', () => resolve(false));
          });
          
          return { server, installed: result };
        } catch {
          return { server, installed: false };
        }
      })
    );
    
    spinner.succeed('Status check complete');
    
    console.log(chalk.bold('\n📊 Installation Status\n'));
    
    const installed = statuses.filter(s => s.installed);
    const missing = statuses.filter(s => !s.installed);
    
    console.log(chalk.green(`✅ Installed: ${installed.length}/${statuses.length}`));
    console.log(chalk.red(`❌ Missing: ${missing.length}/${statuses.length}\n`));
    
    if (verbose || missing.length > 0) {
      console.log('Detailed Status:');
      for (const status of statuses) {
        const icon = status.installed ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${icon} ${status.server.name} (${status.server.package})`);
        
        if (verbose) {
          console.log(`    ${chalk.gray(status.server.description)}`);
        }
      }
    }
    
    // Check configuration
    const envManager = new EnvironmentManager();
    const validation = await envManager.validateEnvConfig();
    
    console.log(`\n⚙️  Configuration: ${validation.valid ? chalk.green('Complete') : chalk.yellow('Incomplete')}`);
    
    if (!validation.valid && validation.missing.length > 0) {
      console.log(chalk.yellow(`  Missing: ${validation.missing.join(', ')}`));
    }
    
  } catch (error) {
    spinner.fail('Status check failed');
    throw error;
  }
}

/**
 * Edit configuration
 */
async function editConfiguration(): Promise<void> {
  console.log('Configuration editing functionality will be implemented in next version');
  console.log(chalk.gray('For now, manually edit the .env.mcp file'));
}

/**
 * Validate configuration
 */
async function validateConfiguration(): Promise<void> {
  const spinner = ora('Validating configuration...').start();
  
  try {
    const envManager = new EnvironmentManager();
    const validation = await envManager.validateEnvConfig();
    
    if (validation.valid) {
      spinner.succeed('Configuration is valid');
    } else {
      spinner.warn(`Configuration has ${validation.missing.length} issues`);
      
      console.log('\nMissing or invalid variables:');
      for (const missing of validation.missing) {
        console.log(chalk.yellow(`  ${missing}: ${validation.suggestions[missing]}`));
      }
    }
    
  } catch (error) {
    spinner.fail('Configuration validation failed');
    throw error;
  }
}

/**
 * Reset configuration
 */
async function resetConfiguration(): Promise<void> {
  console.log('Configuration reset functionality will be implemented in next version');
}

/**
 * Uninstall function
 */
async function performUninstall(options: any): Promise<void> {
  console.log('Uninstall functionality will be implemented in next version');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled rejection:'), error);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}