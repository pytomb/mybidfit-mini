#!/bin/bash

# Git Hooks Setup for MyBidFit CI/CD Pipeline
# Implements enterprise-standards quality gates

echo "🔧 Setting up Git hooks for MyBidFit..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🚀 MyBidFit Pre-Commit Quality Gates"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Quality gate counters
FAILURES=0

# Function to report status
report_status() {
    if [ $1 -eq 0 ]; then
        echo -e "✅ ${GREEN}$2${NC}"
    else
        echo -e "❌ ${RED}$2${NC}"
        FAILURES=$((FAILURES + 1))
    fi
}

# Quality Gate 1: TypeScript Type Checking
echo -e "${YELLOW}🔍 Running TypeScript type checking...${NC}"
if command -v npx &> /dev/null && [ -f "frontend/tsconfig.json" ]; then
    cd frontend && npx tsc --noEmit --skipLibCheck
    report_status $? "TypeScript type checking"
    cd ..
else
    echo -e "${YELLOW}⚠️ TypeScript checking skipped (no tsconfig.json found)${NC}"
fi

# Quality Gate 2: Unit Tests
echo -e "${YELLOW}🧪 Running unit tests...${NC}"
npm run test:unit 2>/dev/null
report_status $? "Unit tests"

# Quality Gate 3: Integration Tests  
echo -e "${YELLOW}🔗 Running integration tests...${NC}"
npm run test:integration 2>/dev/null
report_status $? "Integration tests"

# Quality Gate 4: Security Scanning
echo -e "${YELLOW}🔒 Running security scan...${NC}"
if command -v npm &> /dev/null; then
    npm audit --audit-level high 2>/dev/null
    AUDIT_RESULT=$?
    if [ $AUDIT_RESULT -eq 0 ]; then
        report_status 0 "Security scan (no high/critical vulnerabilities)"
    else
        report_status 1 "Security scan (vulnerabilities found)"
    fi
else
    echo -e "${YELLOW}⚠️ Security scan skipped (npm not available)${NC}"
fi

# Quality Gate 5: Linting
echo -e "${YELLOW}📝 Running linter...${NC}"
if [ -f "scripts/lint.js" ]; then
    npm run lint 2>/dev/null
    report_status $? "Code linting"
else
    echo -e "${YELLOW}⚠️ Linting skipped (no lint script found)${NC}"
fi

# Quality Gate 6: File Size Check
echo -e "${YELLOW}📏 Checking file sizes...${NC}"
LARGE_FILES=$(find src frontend/src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 1500 {print $2 " (" $1 " lines)"}')
if [ -z "$LARGE_FILES" ]; then
    report_status 0 "File size check (all files under 1500 lines)"
else
    echo -e "${RED}⚠️ Large files detected:${NC}"
    echo "$LARGE_FILES"
    report_status 1 "File size check (large files found)"
fi

# Quality Gate 7: Console Error Check
echo -e "${YELLOW}🖥️ Checking for console.log statements...${NC}"
CONSOLE_LOGS=$(grep -r "console\." src/ frontend/src/ 2>/dev/null | grep -v "console.error\|console.warn" | wc -l)
if [ "$CONSOLE_LOGS" -eq 0 ]; then
    report_status 0 "Console log check"
else
    report_status 1 "Console log check ($CONSOLE_LOGS console statements found)"
fi

echo "====================================="

# Final decision
if [ $FAILURES -eq 0 ]; then
    echo -e "✅ ${GREEN}All quality gates passed! Commit approved.${NC}"
    exit 0
else
    echo -e "❌ ${RED}$FAILURES quality gate(s) failed. Commit blocked.${NC}"
    echo -e "${YELLOW}💡 Fix the issues above and try committing again.${NC}"
    exit 1
fi
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Create pre-push hook for E2E tests
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

echo "🚀 MyBidFit Pre-Push E2E Tests"
echo "=============================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if servers are running
echo -e "${YELLOW}🔍 Checking if test servers are running...${NC}"

# Check backend server
if curl -s http://localhost:3002/health > /dev/null; then
    echo -e "✅ ${GREEN}Backend server is running${NC}"
else
    echo -e "❌ ${RED}Backend server not running on port 3002${NC}"
    echo -e "${YELLOW}💡 Start the backend with: npm run dev${NC}"
    exit 1
fi

# Check frontend server  
if curl -s http://localhost:3004 > /dev/null; then
    echo -e "✅ ${GREEN}Frontend server is running${NC}"
else
    echo -e "❌ ${RED}Frontend server not running on port 3004${NC}"
    echo -e "${YELLOW}💡 Start the frontend with: cd frontend && npm run dev${NC}"
    exit 1
fi

# Run E2E tests
echo -e "${YELLOW}🎭 Running E2E tests...${NC}"
npx playwright test --reporter=line
E2E_RESULT=$?

if [ $E2E_RESULT -eq 0 ]; then
    echo -e "✅ ${GREEN}E2E tests passed! Push approved.${NC}"
    exit 0
else
    echo -e "❌ ${RED}E2E tests failed. Push blocked.${NC}"
    echo -e "${YELLOW}💡 Run 'npx playwright test' to see detailed results${NC}"
    exit 1
fi
EOF

# Make pre-push hook executable
chmod +x .git/hooks/pre-push

# Create commit-msg hook for conventional commits
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Check commit message format
COMMIT_REGEX='^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}'

if ! grep -qE "$COMMIT_REGEX" "$1"; then
    echo "❌ Invalid commit message format!"
    echo "📝 Use format: type(scope): description"
    echo "   Types: feat, fix, docs, style, refactor, test, chore"
    echo "   Example: feat(auth): add JWT token validation"
    exit 1
fi

echo "✅ Commit message format is valid"
EOF

# Make commit-msg hook executable
chmod +x .git/hooks/commit-msg

echo "✅ Git hooks installed successfully!"
echo ""
echo "🎯 Quality Gates Configured:"
echo "   • Pre-commit: TypeScript, tests, security, linting"
echo "   • Pre-push: E2E tests with Playwright"
echo "   • Commit-msg: Conventional commit format"
echo ""
echo "💡 To bypass hooks (emergency only): git commit --no-verify"