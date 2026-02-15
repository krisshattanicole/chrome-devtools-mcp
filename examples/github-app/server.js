#!/usr/bin/env node

/**
 * GitHub App Example using Chrome DevTools MCP
 * 
 * This server listens for GitHub pull request events and automatically
 * tests the changes using Chrome DevTools MCP.
 */

import express from 'express';
import { App } from '@octokit/app';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Configuration constants
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests per minute per IP
const MAX_PERFORMANCE_OUTPUT_LENGTH = 1000; // Maximum characters to include in check output

// GitHub App configuration
const githubApp = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, 'utf8'),
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET
  }
});

// MCP Client class
class MCPClient {
  constructor() {
    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  async start() {
    this.process = spawn('npx', ['-y', 'chrome-devtools-mcp@latest', '--headless'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

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
        // Ignore parse errors
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'github-app-example', version: '1.0.0' }
    });
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });

      const request = { jsonrpc: '2.0', id, method, params };
      this.process.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Timeout: ${method}`));
        }
      }, 60000);
    });
  }

  async callTool(name, args = {}) {
    return await this.sendRequest('tools/call', { name, arguments: args });
  }

  async close() {
    if (this.process) {
      this.process.kill();
    }
  }
}

// Simple in-memory rate limiter
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  
  // Reset if window expired
  if (now > clientData.resetAt) {
    clientData.count = 0;
    clientData.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  
  clientData.count++;
  rateLimitMap.set(ip, clientData);
  
  return clientData.count <= MAX_REQUESTS_PER_WINDOW;
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// Verify webhook signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Test pull request using MCP
async function testPullRequest(octokit, owner, repo, pr) {
  console.log(`Testing PR #${pr.number} in ${owner}/${repo}`);

  // Create a check run
  const checkRun = await octokit.checks.create({
    owner,
    repo,
    name: 'Chrome DevTools Tests',
    head_sha: pr.head.sha,
    status: 'in_progress',
    started_at: new Date().toISOString()
  });

  const mcpClient = new MCPClient();

  try {
    await mcpClient.start();

    // Construct preview URL
    const previewUrlPattern = process.env.PREVIEW_URL_PATTERN || 'https://preview.example.com/pr-{pr_number}';
    const previewUrl = previewUrlPattern.replace('{pr_number}', pr.number);

    console.log(`Testing preview: ${previewUrl}`);

    // Navigate to the preview
    await mcpClient.callTool('navigate_page', { url: previewUrl });

    // Run performance trace
    await mcpClient.callTool('performance_start_trace');
    await new Promise(resolve => setTimeout(resolve, 5000));
    const traceResult = await mcpClient.callTool('performance_stop_trace');

    // Take screenshot
    const screenshotResult = await mcpClient.callTool('take_screenshot', { fullPage: false });

    // Check console messages
    const consoleResult = await mcpClient.callTool('list_console_messages');

    // Parse results
    const performanceText = traceResult.content[0]?.text || '{}';
    const consoleText = consoleResult.content[0]?.text || '[]';

    // Simple pass/fail logic (customize as needed)
    let passed = true;
    let summary = '';
    let details = '';

    // Check for console errors
    try {
      const messages = JSON.parse(consoleText);
      const errors = messages.filter(msg => msg.type === 'error');
      if (errors.length > 0) {
        passed = false;
        summary += `Found ${errors.length} console error(s). `;
        const errorText = errors.map(e => e.text).join('\n');
        // Limit console error output length
        const truncatedErrorText = errorText.length > MAX_PERFORMANCE_OUTPUT_LENGTH 
          ? errorText.substring(0, MAX_PERFORMANCE_OUTPUT_LENGTH) + '\n... (truncated)'
          : errorText;
        details += `\n\n## Console Errors\n\`\`\`\n${truncatedErrorText}\n\`\`\`\n`;
      } else {
        summary += 'No console errors. ';
      }
    } catch (e) {
      details += '\nCould not parse console messages.\n';
    }

    // Add performance info
    details += `\n## Performance\n\`\`\`json\n${performanceText.substring(0, MAX_PERFORMANCE_OUTPUT_LENGTH)}\n\`\`\`\n`;

    // Update check run with results
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.data.id,
      status: 'completed',
      conclusion: passed ? 'success' : 'failure',
      completed_at: new Date().toISOString(),
      output: {
        title: passed ? '✓ All tests passed' : '✗ Tests failed',
        summary: summary || 'Tests completed',
        text: details
      }
    });

    console.log(`PR #${pr.number} test completed: ${passed ? 'PASSED' : 'FAILED'}`);

  } catch (error) {
    console.error(`Error testing PR #${pr.number}:`, error);

    // Update check run with error
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.data.id,
      status: 'completed',
      conclusion: 'failure',
      completed_at: new Date().toISOString(),
      output: {
        title: '✗ Test error',
        summary: error.message,
        text: `\`\`\`\n${error.stack}\n\`\`\``
      }
    });
  } finally {
    await mcpClient.close();
  }
}

// Webhook endpoint with rate limiting and signature verification
app.post('/webhook', async (req, res) => {
  // Rate limiting: Max 60 requests per minute per IP
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp)) {
    console.error(`Rate limit exceeded for ${clientIp}`);
    return res.status(429).send('Too Many Requests');
  }

  // Verify signature
  if (!verifySignature(req)) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  console.log(`Received ${event} event`);

  // Respond quickly to GitHub
  res.status(200).send('OK');

  // Handle pull request events
  if (event === 'pull_request') {
    const { action, pull_request, repository, installation } = payload;

    if (action === 'opened' || action === 'synchronize' || action === 'reopened') {
      try {
        // Get installation access token
        const octokit = await githubApp.getInstallationOctokit(installation.id);

        // Test the pull request
        await testPullRequest(
          octokit,
          repository.owner.login,
          repository.name,
          pull_request
        );
      } catch (error) {
        console.error('Error handling PR:', error);
      }
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GitHub App server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
