#!/usr/bin/env node

/**
 * MyBidFit Tool Template
 * 
 * This template demonstrates the standardized I/O contract for all MyBidFit tools.
 * Copy this template when creating new tools.
 * 
 * Usage:
 *   node tools/tool-template.js --param1=value1 --param2=value2 [--format=json] [--verbose]
 * 
 * Required Parameters:
 *   --param1: Description of required parameter
 *   --param2: Description of another required parameter
 * 
 * Optional Parameters:
 *   --format=json: Output results as JSON for programmatic use
 *   --verbose: Enable detailed output
 *   --help: Show this usage information
 * 
 * Exit Codes:
 *   0: Success
 *   1: Error (invalid parameters, tool failure, etc.)
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
MyBidFit Tool Template

Usage: node tools/tool-template.js --param1=value1 --param2=value2 [options]

Required Parameters:
  --param1=VALUE    Description of required parameter
  --param2=VALUE    Description of another required parameter

Optional Parameters:
  --format=json     Output results as JSON for programmatic use
  --verbose         Enable detailed output
  --help           Show this usage information

Exit Codes:
  0: Success
  1: Error (invalid parameters, tool failure, etc.)

Examples:
  node tools/tool-template.js --param1=test --param2=value
  node tools/tool-template.js --param1=test --param2=value --format=json
  node tools/tool-template.js --param1=test --param2=value --verbose
`);
  process.exit(0);
}

// Validate required parameters
const required = ['param1', 'param2'];
const missing = required.filter(param => !params[param]);

if (missing.length > 0) {
  const errorMessage = `❌ Missing required parameters: ${missing.join(', ')}`;
  
  if (params.format === 'json') {
    console.log(JSON.stringify({
      tool: "tool-template",
      status: "failed",
      timestamp: new Date().toISOString(),
      error: errorMessage,
      missing_parameters: missing,
      help: "Use --help for usage information"
    }, null, 2));
  } else {
    console.error(errorMessage);
    console.error('Use --help for usage information');
  }
  process.exit(1);
}

// Main tool logic
async function runTool() {
  const startTime = Date.now();
  
  try {
    // Verbose output
    if (params.verbose && params.format !== 'json') {
      console.log('🔧 Starting tool execution...');
      console.log(`📋 Parameters: ${JSON.stringify(params, null, 2)}`);
    }

    // Example tool logic here
    const results = {
      processed_param1: params.param1,
      processed_param2: params.param2,
      processing_time: `${Date.now() - startTime}ms`,
      example_data: [
        { id: 1, name: "Example Item 1", status: "active" },
        { id: 2, name: "Example Item 2", status: "inactive" }
      ]
    };

    const recommendations = [
      "Example recommendation 1",
      "Example recommendation 2"
    ];

    const nextActions = [
      "Next action 1",
      "Next action 2"
    ];

    // Output results
    if (params.format === 'json') {
      console.log(JSON.stringify({
        tool: "tool-template",
        status: "success",
        timestamp: new Date().toISOString(),
        input_parameters: params,
        results: results,
        recommendations: recommendations,
        next_actions: nextActions,
        execution_time_ms: Date.now() - startTime
      }, null, 2));
    } else {
      console.log('✅ Tool execution completed successfully');
      console.log(`📊 Results: ${JSON.stringify(results, null, 2)}`);
      
      if (recommendations.length > 0) {
        console.log('💡 Recommendations:');
        recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      if (nextActions.length > 0) {
        console.log('🎯 Suggested next actions:');
        nextActions.forEach(action => console.log(`   • ${action}`));
      }
      
      if (params.verbose) {
        console.log(`⏱️ Execution time: ${Date.now() - startTime}ms`);
      }
    }

    // Optional: Log activity (if this is a significant tool action)
    // const logActivity = require('./log-agent-activity.js');
    // logActivity(...);

    process.exit(0);

  } catch (error) {
    const errorMessage = `Tool execution failed: ${error.message}`;
    
    if (params.format === 'json') {
      console.log(JSON.stringify({
        tool: "tool-template",
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
runTool();