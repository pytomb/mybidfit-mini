# Test Data Generation for MyBidFit - IT Services Companies

## Output Structure Requirements

Create test data for 15 fictitious IT services companies. Each company should have its own folder with the following structure:

```
test-data/
├── company-001-techsolutions/
│   ├── profile.md
│   ├── case_study_001.md
│   ├── case_study_002.md
│   └── case_study_003.md
├── company-002-cyberguard/
│   ├── profile.md
│   ├── case_study_001.md
│   └── case_study_002.md
...
```

## Company Profile Format (profile.md)

Each profile.md file should contain structured data that can be parsed by automated tests:

```markdown
# Company Profile

## Basic Information
- **Company Name**: [Full legal name]
- **Email Domain**: @[company-domain].com
- **Test Password**: Test123!@# (use this exact password for all test companies)
- **Industry Focus**: [Primary industry served]
- **Company Size**: [Small/Medium/Large]
- **Annual Revenue**: $[Amount]
- **Employee Count**: [Number]
- **Years in Business**: [Number]
- **Location**: [City, State]

## Capabilities
- **Primary Services**: [List 3-5 main services]
- **Technology Stack**: [List key technologies]
- **Certifications**: [List relevant certifications, some companies should have none]
- **Partner Status**: [Microsoft/AWS/Google/None - vary this]

## Ideal Client Profile
- **Target Company Size**: [Range]
- **Industries Served**: [List]
- **Project Budget Range**: $[Min] - $[Max]
- **Engagement Model**: [Project/Retainer/Managed Services]

## Testing Scenarios
- **Opportunity Match Score Expected**: [Low/Medium/High]
- **Partnership Potential**: [Complementary/Similar/None]
- **Pilot User**: [Yes/No - make 3 companies pilot users]
```

## Case Study Format (case_study_XXX.md)

Each case study should be 200-400 words and follow this structure:

```markdown
# Case Study: [Project Title]

## Client Overview
- **Client Name**: [Company Name]
- **Industry**: [Industry]
- **Challenge**: [Brief problem statement]

## Solution Delivered
[2-3 paragraphs describing the solution]

## Technologies Used
- [Technology 1]
- [Technology 2]
- [Technology 3]

## Results
- **Metric 1**: [Improvement percentage or value]
- **Metric 2**: [Improvement percentage or value]
- **Timeline**: [Project duration]
- **Budget**: $[Amount or range]

## Keywords for Matching
[List 5-10 keywords that should trigger opportunity matches]
```

## Company Generation Guidelines

### Company Diversity Requirements

1. **Size Distribution**:
   - 5 small companies (5-25 employees, <$5M revenue)
   - 7 medium companies (26-100 employees, $5M-$50M revenue)
   - 3 large companies (100+ employees, >$50M revenue)

2. **Service Focus Areas** (distribute across companies):
   - Cloud Migration & Infrastructure
   - Cybersecurity & Compliance
   - Custom Software Development
   - Managed IT Services
   - Data Analytics & AI
   - ERP Implementation
   - Digital Transformation
   - Network Infrastructure
   - Business Continuity
   - Healthcare IT

3. **Geographic Distribution**:
   - Mix of locations across US regions
   - Include 2-3 remote-only companies
   - Some in major tech hubs, others in smaller markets

4. **Partnership Characteristics**:
   - 5 companies with strong Microsoft partnerships
   - 3 companies with AWS certifications
   - 2 companies with Google Cloud expertise
   - 5 companies with no major partnerships (independent)

### Edge Cases to Include (IMPORTANT)

1. **Company 003**: Missing several profile fields (no certifications, vague service descriptions)
2. **Company 007**: Extremely broad service offerings (trying to do everything)
3. **Company 009**: Very narrow niche focus (only healthcare compliance)
4. **Company 011**: Conflicting information between profile and case studies
5. **Company 013**: Only one case study instead of multiple
6. **Company 015**: Exceptionally detailed profile with 5+ case studies

### Test Scenario Coverage

