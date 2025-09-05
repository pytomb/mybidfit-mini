#!/bin/bash

echo "🧹 MyBidFit Script Cleanup Tool"
echo "==============================="
echo ""
echo "This will help you clean up unused/duplicate scripts."
echo "⚠️  Always review before deleting!"
echo ""

read -p "Proceed with cleanup review? (y/n): " confirm
if [[ $confirm != "y" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Create archive directory if it doesn't exist
mkdir -p .archive/scripts

echo ""
echo "🗑️  SUGGESTED FOR DELETION (likely duplicates/unused):"
echo ""

SCRIPTS_TO_DELETE=(
    "scripts/migrate-partner-fit.js"
    "scripts/migrate-partner-fit-fixed.js" 
    "scripts/apply-migrations.js"
    ".claude/scripts/agent-performance-tracker.js"
    ".claude/scripts/ci-observability-integration.js"
    ".claude/scripts/run-all-validators.js"
)

for script in "${SCRIPTS_TO_DELETE[@]}"; do
    if [[ -f "$script" ]]; then
        echo "  📁 $script"
    fi
done

echo ""
echo "📦 SUGGESTED FOR ARCHIVING (one-time use):"
echo ""

SCRIPTS_TO_ARCHIVE=(
    "scripts/seed.js"
    "scripts/seed-production-data.js"
    "scripts/create-waitlist-table.js"
    "scripts/test-profiles-db.js"
)

for script in "${SCRIPTS_TO_ARCHIVE[@]}"; do
    if [[ -f "$script" ]]; then
        echo "  📁 $script"
    fi
done

echo ""
echo "🔧 MANUAL CLEANUP COMMANDS:"
echo ""
echo "# Delete duplicates/unused (review each one first!):"
for script in "${SCRIPTS_TO_DELETE[@]}"; do
    if [[ -f "$script" ]]; then
        echo "rm '$script'"
    fi
done

echo ""
echo "# Archive one-time scripts:"
for script in "${SCRIPTS_TO_ARCHIVE[@]}"; do
    if [[ -f "$script" ]]; then
        echo "mv '$script' '.archive/scripts/'"
    fi
done

echo ""
echo "📊 CURRENT SCRIPT COUNT: $(find . -name "*.sh" -o -name "*.js" -path "./scripts/*" -o -name "*.js" -path "./.claude/scripts/*" | wc -l) scripts"
echo "🎯 TARGET: ~15-20 useful scripts"
echo ""
echo "💡 TIP: Use './run help' to see the scripts you actually need!"