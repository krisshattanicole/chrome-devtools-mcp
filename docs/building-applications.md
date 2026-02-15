# Building Applications with Chrome DevTools MCP

Yes, Chrome DevTools MCP can help you build various types of applications! This guide shows you how to integrate Chrome DevTools MCP into your own applications and build custom solutions.

## Table of Contents

- [Overview](#overview)
- [Building a Node.js Application](#building-a-nodejs-application)
- [Building a GitHub App](#building-a-github-app)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)

## Overview

Chrome DevTools MCP (Model Context Protocol) provides a powerful interface for browser automation, performance analysis, and debugging. You can integrate it into:

- **Automated testing frameworks**
- **Performance monitoring tools**
- **Web scraping applications**
- **GitHub Apps for automated testing**
- **CI/CD pipelines**
- **Custom development tools**

## Building a Node.js Application

### Basic Integration

Here's how to build a simple Node.js application that uses Chrome DevTools MCP:

```javascript
import { spawn } from 'child_process';
import { createInterface } from 'readline';

class ChromeDevToolsMCPClient {
  constructor() {
    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  async start() {
    // Start the MCP server
    this.process = spawn('npx', ['-y', 'chrome-devtools-mcp@latest'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Set up readline interface for JSON-RPC
    this.readline = createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity
    });

    this.readline.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
          this.pendingRequests.delete(response.id);
        }
      } catch (error) {
        console.error('Failed to parse response:', error);
      }
    });

    // Initialize the connection
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'custom-app',
        version: '1.0.0'
      }
    });
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });

      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async callTool(name, args = {}) {
    return await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async close() {
    if (this.process) {
      this.process.kill();
    }
  }
}

// Example usage
async function main() {
  const client = new ChromeDevToolsMCPClient();
  
  try {
    await client.start();
    
    // Navigate to a page
    await client.callTool('navigate_page', {
      url: 'https://example.com'
    });
    
    // Take a screenshot
    const screenshot = await client.callTool('take_screenshot');
    console.log('Screenshot taken:', screenshot);
    
    // Get performance insights
    await client.callTool('performance_start_trace');
    // ... perform some actions ...
    const trace = await client.callTool('performance_stop_trace');
    console.log('Performance trace captured:', trace);
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
```

### Using @modelcontextprotocol/sdk

For a more robust integration, use the official MCP SDK:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function createMCPClient() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'chrome-devtools-mcp@latest']
  });

  const client = new Client({
    name: 'my-app',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  return client;
}

async function automateWebsite() {
  const client = await createMCPClient();
  
  try {
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools);
    
    // Navigate to a website
    await client.callTool('navigate_page', {
      url: 'https://developers.chrome.com'
    });
    
    // Fill a form
    await client.callTool('fill', {
      selector: '#search-input',
      value: 'Web Performance'
    });
    
    // Click a button
    await client.callTool('click', {
      selector: '#search-button'
    });
    
    // Wait for results
    await client.callTool('wait_for', {
      text: 'Results'
    });
    
    // Take a screenshot
    const screenshot = await client.callTool('take_screenshot', {
      fullPage: true
    });
    
    console.log('Screenshot:', screenshot);
    
  } finally {
    await client.close();
  }
}

automateWebsite().catch(console.error);
```

## Building a GitHub App

You can build a GitHub App that uses Chrome DevTools MCP for automated testing, performance monitoring, or accessibility checks.

### Architecture

```
┌─────────────────┐
│   GitHub App    │
│   (Webhook)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Your Server    │
│  (Node.js/API)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chrome DevTools │
│   MCP Server    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Chrome      │
│    Browser      │
└─────────────────┘
```

### Example: PR Review Bot

Create a GitHub App that automatically tests pull requests:

```javascript
import express from 'express';
import { Octokit } from '@octokit/rest';
import { createMCPClient } from './mcp-client.js';

const app = express();
app.use(express.json());

// GitHub webhook handler
app.post('/webhook', async (req, res) => {
  const { action, pull_request } = req.body;
  
  if (action === 'opened' || action === 'synchronize') {
    // Trigger automated tests
    await testPullRequest(pull_request);
  }
  
  res.status(200).send('OK');
});

async function testPullRequest(pr) {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });
  
  // Create a check run
  const checkRun = await octokit.checks.create({
    owner: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    name: 'Browser Tests',
    head_sha: pr.head.sha,
    status: 'in_progress'
  });
  
  const mcpClient = await createMCPClient();
  
  try {
    // Build the preview URL for the PR
    const previewUrl = `https://preview.example.com/pr-${pr.number}`;
    
    // Navigate to the preview
    await mcpClient.callTool('navigate_page', {
      url: previewUrl
    });
    
    // Run performance tests
    await mcpClient.callTool('performance_start_trace');
    await mcpClient.callTool('wait_for', { time: 5 });
    const trace = await mcpClient.callTool('performance_stop_trace');
    
    // Take screenshots
    const screenshot = await mcpClient.callTool('take_screenshot', {
      fullPage: true
    });
    
    // Check console for errors
    const consoleMessages = await mcpClient.callTool('list_console_messages');
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    
    // Analyze results
    const passed = errors.length === 0 && trace.metrics.score > 0.8;
    
    // Update check run
    await octokit.checks.update({
      owner: pr.base.repo.owner.login,
      repo: pr.base.repo.name,
      check_run_id: checkRun.data.id,
      status: 'completed',
      conclusion: passed ? 'success' : 'failure',
      output: {
        title: passed ? 'Tests Passed' : 'Tests Failed',
        summary: `Performance Score: ${trace.metrics.score}\nConsole Errors: ${errors.length}`,
        text: JSON.stringify({ trace, errors, screenshot }, null, 2)
      }
    });
    
  } catch (error) {
    // Update check run with failure
    await octokit.checks.update({
      owner: pr.base.repo.owner.login,
      repo: pr.base.repo.name,
      check_run_id: checkRun.data.id,
      status: 'completed',
      conclusion: 'failure',
      output: {
        title: 'Test Error',
        summary: error.message
      }
    });
  } finally {
    await mcpClient.close();
  }
}