Each company should support testing of:

1. **Registration Flow**:
   - Email validation (use format: test.user@[company-domain].com)
   - Password creation (all use Test123!@# for consistency)
   - Company profile completion

2. **Opportunity Matching**:
   - Include keywords in case studies that match common opportunities
   - Vary match quality (some perfect fits, some poor fits)
   - Test scoring algorithm with different capability alignments

3. **Partner Matching**:
   - Complementary partnerships (e.g., infrastructure + software dev)
   - Competitive overlaps (similar services)
   - No partnership potential (too similar or too different)

4. **Pilot Features**:
   - Companies 001, 008, and 014 should be pilot users
   - Their email domains should trigger pilot user detection

### Specific Company Assignments

**Company 001 - TechSolutions Pro** (Pilot User)
- Medium-sized, balanced services, strong Microsoft partnership
- 3 solid case studies across different industries
- Good opportunity match potential

**Company 002 - CyberGuard Security**
- Small, specialized in cybersecurity
- 2 case studies focused on compliance
- Strong partner potential with software dev companies

**Company 003 - QuickFix IT** (Edge Case - Incomplete Data)
- Small, vague service descriptions
- Missing certifications
- 2 generic case studies

**Company 004 - CloudFirst Migration**
- Medium, cloud migration specialist
- AWS certified
- 3 detailed cloud transformation case studies

**Company 005 - HealthTech Solutions**
- Medium, healthcare IT focus
- HIPAA compliance expertise
- 3 healthcare-specific case studies

**Company 006 - DataDriven Analytics**
- Small, data analytics and AI
- No major partnerships
- 2 innovative AI implementation case studies

**Company 007 - MegaCorp IT Services** (Edge Case - Too Broad)
- Large, claims to do everything
- Multiple partnerships
- 4 case studies across wildly different areas

**Company 008 - AgileDevs** (Pilot User)
- Medium, custom software development
- Modern tech stack
- 3 software development case studies

**Company 009 - ComplianceFirst** (Edge Case - Too Narrow)
- Small, only healthcare compliance
- Very specific expertise
- 2 highly specialized case studies

**Company 010 - NetworkPros Infrastructure**
- Medium, network and infrastructure
- Cisco partnerships
- 3 infrastructure case studies

**Company 011 - Digital Transform Co** (Edge Case - Conflicting Info)
- Profile says cloud-focused, case studies show on-premise work
- Inconsistent capabilities listed
- 3 case studies that don't align with profile

**Company 012 - RemoteManaged Services**
- Small, fully remote managed services
- 24/7 support model
- 2 managed services case studies

**Company 013 - StartupTech** (Edge Case - Minimal Content)
- Small, new company
- Only 1 case study
- Limited profile information

**Company 014 - EnterpriseScale Solutions** (Pilot User)
- Large, enterprise focus
- Multiple certifications and partnerships
- 4 large-scale implementation case studies

**Company 015 - InnovateLab** (Edge Case - Excessive Detail)
- Medium, innovation consulting
- Extremely detailed profile
- 6 varied case studies with extensive detail

## Output Format Instructions

1. Create a folder for each company using the naming pattern: `company-XXX-shortname/`
2. Each profile.md should be 300-500 words
3. Each case_study_XXX.md should be 200-400 words
4. Use realistic but fictitious company names, client names, and projects
5. Include specific technologies, metrics, and outcomes
6. Make the content believable but clearly test data (avoid real company names)
7. Ensure data supports automated testing by using consistent field formats

## Additional Notes

- All email domains should be in format: @[company-shortname].com
- All test passwords should be exactly: Test123!@#
- Include typos or formatting issues in 2-3 companies to test error handling
- Vary the writing style between companies (formal vs casual)
- Some companies should have overlapping capabilities for partnership testing
- Include budget ranges that span from $10K to $10M projects

Generate all 15 companies with their complete folder structures and files. The data should feel realistic enough to properly test the system while including the specified edge cases and imperfections that will help make the testing process more robust.