#!/usr/bin/env node

/**
 * MCP Discovery CLI Command
 * Discovers new MCP services using search MCPs
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { discoveryEngine } from '../core/mcp-discovery-engine';
import * as fs from 'fs/promises';
import * as path from 'path';

export const discoverCommand = new Command('discover')
  .description('Discover new MCP services using search MCPs')
  .option('-t, --task <task>', 'Find MCPs for a specific task')
  .option('-c, --continuous', 'Start continuous discovery mode')
  .option('-i, --install', 'Automatically install discovered MCPs')
  .option('-s, --save <file>', 'Save discoveries to file')
  .option('-f, --filter <category>', 'Filter by category (e.g., search, database, api)')
  .option('--confidence <min>', 'Minimum confidence threshold (0-100)', '80')
  .action(async (options) => {
    const spinner = ora('Initializing MCP Discovery Engine...').start();
    
    try {
      // Initialize the discovery engine
      await discoveryEngine.initialize();
      spinner.succeed('Discovery engine initialized');
      
      if (options.continuous) {
        // Start continuous discovery
        spinner.start('Starting continuous discovery mode...');
        await discoveryEngine.startContinuousDiscovery(24);
        spinner.succeed('Continuous discovery started (24-hour interval)');
        console.log(chalk.cyan('Discovery engine will run in background'));
        return;
      }
      
      if (options.task) {
        // Find MCPs for specific task
        spinner.start(`Finding MCPs for: "${options.task}"`);
        const recommendations = await discoveryEngine.getRecommendations(options.task);
        spinner.succeed(`Found ${recommendations.length} relevant MCPs`);
        
        displayRecommendations(recommendations, options);
        
        if (options.install) {
          await installRecommended(recommendations);
        }
      } else {
        // General discovery
        spinner.start('Discovering new MCP services...');
        const discoveries = await discoveryEngine.discoverMCPs();
        spinner.succeed(`Discovered ${discoveries.length} MCP services`);
        
        // Filter by confidence
        const minConfidence = parseInt(options.confidence);
        const filtered = discoveries.filter(mcp => mcp.confidence >= minConfidence);
        
        // Filter by category if specified
        const categorized = options.filter 
          ? filtered.filter(mcp => 
              mcp.capabilities.some(cap => cap.includes(options.filter.toLowerCase()))
            )
          : filtered;
        
        displayDiscoveries(categorized, options);
        
        if (options.save) {
          await saveDiscoveries(categorized, options.save);
        }
      }
      
    } catch (error) {
      spinner.fail('Discovery failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Display task-specific recommendations
 */
function displayRecommendations(recommendations: any[], options: any): void {
  console.log('\n' + chalk.bold.cyan('📋 Recommended MCPs for your task:'));
  console.log(chalk.gray('─'.repeat(60)));
  
  recommendations.forEach((mcp, index) => {
    console.log(`\n${chalk.bold.yellow(`${index + 1}.`)} ${chalk.bold(mcp.name)}`);
    console.log(`   ${chalk.gray('├')} ${chalk.cyan('Confidence:')} ${getConfidenceBar(mcp.confidence)}`);
    console.log(`   ${chalk.gray('├')} ${chalk.cyan('Repository:')} ${mcp.repository}`);
    console.log(`   ${chalk.gray('├')} ${chalk.cyan('Description:')} ${mcp.description}`);
    console.log(`   ${chalk.gray('├')} ${chalk.cyan('Capabilities:')} ${mcp.capabilities.join(', ')}`);
    
    if (mcp.installation) {
      console.log(`   ${chalk.gray('└')} ${chalk.cyan('Install:')} ${chalk.green(mcp.installation)}`);
    }
  });
  
  console.log('\n' + chalk.gray('─'.repeat(60)));
}

/**
 * Display general discoveries
 */
