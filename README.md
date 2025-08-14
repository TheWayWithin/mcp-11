# MCP-11 Universal MCP Utility Library

**Transform complex MCP setup into a single command**

AGENT-11's Universal MCP Utility Library simplifies the installation and configuration of Model Context Protocol (MCP) servers, reducing complex multi-step setups to a single command experience.

## 🚀 Quick Start

### One-Line Installation
```bash
npx mcp-11 install
```

### Alternative Installation
```bash
# Install globally
npm install -g mcp-11

# Then run
mcp-11 install
```

## ✨ Features

- **Single Command Setup**: Transform complex MCP installation into one command
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **Intelligent Configuration**: Automatically detects and configures environment variables
- **Rollback Support**: Safe installation with automatic rollback on failures
- **Progress Tracking**: Real-time installation progress with detailed feedback
- **Validation**: Comprehensive system and installation validation
- **8 Essential MCP Servers**: Pre-configured with the most useful MCP servers

## 📦 Included MCP Servers

### Required Servers
- **Filesystem MCP** - File system operations and management
- **Memory MCP** - Persistent memory and context management  
- **Git MCP** - Git repository management and operations
- **GitHub MCP** - GitHub API integration and repository management
- **Playwright MCP** - Web automation and testing capabilities
- **Context7 MCP** - Context management and data persistence
- **Firecrawl MCP** - Web scraping and content extraction

### Optional Servers
- **Figma MCP** - Figma design file access and management

## 🛠️ Commands

### Installation
```bash
# Standard installation
mcp-11 install

# Verbose output
mcp-11 install --verbose

# Dry run (see what would be installed)
mcp-11 install --dry-run

# Force installation (skip existing check)
mcp-11 install --force
```

### Status Check
```bash
# Check installation status
mcp-11 status

# Detailed status information
mcp-11 status --verbose
```

### Configuration Management
```bash
# Validate configuration
mcp-11 config --validate

# Edit configuration (future release)
mcp-11 config --edit

# Reset configuration (future release)
mcp-11 config --reset
```

## ⚙️ Configuration

The tool automatically manages `.env.mcp` files with required environment variables:

### Required Environment Variables
```env
# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here

# Context7 MCP  
CONTEXT7_API_KEY=your_context7_api_key_here
CONTEXT7_PROJECT_ID=your_context7_project_id_here

# Firecrawl MCP
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Optional: Figma MCP
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

### Getting API Keys
- **GitHub**: [Generate Personal Access Token](https://github.com/settings/tokens)
- **Context7**: [Get API Key](https://context7.dev/dashboard)
- **Firecrawl**: [Get API Key](https://firecrawl.dev/app/apikeys)
- **Figma**: [Generate Access Token](https://figma.com/developers/api#access-tokens)

## 🏗️ System Requirements

- **Node.js**: v18.0.0 or higher
- **NPM**: Latest version
- **Platforms**: Windows, macOS, Linux
- **Memory**: ~512MB during operations
- **Installation Time**: <5 minutes

## 📋 Installation Process

The tool follows a comprehensive installation workflow:

1. **System Validation** - Check Node.js version, NPM availability
2. **Environment Setup** - Create/validate `.env.mcp` configuration  
3. **MCP Server Installation** - Install all required servers globally
4. **Configuration Update** - Update MCP configuration files
5. **Validation** - Verify all installations are working
6. **Rollback Support** - Automatic rollback on any failures

## 🔧 Development

### Local Development
```bash
# Clone repository
git clone https://github.com/TheWayWithin/mcp-11.git
cd mcp-11

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Development mode
npm run dev -- --help
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/registry.test.ts

# Run with coverage
npm test -- --coverage
```

## 🔒 Security

- Validates all package installations before execution
- Creates backups before making changes
- Supports rollback on installation failures
- Never stores or transmits API keys
- Uses official NPM registry packages only

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/TheWayWithin/mcp-11/issues)
- **Documentation**: [Wiki](https://github.com/TheWayWithin/mcp-11/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/TheWayWithin/mcp-11/discussions)

## 🎯 Roadmap

- [ ] Interactive configuration editor
- [ ] Custom MCP server registry
- [ ] Docker container support
- [ ] CI/CD integration templates
- [ ] VSCode extension
- [ ] Automated updates
- [ ] Health monitoring dashboard

---

**Made with ❤️ by the AGENT-11 Development Team**

Transform your MCP setup from complex to simple with a single command.