#!/usr/bin/env node

/**
 * CLI tool to test PostgreSQL compatibility layer queries
 * Usage: node .claude/scripts/validate-postgres-compatibility.js [query-category] [query-name]
 */

const { getPostgreSQLCompatibility } = require('../database/postgres-compatibility-layer');

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🐘 PostgreSQL Compatibility Layer Tester');
  console.log('==========================================');
  console.log('');

  // Initialize compatibility layer
  const pgCompat = getPostgreSQLCompatibility('13+');
  
  if (args.length === 0) {
    showUsage(pgCompat);
    return;
  }

  const [category, queryName] = args;

  try {
    // Test query structure and parameters
    const queries = pgCompat.getQueryByCategory(category);
    
    if (queryName) {
      await testSpecificQuery(pgCompat, category, queryName, queries);
    } else {
      await testCategoryQueries(pgCompat, category, queries);
    }
    
  } catch (error) {
    console.error('💥 Compatibility test failed:', error.message);
    process.exit(1);
  }
}

function showUsage(pgCompat) {
  console.log('Available query categories and queries:');
  console.log('=====================================');
  console.log('');
  
  const categories = ['system', 'business', 'validation', 'performance'];
  
  categories.forEach(category => {
    console.log(`📁 ${category.toUpperCase()}:`);
    try {
      const queries = pgCompat.getQueryByCategory(category);
      Object.keys(queries).forEach(queryName => {
        if (typeof queries[queryName] === 'string') {
          console.log(`   ✓ ${queryName}`);
        } else if (typeof queries[queryName] === 'object') {
          // Handle nested objects like databaseHealth
          Object.keys(queries[queryName]).forEach(subQuery => {
            console.log(`   ✓ ${queryName}.${subQuery}`);
          });
        }
      });
    } catch (error) {
      console.log(`   ❌ Error loading ${category} queries: ${error.message}`);
    }
    console.log('');
  });
  
  console.log('Usage examples:');
  console.log('  node validate-postgres-compatibility.js system');
  console.log('  node validate-postgres-compatibility.js system tableStatistics');
  console.log('  node validate-postgres-compatibility.js business partnerSearch');
  console.log('  node validate-postgres-compatibility.js validation businessRules');
}

async function testCategoryQueries(pgCompat, category, queries) {
  console.log(`📋 Testing ${category.toUpperCase()} Query Category`);
  console.log('='.repeat(40));
  console.log('');
  
  const results = [];
  
  for (const [queryName, query] of Object.entries(queries)) {
    console.log(`🔍 Testing: ${queryName}`);
    
    if (typeof query === 'string') {
      const result = await validateQuery(pgCompat, query, queryName);
      results.push({ queryName, ...result });
    } else if (typeof query === 'object') {
      // Handle nested objects like databaseHealth
      for (const [subQueryName, subQuery] of Object.entries(query)) {
        if (typeof subQuery === 'string') {
          const result = await validateQuery(pgCompat, subQuery, `${queryName}.${subQueryName}`);
          results.push({ queryName: `${queryName}.${subQueryName}`, ...result });
        }
      }
    }
    console.log('');
  }
  
  displayCategoryResults(results, category);
}

async function testSpecificQuery(pgCompat, category, queryName, queries) {
  console.log(`🎯 Testing Specific Query: ${category}.${queryName}`);
  console.log('='.repeat(50));
  console.log('');
  
  let query = queries[queryName];
  
  // Handle nested queries (e.g., databaseHealth.size)
  if (queryName.includes('.')) {
    const [parentQuery, subQuery] = queryName.split('.');
    query = queries[parentQuery] && queries[parentQuery][subQuery];
  }
  
  if (!query) {
    console.error(`❌ Query '${queryName}' not found in category '${category}'`);
    process.exit(1);
  }
  
  const result = await validateQuery(pgCompat, query, queryName);
  displayQueryResult(result, queryName);
  
  // Show example usage
  if (result.status === 'VALID') {
    console.log('');
    console.log('💡 Example usage:');
    console.log(`const pgCompat = getPostgreSQLCompatibility();`);
    console.log(`const result = await pgCompat.executeQuery(db, '${category}', '${queryName}', ${JSON.stringify(result.exampleParams)});`);
  }
}

