/**
 * Core types for MCP-11 Universal Utility Library
 */

export interface MCPServer {
  name: string;
  package: string;
  version: string;
  description: string;
  configKeys?: string[];
  requiredEnvVars?: string[];
  optional?: boolean;
}

export interface InstallationConfig {
  servers: MCPServer[];
  configPath: string;
  backupPath: string;
  logLevel: 'silent' | 'minimal' | 'verbose';
  timeout: number;
  retryAttempts: number;
}

export interface InstallationResult {
  success: boolean;
  installedServers: string[];
  failedServers: string[];
  errors: InstallationError[];
  duration: number;
}

export interface InstallationError {
  server: string;
  message: string;
  code: string;
  recoverable: boolean;
}

export interface PlatformInfo {
  os: 'windows' | 'macos' | 'linux';
  arch: string;
  nodeVersion: string;
  npmVersion: string;
}

export interface ValidationResult {
  valid: boolean;
  server: string;
  message?: string;
  suggestion?: string;
}

export interface ConfigTemplate {
  server: string;
  envVars: Record<string, string>;
  description: string;
  required: boolean;
}

export interface RollbackPoint {
  timestamp: number;
  configBackup?: string;
  installedPackages: string[];
  action: string;
}

export interface ProgressCallback {
  (stage: string, progress: number, message?: string): void;
}

// Event system types
export interface InstallationEvent {
  type: 'start' | 'progress' | 'success' | 'error' | 'rollback';
  timestamp: number;
  data: any;
}

export type EventHandler = (event: InstallationEvent) => void;

// Configuration management types
export interface MCPConfigFile {
  servers: Record<string, any>;
  globalSettings?: Record<string, any>;
  version: string;
  lastUpdated: number;
}

// CLI types
export interface CLIOptions {
  config?: string;
  verbose?: boolean;
  dryRun?: boolean;
  force?: boolean;
  backup?: boolean;
}