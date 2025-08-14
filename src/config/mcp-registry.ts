/**
 * MCP Server Registry - Defines the 8 essential MCP servers for AGENT-11
 */

import { MCPServer } from '../types/index';

export const MCP_SERVER_REGISTRY: MCPServer[] = [
  {
    name: 'Filesystem MCP',
    package: '@modelcontextprotocol/server-filesystem',
    version: '2025.7.29',
    description: 'File system operations and management',
    configKeys: ['filesystem'],
    requiredEnvVars: [],
    optional: false
  },
  {
    name: 'Memory MCP',
    package: '@modelcontextprotocol/server-memory',
    version: '2025.8.4',
    description: 'Persistent memory and context management',
    configKeys: ['memory'],
    requiredEnvVars: [],
    optional: false
  },
  {
    name: 'Git MCP',
    package: '@cyanheads/git-mcp-server',
    version: '2.3.2',
    description: 'Git repository management and operations',
    configKeys: ['git'],
    requiredEnvVars: [],
    optional: false
  },
  {
    name: 'GitHub MCP',
    package: '@edjl/github-mcp',
    version: '1.0.7',
    description: 'GitHub API integration and repository management',
    configKeys: ['github'],
    requiredEnvVars: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    optional: false
  },
  {
    name: 'Playwright MCP',
    package: '@playwright/mcp',
    version: '0.0.33',
    description: 'Web automation and testing capabilities',
    configKeys: ['playwright'],
    requiredEnvVars: [],
    optional: false
  },
  {
    name: 'Context7 MCP',
    package: '@upstash/context7-mcp',
    version: 'v1.0.14',
    description: 'Context management and data persistence',
    configKeys: ['context7'],
    requiredEnvVars: ['CONTEXT7_API_KEY', 'CONTEXT7_PROJECT_ID'],
    optional: false
  },
  {
    name: 'Firecrawl MCP',
    package: 'firecrawl-mcp',
    version: '1.12.0',
    description: 'Web scraping and content extraction',
    configKeys: ['firecrawl'],
    requiredEnvVars: ['FIRECRAWL_API_KEY'],
    optional: false
  },
  {
    name: 'Figma MCP',
    package: 'figma-developer-mcp',
    version: '0.5.0',
    description: 'Figma design file access and management',
    configKeys: ['figma'],
    requiredEnvVars: ['FIGMA_ACCESS_TOKEN'],
    optional: true
  }
];

/**
 * Get server configuration by package name
 */
export function getServerByPackage(packageName: string): MCPServer | undefined {
  return MCP_SERVER_REGISTRY.find(server => server.package === packageName);
}

/**
 * Get all required servers (non-optional)
 */
export function getRequiredServers(): MCPServer[] {
  return MCP_SERVER_REGISTRY.filter(server => !server.optional);
}

/**
 * Get all optional servers
 */
export function getOptionalServers(): MCPServer[] {
  return MCP_SERVER_REGISTRY.filter(server => server.optional);
}

/**
 * Get all servers that require environment variables
 */
export function getServersWithEnvVars(): MCPServer[] {
  return MCP_SERVER_REGISTRY.filter(server => 
    server.requiredEnvVars && server.requiredEnvVars.length > 0
  );
}

/**
 * Validate server registry integrity
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const packageNames = new Set<string>();
  
  for (const server of MCP_SERVER_REGISTRY) {
    // Check for duplicate package names
    if (packageNames.has(server.package)) {
      errors.push(`Duplicate package name: ${server.package}`);
    }
    packageNames.add(server.package);
    
    // Validate required fields
    if (!server.name || !server.package || !server.version) {
      errors.push(`Server ${server.package} missing required fields`);
    }
    
    // Validate version format
    if (!/^[\d\w\.-]+$/.test(server.version)) {
      errors.push(`Server ${server.package} has invalid version format: ${server.version}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}