# Database Health Report

**Generated**: 2025-09-04T06:05:17.638Z
**Duration**: 70ms
**Health Score**: 🟢 100/100 (excellent)

## 📊 Summary
- Connection Tests: 1
- Query Performance Tests: 5  
- Table Health Checks: 1
- Errors: 1
- Warnings: 0

## 🔌 Connection Health
✅ Database connection is healthy

## ⚡ Query Performance

### Simple Select
- Duration: 1ms (expected: ≤10ms)
- Performance: excellent
- Status: ✅
- Rows: 1


### Schema Info
- Duration: 4ms (expected: ≤50ms)
- Performance: excellent
- Status: ✅
- Rows: 1


### Users Count
- Duration: 0ms (expected: ≤100ms)
- Performance: excellent
- Status: ✅
- Rows: 1


### Companies Count
- Duration: 1ms (expected: ≤100ms)
- Performance: excellent
- Status: ✅
- Rows: 1


### Join Query
- Duration: 4ms (expected: ≤500ms)
- Performance: excellent
- Status: ✅
- Rows: 1



## 📋 Table Health


## 🔗 Constraint Health

Found 25 foreign key constraints:

- ✅ **analytics_events_user_id_fkey** (analytics_events): 0 violations


- ✅ **atlanta_event_attendance_event_id_fkey** (atlanta_event_attendance): 0 violations


- ✅ **atlanta_event_attendance_organization_id_fkey** (atlanta_event_attendance): 0 violations


- ✅ **atlanta_event_attendance_person_id_fkey** (atlanta_event_attendance): 0 violations


- ✅ **atlanta_events_organizer_organization_id_fkey** (atlanta_events): 0 violations


- ✅ **atlanta_opportunities_primary_contact_person_id_fkey** (atlanta_opportunities): 0 violations


- ✅ **atlanta_opportunities_source_organization_id_fkey** (atlanta_opportunities): 0 violations


- ✅ **atlanta_people_organization_id_fkey** (atlanta_people): 0 violations


- ✅ **atlanta_relationships_person_a_id_fkey** (atlanta_relationships): 0 violations


- ✅ **atlanta_relationships_person_b_id_fkey** (atlanta_relationships): 0 violations


- ✅ **event_recommendations_company_id_fkey** (event_recommendations): 0 violations


- ✅ **judge_scores_scoring_result_id_fkey** (judge_scores): 0 violations


- ✅ **partner_activity_log_invitation_id_fkey** (partner_activity_log): 0 violations


- ✅ **partner_activity_log_match_id_fkey** (partner_activity_log): 0 violations


- ✅ **partner_activity_log_profile_id_fkey** (partner_activity_log): 0 violations


- ✅ **partner_invitations_from_profile_id_fkey** (partner_invitations): 0 violations


- ✅ **partner_invitations_match_id_fkey** (partner_invitations): 0 violations


- ✅ **partner_invitations_to_profile_id_fkey** (partner_invitations): 0 violations


- ✅ **partner_matches_partner_id_fkey** (partner_matches): 0 violations


- ✅ **partner_matches_seeker_id_fkey** (partner_matches): 0 violations


- ✅ **partnership_recommendations_company_a_id_fkey** (partnership_recommendations): 0 violations


- ✅ **partnership_recommendations_company_b_id_fkey** (partnership_recommendations): 0 violations


- ✅ **scoring_results_company_id_fkey** (scoring_results): 0 violations


- ✅ **scoring_results_opportunity_id_fkey** (scoring_results): 0 violations


- ✅ **supplier_analytics_company_id_fkey** (supplier_analytics): 0 violations





## ❌ Errors
- **Table Health Check**: column "tablename" does not exist (3ms)




## 🎯 Recommendations
✅ **Excellent**: Database is performing optimally

---
*Database health monitoring provides real-time visibility into database performance and integrity.*
