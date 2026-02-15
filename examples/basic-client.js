#!/usr/bin/env node

/**
 * Basic Chrome DevTools MCP Client Example
 * 
 * This example demonstrates how to:
 * 1. Start the Chrome DevTools MCP server
 * 2. Navigate to a webpage
 * 3. Take a screenshot
 * 4. Capture performance metrics
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { writeFileSync } from 'fs';

class ChromeDevToolsMCPClient {
  constructor() {
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.process = null;
    this.readline = null;
  }

  async start() {
    console.log('Starting Chrome DevTools MCP server...');
    
    // Start the MCP server using npx
    this.process = spawn('npx', ['-y', 'chrome-devtools-mcp@latest'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Log stderr for debugging
    this.process.stderr.on('data', (data) => {
      console.error('MCP Server:', data.toString());
    });

    // Set up readline interface for JSON-RPC communication
    this.readline = createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity
    });

    this.readline.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        
        // Handle method calls from server (notifications)
        if (!response.id) {
          console.log('Server notification:', response);
          return;
        }

        // Handle responses to our requests
        if (this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
          this.pendingRequests.delete(response.id);
        }
      } catch (error) {
        console.error('Failed to parse response:', error, line);
      }
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize the connection
    console.log('Initializing MCP connection...');
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'basic-client-example',
        version: '1.0.0'
      }
    });

    console.log('MCP client ready!');
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

      console.log(`Sending request: ${method}`);
      this.process.stdin.write(JSON.stringify(request) + '\n');

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  async callTool(name, args = {}) {
    console.log(`Calling tool: ${name}`);
    return await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async close() {
    console.log('Closing MCP client...');
    if (this.readline) {
      this.readline.close();
    }
    if (this.process) {
      this.process.kill();
    }
  }
}

async function main() {
  const client = new ChromeDevToolsMCPClient();
  
  try {
    // Start the client
    await client.start();
    
    console.log('\n--- Example 1: Navigate to a webpage ---');
    await client.callTool('navigate_page', {
      url: 'https://developers.chrome.com'
    });
    console.log('✓ Successfully navigated to developers.chrome.com');
    
    console.log('\n--- Example 2: Take a screenshot ---');
    const screenshotResult = await client.callTool('take_screenshot', {
      fullPage: false
    });
    console.log('✓ Screenshot taken');
    
    // Save screenshot if base64 data is available
    if (screenshotResult.content && screenshotResult.content[0]) {
      const base64Data = screenshotResult.content[0].text;
      if (base64Data) {
        const imageBuffer = Buffer.from(base64Data, 'base64');
        writeFileSync('screenshot.png', imageBuffer);
        console.log('✓ Screenshot saved to screenshot.png');
      }
    }
    
    console.log('\n--- Example 3: Get console messages ---');
    const consoleResult = await client.callTool('list_console_messages');
    console.log(`✓ Found ${consoleResult.content[0]?.text ? 'console messages' : 'no console messages'}`);
    
    console.log('\n--- Example 4: Performance trace ---');
    await client.callTool('performance_start_trace');
    console.log('✓ Started performance trace');
    
    // Wait a bit for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const traceResult = await client.callTool('performance_stop_trace');
    console.log('✓ Stopped performance trace');
    console.log('Performance insights:', traceResult.content[0]?.text?.substring(0, 200) + '...');
    
    console.log('\n--- Example 5: Execute JavaScript ---');
    const scriptResult = await client.callTool('evaluate_script', {
      script: 'document.title'
    });
    console.log('✓ Page title:', scriptResult.content[0]?.text);
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
