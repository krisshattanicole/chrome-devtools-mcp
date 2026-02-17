# What You Can Build with Chrome DevTools MCP

## Overview

Chrome DevTools MCP is a **powerful automation and testing platform** that gives you programmatic access to Chrome browser through the Model Context Protocol (MCP). This repository enables you to build production-ready applications across multiple domains.

---

## 🎯 What This Repository Provides

### Core Capabilities
- **Browser Automation**: Full control over Chrome browser actions
- **Performance Testing**: Capture and analyze real performance metrics
- **Visual Testing**: Screenshots and visual regression testing
- **Network Analysis**: Monitor and analyze HTTP requests/responses
- **Console Monitoring**: Track JavaScript errors and logs with source maps
- **Script Execution**: Run custom JavaScript in page context

### Technology Stack
- **MCP Protocol**: Model Context Protocol for AI-agent integration
- **Puppeteer**: Reliable Chrome automation under the hood
- **Chrome DevTools Protocol**: Direct access to browser internals
- **TypeScript/Node.js**: Modern, type-safe development

---

## 🏗️ Applications You Can Build

### 1. **Automated Testing Frameworks**

Build comprehensive testing solutions:

#### End-to-End (E2E) Testing
```javascript
// Test user flows automatically
await client.callTool('navigate_page', { url: 'https://myapp.com/login' });
await client.callTool('fill', { selector: '#username', value: 'testuser' });
await client.callTool('fill', { selector: '#password', value: 'password123' });
await client.callTool('click', { selector: '#login-btn' });
await client.callTool('wait_for', { text: 'Dashboard' });
const screenshot = await client.callTool('take_screenshot');
```

**Use Cases:**
- User authentication flows
- Shopping cart workflows  
- Form submissions
- Multi-step wizards
- Complex user journeys

#### Visual Regression Testing
```javascript
// Capture and compare screenshots
const baseline = await captureScreenshot('homepage');
// Make changes...
const current = await captureScreenshot('homepage');
const diff = compareImages(baseline, current);
```

**Use Cases:**
- UI consistency across releases
- Cross-browser visual testing
- Component library validation
- Responsive design testing

#### Performance Testing
```javascript
// Measure real performance metrics
await client.callTool('performance_start_trace');
await simulateUserBehavior();
const metrics = await client.callTool('performance_stop_trace');
// Analyze: LCP, FID, CLS, TTFB, etc.
```

**Use Cases:**
- Page load performance
- Runtime performance analysis
- Core Web Vitals monitoring
- Performance budgets enforcement

---

### 2. **CI/CD Pipeline Integration**

#### GitHub Actions Integration
```yaml
- name: Run Browser Tests
  uses: actions/setup-node@v3
- run: npm install
- run: node test-with-mcp.js
```

**Examples in this repo:**
- `examples/github-app/` - Complete GitHub App for PR testing
- Webhook-based automated testing
- Check runs with performance reports
- Screenshot attachments on failures

#### Other CI/CD Platforms
- **GitLab CI**: Browser testing in pipelines
- **Jenkins**: Automated acceptance testing
- **CircleCI**: Parallel browser testing
- **Travis CI**: Cross-browser validation

---

### 3. **Monitoring & Observability Tools**

#### Website Performance Monitoring
```javascript
// Continuous monitoring
const monitor = new PerformanceMonitor();
setInterval(async () => {
  const metrics = await monitor.test('https://mysite.com');
  await sendToDatadog(metrics);
  await alertIfSlow(metrics);
}, 60000);
```

**Use Cases:**
- Real-user simulation monitoring
- Performance degradation alerts
- Uptime monitoring with screenshots
- Synthetic monitoring dashboards

#### Error Tracking & Debugging
```javascript
// Capture JavaScript errors
const consoleErrors = await client.callTool('list_console_messages');
const errors = consoleErrors.filter(msg => msg.type === 'error');
await sendToSentry(errors);
```

---

### 4. **Web Scraping & Data Extraction**

#### JavaScript-Rendered Content
```javascript
// Scrape dynamic sites
await client.callTool('navigate_page', { url: 'https://spa-site.com' });
await client.callTool('wait_for', { selector: '.loaded' });
const data = await client.callTool('evaluate_script', {
  script: 'return Array.from(document.querySelectorAll(".item")).map(el => el.textContent)'
});
```

**Use Cases:**
- Price monitoring (e-commerce)
- News aggregation
- Real estate listings
- Job board scraping
- Social media data collection

#### API Testing with Browser Context
```javascript
// Test APIs in real browser context
await client.callTool('navigate_page', { url: 'https://myapp.com' });
const apiResponse = await client.callTool('evaluate_script', {
  script: `
    const response = await fetch('/api/data');
    return await response.json();
  `
});
```

---

### 5. **Development Tools & Utilities**

#### Screenshot as a Service
```javascript
// HTTP endpoint for screenshots
app.post('/screenshot', async (req, res) => {
  const screenshot = await mcpClient.callTool('take_screenshot', {
    url: req.body.url,
    fullPage: true
  });
  res.send(screenshot);
});
```

**Use Cases:**
- Social media preview images
- PDF report generation
- Email template previews
- Documentation screenshots

#### Browser Automation Scripts
```javascript
// One-off automation tasks
async function fillOutForm() {
  await client.callTool('fill_form', {
    fields: [
      { selector: '#name', value: 'John Doe' },
      { selector: '#email', value: 'john@example.com' }
    ]
  });
}
```

