@PROJECT_INDEX.json
1. Read all lines of files in the project that are not gitignored
2. Ultrathink to make a plan for next steps
3. Present plan to the user for review

# MyBidFit Quality Prevention System

🚨 **MANDATORY QUALITY GATES** - Run these validators before major changes to prevent recurring issues:

## Pre-Development Validation Hooks

### Database Work (ALWAYS run before schema changes)
```bash
# Validate data relationships and foreign keys
node .claude/scripts/validate-data-integrity.js src/database/schema.sql

# Check PostgreSQL compatibility  
node .claude/scripts/validate-postgres-compatibility.js system

# Validate migration SQL before execution
node .claude/scripts/validate-migration.js scripts/migrate.js
```

### Service Development (ALWAYS run after service changes)
```bash
# Check service/test import/export consistency
node .claude/scripts/validate-services.js

# Validate test coverage and Store-First methodology
node .claude/scripts/validate-test-generation.js
```

## Validation Integration Rules

### MANDATORY: Run validators when:
- ✅ Creating or modifying database schemas
- ✅ Adding new services or classes  
- ✅ Creating or updating test files
- ✅ Before major feature development
- ✅ During code reviews and pull requests

### What These Validators Prevent:
1. **Database Migration Validator**: SQL parsing failures, execution order issues
2. **Service Consistency Validator**: Import/export mismatches (SupplierAnalysis vs SupplierAnalysisService)  
3. **PostgreSQL Compatibility Layer**: System table query failures (tablename vs relname)
4. **Data Integrity Validator**: Foreign key constraint violations, orphaned records
5. **Test Generation Validator**: Missing test coverage, Store-First methodology violations

### Real Issues Found in Current Codebase:
- ❌ **14 critical** database schema issues
- ❌ **31 critical** service import/export mismatches  
- ❌ **5 missing** foreign key relationships
- ❌ **3 high-priority services** without test coverage

## Development Workflow Integration

**Before ANY database work:**
```bash
node .claude/scripts/validate-data-integrity.js src/database/schema.sql
```

**After creating/modifying services:**
```bash
node .claude/scripts/validate-services.js
```

**Before running migrations:**
```bash
node .claude/scripts/validate-migration.js scripts/migrate.js
```

**Quality assurance check:**
```bash
node .claude/scripts/validate-test-generation.js
```

See `.claude/README.md` for complete documentation.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.