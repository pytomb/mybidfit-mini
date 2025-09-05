#!/bin/bash

echo "🗓️  Weekly Refactoring Health Check"
echo "=================================="

# Find duplicate service patterns
echo "🔄 Potential Service Consolidations:"
ls src/services/ | grep -E "(enhanced|improved|new|v2|alt)" | head -5

# Check for oversized files
echo ""
echo "📏 Files needing decomposition (>500 lines):"
find src -name "*.js" | xargs wc -l | awk '$1 > 500 {print "  " $2 " (" $1 " lines)"}' | head -3

# Look for repeated code patterns
echo ""
echo "🎯 Common code patterns to abstract:"
echo "  Scoring functions: $(grep -r 'Score.*=' src/ | wc -l)"
echo "  Validation functions: $(grep -r 'validate.*(' src/ | wc -l)" 
echo "  Database queries: $(grep -r 'SELECT\|INSERT\|UPDATE' src/ | wc -l)"

# Check growth trend
echo ""
echo "📈 Codebase growth (lines of code):"
TOTAL_LINES=$(find src -name "*.js" | xargs wc -l | tail -1 | awk '{print $1}')
echo "  Current: $TOTAL_LINES lines"
echo "  Target: Keep under 20,000 lines"

if [ $TOTAL_LINES -gt 20000 ]; then
    echo "  ⚠️  BLOAT ALERT: Consider major refactoring"
elif [ $TOTAL_LINES -gt 15000 ]; then
    echo "  ⚠️  CAUTION: Monitor for bloat patterns"
else
    echo "  ✅ Healthy size"
fi