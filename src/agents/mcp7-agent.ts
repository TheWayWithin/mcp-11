/**
 * MCP-7 Agent: Intelligent MCP Selection and Orchestration
 * 
 * This agent actively connects to Firecrawl, Context7, and other MCPs
 * to intelligently select and orchestrate MCP services based on real-time data
 */

import { EventEmitter } from 'events';
import axios from 'axios';

interface MCPConnection {
  id: string;
  name: string;
  url?: string;
  apiKey?: string;
  connected: boolean;
  client?: any;
}

interface TaskContext {
  description: string;
  domain?: string;
  history?: string[];
  constraints?: {
    maxMCPs?: number;
    requiredConfidence?: number;
    preferredMCPs?: string[];
  };
}

interface MCPRecommendation {
  mcp: string;
  confidence: number;
  reasoning: string;
  source: 'firecrawl' | 'context7' | 'grep' | 'analysis';
  capabilities: string[];
  alternativeIf?: string;
}

interface LearningData {
  task: string;
  selectedMCPs: string[];
  outcome: 'success' | 'failure' | 'partial';
  feedback?: string;
  timestamp: Date;
}

export class MCP7Agent extends EventEmitter {
  private connections: Map<string, MCPConnection> = new Map();
  private firecrawlClient?: any;
  private context7Client?: any;
  private grepClient?: any;
  private learningHistory: LearningData[] = [];
  
  // Core MCPs for intelligence
  private readonly INTELLIGENCE_MCPS = {
    firecrawl: {
      url: process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev',
      apiKey: process.env.FIRECRAWL_API_KEY,
      capabilities: ['web-scraping', 'research', 'documentation-extraction']
    },
    context7: {
      url: process.env.CONTEXT7_API_URL || 'https://api.context7.dev',
      apiKey: process.env.CONTEXT7_API_KEY,
      projectId: process.env.CONTEXT7_PROJECT_ID,
      capabilities: ['pattern-recognition', 'context-tracking', 'learning']
    },
    grep: {
      url: 'https://mcp.grep.app',
      capabilities: ['code-search', 'pattern-matching', 'github-search']
    }
  };

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize connections to intelligence MCPs
   */
  private async initialize(): Promise<void> {
    console.log('🤖 MCP-7 Agent initializing...');
    
    // Connect to Firecrawl for research
    await this.connectFirecrawl();
    
    // Connect to Context7 for learning
    await this.connectContext7();
    
    // Connect to Grep MCP for code search
    await this.connectGrepMCP();
    
    // Load learning history from Context7
    await this.loadLearningHistory();
    
    this.emit('initialized');
  }

