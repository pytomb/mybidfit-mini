# MyBidFit Tools Directory

This directory contains utility scripts and diagnostic tools for the MyBidFit project. These tools are designed for AI agent collaboration and development support.

## 📋 **Tool Standards & Contracts**

All tools in this directory follow standardized input/output contracts for predictable AI agent interaction:

### Input Contract
- **Command-line flags**: `--param=value` format
- **Required parameters**: Always documented in tool header
- **Optional parameters**: Clearly marked as optional

### Output Contract
- **Default output**: Human-readable status messages
- **JSON output**: Available with `--format=json` flag
- **Exit codes**: 0 for success, 1 for errors

## 🛠️ **Available Tools**

### UI/UX Assessment Tools
- **`mybidfit-ui-assessment.js`** - Comprehensive UI quality assessment
- **`comprehensive-ui-assessment.js`** - Complete UI assessment with visual validation
- **`capture-dashboard.js`** - Capture dashboard screenshots for analysis
- **`capture-screenshots.js`** - General screenshot capture utility
- **`final-dashboard-inspection.js`** - Final quality verification for dashboard

### Development & Debugging Tools
- **`debug-login.js`** - Debug authentication and login issues
- **`log-agent-activity.js`** - Log AI agent actions to audit trail

## 🎯 **Usage Examples**

```bash
# UI Assessment
node tools/mybidfit-ui-assessment.js --url=http://localhost:3001 --format=json

# Debug authentication
node tools/debug-login.js --user=testuser --verbose

# Log agent activity
node tools/log-agent-activity.js --action="test_run" --target="ui_assessment" --status="success" --notes="UI quality validated"

# Screenshot capture
node tools/capture-dashboard.js --url=http://localhost:3001 --output=./screenshots/
```

## 🤖 **AI Agent Integration**

These tools are designed for seamless AI agent integration:

1. **Predictable I/O**: All tools follow the same input/output patterns
2. **JSON Mode**: Use `--format=json` for programmatic parsing
3. **Agent Manifest**: Tools are registered in `../agent_manifest.json`
4. **Activity Logging**: Built-in integration with agent activity tracking

## 📊 **Tool Output Format (JSON Mode)**

```json
{
  "tool": "tool_name",
  "status": "success|failed|pending",
  "timestamp": "2025-01-31T08:00:00.000Z",
  "input_parameters": {...},
  "results": {...},
  "recommendations": [...],
  "next_actions": [...]
}
```

## 🔧 **Development Guidelines**

When creating new tools:

1. **Follow naming convention**: `tool-purpose.js`
2. **Include tool header**: Document purpose, usage, and I/O contracts
3. **Implement JSON output**: Support `--format=json` flag
4. **Add error handling**: Proper exit codes and error messages
5. **Update agent manifest**: Register new tools in `../agent_manifest.json`
6. **Test thoroughly**: Ensure tool works in both human and AI agent contexts

## 🚨 **Important Notes**

- These tools are **NOT part of the production build**
- Tools are excluded from Docker production images via `.dockerignore`
- Tools are designed for development, testing, and AI collaboration
- All tools should be safe to run without affecting production data

## 📝 **Logging Integration**

All tools can integrate with the agent activity logging system:

```bash
# Manual logging
node tools/log-agent-activity.js --action="tool_execution" --target="ui_assessment" --status="success"

# Automated logging (in tool scripts)
const logActivity = require('../log-agent-activity.js');
// Use programmatic logging within tools
```

This standardized approach enables reliable AI agent automation while maintaining human usability.