app.listen(3000, () => {
  console.log('GitHub App server running on port 3000');
});
```

### Setting Up Your GitHub App

1. **Create the GitHub App**:
   - Go to GitHub Settings → Developer Settings → GitHub Apps
   - Create a new GitHub App
   - Set webhook URL to your server
   - Subscribe to `pull_request` events
   - Generate a private key

2. **Configure Permissions**:
   - Repository permissions:
     - Checks: Read & Write
     - Contents: Read
     - Pull requests: Read

3. **Deploy Your Server**:
   ```bash
   # Install dependencies
   npm install express @octokit/rest @modelcontextprotocol/sdk
   
   # Set environment variables
   export GITHUB_TOKEN=your_github_app_token
   export WEBHOOK_SECRET=your_webhook_secret
   
   # Start the server
   node server.js
   ```

## Use Cases

### 1. Automated Visual Testing

```javascript
async function visualRegressionTest(baseUrl, newUrl) {
  const client = await createMCPClient();
  
  // Capture base screenshot
  await client.callTool('navigate_page', { url: baseUrl });
  const baseScreenshot = await client.callTool('take_screenshot', {
    fullPage: true
  });
  
  // Capture new screenshot
  await client.callTool('navigate_page', { url: newUrl });
  const newScreenshot = await client.callTool('take_screenshot', {
    fullPage: true
  });
  
  // Compare screenshots (use image comparison library)
  return compareImages(baseScreenshot, newScreenshot);
}
```

### 2. Performance Monitoring

```javascript
async function monitorPerformance(urls) {
  const client = await createMCPClient();
  const results = [];
  
  for (const url of urls) {
    await client.callTool('navigate_page', { url });
    await client.callTool('performance_start_trace');
    await client.callTool('wait_for', { time: 5 });
    const trace = await client.callTool('performance_stop_trace');
    
    results.push({
      url,
      score: trace.metrics.score,
      timestamp: new Date()
    });
  }
  
  return results;
}
```

### 3. Web Scraping

```javascript
async function scrapeData(url, selector) {
  const client = await createMCPClient();
  
  await client.callTool('navigate_page', { url });
  
  // Execute JavaScript to extract data
  const data = await client.callTool('evaluate_script', {
    script: `
      return Array.from(document.querySelectorAll('${selector}'))
        .map(el => ({
          text: el.textContent,
          href: el.href
        }));
    `
  });
  
  return data;
}
```

### 4. Accessibility Testing

```javascript
async function checkAccessibility(url) {
  const client = await createMCPClient();
  
  await client.callTool('navigate_page', { url });
  
  // Check for common accessibility issues
  const issues = await client.callTool('evaluate_script', {
    script: `
      const issues = [];
      
      // Check for alt text on images
      document.querySelectorAll('img:not([alt])').forEach(img => {
        issues.push({ type: 'missing-alt', element: img.src });
      });
      
      // Check for proper heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      // ... more checks
      
      return issues;
    `
  });
  
  return issues;
}
```

## Best Practices

### 1. Error Handling

Always wrap MCP calls in try-catch blocks and clean up resources:

```javascript
async function safeAutomation() {
  const client = await createMCPClient();
  
  try {
    // Your automation code
    await client.callTool('navigate_page', { url: 'https://example.com' });
  } catch (error) {
    console.error('Automation failed:', error);
    // Handle error appropriately
  } finally {
    // Always close the client
    await client.close();
  }
}
```

### 2. Use Headless Mode for Production

```javascript
// Start MCP server in headless mode
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'chrome-devtools-mcp@latest', '--headless']
});
```

### 3. Implement Timeouts

```javascript
async function callWithTimeout(client, toolName, args, timeoutMs = 30000) {
  return Promise.race([
    client.callTool(toolName, args),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

### 4. Use Isolated Mode for Testing

```javascript
// Use isolated mode to avoid state pollution between tests
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'chrome-devtools-mcp@latest', '--isolated']
});
```

### 5. Monitor Resource Usage

```javascript
class ResourceMonitor {
  constructor() {
    this.clients = new Set();
  }
  
  async createClient() {
    const client = await createMCPClient();
    this.clients.add(client);
    return client;
  }
  
  async closeAll() {
    for (const client of this.clients) {
      await client.close();
    }
    this.clients.clear();
  }
}
```

## Additional Resources

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Chrome DevTools MCP Tool Reference](./tool-reference.md)
- [Puppeteer Documentation](https://pptr.dev/)
- [GitHub Apps Documentation](https://docs.github.com/en/apps)

## Need Help?

If you have questions or need assistance building your application:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review the [Tool Reference](./tool-reference.md)
3. Open an issue on [GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues)
4. Join the community discussions

Happy building! 🚀
