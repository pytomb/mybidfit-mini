#!/bin/bash

# Smart Script Runner with Date Awareness
# Usage: ./smart-run.sh <script_name> [--force] [--dry-run]

TRACKER_FILE=".claude/script-tracker.json"
SCRIPT_NAME="$1"
FORCE_RUN=false
DRY_RUN=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
for arg in "$@"; do
    case $arg in
        --force) FORCE_RUN=true ;;
        --dry-run) DRY_RUN=true ;;
    esac
done

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if tracker file exists
if [[ ! -f "$TRACKER_FILE" ]]; then
    log_error "Script tracker not found: $TRACKER_FILE"
    exit 1
fi

# Function to get script info from tracker
get_script_info() {
    local script_name="$1"
    local field="$2"
    local result=$(node -e "
        const tracker = JSON.parse(require('fs').readFileSync('$TRACKER_FILE'));
        const script = tracker.scripts['$script_name'];
        if (!script) { process.stdout.write('null'); process.exit(0); }
        const value = script['$field'];
        process.stdout.write(value === undefined ? 'null' : String(value));
    " 2>/dev/null)
    echo "${result:-null}"
}

# Function to check if files have changed since last run
files_changed_since() {
    local script_name="$1"
    local last_run="$2"
    local triggers=$(node -pe "
        const tracker = JSON.parse(require('fs').readFileSync('$TRACKER_FILE'));
        const script = tracker.scripts['$script_name'];
        if (!script || !script.triggers) { console.log(''); process.exit(0); }
        console.log(script.triggers.join(' '));
    " 2>/dev/null)
    
    if [[ -z "$triggers" ]] || [[ "$last_run" == "null" ]]; then
        return 0  # No triggers or never run = assume changed
    fi
    
    # Check if any trigger files changed since last run
    local last_run_epoch=$(date -d "$last_run" +%s 2>/dev/null || echo "0")
    
    for pattern in $triggers; do
        # Use find to check for files newer than last run
        if find . -path "./$pattern" -newer <(date -d "@$last_run_epoch" 2>/dev/null || echo "") 2>/dev/null | grep -q .; then
            return 0  # Files changed
        fi
    done
    
    return 1  # No relevant files changed
}

# Function to check if script should run
should_run_script() {
    local script_name="$1"
    
    if [[ "$FORCE_RUN" == true ]]; then
        log_info "Force run requested for $script_name"
        return 0
    fi
    
    local script_type=$(get_script_info "$script_name" "type")
    local last_run=$(get_script_info "$script_name" "last_run")
    local interval_hours=$(get_script_info "$script_name" "interval_hours")
    
    if [[ "$script_type" == "null" ]]; then
        log_error "Script '$script_name' not found in tracker"
        return 1
    fi
    
    case "$script_type" in
        "manual")
            log_info "$script_name is manual-only (skipping automatic run)"
            return 1
            ;;
        "on_change")
            if files_changed_since "$script_name" "$last_run"; then
                log_info "$script_name: Relevant files changed since last run"
                return 0
            else
                log_info "$script_name: No relevant changes detected (skipping)"
                return 1
            fi
            ;;
        "daily"|"weekly")
            if [[ "$last_run" == "null" ]]; then
                log_info "$script_name: Never run before"
                return 0
            fi
            
            local last_run_epoch=$(date -d "$last_run" +%s 2>/dev/null || echo "0")
            local now_epoch=$(date +%s)
            local hours_since=$(( (now_epoch - last_run_epoch) / 3600 ))
            
            if [[ $hours_since -ge $interval_hours ]]; then
                log_info "$script_name: ${hours_since}h since last run (threshold: ${interval_hours}h)"
                return 0
            else
                local hours_remaining=$(( interval_hours - hours_since ))
                log_info "$script_name: Last run ${hours_since}h ago (${hours_remaining}h remaining)"
                return 1
            fi
            ;;
    esac
    
    return 1
}

# Function to update tracker after run
update_tracker() {
    local script_name="$1"
    local status="$2"
    local runtime_ms="$3"
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    node -e "
        const fs = require('fs');
        const tracker = JSON.parse(fs.readFileSync('$TRACKER_FILE'));
        
        if (tracker.scripts['$script_name']) {
            tracker.scripts['$script_name'].last_run = '$now';
            tracker.scripts['$script_name'].last_status = '$status';
            tracker.scripts['$script_name'].run_count += 1;
            
            // Update average runtime
            const currentAvg = tracker.scripts['$script_name'].avg_runtime_ms || 0;
            const runCount = tracker.scripts['$script_name'].run_count;
            tracker.scripts['$script_name'].avg_runtime_ms = Math.round(
                (currentAvg * (runCount - 1) + $runtime_ms) / runCount
            );
            
            // Update global stats
            tracker.stats.total_runs += 1;
            tracker.stats.total_runtime_ms += $runtime_ms;
            tracker.last_updated = '$now';
            
            fs.writeFileSync('$TRACKER_FILE', JSON.stringify(tracker, null, 2));
        }
    "
}

# Function to execute script
execute_script() {
    local script_name="$1"
    local command=$(get_script_info "$script_name" "command")
    local description=$(get_script_info "$script_name" "description")
    
    if [[ "$command" == "null" ]]; then
        log_error "No command found for script: $script_name"
        return 1
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY RUN: Would execute: $command"
        return 0
    fi
    
    log_info "Executing: $description"
    echo "Command: $command"
    echo "----------------------------------------"
    
    local start_time=$(date +%s%3N)
    eval "$command"
    local exit_code=$?
    local end_time=$(date +%s%3N)
    local runtime_ms=$((end_time - start_time))
    
    echo "----------------------------------------"
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "$script_name completed successfully (${runtime_ms}ms)"
        update_tracker "$script_name" "success" "$runtime_ms"
    else
        log_error "$script_name failed with exit code $exit_code (${runtime_ms}ms)"
        update_tracker "$script_name" "failed" "$runtime_ms"
    fi
    
    return $exit_code
}

# Main execution logic
main() {
    if [[ -z "$SCRIPT_NAME" ]]; then
        echo "🤖 Smart Script Runner"
        echo "====================="
        echo ""
        echo "Usage: ./smart-run.sh <script_name> [--force] [--dry-run]"
        echo ""
        echo "Available scripts:"
        node -pe "
            const tracker = JSON.parse(require('fs').readFileSync('$TRACKER_FILE'));
            Object.entries(tracker.scripts).forEach(([name, script]) => {
                console.log('  ' + name.padEnd(20) + ' - ' + script.description);
            });
        "
        echo ""
        echo "Options:"
        echo "  --force    Force run regardless of timing/changes"
        echo "  --dry-run  Show what would run without executing"
        return 0
    fi
    
    if should_run_script "$SCRIPT_NAME"; then
        execute_script "$SCRIPT_NAME"
    else
        log_info "Script '$SCRIPT_NAME' does not need to run at this time"
        return 0
    fi
}

# Execute main function
main "$@"