/**
 * MCP Self-Discovery Engine
 * Uses search MCPs to automatically discover new MCP services
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface DiscoveredMCP {
  name: string;
  repository: string;
  description: string;
  capabilities: string[];
  confidence: number;
  discoverySource: string;
  lastUpdated: string;
  stars?: number;
  installation?: string;
}

interface SearchQuery {
  query: string;
  source: 'grep-mcp' | 'github' | 'google' | 'npm';
  filters?: Record<string, any>;
}

export class MCPDiscoveryEngine {
  private discoveredMCPs: Map<string, DiscoveredMCP> = new Map();
  private searchMCPs: Record<string, any> = {
    'grep-mcp': {
      url: 'https://mcp.grep.app',
      installed: false,
      capabilities: ['code-search', 'pattern-matching', 'github-search']
    },
    'github-mcp': {
      package: '@modelcontextprotocol/server-github',
      installed: false,
      capabilities: ['repo-search', 'code-browsing', 'commit-analysis']
    },
    'google-search-mcp': {
      package: 'google-search-mcp-server',
      installed: false,
      capabilities: ['web-search', 'documentation-search']
    }
  };

  /**
   * Initialize the discovery engine with search MCPs
   */
  async initialize(): Promise<void> {
    console.log('🔍 Initializing MCP Discovery Engine...');
    
    // Check and install search MCPs
    for (const [name, config] of Object.entries(this.searchMCPs)) {
      if (!config.installed) {
        await this.installSearchMCP(name, config);
      }
    }
    
    // Load existing discoveries
    await this.loadDiscoveryCache();
  }

  /**
   * Install a search MCP for discovery purposes
   */
  private async installSearchMCP(name: string, config: any): Promise<void> {
    try {
      if (config.package) {
        console.log(`📦 Installing ${name}...`);
        await execAsync(`npm install -g ${config.package}`);
        this.searchMCPs[name].installed = true;
      } else if (config.url) {
        // URL-based MCPs are configured differently
        console.log(`🔗 Configuring ${name} at ${config.url}`);
        this.searchMCPs[name].installed = true;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to install ${name}:`, error);
    }
  }

  /**
   * Discover new MCPs using multiple search strategies
   */
  async discoverMCPs(): Promise<DiscoveredMCP[]> {
    console.log('🔎 Starting MCP discovery process...');
    
    const discoveries: DiscoveredMCP[] = [];
    
    // Strategy 1: Search GitHub for MCP repositories
    const githubResults = await this.searchGitHub();
    discoveries.push(...githubResults);
    
    // Strategy 2: Search code patterns using Grep MCP
    const grepResults = await this.searchWithGrepMCP();
    discoveries.push(...grepResults);
    
    // Strategy 3: Search NPM registry
    const npmResults = await this.searchNPM();
    discoveries.push(...npmResults);
    
    // Strategy 4: Search Google for MCP documentation
    const googleResults = await this.searchGoogle();
    discoveries.push(...googleResults);
    
    // Strategy 5: Analyze awesome lists
    const awesomeResults = await this.searchAwesomeLists();
    discoveries.push(...awesomeResults);
    
    // Deduplicate and rank discoveries
    const rankedDiscoveries = this.rankDiscoveries(discoveries);
    
    // Save to cache
    await this.saveDiscoveryCache(rankedDiscoveries);
    
    return rankedDiscoveries;
  }

  /**
   * Search GitHub for MCP repositories
   */
  private async searchGitHub(): Promise<DiscoveredMCP[]> {
    const queries = [
      'topic:mcp-server',
      'topic:model-context-protocol',
      '"mcp server" in:description',
      'org:modelcontextprotocol',
      'filename:mcp.json',
      '"extends @modelcontextprotocol" in:file'
    ];
    
    const discoveries: DiscoveredMCP[] = [];
    
    for (const query of queries) {
      try {
        // Use GitHub API or GitHub MCP if available
        const results = await this.executeGitHubSearch(query);
        discoveries.push(...this.parseGitHubResults(results));
      } catch (error) {
        console.warn(`GitHub search failed for "${query}":`, error);
      }
    }
    
    return discoveries;
  }

  /**
   * Search using Grep MCP for code patterns
   */
  private async searchWithGrepMCP(): Promise<DiscoveredMCP[]> {
    const patterns = [
      'class.*MCP.*Server',
      'implements.*ModelContextProtocol',
      'mcp\\.server\\.register',
      '@modelcontextprotocol/sdk',
      'from mcp import Server',
      'MCP_SERVER_CONFIG'
    ];
    
    const discoveries: DiscoveredMCP[] = [];
    
    for (const pattern of patterns) {
      try {
        // Use Grep MCP API
        const results = await this.executeGrepSearch(pattern);
        discoveries.push(...this.parseGrepResults(results));
      } catch (error) {
        console.warn(`Grep MCP search failed for "${pattern}":`, error);
      }
    }
    
    return discoveries;
  }

  /**
   * Search NPM registry for MCP packages
   */
  private async searchNPM(): Promise<DiscoveredMCP[]> {
    const keywords = [
      'mcp-server',
      'model-context-protocol',
      'mcp',
      'modelcontextprotocol',
      'claude-mcp',
      'anthropic-mcp'
    ];
    
    const discoveries: DiscoveredMCP[] = [];
    
    for (const keyword of keywords) {
      try {
        const { stdout } = await execAsync(`npm search ${keyword} --json`);
        const results = JSON.parse(stdout);
        
        for (const pkg of results) {
          if (this.isMCPPackage(pkg)) {
            discoveries.push({
              name: pkg.name,
              repository: `npm:${pkg.name}`,
              description: pkg.description || '',
              capabilities: this.extractCapabilitiesFromDescription(pkg.description),
              confidence: this.calculateConfidence(pkg),
              discoverySource: 'npm',
              lastUpdated: pkg.date || new Date().toISOString(),
              installation: `npm install -g ${pkg.name}`
            });
          }
        }
      } catch (error) {
        console.warn(`NPM search failed for "${keyword}":`, error);
      }
    }
    
    return discoveries;
  }

  /**
   * Search Google for MCP documentation and resources
   */
  private async searchGoogle(): Promise<DiscoveredMCP[]> {
    const queries = [
      'site:github.com "MCP server" implementation',
      'site:npmjs.com model context protocol',
      '"how to create MCP server" tutorial',
      'anthropic MCP server examples',
      'claude desktop MCP integration'
    ];
    
    const discoveries: DiscoveredMCP[] = [];
    
    // This would use Google Search MCP when available
    // For now, returning placeholder
    console.log('Google search would execute:', queries);
    
    return discoveries;
  }

  /**
   * Search and analyze awesome lists for MCP servers
   */
  private async searchAwesomeLists(): Promise<DiscoveredMCP[]> {
    const awesomeLists = [
      'https://github.com/punkpeye/awesome-mcp-servers',
      'https://github.com/wong2/awesome-mcp-servers',
      'https://github.com/modelcontextprotocol/servers'
    ];
    
    const discoveries: DiscoveredMCP[] = [];
    
    for (const listUrl of awesomeLists) {
      try {
        // Fetch and parse awesome list
        const listContent = await this.fetchAwesomeList(listUrl);
        const mcps = this.parseAwesomeList(listContent);
        discoveries.push(...mcps);
      } catch (error) {
        console.warn(`Failed to fetch awesome list ${listUrl}:`, error);
      }
    }
    
    return discoveries;
  }

  /**
   * Execute GitHub search (would use GitHub MCP)
   */
  private async executeGitHubSearch(query: string): Promise<any> {
    // Placeholder - would integrate with GitHub MCP
    console.log(`GitHub search: ${query}`);
    return [];
  }

  /**
   * Execute Grep MCP search
   */
  private async executeGrepSearch(pattern: string): Promise<any> {
    // Placeholder - would integrate with Grep MCP API
    console.log(`Grep search: ${pattern}`);
    return [];
  }

  /**
   * Parse GitHub search results
   */
  private parseGitHubResults(results: any[]): DiscoveredMCP[] {
    return results.map(repo => ({
      name: repo.name,
      repository: repo.html_url,
      description: repo.description,
      capabilities: this.extractCapabilitiesFromRepo(repo),
      confidence: this.calculateRepoConfidence(repo),
      discoverySource: 'github',
      lastUpdated: repo.updated_at,
      stars: repo.stargazers_count
    }));
  }

  /**
   * Parse Grep MCP results
   */
  private parseGrepResults(results: any[]): DiscoveredMCP[] {
    // Extract MCP information from code matches
    return results.map(match => ({
      name: this.extractMCPNameFromCode(match.content),
      repository: match.repository,
      description: 'Discovered via code pattern',
      capabilities: this.extractCapabilitiesFromCode(match.content),
      confidence: 75, // Lower confidence for pattern-based discovery
      discoverySource: 'grep-mcp',
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Fetch and parse awesome list content
   */
  private async fetchAwesomeList(url: string): Promise<string> {
    // Would use fetch or GitHub MCP to get content
    return '';
  }

  /**
   * Parse awesome list for MCP entries
   */
  private parseAwesomeList(content: string): DiscoveredMCP[] {
    const discoveries: DiscoveredMCP[] = [];
    
    // Parse markdown for MCP entries
    const lines = content.split('\n');
    const mcpPattern = /\[([^\]]+)\]\(([^)]+)\)\s*-\s*(.+)/;
    
    for (const line of lines) {
      const match = line.match(mcpPattern);
      if (match) {
        discoveries.push({
          name: match[1],
          repository: match[2],
          description: match[3],
          capabilities: this.extractCapabilitiesFromDescription(match[3]),
          confidence: 85, // Good confidence for curated lists
          discoverySource: 'awesome-list',
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    return discoveries;
  }

  /**
   * Check if NPM package is likely an MCP
   */
  private isMCPPackage(pkg: any): boolean {
    const indicators = [
      'mcp',
      'model-context-protocol',
      'modelcontextprotocol',
      '@modelcontextprotocol'
    ];
    
    const name = pkg.name.toLowerCase();
    const description = (pkg.description || '').toLowerCase();
    const keywords = (pkg.keywords || []).map((k: string) => k.toLowerCase());
    
    return indicators.some(indicator => 
      name.includes(indicator) || 
      description.includes(indicator) ||
      keywords.includes(indicator)
    );
  }

  /**
   * Extract capabilities from description text
   */
  private extractCapabilitiesFromDescription(description: string): string[] {
    const capabilities: string[] = [];
    const capabilityKeywords = {
      'search': ['search', 'find', 'query', 'lookup'],
      'database': ['database', 'sql', 'postgres', 'mysql', 'mongodb'],
      'api': ['api', 'rest', 'graphql', 'endpoint'],
      'file': ['file', 'filesystem', 'directory', 'folder'],
      'git': ['git', 'version', 'commit', 'branch'],
      'test': ['test', 'testing', 'qa', 'quality'],
      'deploy': ['deploy', 'deployment', 'ci/cd', 'pipeline'],
      'auth': ['auth', 'authentication', 'login', 'security'],
      'email': ['email', 'mail', 'smtp', 'send'],
      'web': ['web', 'scrape', 'crawl', 'fetch']
    };
    
    const desc = description.toLowerCase();
    
    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        capabilities.push(capability);
      }
    }
    
    return capabilities;
  }

  /**
   * Extract capabilities from repository info
   */
  private extractCapabilitiesFromRepo(repo: any): string[] {
    const capabilities: string[] = [];
    
    // Analyze repo topics
    if (repo.topics) {
      capabilities.push(...repo.topics);
    }
    
    // Analyze description
    if (repo.description) {
      capabilities.push(...this.extractCapabilitiesFromDescription(repo.description));
    }
    
    return [...new Set(capabilities)]; // Deduplicate
  }

  /**
   * Extract capabilities from code content
   */
  private extractCapabilitiesFromCode(code: string): string[] {
    const capabilities: string[] = [];
    
    // Look for method names that indicate capabilities
    const methodPatterns = [
      /function\s+(\w+)/g,
      /async\s+(\w+)/g,
      /class\s+(\w+)MCP/g,
      /\.register\(['"](\w+)['"]/g
    ];
    
    for (const pattern of methodPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          capabilities.push(match[1].toLowerCase());
        }
      }
    }
    
    return capabilities;
  }

  /**
   * Extract MCP name from code
   */
  private extractMCPNameFromCode(code: string): string {
    // Try to extract class name or package name
    const patterns = [
      /class\s+(\w+MCP\w*)/,
      /export\s+class\s+(\w+)/,
      /package\s+name\s*=\s*["']([^"']+)/,
      /@name\s+(\w+)/
    ];
    
    for (const pattern of patterns) {
      const match = code.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }
    
    return 'UnknownMCP';
  }

  /**
   * Calculate confidence score for NPM package
   */
  private calculateConfidence(pkg: any): number {
    let confidence = 50; // Base confidence
    
    // Factors that increase confidence
    if (pkg.name.includes('@modelcontextprotocol')) confidence += 20;
    if (pkg.name.includes('mcp-server')) confidence += 15;
    if (pkg.keywords?.includes('mcp')) confidence += 10;
    if (pkg.links?.repository) confidence += 5;
    if (pkg.links?.homepage) confidence += 5;
    
    // Recent update increases confidence
    const lastUpdate = new Date(pkg.date);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) confidence += 10;
    if (daysSinceUpdate < 7) confidence += 5;
    
    return Math.min(100, confidence);
  }

  /**
   * Calculate confidence for GitHub repository
   */
  private calculateRepoConfidence(repo: any): number {
    let confidence = 60; // Base confidence for GitHub repos
    
    // Stars indicate popularity
    if (repo.stargazers_count > 1000) confidence += 15;
    else if (repo.stargazers_count > 100) confidence += 10;
    else if (repo.stargazers_count > 10) confidence += 5;
    
    // Recent activity
    const lastUpdate = new Date(repo.updated_at);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) confidence += 10;
    
    // Has documentation
    if (repo.has_wiki) confidence += 5;
    if (repo.homepage) confidence += 5;
    
    return Math.min(100, confidence);
  }

  /**
   * Rank and deduplicate discoveries
   */
  private rankDiscoveries(discoveries: DiscoveredMCP[]): DiscoveredMCP[] {
    // Deduplicate by name
    const uniqueMap = new Map<string, DiscoveredMCP>();
    
    for (const mcp of discoveries) {
      const existing = uniqueMap.get(mcp.name);
      if (!existing || mcp.confidence > existing.confidence) {
        uniqueMap.set(mcp.name, mcp);
      }
    }
    
    // Sort by confidence
    return Array.from(uniqueMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Load cached discoveries
   */
  private async loadDiscoveryCache(): Promise<void> {
    try {
      const cacheFile = path.join(process.cwd(), '.mcp-discoveries.json');
      const data = await fs.readFile(cacheFile, 'utf-8');
      const cache = JSON.parse(data);
      
      for (const mcp of cache.discoveries) {
        this.discoveredMCPs.set(mcp.name, mcp);
      }
      
      console.log(`📚 Loaded ${this.discoveredMCPs.size} cached MCP discoveries`);
    } catch (error) {
      // Cache doesn't exist yet
      console.log('🆕 No discovery cache found, starting fresh');
    }
  }

  /**
   * Save discoveries to cache
   */
  private async saveDiscoveryCache(discoveries: DiscoveredMCP[]): Promise<void> {
    const cacheFile = path.join(process.cwd(), '.mcp-discoveries.json');
    const cache = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      discoveries: discoveries
    };
    
    await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
    console.log(`💾 Saved ${discoveries.length} MCP discoveries to cache`);
  }

  /**
   * Get recommendations for a specific task
   */
  async getRecommendations(task: string): Promise<DiscoveredMCP[]> {
    // First ensure we have discoveries
    if (this.discoveredMCPs.size === 0) {
      await this.discoverMCPs();
    }
    
    // Analyze task for needed capabilities
    const neededCapabilities = this.extractCapabilitiesFromDescription(task);
    
    // Find matching MCPs
    const recommendations: DiscoveredMCP[] = [];
    
    for (const mcp of this.discoveredMCPs.values()) {
      const matchScore = this.calculateMatchScore(mcp.capabilities, neededCapabilities);
      if (matchScore > 0) {
        recommendations.push({
          ...mcp,
          confidence: Math.min(100, mcp.confidence * matchScore)
        });
      }
    }
    
    // Sort by adjusted confidence
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5 recommendations
  }

  /**
   * Calculate match score between capabilities
   */
  private calculateMatchScore(mcpCapabilities: string[], needed: string[]): number {
    if (needed.length === 0) return 0;
    
    let matches = 0;
    for (const need of needed) {
      if (mcpCapabilities.some(cap => cap.includes(need) || need.includes(cap))) {
        matches++;
      }
    }
    
    return matches / needed.length;
  }

  /**
   * Continuously discover new MCPs (background process)
   */
  async startContinuousDiscovery(intervalHours: number = 24): Promise<void> {
    console.log(`🔄 Starting continuous MCP discovery (every ${intervalHours} hours)`);
    
    // Initial discovery
    await this.discoverMCPs();
    
    // Schedule periodic discoveries
    setInterval(async () => {
      console.log('🔄 Running scheduled MCP discovery...');
      await this.discoverMCPs();
    }, intervalHours * 60 * 60 * 1000);
  }
}

// Export singleton instance
export const discoveryEngine = new MCPDiscoveryEngine();