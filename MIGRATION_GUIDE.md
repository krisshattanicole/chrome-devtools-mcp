# Migration Guide

This repository is a fork of the original Chrome DevTools MCP project. This guide helps you migrate to this fork.

## What Changed

### Repository Information
- **Original**: `ChromeDevTools/chrome-devtools-mcp` (Google LLC)
- **This Fork**: `krisshattanicole/chrome-devtools-mcp`

### Why This Fork?

This fork extends the original project with:
- ✅ **Enhanced Documentation**: Comprehensive guides on what you can build
- ✅ **Integration Patterns**: How to vendor and integrate into your repos
- ✅ **Working Examples**: More practical examples and use cases
- ✅ **Community Focus**: Community-driven enhancements

## Migration Steps

### If You're Using NPM Package

No changes needed! The npm package name remains the same:
```bash
npm install chrome-devtools-mcp
```

### If You're Using Git Reference

Update your `package.json`:

**Before:**
```json
{
  "dependencies": {
    "chrome-devtools-mcp": "github:ChromeDevTools/chrome-devtools-mcp#main"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "chrome-devtools-mcp": "github:krisshattanicole/chrome-devtools-mcp#main"
  }
}
```

Then run:
```bash
npm install
```

### If You're Using Git Submodule

Update the submodule URL:

```bash
# Update .gitmodules
vim .gitmodules  # Change URL to https://github.com/krisshattanicole/chrome-devtools-mcp

# Sync changes
git submodule sync
git submodule update --init --recursive
```

### If You've Forked the Repository

Add this fork as a new remote:

```bash
git remote add krisshattanicole https://github.com/krisshattanicole/chrome-devtools-mcp
git fetch krisshattanicole
git merge krisshattanicole/main
```

## MCP Client Configuration

Update MCP server name in your configuration:

### VS Code / Copilot

**Before:**
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "name": "io.github.ChromeDevTools/chrome-devtools-mcp",
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"]
    }
  }
}
```

**After:**
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "name": "io.github.krisshattanicole/chrome-devtools-mcp",
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"]
    }
  }
}
```

### Command Line Update

**Before:**
```bash
code --add-mcp '{"name":"io.github.ChromeDevTools/chrome-devtools-mcp","command":"npx","args":["-y","chrome-devtools-mcp"],"env":{}}'
```

**After:**
```bash
code --add-mcp '{"name":"io.github.krisshattanicole/chrome-devtools-mcp","command":"npx","args":["-y","chrome-devtools-mcp"],"env":{}}'
```

## What Stays the Same

✅ **Package Name**: Still `chrome-devtools-mcp` on npm  
✅ **Command**: Still `npx chrome-devtools-mcp@latest`  
✅ **API**: All tools and APIs remain compatible  
✅ **Configuration**: All flags and options work the same  
✅ **Dependencies**: Same dependencies, same requirements

## New Features in This Fork

### Enhanced Documentation
- **[What You Can Build](./WHAT_YOU_CAN_BUILD.md)**: Comprehensive overview of use cases
- **[Integration Guide](./INTEGRATION_GUIDE.md)**: How to integrate into your projects
- **[Building Apps Guide](./docs/building-applications.md)**: Detailed application development guide

### More Examples
- Working GitHub App example
- Performance monitoring tool
- Web scraper with security
- Basic client implementation

### Better Security
- Security review documentation
- Best practices guide
- Vulnerability fixes

## Breaking Changes

**None!** This fork maintains 100% backward compatibility with the original project.

## Getting Help

- **Documentation**: See [docs/](./docs/) directory
- **Examples**: Check [examples/](./examples/) directory
- **Issues**: Open an issue on this repository
- **Original Project**: You can still reference the [original repository](https://github.com/ChromeDevTools/chrome-devtools-mcp) for comparison

## Staying Up to Date

This fork periodically syncs with the original repository to pull in bug fixes and improvements.

### Check for Updates

```bash
# If using npm
npm outdated chrome-devtools-mcp

# If using git
git fetch origin
git log HEAD..origin/main --oneline
```

### Update

```bash
# If using npm
npm update chrome-devtools-mcp

# If using git submodule
git submodule update --remote
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Same as original: Apache-2.0 - See [LICENSE](./LICENSE)

## Questions?

If you have questions about this fork or need help migrating:
1. Check the [FAQ](#faq) below
2. Review the [documentation](./docs/)
3. Open an issue

## FAQ

### Q: Will this fork stay maintained?
**A:** Yes, this fork actively maintains the codebase and adds community-requested features.

### Q: Can I use both the original and this fork?
**A:** Technically yes, but it's recommended to use one consistently to avoid confusion.

### Q: Will npm package updates break things?
**A:** No, the npm package name is the same and versions are coordinated.

### Q: Can I contribute to both repositories?
**A:** Yes! Contributions to either repository benefit the community.

### Q: How often does this sync with the original?
**A:** Regular syncs happen to incorporate bug fixes and improvements from the original repository.

## Acknowledgments

This fork builds upon the excellent work of the Chrome DevTools team and the original `chrome-devtools-mcp` project. All credit for the core functionality goes to the original maintainers.

---

**Ready to use this fork? Check out [What You Can Build](./WHAT_YOU_CAN_BUILD.md)!**
