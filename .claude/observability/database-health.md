# Database Health Report

**Generated**: 2025-09-04T14:14:51.747Z
**Duration**: 15ms
**Health Score**: 🔴 40/100 (poor)

## 📊 Summary
- Connection Tests: 1
- Query Performance Tests: 5  
- Table Health Checks: 1
- Errors: 8
- Warnings: 0

## 🔌 Connection Health
❌ Database connection issues detected

## ⚡ Query Performance

### Simple Select
- Duration: 1ms (expected: ≤10ms)
- Performance: undefined
- Status: ❌

- Error: connect ECONNREFUSED 127.0.0.1:5432

### Schema Info
- Duration: 1ms (expected: ≤50ms)
- Performance: undefined
- Status: ❌

- Error: connect ECONNREFUSED 127.0.0.1:5432

### Users Count
- Duration: 0ms (expected: ≤100ms)
- Performance: undefined
- Status: ❌

- Error: connect ECONNREFUSED 127.0.0.1:5432

### Companies Count
- Duration: 1ms (expected: ≤100ms)
- Performance: undefined
- Status: ❌

- Error: connect ECONNREFUSED 127.0.0.1:5432

### Join Query
- Duration: 1ms (expected: ≤500ms)
- Performance: undefined
- Status: ❌

- Error: connect ECONNREFUSED 127.0.0.1:5432


## 📋 Table Health


## 🔗 Constraint Health
No foreign key constraints found


## ❌ Errors
- **Connection Test**: connect ECONNREFUSED 127.0.0.1:5432 (8ms)
- **Query: Simple Select**: connect ECONNREFUSED 127.0.0.1:5432 (1ms)
- **Query: Schema Info**: connect ECONNREFUSED 127.0.0.1:5432 (1ms)
- **Query: Users Count**: connect ECONNREFUSED 127.0.0.1:5432 (0ms)
- **Query: Companies Count**: connect ECONNREFUSED 127.0.0.1:5432 (1ms)
- **Query: Join Query**: connect ECONNREFUSED 127.0.0.1:5432 (1ms)
- **Table Health Check**: connect ECONNREFUSED 127.0.0.1:5432 (1ms)
- **Constraint Check**: connect ECONNREFUSED 127.0.0.1:5432 (0ms)




## 🎯 Recommendations
🔴 **Critical**: Fix database connection issues immediately
🔴 **Action Required**: Database needs immediate attention

---
*Database health monitoring provides real-time visibility into database performance and integrity.*
