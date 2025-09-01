#!/bin/bash

# Setup script for MyBidFit Observability System
# Integrates observability with existing development workflows

PROJECT_ROOT="/mnt/c/Users/dnice/DJ Programs/mybidfit_mini"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🛡️ Setting up MyBidFit Observability System..."

# Change to project directory
cd "$PROJECT_ROOT"

# Create necessary directories
mkdir -p .claude/observability
mkdir -p .claude/scripts/git-hooks

# Make scripts executable
chmod +x .claude/scripts/*.sh 2>/dev/null
chmod +x .claude/scripts/*.js 2>/dev/null

# Install git hook (only if git directory exists)
if [ -d ".git" ]; then
    echo "🔗 Installing git hooks..."
    if [ -f "$HOOKS_DIR/post-commit" ]; then
        echo "⚠️  Existing post-commit hook found. Backing up..."
        cp "$HOOKS_DIR/post-commit" "$HOOKS_DIR/post-commit.backup.$(date +%s)"
    fi
    
    cp .claude/scripts/git-hooks/post-commit "$HOOKS_DIR/post-commit"
    chmod +x "$HOOKS_DIR/post-commit"
    echo "✅ Git hooks installed"
else
    echo "⚠️  No git directory found, skipping hook installation"
fi

# Generate initial observability report
echo "📊 Generating initial observability report..."
npm run observability:status

echo ""
echo "🎯 Observability System Setup Complete!"
echo ""
echo "Available commands:"
echo "  npm run health                 - Quick health check"
echo "  npm run observability:status   - Full quality status"
echo "  npm run observability:agents   - Agent performance report"
echo "  npm run observability:db       - Database health check"
echo "  npm run observability:full     - Complete observability report"
echo "  npm run ci:full                - CI with observability integration"
echo ""
echo "📋 Dashboard location: .claude/observability/dashboard.md"
echo "🤖 Agent reports: .claude/observability/agent-report.md"
echo "📊 Database health: .claude/observability/database-health.md"
echo ""
echo "🔄 Automatic updates enabled via git hooks"