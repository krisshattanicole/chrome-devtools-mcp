# Repository Integration & Vendoring Guide

## Overview

This guide explains how to integrate Chrome DevTools MCP into your other repositories and projects.

---

## 🎯 Integration Strategies

### Strategy 1: NPM Package Dependency (Recommended)

**Best for:** Most projects, standard Node.js applications

```json
// package.json
{
  "dependencies": {
    "chrome-devtools-mcp": "^0.17.0"
  }
}
```

**Pros:**
- ✅ Easy updates via `npm update`
- ✅ Semantic versioning
- ✅ Minimal repository size
- ✅ Standard Node.js practice

**Cons:**
- ❌ Requires npm registry access
- ❌ Network dependency

---

### Strategy 2: Git Submodule

**Best for:** Monorepos, when you need source code access, version pinning

```bash
# Add as submodule
git submodule add https://github.com/krisshattanicole/chrome-devtools-mcp packages/chrome-devtools-mcp

# Initialize and update
git submodule update --init --recursive

# Update to latest
cd packages/chrome-devtools-mcp
git pull origin main
cd ../..
git add packages/chrome-devtools-mcp
git commit -m "Update chrome-devtools-mcp submodule"
```

**Directory structure:**
```
your-repo/
├── packages/
│   ├── chrome-devtools-mcp/     ← Submodule
│   ├── your-app/
│   └── your-tests/
├── .gitmodules
└── package.json
```

**Pros:**
- ✅ Full source code access
- ✅ Version pinning to specific commit
- ✅ Works offline once cloned
- ✅ Can make local modifications

**Cons:**
- ❌ Requires Git knowledge
- ❌ Extra setup steps for contributors
- ❌ Updates require manual commits

---

### Strategy 3: True Vendoring (Copy Files)

**Best for:** Air-gapped environments, maximum control, no external dependencies

```bash
# Copy the entire repository
cp -r /path/to/chrome-devtools-mcp ./vendor/chrome-devtools-mcp

# Or just copy what you need
mkdir -p ./vendor/chrome-devtools-mcp
cp -r /path/to/chrome-devtools-mcp/src ./vendor/chrome-devtools-mcp/
cp /path/to/chrome-devtools-mcp/package.json ./vendor/chrome-devtools-mcp/
```

**Update .gitignore if needed:**
```gitignore
# Don't ignore vendored code
!vendor/chrome-devtools-mcp
```

**Pros:**
- ✅ Complete control
- ✅ No external dependencies
- ✅ Works in air-gapped environments
- ✅ Fast CI/CD (no downloads)

**Cons:**
- ❌ Large repository size
- ❌ Manual updates required
- ❌ Merge conflicts on updates
- ❌ Licensing considerations

---

### Strategy 4: Monorepo with Workspaces

**Best for:** Multiple related projects, shared development

Using npm workspaces:
```json
// package.json (root)
{
  "name": "my-monorepo",
  "workspaces": [
    "packages/*"
  ]
}
```

**Directory structure:**
```
my-monorepo/
├── packages/
│   ├── chrome-devtools-mcp/     ← This repo (submodule or copy)
│   ├── my-test-suite/
│   ├── my-monitoring-tool/
│   └── my-scraper/
└── package.json
```

**Using in other packages:**
```json
// packages/my-test-suite/package.json
{
  "dependencies": {
    "chrome-devtools-mcp": "*"
  }
}
```

**Pros:**
- ✅ Share code between packages
- ✅ Single `node_modules`
- ✅ Unified dependency management
- ✅ Easy local development

**Cons:**
- ❌ More complex setup
- ❌ Requires workspace-aware tools

---

## 🔧 Configuration for Different Setups

### For Testing Frameworks

```javascript
// test-setup.js
import { resolve } from 'path';

// If using submodule
const mcpPath = resolve(__dirname, '../packages/chrome-devtools-mcp');

// If using npm package
const mcpPath = 'chrome-devtools-mcp';

export const MCP_CONFIG = {
  command: 'npx',
  args: ['-y', mcpPath]
};
```

### For CI/CD Pipelines

#### GitHub Actions
```yaml
name: Browser Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive  # If using submodules
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm test
```

#### GitLab CI
```yaml
test:
  image: node:20
  before_script:
    - git submodule update --init --recursive  # If using submodules
    - npm ci
  script:
    - npm test
```

---

## 📦 Multi-Repository Integration Patterns

### Pattern 1: Shared Testing Infrastructure

```
organization/
├── chrome-devtools-mcp/          ← MCP server
├── e2e-test-framework/           ← Uses MCP
├── performance-monitor/          ← Uses MCP
└── website-scraper/              ← Uses MCP
```

Each repository includes MCP as dependency:
```json
{
  "dependencies": {
    "chrome-devtools-mcp": "github:krisshattanicole/chrome-devtools-mcp#main"
  }
}
```

### Pattern 2: Central Testing Repository

```
testing-monorepo/
├── packages/
│   ├── chrome-devtools-mcp/      ← Core (submodule)
│   ├── test-utils/               ← Shared utilities
│   ├── app1-tests/               ← Tests for app 1
│   ├── app2-tests/               ← Tests for app 2
│   └── shared-tests/             ← Shared test suites
```

### Pattern 3: Plugin Architecture

