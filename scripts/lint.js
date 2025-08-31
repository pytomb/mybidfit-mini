#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Running lightweight JavaScript linter...\n');

let hasErrors = false;
let totalFiles = 0;
let checkedFiles = 0;

// Simple linting rules
const lintRules = [
  {
    name: 'No console.log in production',
    pattern: /console\.log\(/g,
    severity: 'warn',
    excludeFiles: ['src/utils/logger.js', 'test/**/*.js']
  },
  {
    name: 'No TODO comments',
    pattern: /\/\/\s*TODO|\/\*\s*TODO/gi,
    severity: 'info'
  },
  {
    name: 'Prefer const over let',
    pattern: /^\s*let\s+\w+\s*=\s*(['"`].*['"`]|true|false|\d+)\s*;?\s*$/gm,
    severity: 'info'
  },
  {
    name: 'No unused require',
    pattern: /const\s+\{?\s*\w+\s*\}?\s*=\s*require\([^)]+\);\s*(?!.*\1)/g,
    severity: 'warn',
    skip: true // Complex to implement correctly
  }
];

function shouldExcludeFile(filePath, excludePatterns) {
  if (!excludePatterns) return false;
  return excludePatterns.some(pattern => {
    if (pattern.includes('**')) {
      const regexPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      return new RegExp(regexPattern).test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  lintRules.forEach(rule => {
    if (rule.skip) return;
    
    if (shouldExcludeFile(filePath, rule.excludeFiles)) {
      return;
    }
    
    const matches = content.match(rule.pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        issues.push({
          rule: rule.name,
          severity: rule.severity,
          line: lineNumber,
          text: match.trim()
        });
      });
    }
  });
  
  return issues;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.test.js')) {
      totalFiles++;
      const relativePath = path.relative(process.cwd(), filePath);
      const issues = lintFile(filePath);
      
      if (issues.length > 0) {
        console.log(`📄 ${relativePath}:`);
        issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warn' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} Line ${issue.line}: ${issue.rule}`);
          if (issue.text) {
            console.log(`     └─ ${issue.text}`);
          }
          
          if (issue.severity === 'error') {
            hasErrors = true;
          }
        });
        console.log('');
      }
      checkedFiles++;
    }
  });
}

// Start linting
const startTime = Date.now();
walkDirectory('src');

const duration = Date.now() - startTime;
console.log(`✅ Linting completed in ${duration}ms`);
console.log(`📊 Checked ${checkedFiles}/${totalFiles} JavaScript files`);

if (hasErrors) {
  console.log('\n❌ Linting failed with errors');
  process.exit(1);
} else {
  console.log('\n✅ No linting errors found');
  process.exit(0);
}