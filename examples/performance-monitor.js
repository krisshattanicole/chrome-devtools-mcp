#!/usr/bin/env node

/**
 * Performance Monitor Example
 * 
 * This example monitors multiple websites and captures performance metrics.
 * It generates a detailed report with performance scores and insights.
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { writeFileSync } from 'fs';

class PerformanceMonitor {
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
      clientInfo: {
        name: 'performance-monitor',
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

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Timeout: ${method}`));
        }
      }, 60000);
    });
  }

  async callTool(name, args = {}) {
    return await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async monitorWebsite(url) {
    console.log(`\nMonitoring: ${url}`);
    const startTime = Date.now();
    
    try {
      // Navigate to the website
      await this.callTool('navigate_page', { url });
      
      // Start performance trace
      await this.callTool('performance_start_trace');
      
      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Stop trace and get results
      const traceResult = await this.callTool('performance_stop_trace');
      
      // Get console messages
      const consoleResult = await this.callTool('list_console_messages');
      
      // Get network requests
      const networkResult = await this.callTool('list_network_requests');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Parse results
      const performanceData = traceResult.content[0]?.text || '{}';
      const consoleMessages = consoleResult.content[0]?.text || '[]';
      const networkRequests = networkResult.content[0]?.text || '[]';
      
      return {
        url,
        timestamp: new Date().toISOString(),
        duration,
        performance: performanceData,
        console: consoleMessages,
        network: networkRequests,
        success: true
      };
      
    } catch (error) {
      return {
        url,
        timestamp: new Date().toISOString(),
        error: error.message,
        success: false
      };
    }
  }

  async close() {
    if (this.process) {
      this.process.kill();
    }
  }
}

async function main() {
  const urls = process.argv.slice(2);
  
  if (urls.length === 0) {
    console.log('Usage: node performance-monitor.js <url1> <url2> ...');
    console.log('Example: node performance-monitor.js https://example.com https://google.com');
    process.exit(1);
  }
  
  console.log(`Performance Monitor - Testing ${urls.length} website(s)`);
  console.log('='.repeat(60));
  
  const monitor = new PerformanceMonitor();
  
  try {
    await monitor.start();
    
    const results = [];
    
    // Monitor each website
    for (const url of urls) {
      const result = await monitor.monitorWebsite(url);
      results.push(result);
      
      if (result.success) {
        console.log(`✓ ${url} - Completed in ${result.duration}ms`);
      } else {
        console.log(`✗ ${url} - Failed: ${result.error}`);
      }
    }
    
    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      totalWebsites: urls.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
    
    // Save report to file
    const filename = `performance-report-${Date.now()}.json`;
    writeFileSync(filename, JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('Report Summary:');
    console.log(`  Total websites tested: ${report.totalWebsites}`);
    console.log(`  Successful: ${report.successful}`);
    console.log(`  Failed: ${report.failed}`);
    console.log(`  Report saved to: ${filename}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await monitor.close();
  }
}

main().catch(console.error);
