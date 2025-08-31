#!/usr/bin/env node

/**
 * MyBidFit AI Agent Activity Logger
 * Standardized utility for logging agent actions to the audit trail
 * 
 * Usage:
 *   node tools/log-agent-activity.js --action="file_read" --target="src/server.js" --status="success" [options]
 * 
 * Required Parameters:
 *   --action: Type of action performed (e.g., file_read, test_execution, phase_completion)
 *   --target: Target of the action (file path, system, or description)
 *   --status: Result status (success, failed, pending)
 * 
 * Optional Parameters:
 *   --notes: Additional description or context
 *   --format=json: Output results as JSON for programmatic use
 *   --verbose: Enable detailed output
 *   --help: Show usage information
 * 
 * Exit Codes:
 *   0: Successfully logged activity
 *   1: Error (missing parameters, file write failure)
 * 
 * Output format (log file): timestamp | action | target | status | notes
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const params = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    params[key] = value || '';
  }
});

// Show help if requested
if (params.help) {
  console.log(`
MyBidFit AI Agent Activity Logger

Usage: node tools/log-agent-activity.js --action=ACTION --target=TARGET --status=STATUS [options]

Required Parameters:
  --action=VALUE    Type of action (file_read, test_execution, phase_completion, etc.)
  --target=VALUE    Target of action (file path, system name, or description)
  --status=VALUE    Result status (success, failed, pending)

Optional Parameters:
  --notes=VALUE     Additional description or context
  --format=json     Output results as JSON for programmatic use
  --verbose         Enable detailed output
  --help           Show this usage information

Exit Codes:
  0: Successfully logged activity
  1: Error (missing parameters, file write failure)

Examples:
  node tools/log-agent-activity.js --action=file_read --target=src/server.js --status=success --notes="Analyzed server config"
  node tools/log-agent-activity.js --action=test_execution --target=auth_tests --status=failed --format=json
`);
  process.exit(0);
}

// Validate required parameters
const required = ['action', 'target', 'status'];
const missing = required.filter(param => !params[param]);

if (missing.length > 0) {
  const errorMessage = `Missing required parameters: ${missing.join(', ')}`;
  
  if (params.format === 'json') {
    console.log(JSON.stringify({
      tool: "log-agent-activity",
      status: "failed",
      timestamp: new Date().toISOString(),
      error: errorMessage,
      missing_parameters: missing,
      help: "Use --help for usage information"
    }, null, 2));
  } else {
    console.error(`❌ ${errorMessage}`);
    console.error('Use --help for usage information');
  }
  process.exit(1);
}

// Main logging logic
async function logActivity() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const { action, target, status, notes = '' } = params;

  try {
    // Create log entry
    const logEntry = `${timestamp} | ${action} | ${target} | ${status} | ${notes}\n`;

    // Append to log file
    const logFile = path.join(process.cwd(), 'agent_activity.log');
    fs.appendFileSync(logFile, logEntry);

    // Prepare results
    const results = {
      log_entry_created: true,
      log_file: logFile,
      timestamp: timestamp,
      action: action,
      target: target,
      status: status,
      notes: notes
    };

    // Output results
    if (params.format === 'json') {
      console.log(JSON.stringify({
        tool: "log-agent-activity",
        status: "success",
        timestamp: new Date().toISOString(),
        input_parameters: params,
        results: results,
        recommendations: ["Activity logged successfully", "Check agent_activity.log for audit trail"],
        next_actions: ["Continue with next task", "Monitor activity log for patterns"],
        execution_time_ms: Date.now() - startTime
      }, null, 2));
    } else {
      const statusEmoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';
      console.log(`${statusEmoji} Logged: ${action} on ${target} (${status})`);
      
      if (notes && params.verbose) {
        console.log(`   Notes: ${notes}`);
      }
      
      if (params.verbose) {
        console.log(`   ⏱️ Logged to: ${logFile}`);
        console.log(`   🕒 Timestamp: ${timestamp}`);
        console.log(`   ⚡ Execution time: ${Date.now() - startTime}ms`);
      }
    }

    process.exit(0);

  } catch (error) {
    const errorMessage = `Failed to log activity: ${error.message}`;
    
    if (params.format === 'json') {
      console.log(JSON.stringify({
        tool: "log-agent-activity",
        status: "failed",
        timestamp: new Date().toISOString(),
        error: errorMessage,
        stack: error.stack,
        input_parameters: params,
        execution_time_ms: Date.now() - startTime
      }, null, 2));
    } else {
      console.error(`❌ ${errorMessage}`);
      if (params.verbose) {
        console.error(error.stack);
      }
    }
    
    process.exit(1);
  }
}

// Run the tool
logActivity();