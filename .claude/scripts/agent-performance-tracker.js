#!/usr/bin/env node

/**
 * Agent Performance Tracker
 * Lightweight monitoring for agent execution, token usage, and coordination efficiency
 */

const fs = require('fs');
const path = require('path');

class AgentPerformanceTracker {
  constructor() {
    this.activeAgents = new Map();
    this.completedAgents = [];
    this.metricsFile = path.join(__dirname, '../observability/agent-metrics.json');
    this.reportFile = path.join(__dirname, '../observability/agent-report.md');
    
    // Ensure observability directory exists
    const obsDir = path.dirname(this.metricsFile);
    if (!fs.existsSync(obsDir)) {
      fs.mkdirSync(obsDir, { recursive: true });
    }
    
    // Load existing metrics if available
    this.loadMetrics();
  }

  /**
   * Start tracking an agent execution
   */
  startTracking(agentName, task, expectedDuration = null) {
    const id = `${agentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const execution = {
      id,
      agent: agentName,
      task: task || 'unspecified',
      startTime: Date.now(),
      expectedDuration,
      status: 'running',
      pid: process.pid
    };
    
    this.activeAgents.set(id, execution);
    
    console.log(`🚀 Started tracking: ${agentName} (ID: ${id})`);
    this.saveMetrics();
    
    return id;
  }

  /**
   * End tracking for an agent execution
   */
  endTracking(id, success = true, tokenUsage = 0, result = null) {
    const execution = this.activeAgents.get(id);
    
    if (!execution) {
      console.warn(`⚠️  Attempted to end tracking for unknown agent ID: ${id}`);
      return false;
    }
    
    const endTime = Date.now();
    const duration = endTime - execution.startTime;
    
    const completedExecution = {
      ...execution,
      endTime,
      duration,
      success,
      tokenUsage,
      result: result ? String(result).substring(0, 100) + '...' : null,
      status: success ? 'completed' : 'failed',
      efficiency: execution.expectedDuration ? 
        Math.round((execution.expectedDuration / duration) * 100) : null
    };
    
    // Move to completed list
    this.completedAgents.unshift(completedExecution);
    this.activeAgents.delete(id);
    
    // Keep only last 100 completed executions
    if (this.completedAgents.length > 100) {
      this.completedAgents = this.completedAgents.slice(0, 100);
    }
    
    console.log(`✅ Completed tracking: ${execution.agent} (${duration}ms, ${success ? 'success' : 'failed'})`);
    
    this.saveMetrics();
    this.generateReport();
    
    return completedExecution;
  }

  /**
   * Get current agent performance statistics
   */
  getStats() {
    const now = Date.now();
    const recentLimit = now - (24 * 60 * 60 * 1000); // Last 24 hours
    
    const recentExecutions = this.completedAgents.filter(exec => 
      exec.endTime > recentLimit
    );
    
    const stats = {
      overview: {
        totalExecutions: this.completedAgents.length,
        recentExecutions: recentExecutions.length,
        activeExecutions: this.activeAgents.size,
        timestamp: new Date().toISOString()
      },
      performance: this.calculatePerformanceStats(recentExecutions),
      agents: this.calculateAgentStats(recentExecutions),
      efficiency: this.calculateEfficiencyStats(recentExecutions)
    };
    
    return stats;
  }

  /**
   * Calculate performance statistics
   */
  calculatePerformanceStats(executions) {
    if (executions.length === 0) {
      return { avgDuration: 0, totalTokens: 0, successRate: 0 };
    }
    
    const durations = executions.map(e => e.duration);
    const tokens = executions.map(e => e.tokenUsage || 0);
    const successes = executions.filter(e => e.success).length;
    
    return {
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalTokens: tokens.reduce((a, b) => a + b, 0),
      avgTokens: Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length),
      successRate: Math.round((successes / executions.length) * 100),
      totalExecutions: executions.length
    };
  }

  /**
   * Calculate per-agent statistics
   */
  calculateAgentStats(executions) {
    const agentGroups = {};
    
    executions.forEach(exec => {
      if (!agentGroups[exec.agent]) {
        agentGroups[exec.agent] = [];
      }
      agentGroups[exec.agent].push(exec);
    });
    
    const agentStats = {};
    
    Object.entries(agentGroups).forEach(([agent, execs]) => {
      const durations = execs.map(e => e.duration);
      const tokens = execs.map(e => e.tokenUsage || 0);
      const successes = execs.filter(e => e.success).length;
      
      agentStats[agent] = {
        executions: execs.length,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        totalTokens: tokens.reduce((a, b) => a + b, 0),
        successRate: Math.round((successes / execs.length) * 100),
        lastExecution: Math.max(...execs.map(e => e.endTime))
      };
    });
    
    return agentStats;
  }

  /**
   * Calculate efficiency statistics
   */
  calculateEfficiencyStats(executions) {
    const withExpected = executions.filter(e => e.expectedDuration && e.efficiency);
    
    if (withExpected.length === 0) {
      return { avgEfficiency: null, onTimeRate: null };
    }
    
    const efficiencies = withExpected.map(e => e.efficiency);
    const onTime = withExpected.filter(e => e.duration <= e.expectedDuration).length;
    
    return {
      avgEfficiency: Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length),
      onTimeRate: Math.round((onTime / withExpected.length) * 100),
      totalWithExpected: withExpected.length
    };
  }

  /**
   * Generate human-readable performance report
   */
  generateReport() {
    const stats = this.getStats();
    const timestamp = new Date().toLocaleString();
    
    const report = `# Agent Performance Report

*Generated: ${timestamp}*

## 📊 Overview

- **Total Executions**: ${stats.overview.totalExecutions}
- **Recent (24h)**: ${stats.overview.recentExecutions}
- **Currently Active**: ${stats.overview.activeExecutions}
- **Success Rate**: ${stats.performance.successRate}%

## ⚡ Performance Metrics

### Overall Performance (Last 24h)
- **Average Duration**: ${stats.performance.avgDuration}ms
- **Fastest Execution**: ${stats.performance.minDuration}ms
- **Slowest Execution**: ${stats.performance.maxDuration}ms
- **Total Token Usage**: ${stats.performance.totalTokens.toLocaleString()}
- **Average Tokens**: ${stats.performance.avgTokens}

### Efficiency Metrics
${stats.efficiency.avgEfficiency ? `
- **Average Efficiency**: ${stats.efficiency.avgEfficiency}%
- **On-Time Rate**: ${stats.efficiency.onTimeRate}%
- **Executions with Targets**: ${stats.efficiency.totalWithExpected}
` : '- **Efficiency Tracking**: Not enough data with expected durations'}

## 🤖 Agent Breakdown

${Object.entries(stats.agents).map(([agent, agentStats]) => `
### ${agent}
- **Executions**: ${agentStats.executions}
- **Avg Duration**: ${agentStats.avgDuration}ms
- **Total Tokens**: ${agentStats.totalTokens.toLocaleString()}
- **Success Rate**: ${agentStats.successRate}%
- **Last Run**: ${new Date(agentStats.lastExecution).toLocaleString()}
`).join('')}

## 🎯 Optimization Opportunities

${this.generateOptimizationRecommendations(stats)}

## 📈 Active Executions

${this.activeAgents.size > 0 ? Array.from(this.activeAgents.values()).map(exec => `
- **${exec.agent}**: Running for ${Math.round((Date.now() - exec.startTime) / 1000)}s
  - Task: ${exec.task}
  - Expected: ${exec.expectedDuration ? exec.expectedDuration + 'ms' : 'N/A'}
`).join('') : '- No active executions'}

---

*Agent performance tracking is lightweight and adds minimal overhead to normal operations.*
`;
    
    // Write report to file
    try {
      fs.writeFileSync(this.reportFile, report);
      console.log(`📊 Agent performance report updated: ${this.reportFile}`);
    } catch (error) {
      console.error('❌ Failed to write agent performance report:', error);
    }
    
    return report;
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(stats) {
    const recommendations = [];
    
    // Check for slow agents
    Object.entries(stats.agents).forEach(([agent, agentStats]) => {
      if (agentStats.avgDuration > 5000) {
        recommendations.push(`- **${agent}**: Consider optimization (${agentStats.avgDuration}ms avg)`);
      }
      
      if (agentStats.successRate < 90) {
        recommendations.push(`- **${agent}**: Low success rate (${agentStats.successRate}%) needs investigation`);
      }
      
      if (agentStats.totalTokens > 10000) {
        recommendations.push(`- **${agent}**: High token usage (${agentStats.totalTokens.toLocaleString()}) - consider context optimization`);
      }
    });
    
    // Overall recommendations
    if (stats.performance.avgDuration > 3000) {
      recommendations.push('- **Overall**: Average execution time is high - consider parallel execution');
    }
    
    if (stats.performance.successRate < 95) {
      recommendations.push('- **Overall**: Success rate below 95% - review error patterns');
    }
    
    return recommendations.length > 0 ? 
      recommendations.join('\n') : 
      '- No optimization opportunities identified - performance looks good! ✅';
  }

  /**
   * Load metrics from file
   */
  loadMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
        this.completedAgents = data.completedAgents || [];
        // Don't restore active agents - they're likely stale
        console.log(`📊 Loaded ${this.completedAgents.length} previous agent executions`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to load existing metrics:', error.message);
      this.completedAgents = [];
    }
  }

  /**
   * Save metrics to file
   */
  saveMetrics() {
    try {
      const data = {
        completedAgents: this.completedAgents,
        lastUpdated: Date.now(),
        version: '1.0.0'
      };
      
      fs.writeFileSync(this.metricsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save agent metrics:', error);
    }
  }

  /**
   * Clean up stale active agents (for crash recovery)
   */
  cleanupStaleAgents(maxAge = 10 * 60 * 1000) { // 10 minutes
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, execution] of this.activeAgents) {
      if (now - execution.startTime > maxAge) {
        console.log(`🧹 Cleaning up stale agent: ${execution.agent} (${id})`);
        this.activeAgents.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} stale agent executions`);
      this.saveMetrics();
    }
  }
}

