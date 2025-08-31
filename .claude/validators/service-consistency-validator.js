#!/usr/bin/env node

/**
 * Service Import/Export Consistency Validator for MyBidFit Platform
 * Prevents service/test import mismatches and enforces naming conventions
 * 
 * This validator would have caught and prevented all service import issues we encountered:
 * - SupplierAnalysis vs SupplierAnalysisService naming mismatches
 * - Incorrect require() vs const { Class } = require() patterns
 * - Service instantiation inconsistencies
 * - Missing service exports
 */

const fs = require('fs');
const path = require('path');

class ServiceConsistencyValidator {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      serviceDir: options.serviceDir || 'src/services',
      testDir: options.testDir || 'test',
      strictMode: options.strictMode || false,
      logLevel: options.logLevel || 'info',
      ...options
    };
    
    this.services = new Map();
    this.tests = new Map();
    this.issues = [];
    this.warnings = [];
  }

  /**
   * Main validation entry point
   * Scans all services and tests for consistency issues
   */
  async validateServiceConsistency() {
    this.log('🔍 Starting service import/export consistency validation...');
    
    // Reset state
    this.services.clear();
    this.tests.clear();
    this.issues = [];
    this.warnings = [];
    
    // Scan services and tests
    await this.scanServices();
    await this.scanTests();
    
    // Run validations
    this.validateNamingConsistency();
    this.validateImportPatterns();
    this.validateExportPatterns();
    this.validateServiceInstantiation();
    this.validateTestCoverage();
    
    // Generate report
    const report = this.generateValidationReport();
    
    if (this.issues.length === 0) {
      this.log(`✅ Service consistency validation PASSED`);
    } else {
      this.log(`❌ Service consistency validation FAILED: ${this.issues.length} critical issues found`);
    }
    
    return report;
  }

  /**
   * Scan all service files and analyze their exports
   */
  async scanServices() {
    const serviceDir = path.join(this.options.projectRoot, this.options.serviceDir);
    
    if (!fs.existsSync(serviceDir)) {
      this.addWarning('MISSING_SERVICE_DIR', `Service directory not found: ${serviceDir}`);
      return;
    }
    
    const serviceFiles = this.findJavaScriptFiles(serviceDir);
    this.log(`📁 Found ${serviceFiles.length} service files`);
    
    for (const filePath of serviceFiles) {
      try {
        const serviceInfo = await this.analyzeServiceFile(filePath);
        if (serviceInfo) {
          const serviceName = path.basename(filePath, '.js');
          this.services.set(serviceName, serviceInfo);
          this.log(`   ✅ Analyzed service: ${serviceName}`);
        }
      } catch (error) {
        this.addIssue('SERVICE_ANALYSIS_ERROR', 
          `Failed to analyze service file: ${filePath}`, 
          null, 
          { error: error.message }
        );
      }
    }
  }

  /**
   * Scan all test files and analyze their imports
   */
  async scanTests() {
    const testDir = path.join(this.options.projectRoot, this.options.testDir);
    
    if (!fs.existsSync(testDir)) {
      this.addWarning('MISSING_TEST_DIR', `Test directory not found: ${testDir}`);
      return;
    }
    
    const testFiles = this.findTestFiles(testDir);
    this.log(`📁 Found ${testFiles.length} test files`);
    
    for (const filePath of testFiles) {
      try {
        const testInfo = await this.analyzeTestFile(filePath);
        if (testInfo) {
          const testName = path.basename(filePath, '.js');
          this.tests.set(testName, testInfo);
          this.log(`   ✅ Analyzed test: ${testName}`);
        }
      } catch (error) {
        this.addIssue('TEST_ANALYSIS_ERROR',
          `Failed to analyze test file: ${filePath}`,
          null,
          { error: error.message }
        );
      }
    }
  }

  /**
   * Analyze a service file to extract export information
   */
  async analyzeServiceFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.options.projectRoot, filePath);
    
    const analysis = {
      filePath: relativePath,
      content: content,
      exports: this.extractExports(content),
      classes: this.extractClasses(content),
      functions: this.extractFunctions(content),
      hasModuleExports: content.includes('module.exports'),
      hasESModuleExports: content.includes('export '),
      dependencies: this.extractDependencies(content)
    };
    
    return analysis;
  }

  /**
   * Analyze a test file to extract import information
   */
  async analyzeTestFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.options.projectRoot, filePath);
    
    const analysis = {
      filePath: relativePath,
      content: content,
      imports: this.extractImports(content),
      serviceImports: this.extractServiceImports(content),
      instantiations: this.extractServiceInstantiations(content),
      testDescriptions: this.extractTestDescriptions(content)
    };
    
    return analysis;
  }

  /**
   * Extract export patterns from service files
   */
  extractExports(content) {
    const exports = {
      moduleExports: [],
      namedExports: [],
      defaultExport: null,
      exportStyle: null
    };
    
    // Check for module.exports patterns
    const moduleExportPatterns = [
      // module.exports = { Class1, Class2 }
      /module\.exports\s*=\s*\{\s*([^}]+)\s*\}/g,
      // module.exports = Class
      /module\.exports\s*=\s*(\w+)/g,
      // module.exports.Class = Class
      /module\.exports\.(\w+)\s*=\s*(\w+)/g
    ];
    
    for (const pattern of moduleExportPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[0].includes('{')) {
          // Named exports in object
          const namedExports = match[1].split(',').map(exp => exp.trim());
          exports.moduleExports.push(...namedExports);
          exports.exportStyle = 'named_object';
        } else if (match[0].includes('.')) {
          // Property assignment
          exports.moduleExports.push(match[1]);
          exports.exportStyle = 'property_assignment';
        } else {
          // Default export
          exports.defaultExport = match[1];
          exports.exportStyle = 'default';
        }
      }
    }
    
    // Check for ES module exports
    const esExportPatterns = [
      /export\s+class\s+(\w+)/g,
      /export\s+function\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+(\w+)/g
    ];
    
    for (const pattern of esExportPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[0].includes('default')) {
          exports.defaultExport = match[1];
        } else if (match[0].includes('{')) {
          const namedExports = match[1].split(',').map(exp => exp.trim());
          exports.namedExports.push(...namedExports);
        } else {
          exports.namedExports.push(match[1]);
        }
      }
    }
    
    return exports;
  }

  /**
   * Extract class definitions from service files
   */
  extractClasses(content) {
    const classes = [];
    const classPattern = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g;
    let match;
    
    while ((match = classPattern.exec(content)) !== null) {
      classes.push({
        name: match[1],
        line: content.substring(0, match.index).split('\n').length,
        isService: match[1].includes('Service') || match[1].includes('Manager') || match[1].includes('Handler')
      });
    }
    
    return classes;
  }

  /**
   * Extract function definitions from service files
   */
  extractFunctions(content) {
    const functions = [];
    const functionPatterns = [
      /function\s+(\w+)\s*\(/g,
      /const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /(\w+)\s*:\s*(?:async\s+)?function/g
    ];
    
    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
    
    return functions;
  }

  /**
   * Extract import patterns from test files
   */
  extractImports(content) {
    const imports = {
      requires: [],
      esImports: [],
      serviceRequires: []
    };
    
    // CommonJS require patterns
    const requirePatterns = [
      // const { Class1, Class2 } = require('module')
      /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"](.*?)['"];?\)/g,
      // const Module = require('module')
      /const\s+(\w+)\s*=\s*require\(['"](.*?)['"];?\)/g,
      // const service = require('module').Class
      /const\s+(\w+)\s*=\s*require\(['"](.*?)['"]\)\.(\w+);?/g
    ];
    
    for (const pattern of requirePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[0].includes('{')) {
          // Named imports
          const namedImports = match[1].split(',').map(imp => imp.trim());
          imports.requires.push({
            type: 'named',
            names: namedImports,
            module: match[2],
            line: content.substring(0, match.index).split('\n').length
          });
        } else if (match[3]) {
          // Property access
          imports.requires.push({
            type: 'property',
            name: match[1],
            module: match[2],
            property: match[3],
            line: content.substring(0, match.index).split('\n').length
          });
        } else {
          // Default import
          imports.requires.push({
            type: 'default',
            name: match[1],
            module: match[2],
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }
    
    return imports;
  }

  /**
   * Extract service-specific imports from test files
   */
  extractServiceImports(content) {
    const serviceImports = [];
    const servicePathPattern = /require\(['"](.*services.*?)['"];?\)/g;
    let match;
    
    while ((match = servicePathPattern.exec(content)) !== null) {
      const fullMatch = this.getFullRequireStatement(content, match.index);
      if (fullMatch) {
        serviceImports.push({
          module: match[1],
          statement: fullMatch.statement,
          line: content.substring(0, match.index).split('\n').length,
          pattern: this.categorizeImportPattern(fullMatch.statement)
        });
      }
    }
    
    return serviceImports;
  }

  /**
   * Extract service instantiation patterns from test files
   */
  extractServiceInstantiations(content) {
    const instantiations = [];
    const instantiationPatterns = [
      // new ServiceClass()
      /new\s+(\w+)\s*\([^)]*\)/g,
      // const instance = new ServiceClass()
      /const\s+(\w+)\s*=\s*new\s+(\w+)\s*\(/g
    ];
    
    for (const pattern of instantiationPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        instantiations.push({
          className: match[2] || match[1],
          instanceName: match[2] ? match[1] : null,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
    
    return instantiations;
  }

  /**
   * Validate naming consistency between services and tests
   */
  validateNamingConsistency() {
    this.log('📝 Validating naming consistency...');
    
    for (const [serviceName, serviceInfo] of this.services.entries()) {
      const expectedTestName = `${serviceName}.test`;
      const hasCorrespondingTest = this.tests.has(expectedTestName);
      
      if (!hasCorrespondingTest) {
        // Check for alternative naming patterns
        const alternativeNames = [
          `${serviceName}Test`,
          `${serviceName}Spec`,
          `test${serviceName.charAt(0).toUpperCase()}${serviceName.slice(1)}`
        ];
        
        const hasAlternative = alternativeNames.some(name => this.tests.has(name));
        
        if (!hasAlternative) {
          this.addWarning('MISSING_TEST_FILE',
            `No test file found for service: ${serviceName}. Expected: ${expectedTestName}.js`
          );
        }
      }
      
      // Check for consistent class naming
      for (const classInfo of serviceInfo.classes) {
        if (!classInfo.name.endsWith('Service') && !classInfo.name.endsWith('Manager') && !classInfo.name.endsWith('Handler')) {
          this.addWarning('INCONSISTENT_CLASS_NAMING',
            `Class ${classInfo.name} doesn't follow service naming convention (should end with Service/Manager/Handler)`,
            classInfo.line
          );
        }
      }
    }
  }

  /**
   * Validate import patterns between services and tests
   * This is the key validation that would have caught our import issues!
   */
  validateImportPatterns() {
    this.log('🔗 Validating import patterns...');
    
    for (const [testName, testInfo] of this.tests.entries()) {
      for (const serviceImport of testInfo.serviceImports) {
        const serviceName = this.extractServiceNameFromPath(serviceImport.module);
        const serviceInfo = this.services.get(serviceName);
        
        if (serviceInfo) {
          // Check if import pattern matches export pattern
          const importPattern = serviceImport.pattern;
          const exportStyle = serviceInfo.exports.exportStyle;
          
          // This is where we catch the SupplierAnalysis vs SupplierAnalysisService issue!
          if (importPattern.type === 'named' && exportStyle !== 'named_object') {
            this.addIssue('IMPORT_EXPORT_MISMATCH',
              `Test file ${testInfo.filePath} uses named import but service ${serviceName} doesn't export named objects`,
              serviceImport.line,
              {
                importStatement: serviceImport.statement,
                suggestion: this.generateCorrectImportStatement(serviceInfo),
                serviceExports: serviceInfo.exports
              }
            );
          }
          
          if (importPattern.type === 'default' && exportStyle === 'named_object') {
            this.addIssue('IMPORT_EXPORT_MISMATCH',
              `Test file ${testInfo.filePath} uses default import but service ${serviceName} exports named objects`,
              serviceImport.line,
              {
                importStatement: serviceImport.statement,
                suggestion: this.generateCorrectImportStatement(serviceInfo),
                serviceExports: serviceInfo.exports
              }
            );
          }
          
          // Check if imported names actually exist in service
          if (importPattern.type === 'named') {
            for (const importedName of importPattern.names) {
              const exists = this.checkIfExportExists(serviceInfo, importedName);
              if (!exists) {
                this.addIssue('NONEXISTENT_EXPORT',
                  `Imported name '${importedName}' does not exist in service ${serviceName}`,
                  serviceImport.line,
                  {
                    availableExports: [...serviceInfo.exports.moduleExports, ...serviceInfo.exports.namedExports]
                  }
                );
              }
            }
          }
        }
      }
    }
  }

  /**
   * Validate export patterns in service files
   */
  validateExportPatterns() {
    this.log('📤 Validating export patterns...');
    
    for (const [serviceName, serviceInfo] of this.services.entries()) {
      // Check if service has exports
      if (serviceInfo.exports.moduleExports.length === 0 && 
          serviceInfo.exports.namedExports.length === 0 && 
          !serviceInfo.exports.defaultExport) {
        this.addIssue('NO_EXPORTS_FOUND',
          `Service ${serviceName} has no detectable exports`,
          null,
          { suggestion: 'Add module.exports = { ClassName } or export statements' }
        );
      }
      
      // Check for consistent export style
      if (serviceInfo.exports.moduleExports.length > 0 && serviceInfo.exports.namedExports.length > 0) {
        this.addWarning('MIXED_EXPORT_STYLES',
          `Service ${serviceName} uses both CommonJS and ES module exports. Consider using one style consistently.`
        );
      }
      
      // Check if all classes are exported
      for (const classInfo of serviceInfo.classes) {
        if (classInfo.isService) {
          const isExported = this.checkIfExportExists(serviceInfo, classInfo.name);
          if (!isExported) {
            this.addIssue('CLASS_NOT_EXPORTED',
              `Service class ${classInfo.name} is defined but not exported`,
              classInfo.line,
              { suggestion: `Add ${classInfo.name} to module.exports` }
            );
          }
        }
      }
    }
  }

  /**
   * Validate service instantiation in tests
   */
  validateServiceInstantiation() {
    this.log('🏗️ Validating service instantiation...');
    
    for (const [testName, testInfo] of this.tests.entries()) {
      for (const instantiation of testInfo.instantiations) {
        // Check if instantiated class was properly imported
        const wasImported = this.checkIfClassWasImported(testInfo, instantiation.className);
        
        if (!wasImported) {
          this.addIssue('UNIMPORTED_INSTANTIATION',
            `Test ${testName} instantiates ${instantiation.className} but doesn't import it`,
            instantiation.line,
            { suggestion: `Import ${instantiation.className} from the appropriate service` }
          );
        }
      }
    }
  }

  /**
   * Validate test coverage for services
   */
  validateTestCoverage() {
    this.log('📊 Validating test coverage...');
    
    const serviceCount = this.services.size;
    const testCount = this.tests.size;
    const coverage = testCount / serviceCount;
    
    if (coverage < 0.8) {
      this.addWarning('LOW_TEST_COVERAGE',
        `Low test coverage: ${testCount} tests for ${serviceCount} services (${Math.round(coverage * 100)}%)`
      );
    }
  }

  /**
   * Helper methods
   */
  findJavaScriptFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.findJavaScriptFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  findTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.findTestFiles(fullPath));
      } else if (entry.isFile() && (entry.name.includes('.test.') || entry.name.includes('.spec.'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  extractServiceNameFromPath(modulePath) {
    const parts = modulePath.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(js|ts)$/, '');
  }

  getFullRequireStatement(content, startIndex) {
    const lines = content.substring(0, startIndex + 200).split('\n');
    const lineWithRequire = lines[lines.length - 1];
    
    // Find the full statement (may span multiple lines)
    let statement = lineWithRequire;
    const beforeRequire = content.substring(Math.max(0, startIndex - 100), startIndex);
    const beforeLines = beforeRequire.split('\n');
    
    for (let i = beforeLines.length - 2; i >= 0; i--) {
      const line = beforeLines[i].trim();
      if (line.includes('const') || line.includes('let') || line.includes('var')) {
        statement = line + ' ' + statement;
        break;
      }
    }
    
    return { statement: statement.trim() };
  }

  categorizeImportPattern(statement) {
    if (statement.includes('{')) {
      const match = statement.match(/\{\s*([^}]+)\s*\}/);
      return {
        type: 'named',
        names: match ? match[1].split(',').map(n => n.trim()) : []
      };
    } else if (statement.match(/const\s+\w+\s*=\s*require/)) {
      return { type: 'default' };
    } else {
      return { type: 'other' };
    }
  }

  checkIfExportExists(serviceInfo, exportName) {
    return serviceInfo.exports.moduleExports.includes(exportName) ||
           serviceInfo.exports.namedExports.includes(exportName) ||
           serviceInfo.exports.defaultExport === exportName ||
           serviceInfo.classes.some(c => c.name === exportName);
  }

  checkIfClassWasImported(testInfo, className) {
    for (const importInfo of testInfo.imports.requires) {
      if (importInfo.type === 'named' && importInfo.names.includes(className)) {
        return true;
      }
      if (importInfo.type === 'default' && importInfo.name === className) {
        return true;
      }
    }
    return false;
  }

  generateCorrectImportStatement(serviceInfo) {
    const serviceName = serviceInfo.filePath.split('/').pop().replace('.js', '');
    
    if (serviceInfo.exports.exportStyle === 'named_object') {
      const exportNames = serviceInfo.exports.moduleExports;
      return `const { ${exportNames.join(', ')} } = require('./${serviceName}');`;
    } else if (serviceInfo.exports.defaultExport) {
      return `const ${serviceInfo.exports.defaultExport} = require('./${serviceName}');`;
    } else {
      return `const service = require('./${serviceName}');`;
    }
  }

  extractDependencies(content) {
    const dependencies = [];
    const requirePattern = /require\(['"](.*?)['"];?\)/g;
    let match;
    
    while ((match = requirePattern.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    return [...new Set(dependencies)];
  }

  extractTestDescriptions(content) {
    const descriptions = [];
    const testPatterns = [
      /describe\(['"](.*?)['"];?/g,
      /it\(['"](.*?)['"];?/g,
      /test\(['"](.*?)['"];?/g
    ];
    
    for (const pattern of testPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        descriptions.push(match[1]);
      }
    }
    
    return descriptions;
  }

  /**
   * Issue tracking
   */
  addIssue(code, message, line = null, details = {}) {
    this.issues.push({
      type: 'ERROR',
      code,
      message,
      line,
      details,
      timestamp: new Date()
    });
  }

  addWarning(code, message, line = null, details = {}) {
    this.warnings.push({
      type: 'WARNING',
      code,
      message,
      line,
      details,
      timestamp: new Date()
    });
  }

  log(message) {
    if (this.options.logLevel !== 'silent') {
      console.log(message);
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalServices: this.services.size,
        totalTests: this.tests.size,
        totalIssues: this.issues.length,
        totalWarnings: this.warnings.length,
        testCoverage: Math.round((this.tests.size / Math.max(this.services.size, 1)) * 100),
        status: this.issues.length === 0 ? 'PASSED' : 'FAILED'
      },
      services: Array.from(this.services.entries()).map(([name, info]) => ({
        name,
        ...info,
        content: undefined // Remove content to keep report size manageable
      })),
      tests: Array.from(this.tests.entries()).map(([name, info]) => ({
        name,
        ...info,
        content: undefined // Remove content to keep report size manageable
      })),
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Import/Export mismatch recommendations
    if (this.issues.some(i => i.code === 'IMPORT_EXPORT_MISMATCH')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Import/Export Consistency',
        action: 'Fix import statements to match service export patterns. Use named imports for named exports.'
      });
    }

    // Missing exports recommendations
    if (this.issues.some(i => i.code === 'CLASS_NOT_EXPORTED')) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Service Exports',
        action: 'Export all service classes using module.exports = { ClassName } pattern'
      });
    }

    // Test coverage recommendations
    if (this.warnings.some(w => w.code === 'LOW_TEST_COVERAGE')) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Test Coverage',
        action: 'Create test files for services without tests. Aim for at least 80% coverage.'
      });
    }

    return recommendations;
  }
}

module.exports = { ServiceConsistencyValidator };