# Chrome DevTools MCP Examples

This directory contains example applications showing how to integrate Chrome DevTools MCP into your projects.

## Examples

### 1. Basic Node.js Client (`basic-client.js`)
A simple Node.js script that demonstrates:
- Starting the MCP server
- Navigating to a webpage
- Taking screenshots
- Capturing performance traces

**Usage:**
```bash
node basic-client.js
```

### 2. Website Performance Monitor (`performance-monitor.js`)
An automated tool that:
- Monitors multiple websites
- Captures performance metrics
- Generates reports
- Saves results to JSON

**Usage:**
```bash
node performance-monitor.js https://example.com https://google.com
```

### 3. GitHub App Example (`github-app/`)
A complete GitHub App that:
- Listens for pull request events
- Tests preview deployments
- Runs performance analysis
- Posts results as check runs

**Setup:**
```bash
cd github-app
npm install
cp .env.example .env
# Edit .env with your GitHub App credentials
npm start
```

### 4. Web Scraper (`web-scraper.js`)
A scraper that:
- Extracts data from dynamic websites
- Handles JavaScript-rendered content
- Exports data in structured format

**Usage:**
```bash
node web-scraper.js https://example.com
```

## Prerequisites

All examples require:
- Node.js v20.19 or newer
- Chrome browser installed
- `chrome-devtools-mcp` package (installed via npx)

## Installation

Most examples use npx to automatically install and run the MCP server. For examples that need additional dependencies:

```bash
cd examples
npm install @modelcontextprotocol/sdk
```

## Learn More

- [Building Applications Guide](../docs/building-applications.md)
- [Tool Reference](../docs/tool-reference.md)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