async function validateQuery(pgCompat, query, queryName) {
  const result = {
    queryName,
    status: 'UNKNOWN',
    issues: [],
    parameterCount: 0,
    exampleParams: []
  };
  
  try {
    // Count parameters
    const paramMatches = query.match(/\$\d+/g) || [];
    result.parameterCount = paramMatches.length;
    
    // Create example parameters based on parameter count
    result.exampleParams = generateExampleParams(result.parameterCount, queryName);
    
    // Validate parameter consistency
    if (paramMatches.length > 0) {
      const uniqueParams = [...new Set(paramMatches)];
      const expectedParams = Array.from({length: uniqueParams.length}, (_, i) => `$${i + 1}`);
      
      for (let i = 0; i < expectedParams.length; i++) {
        if (!uniqueParams.includes(expectedParams[i])) {
          result.issues.push(`Missing parameter ${expectedParams[i]}`);
        }
      }
    }
    
    // Test parameter validation (dry run)
    try {
      pgCompat.validateQueryParameters(query, result.exampleParams);
    } catch (validationError) {
      result.issues.push(`Parameter validation error: ${validationError.message}`);
    }
    
    // Basic SQL syntax validation
    const syntaxIssues = validateSQLSyntax(query);
    result.issues.push(...syntaxIssues);
    
    // Determine status
    result.status = result.issues.length === 0 ? 'VALID' : 'ISSUES';
    
    console.log(`   ${result.status === 'VALID' ? '✅' : '⚠️'} ${result.status}`);
    console.log(`   Parameters: ${result.parameterCount}`);
    
    if (result.issues.length > 0) {
      console.log(`   Issues:`);
      result.issues.forEach(issue => {
        console.log(`     ❌ ${issue}`);
      });
    }
    
  } catch (error) {
    result.status = 'ERROR';
    result.error = error.message;
    console.log(`   💥 ERROR: ${error.message}`);
  }
  
  return result;
}

function generateExampleParams(count, queryName) {
  const params = [];
  
  for (let i = 0; i < count; i++) {
    // Generate context-appropriate example parameters
    if (queryName.includes('table') || queryName.includes('schema')) {
      params.push(i === 0 ? 'public' : 'example_value');
    } else if (queryName.includes('limit') || queryName.includes('top')) {
      params.push(10);
    } else if (queryName.includes('score') || queryName.includes('percentage')) {
      params.push(80);
    } else if (queryName.includes('capabilities') || queryName.includes('industries')) {
      params.push(['capability1', 'capability2']);
    } else if (queryName.includes('email')) {
      params.push('test@example.com');
    } else if (queryName.includes('id')) {
      params.push(1);
    } else {
      // Generic parameter based on position
      params.push(i === 0 ? 'param1' : `param${i + 1}`);
    }
  }
  
  return params;
}

function validateSQLSyntax(query) {
  const issues = [];
  
  // Check for common SQL syntax issues
  const commonIssues = [
    { pattern: /SELECT\s+,/, message: 'Empty SELECT clause detected' },
    { pattern: /,\s*FROM/, message: 'Trailing comma before FROM clause' },
    { pattern: /,\s*WHERE/, message: 'Trailing comma before WHERE clause' },
    { pattern: /,\s*ORDER/, message: 'Trailing comma before ORDER BY clause' },
    { pattern: /,\s*GROUP/, message: 'Trailing comma before GROUP BY clause' },
    { pattern: /\(\s*\)/, message: 'Empty parentheses detected' }
  ];
  
  commonIssues.forEach(({ pattern, message }) => {
    if (pattern.test(query)) {
      issues.push(message);
    }
  });
  
  // Check for balanced parentheses
  const openParens = (query.match(/\(/g) || []).length;
  const closeParens = (query.match(/\)/g) || []).length;
  
  if (openParens !== closeParens) {
    issues.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }
  
  return issues;
}

function displayCategoryResults(results, category) {
  console.log(`📊 ${category.toUpperCase()} Category Summary:`);
  console.log('='.repeat(35));
  
  const valid = results.filter(r => r.status === 'VALID').length;
  const issues = results.filter(r => r.status === 'ISSUES').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ Valid queries: ${valid}`);
  console.log(`⚠️  Queries with issues: ${issues}`);  
  console.log(`💥 Error queries: ${errors}`);
  console.log(`📊 Total queries tested: ${results.length}`);
  
  if (issues > 0) {
    console.log('');
    console.log('🔧 Queries needing attention:');
    results.filter(r => r.status === 'ISSUES').forEach(result => {
      console.log(`   ⚠️  ${result.queryName}: ${result.issues.join(', ')}`);
    });
  }
  
  if (errors > 0) {
    console.log('');
    console.log('💥 Queries with errors:');
    results.filter(r => r.status === 'ERROR').forEach(result => {
      console.log(`   💥 ${result.queryName}: ${result.error}`);
    });
  }
}

function displayQueryResult(result, queryName) {
  console.log(`Status: ${getStatusIcon(result.status)} ${result.status}`);
  console.log(`Parameters: ${result.parameterCount}`);
  
  if (result.exampleParams.length > 0) {
    console.log(`Example params: [${result.exampleParams.map(p => 
      Array.isArray(p) ? `[${p.join(',')}]` : 
      typeof p === 'string' ? `'${p}'` : p
    ).join(', ')}]`);
  }
  
  if (result.issues.length > 0) {
    console.log('');
    console.log('⚠️  Issues found:');
    result.issues.forEach(issue => {
      console.log(`   ❌ ${issue}`);
    });
  }
  
  if (result.error) {
    console.log(`💥 Error: ${result.error}`);
  }
}

function getStatusIcon(status) {
  const icons = {
    'VALID': '✅',
    'ISSUES': '⚠️', 
    'ERROR': '💥',
    'UNKNOWN': '❓'
  };
  return icons[status] || '❓';
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, validateQuery, generateExampleParams };