// Export for use in other modules
const tracker = new AgentPerformanceTracker();

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'report') {
    // Generate and display report
    const report = tracker.generateReport();
    console.log('\n' + report);
  } else if (args[0] === 'stats') {
    // Display JSON stats
    const stats = tracker.getStats();
    console.log(JSON.stringify(stats, null, 2));
  } else if (args[0] === 'cleanup') {
    // Clean up stale agents
    tracker.cleanupStaleAgents();
  } else if (args[0] === 'test') {
    // Test tracking functionality
    console.log('🧪 Testing agent tracking...');
    
    const id1 = tracker.startTracking('test-agent', 'testing functionality', 1000);
    setTimeout(() => {
      tracker.endTracking(id1, true, 150, 'Test completed successfully');
    }, 800);
    
    const id2 = tracker.startTracking('slow-agent', 'testing slow execution', 500);
    setTimeout(() => {
      tracker.endTracking(id2, false, 250, 'Test failed');
    }, 1200);
    
    setTimeout(() => {
      console.log('\n📊 Test Report:');
      console.log(tracker.generateReport());
    }, 1500);
  } else {
    console.log(`
Agent Performance Tracker

Usage:
  node agent-performance-tracker.js [command]

Commands:
  report    Generate human-readable performance report (default)
  stats     Output JSON statistics
  cleanup   Clean up stale agent executions
  test      Test the tracking functionality

Examples:
  # Basic usage - show performance report
  node .claude/scripts/agent-performance-tracker.js
  
  # Get JSON stats for automation
  node .claude/scripts/agent-performance-tracker.js stats
  
  # Clean up after crashes
  node .claude/scripts/agent-performance-tracker.js cleanup

Integration:
  const tracker = require('./.claude/scripts/agent-performance-tracker.js');
  const id = tracker.startTracking('my-agent', 'processing data', 2000);
  // ... agent work ...
  tracker.endTracking(id, success, tokenCount, result);
`);
  }
}

module.exports = tracker;