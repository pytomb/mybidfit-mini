#!/usr/bin/env node

/**
 * Test Generation Consistency Framework for MyBidFit Platform
 * Enforces Store-First testing methodology and prevents import/export mismatches
 * 
 * This framework would have prevented the SupplierAnalysis vs SupplierAnalysisService
 * import issues by ensuring tests match actual service implementations
 */

const fs = require('fs');
const path = require('path');

class TestGenerationValidator {
  constructor(options = {}) {
    this.options = {
      projectRoot: process.cwd(),
      serviceDir: 'src/services',
      testDir: 'test',
      strictMode: true,
      enforceStoreFirst: true,
      logLevel: 'info',
      ...options
    };
    
    this.services = new Map();
    this.tests = new Map();
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
    this.testCoverage = new Map();
  }

  /**
   * Validate test generation consistency and coverage
   */
  async validateTestGeneration() {
    console.log('🧪 Analyzing service and test structure...');
    
    // Analyze services and their exports
    await this.analyzeServices();
    
    // Analyze existing tests
    await this.analyzeTests();
    
    // Validate consistency
    this.validateTestServiceAlignment();
    this.validateStoreFirstMethodology();
    this.validateImportExportConsistency();
    this.analyzeTestCoverage();
    this.recommendTestGenerationStrategy();
    
    return this.generateTestGenerationReport();
  }

  /**
   * Analyze service files and their exports
   */
  async analyzeServices() {
    const serviceDir = path.join(this.options.projectRoot, this.options.serviceDir);
    
    if (!fs.existsSync(serviceDir)) {
      this.addWarning('MISSING_SERVICE_DIR', `Service directory not found: ${serviceDir}`);
      return;
    }
    
    const serviceFiles = this.findFiles(serviceDir, /\.(js|ts)$/);
    
    for (const serviceFile of serviceFiles) {
      const relativePath = path.relative(this.options.projectRoot, serviceFile);
      const serviceName = this.getServiceName(serviceFile);
      
      try {
        const content = fs.readFileSync(serviceFile, 'utf8');
        const serviceInfo = this.analyzeServiceFile(content, serviceName, relativePath);
        this.services.set(serviceName, serviceInfo);
        
      } catch (error) {
        this.addWarning('SERVICE_ANALYSIS_ERROR', 
          `Failed to analyze service ${serviceName}: ${error.message}`
        );
      }
    }
  }

  /**
   * Analyze a single service file
   */
  analyzeServiceFile(content, serviceName, filePath) {
    return {
      name: serviceName,
      filePath: filePath,
      exports: this.extractExports(content),
      classes: this.extractClasses(content),
      functions: this.extractFunctions(content),
      dependencies: this.extractDependencies(content),
      businessLogic: this.identifyBusinessLogic(content),
      testPriority: this.assessTestPriority(content, serviceName)
    };
  }

  /**
   * Extract export patterns from service file
   */
  extractExports(content) {
    const exports = {
      moduleExports: [],
      namedExports: [],
      defaultExport: null,
      exportStyle: null
    };
    
    // Module.exports patterns
    const moduleExportRegex = /module\.exports\s*=\s*(.+);?/g;
    const moduleExportMatches = content.match(moduleExportRegex);
    if (moduleExportMatches) {
      exports.moduleExports = moduleExportMatches;
      exports.exportStyle = 'commonjs_module';
    }
    
    // Named exports with object destructuring
    const namedExportObjectRegex = /module\.exports\s*=\s*\{([^}]+)\}/g;
    let namedMatch;
    while ((namedMatch = namedExportObjectRegex.exec(content)) !== null) {
      const namedExportsList = namedMatch[1]
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      exports.namedExports.push(...namedExportsList);
      exports.exportStyle = 'named_object';
    }
    
    // ES6 export patterns
    const es6ExportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
    let es6Match;
    while ((es6Match = es6ExportRegex.exec(content)) !== null) {
      exports.namedExports.push(es6Match[1]);
      exports.exportStyle = 'es6_named';
    }
    
    // Default export
    const defaultExportRegex = /export\s+default\s+(.+);?/g;
    const defaultMatch = defaultExportRegex.exec(content);
    if (defaultMatch) {
      exports.defaultExport = defaultMatch[1].trim();
      exports.exportStyle = 'es6_default';
    }
    
