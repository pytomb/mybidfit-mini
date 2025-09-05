# MyBidFit Script Inventory & Usage Guide

## 🚀 **HIGH VALUE** - Scripts You Should Actually Use

### Database Management
```bash
# Essential database operations
npm run create-test-data        # Creates test data for development
npm run migrate                 # Runs database migrations
node scripts/optimize-database.js  # Optimizes database performance

# One-time setup
node scripts/create-sample-data.js  # Initial sample data
```

### Development Workflow
```bash
# Quality checks (part of your CLAUDE.md workflow)
node .claude/scripts/validate-services.js        # Check service consistency
node .claude/scripts/validate-test-generation.js # Test coverage validation
./.claude/scripts/check-before-build.sh          # Anti-bloat check (NEW)
./.claude/scripts/weekly-refactor-check.sh       # Architecture health (NEW)

# Git hooks
scripts/setup-git-hooks.sh      # One-time setup for pre-commit/pre-push hooks
```

### Business Dashboard
```bash
# Your business dashboard system
./business/start-dashboard.sh   # Starts business analysis dashboard
./business/stop-dashboard.sh    # Stops dashboard server
```

## ⚠️ **MEDIUM VALUE** - Situational Use

### Database Validation (When Things Break)
```bash
node scripts/check-schema.js                    # Schema validation
node scripts/validate-data-quality.js          # Data integrity check
node .claude/scripts/validate-data-integrity.js # Another data check
```

### Performance & Monitoring
```bash
node scripts/validate-performance.js           # Performance benchmarks  
node .claude/scripts/database-health-monitor.js # DB health check
./.claude/scripts/quality-status.sh            # Overall quality status
```

### Specialized Testing
```bash
node scripts/test-profiles.js                  # Profile-specific tests
node scripts/validate-partner-fit-system.js    # Partner matching tests
node scripts/test-validation.js                # Validation system tests
```

## 🗑️ **LOW VALUE** - Probably Never Use

### Old/Duplicate Migration Scripts
```bash
# These look like old versions - probably safe to delete
scripts/migrate-core.js                 # Likely superseded by migrate.js
scripts/migrate-partner-fit.js          # Old partner fit migration
scripts/migrate-partner-fit-fixed.js    # Fixed version of above
scripts/apply-migrations.js             # Duplicate of migrate.js?
```

### Observability Overkill
```bash
# Complex observability that you probably don't need
.claude/scripts/agent-performance-tracker.js
.claude/scripts/ci-observability-integration.js  
.claude/scripts/setup-observability.sh
.claude/scripts/run-all-validators.js
```

### Build Scripts (Automated)
```bash
scripts/build.js          # Probably handled by npm scripts
scripts/lint.js           # Probably handled by npm run lint
scripts/quick-deploy.sh   # Deployment automation
```

### One-Time Setup Scripts
```bash
scripts/create-waitlist-table.js        # One-time database setup
scripts/seed-production-data.js         # One-time production seed
scripts/seed.js                         # General seeding
```

## 📋 **RECOMMENDED DAILY WORKFLOW**

### Before Starting Work:
```bash
./.claude/scripts/check-before-build.sh
```

### After Making Changes:
```bash
node .claude/scripts/validate-services.js
npm run test
```

### Weekly Maintenance:
```bash
./.claude/scripts/weekly-refactor-check.sh
node scripts/optimize-database.js
```

### When Things Break:
```bash
node scripts/check-schema.js
node scripts/validate-data-quality.js
npm run create-test-data
```

## 🧹 **CLEANUP RECOMMENDATIONS**

### Safe to Delete (Likely Duplicates/Old):
- `scripts/migrate-partner-fit*.js` (superseded)
- `scripts/apply-migrations.js` (duplicate)  
- `.claude/scripts/agent-performance-tracker.js` (overkill)
- `.claude/scripts/ci-observability-integration.js` (unused)
- `.claude/scripts/run-all-validators.js` (complex)

### Archive (Move to .archive/):
- `scripts/seed*.js` (one-time use)
- `scripts/create-waitlist-table.js` (one-time)
- `scripts/test-profiles-db.js` (old test)

### Keep But Rarely Use:
- Database health monitors (for emergencies)
- Performance validators (for optimization)
- Specialized test scripts (for debugging)