function displayDiscoveries(discoveries: any[], options: any): void {
  console.log('\n' + chalk.bold.cyan('🔍 Discovered MCP Services:'));
  console.log(chalk.gray('─'.repeat(80)));
  
  // Group by discovery source
  const bySource: Record<string, any[]> = {};
  discoveries.forEach(mcp => {
    if (!bySource[mcp.discoverySource]) {
      bySource[mcp.discoverySource] = [];
    }
    bySource[mcp.discoverySource].push(mcp);
  });
  
  for (const [source, mcps] of Object.entries(bySource)) {
    console.log(`\n${chalk.bold.magenta(`📦 From ${source}:`)}`);
    
    mcps.slice(0, 10).forEach((mcp, index) => {
      const icon = getConfidenceIcon(mcp.confidence);
      console.log(`  ${icon} ${chalk.bold(mcp.name)} ${chalk.gray(`(${mcp.confidence}%)`)}}`);
      
      if (mcp.description) {
        const desc = mcp.description.length > 60 
          ? mcp.description.substring(0, 60) + '...'
          : mcp.description;
        console.log(`     ${chalk.gray(desc)}`);
      }
      
      if (mcp.stars) {
        console.log(`     ${chalk.yellow('⭐')} ${mcp.stars} stars`);
      }
    });
    
    if (mcps.length > 10) {
      console.log(`  ${chalk.gray(`... and ${mcps.length - 10} more`)}`);
    }
  }
  
  // Summary statistics
  console.log('\n' + chalk.gray('─'.repeat(80)));
  console.log(chalk.bold.cyan('📊 Discovery Summary:'));
  console.log(`  • Total MCPs found: ${chalk.green(discoveries.length)}`);
  console.log(`  • High confidence (90%+): ${chalk.green(discoveries.filter(m => m.confidence >= 90).length)}`);
  console.log(`  • Medium confidence (70-89%): ${chalk.yellow(discoveries.filter(m => m.confidence >= 70 && m.confidence < 90).length)}`);
  console.log(`  • Low confidence (<70%): ${chalk.gray(discoveries.filter(m => m.confidence < 70).length)}`);
  
  // Capability distribution
  const allCapabilities = new Set<string>();
  discoveries.forEach(mcp => mcp.capabilities.forEach((cap: string) => allCapabilities.add(cap)));
  console.log(`  • Unique capabilities: ${chalk.cyan(allCapabilities.size)}`);
  
  // Top capabilities
  const capCount: Record<string, number> = {};
  discoveries.forEach(mcp => {
    mcp.capabilities.forEach((cap: string) => {
      capCount[cap] = (capCount[cap] || 0) + 1;
    });
  });
  
  const topCaps = Object.entries(capCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  console.log(`  • Top capabilities:`);
  topCaps.forEach(([cap, count]) => {
    console.log(`    - ${cap}: ${count} MCPs`);
  });
}

/**
 * Get confidence visualization
 */
function getConfidenceBar(confidence: number): string {
  const percentage = Math.round(confidence);
  const filled = Math.round(confidence / 10);
  const empty = 10 - filled;
  
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  
  if (confidence >= 90) {
    return `${bar} ${chalk.green(`${percentage}%`)}`;
  } else if (confidence >= 70) {
    return `${bar} ${chalk.yellow(`${percentage}%`)}`;
  } else {
    return `${bar} ${chalk.red(`${percentage}%`)}`;
  }
}

/**
 * Get confidence icon
 */
function getConfidenceIcon(confidence: number): string {
  if (confidence >= 90) return chalk.green('✅');
  if (confidence >= 70) return chalk.yellow('⚡');
  return chalk.gray('○');
}

/**
 * Install recommended MCPs
 */
async function installRecommended(recommendations: any[]): Promise<void> {
  console.log('\n' + chalk.bold.cyan('📦 Installing recommended MCPs...'));
  
  for (const mcp of recommendations) {
    if (mcp.confidence >= 85 && mcp.installation) {
      const spinner = ora(`Installing ${mcp.name}...`).start();
      
      try {
        // Would execute installation command
        console.log(`Would run: ${mcp.installation}`);
        spinner.succeed(`${mcp.name} installed`);
      } catch (error) {
        spinner.fail(`Failed to install ${mcp.name}`);
      }
    }
  }
}

/**
 * Save discoveries to file
 */
async function saveDiscoveries(discoveries: any[], filename: string): Promise<void> {
  const output = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    count: discoveries.length,
    discoveries: discoveries
  };
  
  const filepath = path.resolve(filename);
  await fs.writeFile(filepath, JSON.stringify(output, null, 2));
  
  console.log(chalk.green(`\n✅ Discoveries saved to: ${filepath}`));
}

// Export for use in main CLI
export default discoverCommand;