    return exports;
  }

  /**
   * Extract class definitions
   */
  extractClasses(content) {
    const classes = [];
    const classRegex = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g;
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const classContent = this.extractClassBody(content, match.index);
      
      classes.push({
        name: className,
        methods: this.extractMethods(classContent),
        isService: className.includes('Service') || className.includes('Manager'),
        isStore: className.includes('Store') || className.includes('Repository'),
        testable: true
      });
    }
    
    return classes;
  }

  /**
   * Extract class body content
   */
  extractClassBody(content, startIndex) {
    let braceCount = 0;
    let i = startIndex;
    
    // Find the opening brace
    while (i < content.length && content[i] !== '{') {
      i++;
    }
    
    if (i >= content.length) return '';
    
    const start = i;
    braceCount = 1;
    i++;
    
    // Find the matching closing brace
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(start, i);
  }

  /**
   * Extract method definitions from class
   */
  extractMethods(classContent) {
    const methods = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g;
    let match;
    
    while ((match = methodRegex.exec(classContent)) !== null) {
      const methodName = match[1];
      
      // Skip constructor and common non-business methods
      if (['constructor', 'toString', 'valueOf'].includes(methodName)) {
        continue;
      }
      
      methods.push({
        name: methodName,
        isAsync: match[0].includes('async'),
        isPublic: !methodName.startsWith('_'),
        testable: !methodName.startsWith('_') && methodName !== 'constructor'
      });
    }
    
    return methods;
  }

  /**
   * Extract standalone functions
   */
  extractFunctions(content) {
    const functions = [];
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        isAsync: match[0].includes('async'),
        isExported: match[0].includes('export'),
        testable: true
      });
    }
    
    return functions;
  }

  /**
   * Extract import dependencies
   */
  extractDependencies(content) {
    const dependencies = [];
    
    // CommonJS requires
    const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      dependencies.push({
        type: 'require',
        module: match[1],
        isLocal: match[1].startsWith('./')
      });
    }
    
    // ES6 imports
    const importRegex = /import\s+.*from\s+['"`]([^'"`]+)['"`]/g;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push({
        type: 'import',
        module: match[1],
        isLocal: match[1].startsWith('./')
      });
    }
    
    return dependencies;
  }

  /**
   * Identify business logic components that need testing
   */
  identifyBusinessLogic(content) {
    const businessIndicators = [
      'calculate', 'compute', 'analyze', 'match', 'score', 'validate',
      'process', 'transform', 'filter', 'sort', 'rank', 'recommend',
      'partner', 'opportunity', 'company', 'credibility', 'supplier'
    ];
    
    const businessLogic = [];
    
    for (const indicator of businessIndicators) {
      const regex = new RegExp(`(\\w*${indicator}\\w*)`, 'gi');
      const matches = content.match(regex) || [];
      businessLogic.push(...matches.map(match => ({
        type: 'business_logic',
        identifier: match,
        priority: 'high'
      })));
    }
    
    return businessLogic;
  }

  /**
   * Assess test priority based on service characteristics
   */
  assessTestPriority(content, serviceName) {
    let priority = 'medium';
    
    // High priority for business logic services
    const highPriorityIndicators = [
      'PartnerAnalysis', 'SupplierAnalysis', 'OpportunityMatching',
      'ScoringEngine', 'CredibilityCalculator', 'MatchingAlgorithm'
    ];
    
    if (highPriorityIndicators.some(indicator => 
      serviceName.includes(indicator) || content.includes(indicator))) {
      priority = 'high';
    }
    
    // Critical priority for core business services
    const criticalIndicators = [
      'calculate.*score', 'match.*partner', 'analyze.*supplier',
      'process.*opportunity', 'compute.*credibility'
    ];
    
    if (criticalIndicators.some(indicator => 
      new RegExp(indicator, 'i').test(content))) {
      priority = 'critical';
    }
    
    return priority;
  }

  /**
   * Analyze existing test files
   */
  async analyzeTests() {
    const testDir = path.join(this.options.projectRoot, this.options.testDir);
    
    if (!fs.existsSync(testDir)) {
      this.addWarning('MISSING_TEST_DIR', `Test directory not found: ${testDir}`);
      return;
    }
    
    const testFiles = this.findFiles(testDir, /\.(test|spec)\.(js|ts)$/);
    
    for (const testFile of testFiles) {
      const relativePath = path.relative(this.options.projectRoot, testFile);
      const testName = this.getTestName(testFile);
      
      try {
        const content = fs.readFileSync(testFile, 'utf8');
        const testInfo = this.analyzeTestFile(content, testName, relativePath);
        this.tests.set(testName, testInfo);
        
      } catch (error) {
        this.addWarning('TEST_ANALYSIS_ERROR',
          `Failed to analyze test ${testName}: ${error.message}`
        );
      }
    }
  }

  /**
   * Analyze a single test file
   */
  analyzeTestFile(content, testName, filePath) {
    return {
      name: testName,
      filePath: filePath,
      serviceImports: this.extractServiceImports(content),
      testSuites: this.extractTestSuites(content),
      testCases: this.extractTestCases(content),
      instantiations: this.extractServiceInstantiations(content),
      followsStoreFirst: this.checkStoreFirstCompliance(content),
      importPatterns: this.analyzeImportPatterns(content)
    };
  }

  /**
   * Extract service imports from test files
   */
  extractServiceImports(content) {
    const serviceImports = [];
    
    // CommonJS requires pointing to services
    const requireRegex = /const\s+(\{[^}]+\}|\w+)\s*=\s*require\(['"`]([^'"`]*service[^'"`]*)['"`]\)/gi;
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      serviceImports.push({
        pattern: match[1],
        module: match[2],
        type: match[1].includes('{') ? 'destructured' : 'default',
        style: 'commonjs'
      });
    }
    
    // ES6 imports pointing to services
    const importRegex = /import\s+(\{[^}]+\}|\w+)\s+from\s+['"`]([^'"`]*service[^'"`]*)['"`]/gi;
    while ((match = importRegex.exec(content)) !== null) {
      serviceImports.push({
        pattern: match[1],
        module: match[2],
        type: match[1].includes('{') ? 'destructured' : 'default',
        style: 'es6'
      });
    }
    
    return serviceImports;
  }

  /**
   * Extract test suites (describe blocks)
   */
  extractTestSuites(content) {
    const testSuites = [];
    const suiteRegex = /describe\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = suiteRegex.exec(content)) !== null) {
      testSuites.push({
        name: match[1],
        focusesOnStore: match[1].toLowerCase().includes('store') || 
                       match[1].toLowerCase().includes('repository') ||
                       match[1].toLowerCase().includes('service')
      });
    }
    
    return testSuites;
  }

  /**
   * Extract test cases (it/test blocks)
   */
  extractTestCases(content) {
    const testCases = [];
    const testRegex = /(?:it|test)\(['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = testRegex.exec(content)) !== null) {
      testCases.push({
        name: match[1],
        testsBusinessLogic: this.isBusinessLogicTest(match[1])
      });
    }
    
    return testCases;
  }

  /**
   * Check if test case focuses on business logic
   */
  isBusinessLogicTest(testName) {
    const businessLogicPatterns = [
      'calculate', 'compute', 'analyze', 'match', 'score',
      'should.*score', 'should.*calculate', 'should.*match',
      'returns.*result', 'processes.*data'
    ];
    
    return businessLogicPatterns.some(pattern => 
      new RegExp(pattern, 'i').test(testName)
    );
  }

  /**
   * Extract service instantiations in tests
   */
  extractServiceInstantiations(content) {
    const instantiations = [];
    
    // new ServiceName() patterns
    const newRegex = /new\s+(\w+)\s*\(/g;
    let match;
    while ((match = newRegex.exec(content)) !== null) {
      if (match[1].includes('Service') || match[1].includes('Store') || match[1].includes('Manager')) {
        instantiations.push({
          className: match[1],
          type: 'constructor'
        });
      }
    }
    
    return instantiations;
  }

  /**
   * Check Store-First methodology compliance
   */
  checkStoreFirstCompliance(content) {
    const storeFirstIndicators = {
      testsBusinessLogic: /(?:calculate|compute|analyze|process|transform)/i.test(content),
      testsBeforeUI: !/(render|mount|component|jsx)/i.test(content),
      focusesOnPureLogic: /(expect.*to.*equal|expect.*to.*be|assert)/i.test(content),
      avoidsUIComplexity: !/(click|submit|form|input|button)/i.test(content)
    };
    
    const compliance = Object.values(storeFirstIndicators).filter(Boolean).length;
    return compliance >= 3; // At least 3 of 4 criteria met
  }

  /**
   * Analyze import patterns in tests
   */
  analyzeImportPatterns(content) {
    const patterns = [];
    
    // Destructured imports
    const destructuredRegex = /(?:const|import)\s+\{([^}]+)\}/g;
    let match;
    while ((match = destructuredRegex.exec(content)) !== null) {
      patterns.push({
        type: 'destructured',
        items: match[1].split(',').map(item => item.trim())
      });
    }
    
    // Default imports
    const defaultRegex = /(?:const|import)\s+(\w+)(?:\s*=\s*require\(['"`][^'"`]+['"`]\)|from\s+['"`][^'"`]+['"`])/g;
    while ((match = defaultRegex.exec(content)) !== null) {
      patterns.push({
        type: 'default',
        name: match[1]
      });
    }
    
    return patterns;
  }

  /**
   * Validate test-service alignment
   */
  validateTestServiceAlignment() {
    for (const [testName, testInfo] of this.tests) {
      // Find corresponding service
      const correspondingService = this.findCorrespondingService(testName, testInfo);
      
      if (!correspondingService) {
        this.addWarning('ORPHANED_TEST',
          `Test file ${testName} doesn't appear to correspond to any service`
        );
        continue;
      }
      
      // Check import/export consistency
      this.validateImportExportMatch(testInfo, correspondingService);
      
      // Update coverage tracking
      this.testCoverage.set(correspondingService.name, {
        hasTest: true,
        testFile: testInfo.filePath,
        coverage: this.calculateCoverage(testInfo, correspondingService)
      });
    }
    
    // Check for services without tests
    for (const [serviceName, serviceInfo] of this.services) {
      if (!this.testCoverage.has(serviceName)) {
        this.addIssue('MISSING_TEST',
          `Service ${serviceName} has no corresponding test file`,
          { service: serviceName, priority: serviceInfo.testPriority }
        );
      }
    }
  }

  /**
   * Find service corresponding to a test file
   */
  findCorrespondingService(testName, testInfo) {
    // Direct name match
    const directMatch = this.services.get(testName.replace('.test', '').replace('.spec', ''));
    if (directMatch) return directMatch;
    
    // Check service imports
    for (const serviceImport of testInfo.serviceImports) {
      const serviceName = path.basename(serviceImport.module, path.extname(serviceImport.module));
      const service = this.services.get(serviceName);
      if (service) return service;
    }
    
    return null;
  }

  /**
   * Validate import/export consistency between test and service
   */
  validateImportExportMatch(testInfo, serviceInfo) {
    for (const serviceImport of testInfo.serviceImports) {
      const importType = serviceImport.type;
      const exportStyle = serviceInfo.exports.exportStyle;
      
      // Check for common mismatches
      if (importType === 'default' && exportStyle === 'named_object') {
        this.addIssue('IMPORT_EXPORT_MISMATCH',
          `Test ${testInfo.name} uses default import but service ${serviceInfo.name} exports named objects`,
          { 
            testFile: testInfo.filePath,
            serviceFile: serviceInfo.filePath,
            importPattern: serviceImport.pattern,
            exportStyle: exportStyle,
            suggestion: `Use destructured import: const { ${serviceInfo.exports.namedExports.join(', ')} } = require('${serviceImport.module}')`
          }
        );
      }
      
      if (importType === 'destructured' && exportStyle === 'commonjs_module') {
        this.addIssue('IMPORT_EXPORT_MISMATCH',
          `Test ${testInfo.name} uses destructured import but service ${serviceInfo.name} uses module.exports`,
          {
            testFile: testInfo.filePath,
            serviceFile: serviceInfo.filePath,
            importPattern: serviceImport.pattern,
            exportStyle: exportStyle,
            suggestion: `Use default import: const ${serviceInfo.name} = require('${serviceImport.module}')`
          }
        );
      }
    }
  }

  /**
   * Validate Store-First methodology compliance
   */
  validateStoreFirstMethodology() {
    let storeFirstCompliantTests = 0;
    let totalTests = 0;
    
    for (const [testName, testInfo] of this.tests) {
      totalTests++;
      
      if (testInfo.followsStoreFirst) {
        storeFirstCompliantTests++;
      } else {
        this.addWarning('STORE_FIRST_VIOLATION',
          `Test ${testName} doesn't follow Store-First methodology - should focus on business logic before UI`,
          {
            testFile: testInfo.filePath,
            suggestion: 'Prioritize testing business logic, data processing, and core algorithms before UI components'
          }
        );
      }
    }
    
    const complianceRate = totalTests > 0 ? (storeFirstCompliantTests / totalTests) * 100 : 0;
    
    if (complianceRate < 80) {
      this.addIssue('LOW_STORE_FIRST_COMPLIANCE',
        `Only ${complianceRate.toFixed(1)}% of tests follow Store-First methodology`,
        { complianceRate: complianceRate, threshold: 80 }
      );
    }
  }

  /**
   * Validate import/export consistency across all tests
   */
  validateImportExportConsistency() {
    const inconsistencies = new Map();
    
    for (const [testName, testInfo] of this.tests) {
      for (const serviceImport of testInfo.serviceImports) {
        const key = serviceImport.module;
        
        if (!inconsistencies.has(key)) {
          inconsistencies.set(key, []);
        }
        
        inconsistencies.get(key).push({
          testName: testName,
          importPattern: serviceImport
        });
      }
    }
    
    // Check for inconsistent import patterns for the same service
    for (const [modulePath, imports] of inconsistencies) {
      if (imports.length > 1) {
        const patterns = [...new Set(imports.map(imp => imp.importPattern.type))];
        if (patterns.length > 1) {
          this.addWarning('INCONSISTENT_IMPORT_PATTERNS',
            `Module ${modulePath} is imported with different patterns: ${patterns.join(', ')}`,
            {
              module: modulePath,
              patterns: patterns,
              tests: imports.map(imp => imp.testName)
            }
          );
        }
      }
    }
  }

  /**
   * Analyze test coverage
   */
  analyzeTestCoverage() {
    let totalServices = this.services.size;
    let testedServices = this.testCoverage.size;
    let businessLogicCovered = 0;
    let highPriorityTested = 0;
    
    for (const [serviceName, serviceInfo] of this.services) {
      if (this.testCoverage.has(serviceName)) {
        const coverage = this.testCoverage.get(serviceName);
        
        if (coverage.coverage.businessLogic > 50) {
          businessLogicCovered++;
        }
        
        if (serviceInfo.testPriority === 'high' || serviceInfo.testPriority === 'critical') {
          highPriorityTested++;
        }
      } else if (serviceInfo.testPriority === 'high' || serviceInfo.testPriority === 'critical') {
        this.addIssue('MISSING_HIGH_PRIORITY_TEST',
          `High priority service ${serviceName} has no tests`,
          { service: serviceName, priority: serviceInfo.testPriority }
        );
      }
    }
    
    const coveragePercentage = totalServices > 0 ? (testedServices / totalServices) * 100 : 0;
    
    this.addRecommendation('TEST_COVERAGE_ANALYSIS', 'QUALITY',
      `Test coverage: ${testedServices}/${totalServices} services (${coveragePercentage.toFixed(1)}%)`,
      {
        totalServices: totalServices,
        testedServices: testedServices,
        coveragePercentage: coveragePercentage,
        businessLogicCovered: businessLogicCovered,
        highPriorityTested: highPriorityTested
      }
    );
  }

  /**
   * Calculate coverage for a specific service
   */
  calculateCoverage(testInfo, serviceInfo) {
    const coverage = {
      classes: 0,
      methods: 0,
      functions: 0,
      businessLogic: 0
    };
    
    // Simple heuristic based on test cases and business logic
    const businessLogicTests = testInfo.testCases.filter(tc => tc.testsBusinessLogic);
    coverage.businessLogic = businessLogicTests.length > 0 ? 75 : 25;
    
    return coverage;
  }

  /**
   * Recommend test generation strategy
   */
  recommendTestGenerationStrategy() {
    const untestedServices = [];
    const priorityOrder = ['critical', 'high', 'medium'];
    
    for (const priority of priorityOrder) {
      for (const [serviceName, serviceInfo] of this.services) {
        if (serviceInfo.testPriority === priority && !this.testCoverage.has(serviceName)) {
          untestedServices.push({
            name: serviceName,
            priority: priority,
            filePath: serviceInfo.filePath,
            businessLogicCount: serviceInfo.businessLogic.length,
            classCount: serviceInfo.classes.length,
            functionCount: serviceInfo.functions.length
          });
        }
      }
    }
    
    if (untestedServices.length > 0) {
      this.addRecommendation('TEST_GENERATION_PRIORITY', 'DEVELOPMENT',
        `Recommended test generation order (Store-First methodology)`,
        {
          services: untestedServices.slice(0, 10), // Top 10 priorities
          methodology: 'Store-First: Start with business logic services, then move to UI components',
          storeFirstBenefits: [
            'Catches business logic errors early',
            'Prevents import/export mismatches',
            'Enables TDD for core functionality',
            'Reduces debugging time'
          ]
        }
      );
    }
  }

  /**
   * Find files matching a pattern
   */
  findFiles(directory, pattern) {
    const files = [];
    
    function walkDir(currentPath) {
      try {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
          const fullPath = path.join(currentPath, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            walkDir(fullPath);
          } else if (stat.isFile() && pattern.test(item)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    walkDir(directory);
    return files;
  }

  /**
   * Get service name from file path
   */
  getServiceName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Get test name from file path
   */
  getTestName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Add issue to validation results
   */
  addIssue(code, message, details = {}) {
    this.issues.push({
      code,
      message,
      severity: 'critical',
      details,
      suggestion: this.generateSuggestion(code, details)
    });
  }

  /**
   * Add warning to validation results
   */
  addWarning(code, message, details = {}) {
    this.warnings.push({
      code,
      message,
      severity: 'warning',
      details,
      suggestion: this.generateSuggestion(code, details)
    });
  }

  /**
   * Add recommendation to validation results
   */
  addRecommendation(code, category, action, details = {}) {
    this.recommendations.push({
      code,
      category,
      priority: this.determinePriority(code),
      action,
      details
    });
  }

  /**
   * Generate fix suggestion
   */
  generateSuggestion(code, details) {
    switch (code) {
      case 'IMPORT_EXPORT_MISMATCH':
        return details.suggestion || 'Align import pattern with service export style';
        
      case 'MISSING_TEST':
        return `Create test file for ${details.service} service following Store-First methodology`;
        
      case 'STORE_FIRST_VIOLATION':
        return details.suggestion || 'Focus tests on business logic before UI components';
        
      case 'MISSING_HIGH_PRIORITY_TEST':
        return `Priority ${details.priority} service needs comprehensive test coverage`;
        
      default:
        return 'Review test generation strategy and service alignment';
    }
  }

  /**
   * Determine recommendation priority
   */
  determinePriority(code) {
    const priorities = {
      'TEST_GENERATION_PRIORITY': 'HIGH',
      'TEST_COVERAGE_ANALYSIS': 'MEDIUM',
      'IMPORT_EXPORT_CONSISTENCY': 'HIGH'
    };
    
    return priorities[code] || 'MEDIUM';
  }

  /**
   * Generate comprehensive test generation report
   */
  generateTestGenerationReport() {
    const summary = {
      status: this.issues.length === 0 ? 'PASSED' : 'FAILED',
      totalServices: this.services.size,
      totalTests: this.tests.size,
      testCoverage: this.testCoverage.size > 0 ? 
        (this.testCoverage.size / this.services.size * 100).toFixed(1) + '%' : '0%',
      totalIssues: this.issues.length,
      totalWarnings: this.warnings.length,
      storeFirstCompliance: this.calculateStoreFirstCompliance()
    };
    
    return {
      summary,
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      services: Array.from(this.services.values()),
      tests: Array.from(this.tests.values()),
      coverage: Array.from(this.testCoverage.entries()).map(([name, coverage]) => ({
        service: name,
        ...coverage
      }))
    };
  }

  /**
   * Calculate Store-First compliance percentage
   */
  calculateStoreFirstCompliance() {
    if (this.tests.size === 0) return 0;
    
    const compliantTests = Array.from(this.tests.values())
      .filter(test => test.followsStoreFirst).length;
    
    return Math.round((compliantTests / this.tests.size) * 100);
  }
}

module.exports = { TestGenerationValidator };