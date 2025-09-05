#!/bin/bash

echo "📊 MyBidFit Smart Script Status Dashboard"
echo "========================================"
echo ""

TRACKER_FILE=".claude/script-tracker.json"

if [[ ! -f "$TRACKER_FILE" ]]; then
    echo "❌ Script tracker not found: $TRACKER_FILE"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}📈 Script Execution Summary${NC}"
echo "=========================="

# Get stats from tracker
STATS=$(node -e "
const tracker = JSON.parse(require('fs').readFileSync('$TRACKER_FILE'));
console.log('Total runs: ' + tracker.stats.total_runs);
console.log('Total runtime: ' + Math.round(tracker.stats.total_runtime_ms / 1000) + 's');
console.log('Last updated: ' + (tracker.last_updated || 'Never'));
")

echo "$STATS"
echo ""

echo -e "${BLUE}🗓️ Script Status by Type${NC}"
echo "======================="

# Scripts by status and type
node -e "
const tracker = JSON.parse(require('fs').readFileSync('$TRACKER_FILE'));
const scripts = tracker.scripts;

const types = { daily: [], weekly: [], on_change: [], manual: [] };
const statuses = { never_run: 0, success: 0, failed: 0 };

Object.entries(scripts).forEach(([name, script]) => {
    const type = script.type || 'unknown';
    const status = script.last_status || 'never_run';
    
    if (types[type]) {
        types[type].push({ name, script });
    }
    
    statuses[status] = (statuses[status] || 0) + 1;
});

// Daily scripts
console.log('\n📅 DAILY Scripts:');
types.daily.forEach(({name, script}) => {
    const status = script.last_status || 'never_run';
    const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏸️';
    const lastRun = script.last_run ? new Date(script.last_run).toLocaleDateString() : 'Never';
    console.log(\`  \${emoji} \${name.padEnd(25)} - \${script.description} (Last: \${lastRun})\`);
});

// Weekly scripts
console.log('\n📆 WEEKLY Scripts:');
types.weekly.forEach(({name, script}) => {
    const status = script.last_status || 'never_run';
    const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏸️';
    const lastRun = script.last_run ? new Date(script.last_run).toLocaleDateString() : 'Never';
    console.log(\`  \${emoji} \${name.padEnd(25)} - \${script.description} (Last: \${lastRun})\`);
});

// On-change scripts
console.log('\n🔄 ON-CHANGE Scripts:');
types.on_change.forEach(({name, script}) => {
    const status = script.last_status || 'never_run';
    const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏸️';
    const lastRun = script.last_run ? new Date(script.last_run).toLocaleDateString() : 'Never';
    console.log(\`  \${emoji} \${name.padEnd(25)} - \${script.description} (Last: \${lastRun})\`);
});

// Manual scripts
console.log('\n🔧 MANUAL Scripts:');
types.manual.forEach(({name, script}) => {
    const status = script.last_status || 'never_run';
    const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏸️';
    const lastRun = script.last_run ? new Date(script.last_run).toLocaleDateString() : 'Never';
    console.log(\`  \${emoji} \${name.padEnd(25)} - \${script.description} (Last: \${lastRun})\`);
});

console.log(\`\nOverall Status: \${statuses.success} successful, \${statuses.failed} failed, \${statuses.never_run} never run\`);
"

echo ""
echo -e "${YELLOW}🚀 Quick Actions${NC}"
echo "==============="
echo "Run specific script:     ./.claude/scripts/smart-run.sh <script-name>"
echo "Force run script:        ./.claude/scripts/smart-run.sh <script-name> --force"
echo "Dry run test:            ./.claude/scripts/smart-run.sh <script-name> --dry-run"
echo "View this dashboard:     ./run status"
echo ""

echo -e "${CYAN}💡 Recommendations${NC}"
echo "=================="

# Check for scripts that need attention
NEEDS_ATTENTION=$(node -e "
const tracker = JSON.parse(require('fs').readFileSync('$TRACKER_FILE'));
const scripts = tracker.scripts;
const now = new Date();

Object.entries(scripts).forEach(([name, script]) => {
    if (script.last_status === 'failed') {
        console.log('❌ ' + name + ' - Last run failed, needs investigation');
    } else if (!script.last_run && script.type !== 'manual') {
        console.log('⏸️ ' + name + ' - Never been run');
    } else if (script.type === 'daily' && script.last_run) {
        const lastRun = new Date(script.last_run);
        const hoursSince = (now - lastRun) / (1000 * 60 * 60);
        if (hoursSince > 48) {
            console.log('⏰ ' + name + ' - Daily script hasn\\'t run in ' + Math.round(hoursSince) + ' hours');
        }
    } else if (script.type === 'weekly' && script.last_run) {
        const lastRun = new Date(script.last_run);
        const hoursSince = (now - lastRun) / (1000 * 60 * 60);
        if (hoursSince > 168 * 1.5) { // 1.5 weeks
            console.log('⏰ ' + name + ' - Weekly script overdue by ' + Math.round((hoursSince - 168) / 24) + ' days');
        }
    }
});
")

if [[ -z "$NEEDS_ATTENTION" ]]; then
    echo "✅ All scripts are healthy!"
else
    echo "$NEEDS_ATTENTION"
fi

echo ""
echo "📊 Dashboard updated: $(date)"