---

### 6. **Accessibility Testing**

```javascript
// Check accessibility issues
const accessibilityReport = await client.callTool('evaluate_script', {
  script: `
    // Check for alt text
    const missingAlt = document.querySelectorAll('img:not([alt])').length;
    // Check ARIA labels
    const missingAria = document.querySelectorAll('[role]:not([aria-label])').length;
    return { missingAlt, missingAria };
  `
});
```

**Use Cases:**
- WCAG compliance checking
- Screen reader compatibility
- Keyboard navigation testing
- Color contrast validation

---

### 7. **Custom AI Agents & Chatbots**

Since this is an MCP server, you can integrate it with AI coding assistants:

```javascript
// AI agent can control browser
"Navigate to github.com and check if there are any notifications"
// → MCP server handles browser automation
// → Returns results to AI agent
// → AI agent interprets and responds
```

**Supported AI Platforms:**
- GitHub Copilot
- Claude Code
- Cursor
- Gemini CLI
- VS Code Copilot
- JetBrains AI Assistant

---

## 📦 Integration Patterns

### 1. **As an npm Package**
```bash
npm install chrome-devtools-mcp
```

### 2. **As a Git Submodule**
```bash
git submodule add https://github.com/krisshattanicole/chrome-devtools-mcp
```

### 3. **In a Monorepo**
```
/my-monorepo
  /packages
    /chrome-devtools-mcp  ← This repo
    /my-test-framework    ← Uses MCP
    /my-monitoring-tool   ← Uses MCP
```

### 4. **As a Microservice**
```javascript
// Run MCP as a service
const mcpServer = spawn('npx', ['chrome-devtools-mcp']);
// Other apps connect via IPC/HTTP
```

---

## 🚀 Quick Start Examples

### Testing Framework
```javascript
// test-runner.js
import { MCPClient } from './mcp-client.js';

async function runTests() {
  const client = new MCPClient();
  await client.start();
  
  for (const test of tests) {
    await test.run(client);
  }
  
  await client.close();
}
```

### Performance Monitor
```javascript
// monitor.js
const urls = ['https://site1.com', 'https://site2.com'];
const results = await Promise.all(
  urls.map(url => measurePerformance(url))
);
await saveToDatabase(results);
```

### Web Scraper
```javascript
// scraper.js
const products = await scrapeEcommerceSite('https://shop.com');
await exportToCSV(products);
```

---

## 🎓 Learning Resources

### In This Repository
- **[Building Applications Guide](./docs/building-applications.md)** - Comprehensive tutorial
- **[Examples Directory](./examples/)** - Working code samples
  - Basic Client Example
  - Performance Monitor
  - Web Scraper
  - GitHub App Integration
- **[Tool Reference](./docs/tool-reference.md)** - All available MCP tools
- **[Security Guide](./SECURITY_SUMMARY.md)** - Security best practices

### External Resources
- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

---

## 🏢 Production Use Cases

### E-Commerce
- Product catalog testing
- Checkout flow validation
- Price monitoring
- Visual regression on product pages

### SaaS Applications
- Multi-tenant testing
- Feature flag validation
- Performance monitoring per customer
- Automated onboarding testing

### Media & Publishing
- Content rendering validation
- Ad placement verification
- Paywall testing
- Article scraping and aggregation

### Financial Services
- Transaction flow testing
- Security compliance checking
- Performance under load
- Form validation testing

---

## 🔧 Customization & Extension

### Build Your Own Tools
This repository provides the foundation. Build on top:

1. **Custom Test Framework** - Create domain-specific testing DSL
2. **Monitoring Dashboard** - Real-time browser metrics visualization
3. **Scraping Pipeline** - ETL pipeline with browser automation
4. **CI/CD Plugin** - Platform-specific integrations
5. **AI Agent Tools** - Custom MCP tools for your use case

### Contribute Back
- Add new MCP tools
- Improve performance
- Add examples for your use case
- Write guides and tutorials

---

## 💡 Architecture Overview

```
┌─────────────────────────────────────────┐
│        Your Application                 │
│  (Tests, Monitors, Scrapers, etc.)     │
└──────────────┬──────────────────────────┘
               │ Uses MCP Protocol
               ↓
┌─────────────────────────────────────────┐
│    Chrome DevTools MCP Server           │
│    (This Repository)                    │
│  - MCP Protocol Handler                 │
│  - Tool Implementations                 │
│  - Puppeteer Integration                │
└──────────────┬──────────────────────────┘
               │ Chrome DevTools Protocol
               ↓
┌─────────────────────────────────────────┐
│         Chrome Browser                  │
│    - Automation                         │
│    - Performance Tracing                │
│    - Network Monitoring                 │
│    - JavaScript Execution               │
└─────────────────────────────────────────┘
```

---

## 🎯 Next Steps

1. **Read** the [Building Applications Guide](./docs/building-applications.md)
2. **Try** the examples in [`examples/`](./examples/)
3. **Build** your first application
4. **Share** your use case with the community

---

## ❓ Need Help?

- **Documentation**: Check the [docs/](./docs/) directory
- **Examples**: See working code in [examples/](./examples/)
- **Issues**: Open an issue on GitHub
- **Security**: Read [SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md)

---

## 📄 License

Apache-2.0 - See [LICENSE](./LICENSE) for details

---

**Built with ❤️ for developers who automate browsers at scale**