  /**
   * Connect to Firecrawl MCP for web research
   */
  private async connectFirecrawl(): Promise<void> {
    try {
      if (!this.INTELLIGENCE_MCPS.firecrawl.apiKey) {
        console.warn('⚠️ Firecrawl API key not configured');
        return;
      }

      // Initialize Firecrawl client
      this.firecrawlClient = {
        scrape: async (url: string) => {
          const response = await axios.post(
            `${this.INTELLIGENCE_MCPS.firecrawl.url}/v0/scrape`,
            { url },
            {
              headers: {
                'Authorization': `Bearer ${this.INTELLIGENCE_MCPS.firecrawl.apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data;
        },
        search: async (query: string) => {
          const response = await axios.post(
            `${this.INTELLIGENCE_MCPS.firecrawl.url}/v0/search`,
            { query },
            {
              headers: {
                'Authorization': `Bearer ${this.INTELLIGENCE_MCPS.firecrawl.apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data;
        }
      };

      this.connections.set('firecrawl', {
        id: 'firecrawl',
        name: 'Firecrawl MCP',
        url: this.INTELLIGENCE_MCPS.firecrawl.url,
        connected: true,
        client: this.firecrawlClient
      });

      console.log('✅ Connected to Firecrawl MCP');
    } catch (error) {
      console.error('❌ Failed to connect to Firecrawl:', error);
    }
  }

  /**
   * Connect to Context7 for pattern recognition and learning
   */
  private async connectContext7(): Promise<void> {
    try {
      if (!this.INTELLIGENCE_MCPS.context7.apiKey) {
        console.warn('⚠️ Context7 API key not configured');
        return;
      }

      // Initialize Context7 client
      this.context7Client = {
        track: async (event: string, data: any) => {
          const response = await axios.post(
            `${this.INTELLIGENCE_MCPS.context7.url}/v1/events`,
            {
              projectId: this.INTELLIGENCE_MCPS.context7.projectId,
              event,
              data,
              timestamp: new Date().toISOString()
            },
            {
              headers: {
                'X-API-Key': this.INTELLIGENCE_MCPS.context7.apiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data;
        },
        getContext: async (contextId: string) => {
          const response = await axios.get(
            `${this.INTELLIGENCE_MCPS.context7.url}/v1/contexts/${contextId}`,
            {
              headers: {
                'X-API-Key': this.INTELLIGENCE_MCPS.context7.apiKey
              }
            }
          );
          return response.data;
        },
        analyze: async (data: any) => {
          const response = await axios.post(
            `${this.INTELLIGENCE_MCPS.context7.url}/v1/analyze`,
            {
              projectId: this.INTELLIGENCE_MCPS.context7.projectId,
              data
            },
            {
              headers: {
                'X-API-Key': this.INTELLIGENCE_MCPS.context7.apiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data;
        }
      };

      this.connections.set('context7', {
        id: 'context7',
        name: 'Context7 MCP',
        url: this.INTELLIGENCE_MCPS.context7.url,
        connected: true,
        client: this.context7Client
      });

      console.log('✅ Connected to Context7 MCP');
    } catch (error) {
      console.error('❌ Failed to connect to Context7:', error);
    }
  }

  /**
   * Connect to Grep MCP for code search
   */
  private async connectGrepMCP(): Promise<void> {
    try {
      // Initialize Grep MCP client
      this.grepClient = {
        search: async (pattern: string, options?: any) => {
          const params = new URLSearchParams({
            q: pattern,
            ...options
          });
          
          const response = await axios.get(
            `${this.INTELLIGENCE_MCPS.grep.url}/api/search?${params}`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          return response.data;
        }
      };

      this.connections.set('grep', {
        id: 'grep',
        name: 'Grep MCP',
        url: this.INTELLIGENCE_MCPS.grep.url,
        connected: true,
        client: this.grepClient
      });

      console.log('✅ Connected to Grep MCP');
    } catch (error) {
      console.error('❌ Failed to connect to Grep MCP:', error);
    }
  }

  /**
   * Load learning history from Context7
   */
  private async loadLearningHistory(): Promise<void> {
    if (!this.context7Client) return;

    try {
      const history = await this.context7Client.getContext('mcp7-learning');
      if (history && history.data) {
        this.learningHistory = history.data;
        console.log(`📚 Loaded ${this.learningHistory.length} learning records`);
      }
    } catch (error) {
      console.log('📝 Starting with fresh learning history');
    }
  }

  /**
   * Main method: Select MCPs for a given task
   */
  async selectMCPs(task: TaskContext): Promise<MCPRecommendation[]> {
    console.log(`🎯 MCP-7 Agent analyzing task: "${task.description}"`);
    
    const recommendations: MCPRecommendation[] = [];
    
    // Step 1: Use Firecrawl to research the task domain
    const domainInsights = await this.researchTaskDomain(task);
    
    // Step 2: Use Context7 to find patterns from similar tasks
    const patternInsights = await this.findSimilarPatterns(task);
    
    // Step 3: Use Grep MCP to find code examples
    const codeInsights = await this.searchCodeExamples(task);
    
    // Step 4: Analyze and combine insights
    const analysis = await this.analyzeInsights({
      task,
      domainInsights,
      patternInsights,
      codeInsights
    });
    
    // Step 5: Generate recommendations
    recommendations.push(...this.generateRecommendations(analysis));
    
    // Step 6: Track this selection for learning
    await this.trackSelection(task, recommendations);
    
    // Step 7: Apply constraints and rank
    const finalRecommendations = this.applyConstraints(recommendations, task.constraints);
    
    return finalRecommendations;
  }

  /**
   * Research task domain using Firecrawl
   */
  private async researchTaskDomain(task: TaskContext): Promise<any> {
    if (!this.firecrawlClient) {
      return { source: 'firecrawl', available: false };
    }

    try {
      console.log('🔍 Researching task domain with Firecrawl...');
      
      // Search for relevant documentation and best practices
      const searchQueries = [
        `${task.description} best practices`,
        `${task.description} tools libraries`,
        `model context protocol ${task.description}`,
        `MCP server ${task.domain || task.description}`
      ];
      
      const results = [];
      for (const query of searchQueries) {
        try {
          const searchResult = await this.firecrawlClient.search(query);
          results.push(...(searchResult.results || []));
        } catch (error) {
          console.warn(`Search failed for "${query}"`);
        }
      }
      
      // Extract MCP mentions and patterns
      const mcpMentions = this.extractMCPMentions(results);
      const capabilities = this.extractCapabilities(results);
      
      return {
        source: 'firecrawl',
        available: true,
        mcpMentions,
        capabilities,
        confidence: this.calculateResearchConfidence(results)
      };
    } catch (error) {
      console.error('Firecrawl research failed:', error);
      return { source: 'firecrawl', available: false, error };
    }
  }

  /**
   * Find similar patterns using Context7
   */
  private async findSimilarPatterns(task: TaskContext): Promise<any> {
    if (!this.context7Client) {
      return { source: 'context7', available: false };
    }

    try {
      console.log('🧠 Finding patterns with Context7...');
      
      // Analyze task for patterns
      const analysis = await this.context7Client.analyze({
        type: 'task_similarity',
        task: task.description,
        domain: task.domain,
        history: this.learningHistory.slice(-50) // Last 50 tasks
      });
      
      // Find successful patterns
      const successfulPatterns = this.learningHistory
        .filter(h => h.outcome === 'success')
        .filter(h => this.calculateSimilarity(h.task, task.description) > 0.7);
      
      const recommendedMCPs = new Map<string, number>();
      
      for (const pattern of successfulPatterns) {
        for (const mcp of pattern.selectedMCPs) {
          const current = recommendedMCPs.get(mcp) || 0;
          recommendedMCPs.set(mcp, current + 1);
        }
      }
      
      return {
        source: 'context7',
        available: true,
        patterns: Array.from(recommendedMCPs.entries())
          .map(([mcp, count]) => ({
            mcp,
            frequency: count / successfulPatterns.length,
            confidence: (count / successfulPatterns.length) * 100
          }))
          .sort((a, b) => b.confidence - a.confidence),
        similarTasks: successfulPatterns.length
      };
    } catch (error) {
      console.error('Context7 pattern search failed:', error);
      return { source: 'context7', available: false, error };
    }
  }

  /**
   * Search for code examples using Grep MCP
   */
  private async searchCodeExamples(task: TaskContext): Promise<any> {
    if (!this.grepClient) {
      return { source: 'grep', available: false };
    }

    try {
      console.log('💻 Searching code examples with Grep MCP...');
      
      // Generate search patterns based on task
      const patterns = this.generateSearchPatterns(task);
      const codeExamples = [];
      
      for (const pattern of patterns) {
        try {
          const results = await this.grepClient.search(pattern, {
            lang: 'typescript,javascript,python',
            max_results: 10
          });
          
          if (results && results.matches) {
            codeExamples.push(...results.matches);
          }
        } catch (error) {
          console.warn(`Code search failed for pattern: ${pattern}`);
        }
      }
      
      // Extract MCP usage from code
      const mcpUsage = this.extractMCPUsageFromCode(codeExamples);
      
      return {
        source: 'grep',
        available: true,
        codeExamples: codeExamples.length,
        mcpUsage,
        confidence: this.calculateCodeConfidence(codeExamples)
      };
    } catch (error) {
      console.error('Grep MCP search failed:', error);
      return { source: 'grep', available: false, error };
    }
  }

  /**
   * Analyze combined insights
   */
  private async analyzeInsights(insights: any): Promise<any> {
    const { task, domainInsights, patternInsights, codeInsights } = insights;
    
    // Combine all MCP recommendations
    const mcpScores = new Map<string, { score: number, sources: string[] }>();
    
    // Add Firecrawl insights
    if (domainInsights.available && domainInsights.mcpMentions) {
      for (const mention of domainInsights.mcpMentions) {
        const current = mcpScores.get(mention.mcp) || { score: 0, sources: [] };
        current.score += mention.confidence * 0.3; // 30% weight for research
        current.sources.push('research');
        mcpScores.set(mention.mcp, current);
      }
    }
    
    // Add Context7 patterns
    if (patternInsights.available && patternInsights.patterns) {
      for (const pattern of patternInsights.patterns) {
        const current = mcpScores.get(pattern.mcp) || { score: 0, sources: [] };
        current.score += pattern.confidence * 0.4; // 40% weight for patterns
        current.sources.push('patterns');
        mcpScores.set(pattern.mcp, current);
      }
    }
    
    // Add Grep code insights
    if (codeInsights.available && codeInsights.mcpUsage) {
      for (const usage of codeInsights.mcpUsage) {
        const current = mcpScores.get(usage.mcp) || { score: 0, sources: [] };
        current.score += usage.frequency * 30; // 30% weight for code
        current.sources.push('code');
        mcpScores.set(usage.mcp, current);
      }
    }
    
    // Add task-specific analysis
    const taskAnalysis = this.analyzeTaskRequirements(task.description);
    for (const req of taskAnalysis.requiredMCPs) {
      const current = mcpScores.get(req) || { score: 0, sources: [] };
      current.score += 20; // Bonus for task requirements
      current.sources.push('requirements');
      mcpScores.set(req, current);
    }
    
    return {
      mcpScores: Array.from(mcpScores.entries())
        .map(([mcp, data]) => ({
          mcp,
          score: Math.min(100, data.score),
          sources: data.sources
        }))
        .sort((a, b) => b.score - a.score),
      capabilities: [
        ...(domainInsights.capabilities || []),
        ...(taskAnalysis.capabilities || [])
      ],
      confidence: this.calculateOverallConfidence(insights)
    };
  }

  /**
   * Generate final recommendations
   */
  private generateRecommendations(analysis: any): MCPRecommendation[] {
    const recommendations: MCPRecommendation[] = [];
    
    for (const item of analysis.mcpScores) {
      // Skip if score too low
      if (item.score < 30) continue;
      
      const recommendation: MCPRecommendation = {
        mcp: item.mcp,
        confidence: item.score,
        reasoning: this.generateReasoning(item),
        source: this.getPrimarySource(item.sources),
        capabilities: this.getMCPCapabilities(item.mcp)
      };
      
      // Add alternatives for lower confidence
      if (item.score < 70) {
        recommendation.alternativeIf = 'Consider if primary MCPs insufficient';
      }
      
      recommendations.push(recommendation);
    }
    
    // Ensure core MCPs are included
    this.ensureCoreMCPs(recommendations, analysis.capabilities);
    
    return recommendations;
  }

  /**
   * Track selection for learning
   */
  private async trackSelection(task: TaskContext, recommendations: MCPRecommendation[]): Promise<void> {
    if (!this.context7Client) return;
    
    try {
      // Track the selection event
      await this.context7Client.track('mcp_selection', {
        task: task.description,
        domain: task.domain,
        recommendations: recommendations.map(r => ({
          mcp: r.mcp,
          confidence: r.confidence,
          source: r.source
        })),
        timestamp: new Date().toISOString()
      });
      
      // Store in learning history
      this.learningHistory.push({
        task: task.description,
        selectedMCPs: recommendations.map(r => r.mcp),
        outcome: 'partial', // Will be updated later based on feedback
        timestamp: new Date()
      });
      
      console.log('📊 Selection tracked for learning');
    } catch (error) {
      console.warn('Failed to track selection:', error);
    }
  }

  /**
   * Apply constraints to recommendations
   */
  private applyConstraints(
    recommendations: MCPRecommendation[],
    constraints?: TaskContext['constraints']
  ): MCPRecommendation[] {
    let filtered = [...recommendations];
    
    // Apply confidence threshold
    if (constraints?.requiredConfidence) {
      filtered = filtered.filter(r => r.confidence >= constraints.requiredConfidence);
    }
    
    // Prioritize preferred MCPs
    if (constraints?.preferredMCPs) {
      filtered.sort((a, b) => {
        const aPreferred = constraints.preferredMCPs!.includes(a.mcp) ? 1 : 0;
        const bPreferred = constraints.preferredMCPs!.includes(b.mcp) ? 1 : 0;
        return bPreferred - aPreferred || b.confidence - a.confidence;
      });
    }
    
    // Limit number of MCPs
    if (constraints?.maxMCPs) {
      filtered = filtered.slice(0, constraints.maxMCPs);
    }
    
    return filtered;
  }

  /**
   * Learn from feedback
   */
  async learnFromFeedback(
    task: string,
    selectedMCPs: string[],
    outcome: 'success' | 'failure' | 'partial',
    feedback?: string
  ): Promise<void> {
    // Update learning history
    const historyItem = this.learningHistory.find(
      h => h.task === task && 
      JSON.stringify(h.selectedMCPs) === JSON.stringify(selectedMCPs)
    );
    
    if (historyItem) {
      historyItem.outcome = outcome;
      historyItem.feedback = feedback;
    }
    
    // Track with Context7
    if (this.context7Client) {
      await this.context7Client.track('mcp_feedback', {
        task,
        selectedMCPs,
        outcome,
        feedback,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`📈 Learning updated: ${outcome} for "${task}"`);
  }

  // Helper methods
  
  private extractMCPMentions(results: any[]): any[] {
    const mentions: any[] = [];
    const mcpPattern = /(\w+)[\s-]?MCP|MCP[\s-]?(\w+)/gi;
    
    for (const result of results) {
      const text = result.content || result.text || '';
      const matches = text.matchAll(mcpPattern);
      
      for (const match of matches) {
        const mcpName = match[1] || match[2];
        if (mcpName) {
          mentions.push({
            mcp: mcpName.toLowerCase(),
            confidence: 70
          });
        }
      }
    }
    
    return mentions;
  }

  private extractCapabilities(results: any[]): string[] {
    const capabilities = new Set<string>();
    const keywords = [
      'authentication', 'database', 'api', 'testing', 'deployment',
      'monitoring', 'logging', 'search', 'email', 'payment'
    ];
    
    for (const result of results) {
      const text = (result.content || result.text || '').toLowerCase();
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          capabilities.add(keyword);
        }
      }
    }
    
    return Array.from(capabilities);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const common = words1.filter(w => words2.includes(w));
    return common.length / Math.max(words1.length, words2.length);
  }

  private generateSearchPatterns(task: TaskContext): string[] {
    const patterns = [];
    const keywords = task.description.split(/\s+/).filter(w => w.length > 3);
    
    patterns.push(`"MCP" ${keywords.slice(0, 3).join(' ')}`);
    patterns.push(`ModelContextProtocol ${task.domain || keywords[0]}`);
    patterns.push(`mcp.server ${keywords[0]}`);
    
    return patterns;
  }

  private extractMCPUsageFromCode(examples: any[]): any[] {
    const usage = new Map<string, number>();
    
    for (const example of examples) {
      const code = example.content || example.code || '';
      
      // Look for import statements
      const imports = code.match(/import.*from\s+['"]@?[\w-]+mcp[\w-]*['"]/g) || [];
      for (const imp of imports) {
        const mcp = imp.match(/['"](@?[\w-]+mcp[\w-]*)['"]/)?.[1];
        if (mcp) {
          usage.set(mcp, (usage.get(mcp) || 0) + 1);
        }
      }
    }
    
    return Array.from(usage.entries()).map(([mcp, count]) => ({
      mcp,
      frequency: count / Math.max(1, examples.length)
    }));
  }

  private analyzeTaskRequirements(description: string): any {
    const requirements = {
      requiredMCPs: [] as string[],
      capabilities: [] as string[]
    };
    
    // Map keywords to MCPs
    const keywordMap: Record<string, string[]> = {
      'database': ['postgresql', 'supabase', 'mongodb'],
      'test': ['playwright', 'jest'],
      'deploy': ['railway', 'netlify', 'vercel'],
      'email': ['gmail', 'sendgrid'],
      'payment': ['stripe', 'paypal'],
      'search': ['grep', 'elasticsearch'],
      'file': ['filesystem'],
      'git': ['git', 'github']
    };
    
    const desc = description.toLowerCase();
    
    for (const [keyword, mcps] of Object.entries(keywordMap)) {
      if (desc.includes(keyword)) {
        requirements.requiredMCPs.push(...mcps);
        requirements.capabilities.push(keyword);
      }
    }
    
    return requirements;
  }

  private calculateResearchConfidence(results: any[]): number {
    if (results.length === 0) return 0;
    const avgRelevance = results.reduce((sum, r) => sum + (r.relevance || 0.5), 0) / results.length;
    return Math.min(100, avgRelevance * 100);
  }

  private calculateCodeConfidence(examples: any[]): number {
    if (examples.length === 0) return 0;
    return Math.min(100, 50 + examples.length * 5);
  }

  private calculateOverallConfidence(insights: any): number {
    const weights = {
      firecrawl: 0.3,
      context7: 0.4,
      grep: 0.3
    };
    
    let totalConfidence = 0;
    let totalWeight = 0;
    
    if (insights.domainInsights.available) {
      totalConfidence += (insights.domainInsights.confidence || 0) * weights.firecrawl;
      totalWeight += weights.firecrawl;
    }
    
    if (insights.patternInsights.available) {
      const patternConfidence = Math.min(100, insights.patternInsights.similarTasks * 10);
      totalConfidence += patternConfidence * weights.context7;
      totalWeight += weights.context7;
    }
    
    if (insights.codeInsights.available) {
      totalConfidence += (insights.codeInsights.confidence || 0) * weights.grep;
      totalWeight += weights.grep;
    }
    
    return totalWeight > 0 ? totalConfidence / totalWeight : 50;
  }

  private generateReasoning(item: any): string {
    const sources = item.sources || [];
    const reasons = [];
    
    if (sources.includes('research')) {
      reasons.push('Found in documentation and best practices');
    }
    if (sources.includes('patterns')) {
      reasons.push('Successfully used in similar tasks');
    }
    if (sources.includes('code')) {
      reasons.push('Common in code examples');
    }
    if (sources.includes('requirements')) {
      reasons.push('Matches task requirements');
    }
    
    return reasons.join('; ') || 'General recommendation';
  }

  private getPrimarySource(sources: string[]): 'firecrawl' | 'context7' | 'grep' | 'analysis' {
    if (sources.includes('patterns')) return 'context7';
    if (sources.includes('research')) return 'firecrawl';
    if (sources.includes('code')) return 'grep';
    return 'analysis';
  }

  private getMCPCapabilities(mcp: string): string[] {
    // This would be populated from the MCP registry
    const capabilityMap: Record<string, string[]> = {
      'filesystem': ['file-operations', 'local-storage'],
      'git': ['version-control', 'branching'],
      'github': ['repository', 'pr-management'],
      'playwright': ['testing', 'browser-automation'],
      'postgresql': ['database', 'sql'],
      'stripe': ['payments', 'billing'],
      // ... more MCPs
    };
    
    return capabilityMap[mcp.toLowerCase()] || ['general'];
  }

  private ensureCoreMCPs(recommendations: MCPRecommendation[], capabilities: string[]): void {
    // Always include filesystem for local operations
    if (!recommendations.find(r => r.mcp === 'filesystem')) {
      recommendations.push({
        mcp: 'filesystem',
        confidence: 85,
        reasoning: 'Core MCP for file operations',
        source: 'analysis',
        capabilities: ['file-operations']
      });
    }
    
    // Include Context7 for tracking
    if (!recommendations.find(r => r.mcp === 'context7')) {
      recommendations.push({
        mcp: 'context7',
        confidence: 80,
        reasoning: 'Recommended for context tracking and learning',
        source: 'analysis',
        capabilities: ['context-tracking', 'learning']
      });
    }
  }

  /**
   * Get agent status
   */
  getStatus(): any {
    return {
      connections: Array.from(this.connections.values()).map(c => ({
        name: c.name,
        connected: c.connected,
        url: c.url
      })),
      learningRecords: this.learningHistory.length,
      successRate: this.calculateSuccessRate()
    };
  }

  private calculateSuccessRate(): number {
    if (this.learningHistory.length === 0) return 0;
    
    const successful = this.learningHistory.filter(h => h.outcome === 'success').length;
    return (successful / this.learningHistory.length) * 100;
  }
}

// Export singleton instance
export const mcp7Agent = new MCP7Agent();