```javascript
// In your main repo
import { MCPPlugin } from 'chrome-devtools-mcp/plugin';

const testFramework = new TestFramework({
  plugins: [
    new MCPPlugin({
      headless: true,
      isolated: true
    })
  ]
});
```

---

## 🔄 Update Strategies

### For NPM Packages
```bash
# Update to latest
npm update chrome-devtools-mcp

# Update to specific version
npm install chrome-devtools-mcp@0.17.0

# Check for updates
npm outdated
```

### For Git Submodules
```bash
# Update specific submodule
git submodule update --remote packages/chrome-devtools-mcp

# Update all submodules
git submodule update --remote

# Pull specific version
cd packages/chrome-devtools-mcp
git fetch
git checkout v0.17.0
cd ../..
git add packages/chrome-devtools-mcp
git commit -m "Pin to v0.17.0"
```

### For Vendored Code
```bash
# Script to update vendored code
#!/bin/bash
VENDOR_DIR="./vendor/chrome-devtools-mcp"
SOURCE_REPO="https://github.com/krisshattanicole/chrome-devtools-mcp"

rm -rf $VENDOR_DIR
git clone --depth 1 $SOURCE_REPO $VENDOR_DIR
rm -rf $VENDOR_DIR/.git
git add $VENDOR_DIR
git commit -m "Update vendored chrome-devtools-mcp"
```

---

## 🏗️ Building on Top of This Repository

### Create a Test Framework

```javascript
// my-test-framework/
//   ├── src/
//   │   ├── runner.js
//   │   ├── assertions.js
//   │   └── reporters.js
//   ├── package.json
//   └── README.md

// package.json
{
  "name": "my-test-framework",
  "dependencies": {
    "chrome-devtools-mcp": "^0.17.0"
  }
}

// src/runner.js
import { MCPClient } from './mcp-client.js';

export class TestRunner {
  async run(tests) {
    const client = new MCPClient();
    await client.start();
    
    for (const test of tests) {
      await this.runTest(test, client);
    }
    
    await client.close();
  }
}
```

### Create a Monitoring Service

```javascript
// monitoring-service/
//   ├── src/
//   │   ├── monitor.js
//   │   ├── scheduler.js
//   │   └── alerting.js
//   ├── package.json
//   └── config.json

// Depends on chrome-devtools-mcp
export class WebsiteMonitor {
  constructor(mcpClient) {
    this.client = mcpClient;
  }
  
  async checkHealth(url) {
    await this.client.callTool('navigate_page', { url });
    const metrics = await this.client.callTool('performance_stop_trace');
    return this.analyzeMetrics(metrics);
  }
}
```

---

## 📋 Checklist for Integration

### Initial Setup
- [ ] Choose integration strategy (npm, submodule, vendor)
- [ ] Add to your repository
- [ ] Update package.json dependencies
- [ ] Install Chrome browser
- [ ] Verify Node.js version (20.19+)

### Development
- [ ] Import MCP client in your code
- [ ] Create MCP client wrapper (optional)
- [ ] Write tests
- [ ] Add to CI/CD pipeline

### Maintenance
- [ ] Set up dependabot/renovate for updates
- [ ] Monitor for security updates
- [ ] Keep Node.js updated
- [ ] Document your integration

---

## 🔒 Security Considerations

### When Using as Dependency
- Keep dependencies updated
- Use lock files (`package-lock.json`)
- Scan for vulnerabilities (`npm audit`)
- Review security advisories

### When Vendoring
- Keep vendored code updated manually
- Track upstream security fixes
- Document vendoring date and version
- Consider automated update scripts

---

## 💡 Example Integrations

### 1. E2E Testing Suite
```
e2e-tests/
├── package.json              # Depends on chrome-devtools-mcp
├── tests/
│   ├── login.test.js
│   ├── checkout.test.js
│   └── admin.test.js
└── utils/
    └── mcp-helper.js         # Wrapper utilities
```

### 2. Performance Dashboard
```
perf-dashboard/
├── backend/
│   ├── package.json          # Depends on chrome-devtools-mcp
│   ├── monitor.js
│   └── scheduler.js
├── frontend/
│   └── dashboard-ui/
└── database/
```

### 3. Scraping Pipeline
```
data-pipeline/
├── scrapers/
│   ├── package.json          # Depends on chrome-devtools-mcp
│   ├── product-scraper.js
│   └── news-scraper.js
├── processors/
└── storage/
```

---

## 🎓 Best Practices

1. **Use Semantic Versioning**: Pin to major versions, allow minor updates
   ```json
   "chrome-devtools-mcp": "^0.17.0"  // Good
   "chrome-devtools-mcp": "*"        // Avoid
   ```

2. **Document Your Integration**: Explain how/why you're using MCP

3. **Isolate MCP Logic**: Create abstraction layer for easier updates

4. **Test Your Integration**: Include integration tests

5. **Monitor Dependencies**: Use tools like Snyk or Dependabot

---

## 📞 Support

Need help integrating this into your repositories?

1. Check [Building Applications Guide](./docs/building-applications.md)
2. Review [Examples](./examples/)
3. Open an issue with your use case
4. Join community discussions

---

## 🔗 Related Resources

- [NPM Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)
- [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Monorepo Tools](https://monorepo.tools/)
- [Lerna](https://lerna.js.org/)
- [Turborepo](https://turbo.build/)

---

**Ready to integrate? Start with the [Quick Start Guide](./README.md#getting-started)**
