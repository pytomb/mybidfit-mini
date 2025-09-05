#!/bin/bash

# Anti-Bloat Pre-Development Check
echo "🔍 Checking for code reuse opportunities..."

# Check for potential duplicate services
echo "📁 Existing services that might be reusable:"
ls src/services/ | grep -E "(scoring|matching|analysis)" || echo "  No similar services found"

# Check for large files that need attention
echo "📏 Large files (>400 lines) that might need decomposition:"
find src -name "*.js" | xargs wc -l | awk '$1 > 400 {print $2 " - " $1 " lines"}' | head -5

# Look for common patterns that could be abstracted
echo "🔄 Common function patterns (potential for utility extraction):"
grep -r "function calculate" src/ | wc -l | awk '{print "  " $1 " calculate functions found"}'
grep -r "async.*validate" src/ | wc -l | awk '{print "  " $1 " validation functions found"}'

# Check for TODO/FIXME that might indicate technical debt
echo "⚠️  Technical debt indicators:"
grep -r "TODO\|FIXME" src/ | wc -l | awk '{print "  " $1 " TODO/FIXME comments"}'

echo ""
echo "💡 Before adding new code:"
echo "   1. Search existing services for similar functionality"
echo "   2. Consider extending existing patterns vs creating new ones"
echo "   3. Extract common utilities if you find 3+ similar functions"
echo "   4. Keep files under 500 lines when possible"