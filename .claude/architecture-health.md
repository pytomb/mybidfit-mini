# Architecture Health & Anti-Bloat Monitoring

## Service Consolidation Opportunities

### Scoring Services (CONSOLIDATE)
- `opportunityScoring.js` (581 lines)
- `enhancedOpportunityScoring.js` (511 lines)
- **ACTION**: Merge into single `ScoringEngine` with strategy pattern

### Matching Services (CONSOLIDATE) 
- `partnershipMatching.js` (475 lines)
- `enhancedPartnershipMatching.js` (484 lines)
- **ACTION**: Create unified `MatchingEngine` with configurable algorithms

### Analysis Services (REFACTOR)
- `supplierAnalysis.js` + `supplierAnalysis/` directory
- Multiple analysis engines scattered
- **ACTION**: Create `AnalysisOrchestrator` pattern

## Reusability Checklist (Run Before New Features)

### Before Creating New Service:
1. `grep -r "class.*Service" src/services/` - Check existing services
2. `grep -r "function.*calculate" src/` - Look for similar logic
3. `find src -name "*${FEATURE}*"` - Check if feature exists

### Before Adding New Route:
1. Check existing route patterns in `src/routes/`
2. Look for similar endpoint patterns
3. Consider extending existing controllers

### Before Writing New Algorithm:
1. Search for similar mathematical operations
2. Check if existing services can be extended
3. Look for common utility functions

## File Size Monitoring (Auto-Check)

### Warning Thresholds:
- **500+ lines**: Consider decomposition
- **1000+ lines**: Mandatory refactoring
- **Multiple similar services**: Consolidation required

### Tools:
```bash
# Check file sizes weekly
find src -name "*.js" | xargs wc -l | sort -n | tail -10

# Check for duplicate patterns
grep -r "class.*Service" src/services/ | cut -d: -f2 | sort

# Find potential consolidation targets
ls src/services/ | grep -E "(enhanced|improved|new|v2)"
```