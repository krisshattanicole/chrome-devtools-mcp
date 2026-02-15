#!/usr/bin/env node

/**
 * Web Scraper Example
 * 
 * This example demonstrates how to scrape data from JavaScript-rendered websites
 * using Chrome DevTools MCP.
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { writeFileSync } from 'fs';

class WebScraper {
  constructor() {
    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  async start() {
    console.log('Starting web scraper...');
    
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
        // Ignore
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'web-scraper',
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
      }, 30000);
    });
  }

  async callTool(name, args = {}) {
    return await this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async scrape(url, options = {}) {
    console.log(`Scraping: ${url}`);
    
    try {
      // Navigate to the page
      await this.callTool('navigate_page', { url });
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract data based on options
      const data = {};
      
      // Get page title
      const titleResult = await this.callTool('evaluate_script', {
        script: 'document.title'
      });
      data.title = titleResult.content[0]?.text || '';
      
      // Get meta description
      const metaResult = await this.callTool('evaluate_script', {
        script: `
          const meta = document.querySelector('meta[name="description"]');
          return meta ? meta.content : '';
        `
      });
      data.description = metaResult.content[0]?.text || '';
      
      // Get all links
      const linksResult = await this.callTool('evaluate_script', {
        script: `
          return Array.from(document.querySelectorAll('a'))
            .map(a => ({ text: a.textContent.trim(), href: a.href }))
            .filter(link => link.text && link.href);
        `
      });
      data.links = JSON.parse(linksResult.content[0]?.text || '[]');
      
      // Get all images
      const imagesResult = await this.callTool('evaluate_script', {
        script: `
          return Array.from(document.querySelectorAll('img'))
            .map(img => ({ src: img.src, alt: img.alt }))
            .filter(img => img.src);
        `
      });
      data.images = JSON.parse(imagesResult.content[0]?.text || '[]');
      
      // Get headings
      const headingsResult = await this.callTool('evaluate_script', {
        script: `
          return Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(h => ({ tag: h.tagName, text: h.textContent.trim() }))
            .filter(h => h.text);
        `
      });
      data.headings = JSON.parse(headingsResult.content[0]?.text || '[]');
      
      // Custom selector if provided
      if (options.selector) {
        const customResult = await this.callTool('evaluate_script', {
          script: `
            return Array.from(document.querySelectorAll('${options.selector}'))
              .map(el => el.textContent.trim());
          `
        });
        data.customData = JSON.parse(customResult.content[0]?.text || '[]');
      }
      
      return {
        url,
        scrapedAt: new Date().toISOString(),
        data,
        success: true
      };
      
    } catch (error) {
      return {
        url,
        scrapedAt: new Date().toISOString(),
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
  const url = process.argv[2];
  const selector = process.argv[3];
  
  if (!url) {
    console.log('Usage: node web-scraper.js <url> [custom-selector]');
    console.log('Example: node web-scraper.js https://example.com');
    console.log('         node web-scraper.js https://example.com ".article-title"');
    process.exit(1);
  }
  
  const scraper = new WebScraper();
  
  try {
    await scraper.start();
    
    const options = selector ? { selector } : {};
    const result = await scraper.scrape(url, options);
    
    if (result.success) {
      console.log('\n✓ Scraping completed successfully!');
      console.log(`  Title: ${result.data.title}`);
      console.log(`  Links found: ${result.data.links.length}`);
      console.log(`  Images found: ${result.data.images.length}`);
      console.log(`  Headings found: ${result.data.headings.length}`);
      
      // Save to file
      const filename = `scraped-data-${Date.now()}.json`;
      writeFileSync(filename, JSON.stringify(result, null, 2));
      console.log(`\n  Data saved to: ${filename}`);
    } else {
      console.log(`\n✗ Scraping failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main().catch(console.error);
