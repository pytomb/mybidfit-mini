#!/bin/bash

# Quality Status Dashboard Generator
# Provides real-time visibility into project health

PROJECT_ROOT="/mnt/c/Users/dnice/DJ Programs/mybidfit_mini"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "🛡️ MyBidFit Quality Gates Status"
echo "================================="
echo "Last Updated: $TIMESTAMP"
echo ""

# Change to project directory
cd "$PROJECT_ROOT" || exit 1

# Test Status
echo "📊 Test Execution Status:"
echo "-------------------------"
TEST_START=$(date +%s%N)

# Run tests and capture both exit code and output
if npm test --silent > /tmp/test_output.log 2>&1; then
    TEST_END=$(date +%s%N)
    TEST_DURATION=$(( (TEST_END - TEST_START) / 1000000 ))  # Convert to milliseconds
    
    # Extract test statistics from output
    TOTAL_TESTS=$(grep -o "tests [0-9]*" /tmp/test_output.log | head -1 | grep -o "[0-9]*")
    PASS_TESTS=$(grep -o "pass [0-9]*" /tmp/test_output.log | head -1 | grep -o "[0-9]*")
    FAIL_TESTS=$(grep -o "fail [0-9]*" /tmp/test_output.log | head -1 | grep -o "[0-9]*")
    
    echo "✅ Tests: PASSING ($PASS_TESTS/$TOTAL_TESTS passed)"
    echo "   Duration: ${TEST_DURATION}ms (target: <30,000ms)"
    echo "   Failed: ${FAIL_TESTS:-0}"
else
    TEST_END=$(date +%s%N)
    TEST_DURATION=$(( (TEST_END - TEST_START) / 1000000 ))
    
    FAIL_TESTS=$(grep -o "fail [0-9]*" /tmp/test_output.log | head -1 | grep -o "[0-9]*")
    echo "❌ Tests: FAILING (${FAIL_TESTS:-Unknown} failures)"
    echo "   Duration: ${TEST_DURATION}ms"
    echo "   Run 'npm test' for details"
fi

echo ""

# Database Health Status
echo "🗄️ Database Health Status:"
echo "---------------------------"
if node .claude/scripts/validate-data-integrity.js > /tmp/db_output.log 2>&1; then
    echo "✅ Database: HEALTHY"
    echo "   Data integrity: Validated"
    echo "   Constraints: All valid"
else
    echo "⚠️  Database: ISSUES DETECTED"
    echo "   Check: .claude/scripts/validate-data-integrity.js"
    # Show first few lines of error
    head -2 /tmp/db_output.log | sed 's/^/   /'
fi

echo ""

# Code Quality Status
echo "🧹 Code Quality Status:"
echo "-----------------------"
if npm run lint --silent > /tmp/lint_output.log 2>&1; then
    echo "✅ Linting: CLEAN"
    echo "   ESLint: No issues"
else
    LINT_ERRORS=$(grep -c "error" /tmp/lint_output.log 2>/dev/null || echo "Unknown")
    LINT_WARNINGS=$(grep -c "warning" /tmp/lint_output.log 2>/dev/null || echo "Unknown")
    echo "⚠️  Linting: ISSUES"
    echo "   Errors: $LINT_ERRORS"
    echo "   Warnings: $LINT_WARNINGS"
fi

echo ""

# Service Health (check if key services can be imported)
echo "🔧 Service Health Status:"
echo "-------------------------"
if node -e "require('./src/services/opportunityScoring.js'); console.log('OK')" > /dev/null 2>&1; then
    echo "✅ OpportunityScoring: Importable"
else
    echo "❌ OpportunityScoring: Import Error"
fi

if node -e "require('./src/services/relationshipIntelligence.js'); console.log('OK')" > /dev/null 2>&1; then
    echo "✅ RelationshipIntelligence: Importable"
else
    echo "❌ RelationshipIntelligence: Import Error"
fi

if node -e "require('./test/setup/test-database.js'); console.log('OK')" > /dev/null 2>&1; then
    echo "✅ TestDatabase: Importable"
else
    echo "❌ TestDatabase: Import Error"
fi

echo ""

# Performance Metrics
echo "⚡ Performance Metrics:"
echo "----------------------"
# Check Node.js memory usage
NODE_MEMORY=$(node -e "console.log(Math.round(process.memoryUsage().heapUsed / 1024 / 1024))")
echo "   Node.js Memory: ${NODE_MEMORY}MB"

# Check project size
PROJECT_SIZE=$(du -sh . 2>/dev/null | cut -f1 || echo "Unknown")
echo "   Project Size: $PROJECT_SIZE"

# Count lines of code
LOC=$(find src test -name "*.js" -exec wc -l {} \; 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "Unknown")
echo "   Lines of Code: $LOC"

echo ""

# Overall Health Score
echo "🎯 Overall Health Score:"
echo "------------------------"

HEALTH_SCORE=100

# Deduct points for failures
if [ "${FAIL_TESTS:-0}" -gt 0 ]; then
    HEALTH_SCORE=$((HEALTH_SCORE - 30))
fi

if ! node .claude/scripts/validate-data-integrity.js > /dev/null 2>&1; then
    HEALTH_SCORE=$((HEALTH_SCORE - 25))
fi

if ! npm run lint --silent > /dev/null 2>&1; then
    HEALTH_SCORE=$((HEALTH_SCORE - 15))
fi

# Service import failures
if ! node -e "require('./src/services/opportunityScoring.js')" > /dev/null 2>&1; then
    HEALTH_SCORE=$((HEALTH_SCORE - 15))
fi

if ! node -e "require('./src/services/relationshipIntelligence.js')" > /dev/null 2>&1; then
    HEALTH_SCORE=$((HEALTH_SCORE - 15))
fi

# Health score display
if [ $HEALTH_SCORE -ge 90 ]; then
    echo "🟢 Excellent: ${HEALTH_SCORE}%"
elif [ $HEALTH_SCORE -ge 75 ]; then
    echo "🟡 Good: ${HEALTH_SCORE}%"
elif [ $HEALTH_SCORE -ge 50 ]; then
    echo "🟠 Fair: ${HEALTH_SCORE}%"
else
    echo "🔴 Poor: ${HEALTH_SCORE}%"
fi

echo ""
echo "Last quality check: $TIMESTAMP" > .claude/last-quality-check.txt
echo "💾 Status saved to .claude/last-quality-check.txt"

# Clean up temporary files
rm -f /tmp/test_output.log /tmp/db_output.log /tmp/lint_output.log

echo ""
echo "🔄 Run './claude/scripts/quality-status.sh' anytime for latest status"