#!/bin/bash

# MCP-11 Universal Installation Script
# Cross-platform installer for AGENT-11 MCP Utility

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_NODE_VERSION="18.0.0"
PACKAGE_NAME="mcp-11"
PACKAGE_URL="https://registry.npmjs.org/mcp-11"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Compare versions
version_compare() {
    if [[ $1 == $2 ]]; then
        return 0
    fi
    
    local IFS=.
    local i ver1=($1) ver2=($2)
    
    # Fill empty fields in ver1 with zeros
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 2
        fi
    done
    return 0
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*) echo "linux" ;;
        MINGW*|CYGWIN*|MSYS*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

# Install Node.js if needed
install_nodejs() {
    local os=$(detect_os)
    
    log_info "Installing Node.js..."
    
    case $os in
        "macos")
            if command_exists brew; then
                brew install node
            else
                log_error "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
                exit 1
            fi
            ;;
        "linux")
            if command_exists apt-get; then
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command_exists yum; then
                curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                sudo yum install -y nodejs npm
            else
                log_error "Package manager not found. Please install Node.js manually from https://nodejs.org/"
                exit 1
            fi
            ;;
        "windows")
            log_error "Please install Node.js manually from https://nodejs.org/"
            exit 1
            ;;
        *)
            log_error "Unsupported OS. Please install Node.js manually from https://nodejs.org/"
            exit 1
            ;;
    esac
}

# Main installation function
main() {
    log_info "🚀 MCP-11 Universal Installation"
    log_info "Transform complex MCP setup into a single command"
    echo
    
    # Check if Node.js is installed
    if ! command_exists node; then
        log_warning "Node.js not found"
        read -p "Would you like to install Node.js now? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_nodejs
        else
            log_error "Node.js is required. Please install it from https://nodejs.org/"
            exit 1
        fi
    fi
    
    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    version_compare $node_version $MIN_NODE_VERSION
    local result=$?
    
    if [[ $result -eq 2 ]]; then
        log_error "Node.js version $node_version is below minimum required version $MIN_NODE_VERSION"
        log_info "Please update Node.js from https://nodejs.org/"
        exit 1
    fi
    
    log_success "Node.js $node_version detected"
    
    # Check if npm is available
    if ! command_exists npm; then
        log_error "NPM not found. Please ensure Node.js was installed correctly."
        exit 1
    fi
    
    local npm_version=$(npm --version)
    log_success "NPM $npm_version detected"
    
    # Install MCP-11
    log_info "Installing MCP-11..."
    
    if npm install -g $PACKAGE_NAME; then
        log_success "MCP-11 installed successfully!"
    else
        log_error "Failed to install MCP-11"
        exit 1
    fi
    
    # Verify installation
    if command_exists mcp-11; then
        log_success "Installation verified"
        log_info "You can now run: mcp-11 install"
    else
        log_warning "Installation complete but command not found in PATH"
        log_info "You may need to restart your terminal or add npm global bin to PATH"
    fi
    
    echo
    log_info "🎉 Installation Complete!"
    log_info "Run 'mcp-11 install' to set up your MCP servers"
    log_info "Run 'mcp-11 --help' for more commands"
}

# Handle Ctrl+C
trap 'log_warning "Installation cancelled by user"; exit 1' INT

# Run main function
main "$@"