/**
 * MCP-11 Universal MCP Utility Library
 * Main entry point for programmatic usage
 */

export { InstallationOrchestrator } from './core/installation-orchestrator';
export { EnvironmentManager } from './config/env-manager';
export { 
  MCP_SERVER_REGISTRY, 
  getServerByPackage, 
  getRequiredServers, 
  getOptionalServers,
  validateRegistry 
} from './config/mcp-registry';
export { 
  getPlatformInfo, 
  validateNodeVersion, 
  validateNpmAvailability,
  getConfigDirectory,
  checkPermissions 
} from './utils/platform';

// Export types
export type {
  MCPServer,
  InstallationConfig,
  InstallationResult,
  InstallationError,
  PlatformInfo,
  ValidationResult,
  ConfigTemplate,
  RollbackPoint,
  ProgressCallback,
  EventHandler,
  InstallationEvent,
  MCPConfigFile,
  CLIOptions
} from './types/index';

// Version
export const VERSION = '1.0.0';