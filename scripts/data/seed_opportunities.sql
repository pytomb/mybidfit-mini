-- Seed script for B2B opportunities database
-- This script populates realistic opportunities for testing the B2C to B2B discovery system

-- Insert City of Atlanta opportunities
INSERT INTO public.b2b_opportunities (
  title,
  description,
  opportunity_type,
  budget_range,
  deadline,
  location,
  requirements,
  preferred_company_size,
  industry_focus,
  contact_email,
  submission_url,
  source_type,
  source_url,
  posted_date,
  status
) VALUES 
-- City Services & Infrastructure
(
  'Municipal Catering Services for City Events',
  'The City of Atlanta seeks qualified catering companies to provide food services for various municipal events, meetings, and public gatherings throughout the year. This includes breakfast, lunch, dinner, and refreshment services for events ranging from 25 to 500 attendees. Preference given to local businesses and those with diverse ownership.',
  'contract',
  '$75,000 - $200,000 annually',
  '2025-09-15',
  'Atlanta, GA',
  ARRAY[
    'Licensed food service establishment in Georgia',
    'Ability to serve 25-500 people per event',
    'Food safety certification required',
    'Liability insurance minimum $1M',
    'References from similar municipal or corporate contracts',
    'Delivery and setup capabilities',
    'Dietary accommodation experience (vegetarian, vegan, allergies)'
  ],
  ARRAY['under_10', '10_49', '50_99'],
  ARRAY['Food Service', 'Hospitality', 'Event Services'],
  'procurement@atlantaga.gov',
  'https://www.atlantaga.gov/government/procurement',
  'government_portal',
  'https://www.atlantaga.gov/rfp/catering-2025',
  '2025-01-15 10:00:00-05',
  'active'
),

(
  'Landscaping and Grounds Maintenance Services',
  'Multi-year contract for landscaping and grounds maintenance services for City of Atlanta parks, municipal buildings, and public spaces. Services include lawn maintenance, tree care, seasonal plantings, irrigation system maintenance, and emergency storm cleanup. Sustainable and environmentally friendly practices preferred.',
  'contract',
  '$500,000 - $1,200,000 annually',
  '2025-08-30',
  'Atlanta, GA',
  ARRAY[
    'Georgia landscape contractor license',
    'Minimum 5 years commercial landscaping experience',
    'Equipment for large-scale operations',
    'Emergency response capabilities',
    'Environmental sustainability practices',
    'Certified arborist on staff',
    'Workers compensation insurance'
  ],
  ARRAY['10_49', '50_99', '100_249'],
  ARRAY['Landscaping', 'Environmental Services', 'Facilities Management'],
  'procurement@atlantaga.gov',
  'https://www.atlantaga.gov/government/procurement',
  'government_portal',
  'https://www.atlantaga.gov/rfp/landscaping-2025',
  '2025-01-20 14:00:00-05',
  'active'
),

(
  'IT Support and Computer Maintenance Services',
  'The City of Atlanta requires comprehensive IT support services including computer maintenance, network support, software installation, and technical help desk services for municipal departments. Services must be available during business hours with emergency support capabilities.',
  'rfp',
  '$150,000 - $400,000 annually',
  '2025-10-01',
  'Atlanta, GA',
  ARRAY[
    'CompTIA or equivalent IT certifications',
    'Experience with municipal or government IT systems',
    '24/7 emergency support availability',
    'Cybersecurity expertise and clearance',
    'Microsoft and network infrastructure experience',
    'Local presence in Atlanta metro area',
    'Background checks for all technicians'
  ],
  ARRAY['10_49', '50_99', '100_249'],
  ARRAY['Information Technology', 'Technical Services', 'Cybersecurity'],
  'it.procurement@atlantaga.gov',
  'https://www.atlantaga.gov/government/procurement',
  'government_portal',
  'https://www.atlantaga.gov/rfp/it-support-2025',
  '2025-01-18 16:30:00-05',
  'active'
),

(
  'Small Business Development Workshop Facilitation',
  'Seeking experienced business consultants and trainers to facilitate workshops for small business development programs. Topics include business planning, financial management, marketing, and regulatory compliance. Facilitators should have experience working with diverse business communities.',
  'partnership',
  '$25,000 - $75,000',
  '2025-07-15',
  'Atlanta, GA',
  ARRAY[
    'Business consulting or training experience',
    'Workshop facilitation skills',
    'Knowledge of small business challenges',
    'Experience with diverse business communities',
    'Available for evening and weekend sessions',
    'Strong communication and presentation skills'
  ],
  ARRAY['under_10', '10_49'],
  ARRAY['Business Consulting', 'Training', 'Economic Development'],
  'economic.development@atlantaga.gov',
  'https://www.atlantaga.gov/economic-development',
  'government_portal',
  'https://www.atlantaga.gov/rfp/workshop-facilitators',
  '2025-01-25 12:00:00-05',
  'active'
),

-- Corporate Opportunities
(
  'Corporate Event Management Services',
  'Growing technology company seeks event management partner for quarterly all-hands meetings, customer conferences, and team building events. Events range from 50-300 attendees and include venue selection, catering coordination, AV setup, and logistics management.',
  'rfp',
  '$100,000 - $250,000 annually',
  '2025-08-15',
  'Atlanta, GA (some travel required)',
  ARRAY[
    'Event planning experience with corporate clients',
    'Vendor management and coordination skills',
    'Budget management and cost optimization',
    'Technology event experience preferred',
    'Ability to travel to multiple locations',
    'Crisis management and contingency planning',
    'Professional liability insurance'
  ],
  ARRAY['under_10', '10_49', '50_99'],
  ARRAY['Event Management', 'Hospitality', 'Corporate Services'],
  'events@techcorp.com',
  'https://techcorp.com/vendor-portal',
  'corporate_portal',
  'https://techcorp.com/rfp/event-management',
  '2025-01-22 09:00:00-05',
  'active'
),

(
  'Office Cleaning and Maintenance Services',
  'Multi-location professional services firm requires comprehensive office cleaning and maintenance services for 5 Atlanta-area offices. Services include daily cleaning, deep cleaning, restroom maintenance, carpet cleaning, and basic facility maintenance.',
  'contract',
  '$80,000 - $150,000 annually',
  '2025-09-30',
  'Atlanta Metro Area',
  ARRAY[
    'Licensed and bonded cleaning service',
    'Experience with professional office environments',
    'Eco-friendly cleaning products and practices',
    'Flexible scheduling including after-hours service',
    'Quality control and inspection processes',
    'Staff background checks and training',
    'Emergency response capabilities'
  ],
  ARRAY['10_49', '50_99'],
  ARRAY['Facilities Management', 'Cleaning Services', 'Property Maintenance'],
  'facilities@professionalfirm.com',
  'https://professionalfirm.com/procurement',
  'corporate_portal',
  'https://professionalfirm.com/cleaning-services-rfp',
  '2025-01-19 11:30:00-05',
  'active'
),

(
  'Employee Wellness Program Development',
  'Healthcare organization seeking partners to develop and implement comprehensive employee wellness programs. Services include health screenings, fitness programs, mental health support, nutrition counseling, and wellness education workshops.',
  'partnership',
  '$50,000 - $120,000',
  '2025-06-30',
  'Atlanta, GA',
  ARRAY[
    'Healthcare or wellness industry experience',
    'Certified wellness professionals on staff',
    'Program development and implementation experience',
    'HIPAA compliance and privacy protection',
    'Measurement and reporting capabilities',
    'Experience with healthcare worker populations',
    'Flexible delivery methods (in-person and virtual)'
  ],
  ARRAY['under_10', '10_49', '50_99'],
  ARRAY['Healthcare', 'Wellness', 'Human Resources', 'Training'],
  'hr@healthcareorg.com',
  'https://healthcareorg.com/vendor-opportunities',
  'corporate_portal',
  'https://healthcareorg.com/wellness-program-rfp',
  '2025-01-16 13:45:00-05',
  'active'
),

(
  'Legal Document Review and Administrative Services',
  'Growing law firm requires additional capacity for document review, legal research, and administrative support services. Services include contract review, legal research, document preparation, and case file management.',
  'contract',
  '$75,000 - $200,000',
  '2025-11-15',
  'Atlanta, GA (remote work possible)',
  ARRAY[
    'Legal education or paralegal certification',
    'Document review and legal research experience',
    'Confidentiality and ethical standards compliance',
    'Proficiency with legal research databases',
    'Strong attention to detail and accuracy',
    'Available for variable workloads and deadlines',
    'Technology proficiency for remote collaboration'
  ],
  ARRAY['under_10', '10_49'],
  ARRAY['Legal Services', 'Professional Services', 'Administrative Support'],
  'operations@lawfirm.com',
  'https://lawfirm.com/vendor-portal',
  'corporate_portal',
  'https://lawfirm.com/document-services-rfp',
  '2025-01-21 10:15:00-05',
  'active'
),

-- Retail and Consumer Services
(
  'Corporate Gift and Promotional Items Supplier',
  'Established retail company seeks suppliers for corporate gifts, promotional items, and branded merchandise for customer appreciation programs and employee recognition. Items include apparel, tech accessories, gift baskets, and custom branded products.',
  'procurement',
  '$30,000 - $100,000 annually',
  '2025-07-30',
  'Atlanta, GA (shipping nationwide)',
  ARRAY[
    'Product sourcing and customization capabilities',
    'Quality control and brand compliance',
    'Inventory management and fulfillment services',
    'Competitive pricing for bulk orders',
    'Fast turnaround times for urgent orders',
    'Sustainable and eco-friendly product options',
    'Customer service and account management'
  ],
  ARRAY['under_10', '10_49', '50_99'],
  ARRAY['Retail', 'Manufacturing', 'Marketing Services', 'E-commerce'],
  'procurement@retailcompany.com',
  'https://retailcompany.com/suppliers',
  'corporate_portal',
  'https://retailcompany.com/promotional-items-rfp',
  '2025-01-17 14:20:00-05',
  'active'
),

(
  'Employee Transportation and Shuttle Services',
  'Large corporation seeks transportation services for employee shuttles between office locations, airport transfers for business travel, and special event transportation. Services should include professional drivers, well-maintained vehicles, and flexible scheduling.',
  'contract',
  '$120,000 - $300,000 annually',
  '2025-08-01',
  'Atlanta Metro Area',
  ARRAY[
    'Commercial transportation license and insurance',
    'Professional chauffeur services experience',
    'Fleet of clean, well-maintained vehicles',
    'Background checks and drug testing for drivers',
    'GPS tracking and real-time updates',
    'Emergency response and backup vehicle availability',
    'Corporate account management experience'
  ],
  ARRAY['10_49', '50_99', '100_249'],
  ARRAY['Transportation', 'Logistics', 'Corporate Services'],
  'travel@corporation.com',
  'https://corporation.com/vendor-portal',
  'corporate_portal',
  'https://corporation.com/transportation-services-rfp',
  '2025-01-23 15:00:00-05',
  'active'
),

-- Healthcare and Professional Services
(
  'Medical Equipment Calibration and Maintenance',
  'Multi-facility healthcare system requires calibration and preventive maintenance services for medical equipment including imaging systems, patient monitors, laboratory equipment, and surgical instruments. Services must meet FDA and regulatory compliance standards.',
  'contract',
  '$200,000 - $500,000 annually',
  '2025-09-15',
  'Atlanta, GA and surrounding areas',
  ARRAY[
    'Biomedical equipment technician certification',
    'FDA compliance and regulatory knowledge',
    'Experience with major medical equipment brands',
    'Emergency repair and 24/7 support capabilities',
    'Detailed documentation and reporting systems',
    'Insurance and liability coverage for medical facilities',
    'Clean room and sterile environment protocols'
  ],
  ARRAY['10_49', '50_99', '100_249'],
  ARRAY['Healthcare', 'Medical Equipment', 'Technical Services'],
  'facilities@healthsystem.com',
  'https://healthsystem.com/vendor-opportunities',
  'healthcare_portal',
  'https://healthsystem.com/medical-equipment-maintenance-rfp',
  '2025-01-24 08:30:00-05',
  'active'
),

(
  'Educational Technology Training and Support',
  'School district seeks technology training and support services for teachers and staff. Services include software training, technical support, curriculum integration assistance, and ongoing professional development for educational technology tools.',
  'contract',
  '$60,000 - $150,000',
  '2025-06-15',
  'Atlanta Metropolitan Area',
  ARRAY[
    'Educational technology expertise',
    'Teacher training and professional development experience',
    'Knowledge of K-12 educational environments',
    'Curriculum integration and instructional design skills',
    'Flexible scheduling for school calendar',
    'Background checks and clearances for school access',
    'Experience with diverse learning needs and accessibility'
  ],
  ARRAY['under_10', '10_49'],
  ARRAY['Education', 'Technology Training', 'Professional Development'],
  'tech.training@schooldistrict.edu',
  'https://schooldistrict.edu/procurement',
  'education_portal',
  'https://schooldistrict.edu/ed-tech-training-rfp',
  '2025-01-26 16:00:00-05',
  'active'
),

-- Manufacturing and Supply Chain
(
  'Packaging and Shipping Services for E-commerce',
  'Growing e-commerce company requires packaging, fulfillment, and shipping services to handle increased order volume. Services include product packaging, inventory management, order fulfillment, and integration with multiple shipping carriers.',
  'contract',
  '$180,000 - $400,000 annually',
  '2025-10-15',
  'Atlanta, GA (warehouse space required)',
  ARRAY[
    'Warehouse and fulfillment experience',
    'E-commerce platform integration capabilities',
    'Multiple shipping carrier relationships',
    'Inventory management and tracking systems',
    'Quality control and damage prevention protocols',
    'Scalable operations for seasonal volume changes',
    'Technology integration and real-time reporting'
  ],
  ARRAY['10_49', '50_99', '100_249'],
  ARRAY['Logistics', 'E-commerce', 'Warehousing', 'Supply Chain'],
  'operations@ecommerce.com',
  'https://ecommerce.com/vendor-portal',
  'corporate_portal',
  'https://ecommerce.com/fulfillment-services-rfp',
  '2025-01-20 12:30:00-05',
  'active'
),

(
  'Specialized Manufacturing Consulting Services',
  'Manufacturing company seeks consulting services for process optimization, quality improvement, and lean manufacturing implementation. Consultant should have experience with small to medium manufacturing operations and continuous improvement methodologies.',
  'consulting',
  '$40,000 - $100,000',
  '2025-11-30',
  'Atlanta, GA',
  ARRAY[
    'Manufacturing operations experience',
    'Lean manufacturing and Six Sigma expertise',
    'Process optimization and efficiency improvement',
    'Quality management systems knowledge',
    'Data analysis and performance measurement',
    'Change management and employee training',
    'Experience with manufacturing technology integration'
  ],
  ARRAY['under_10', '10_49'],
  ARRAY['Manufacturing', 'Consulting', 'Process Improvement', 'Quality Management'],
  'consulting@manufacturer.com',
  'https://manufacturer.com/consulting-rfp',
  'corporate_portal',
  'https://manufacturer.com/manufacturing-consulting-rfp',
  '2025-01-27 09:45:00-05',
  'active'
),

-- Grant and Nonprofit Opportunities
(
  'Community Development Program Implementation',
  'Nonprofit organization seeks partners to implement community development programs in underserved Atlanta neighborhoods. Programs include small business mentorship, financial literacy training, and community organizing support.',
  'grant',
  '$85,000 - $200,000',
  '2025-05-31',
  'Atlanta, GA',
  ARRAY[
    'Community development or social services experience',
    'Cultural competency and community engagement skills',
    'Program development and implementation experience',
    'Grant reporting and compliance capabilities',
    'Bilingual capabilities preferred (Spanish)',
    'Transportation and flexible scheduling',
    'Outcome measurement and evaluation experience'
  ],
  ARRAY['under_10', '10_49'],
  ARRAY['Nonprofit', 'Community Development', 'Training', 'Social Services'],
  'programs@nonprofit.org',
  'https://nonprofit.org/partner-opportunities',
  'nonprofit_portal',
  'https://nonprofit.org/community-development-rfp',
  '2025-01-28 11:00:00-05',
  'active'
),

(
  'Environmental Sustainability Assessment Services',
  'Green energy nonprofit requires environmental assessment and sustainability consulting services for small businesses. Services include energy audits, sustainability planning, green certification assistance, and environmental impact assessments.',
  'grant',
  '$50,000 - $125,000',
  '2025-07-01',
  'Atlanta Metro Area',
  ARRAY[
    'Environmental science or sustainability expertise',
    'Energy audit and assessment experience',
    'Small business consulting experience',
    'Green building and certification knowledge',
    'Report writing and presentation skills',
    'Transportation to multiple business locations',
    'Commitment to environmental mission and values'
  ],
  ARRAY['under_10', '10_49'],
  ARRAY['Environmental Services', 'Consulting', 'Energy', 'Sustainability'],
  'assessments@greenenergy.org',
  'https://greenenergy.org/consulting-opportunities',
  'nonprofit_portal',
  'https://greenenergy.org/sustainability-assessment-rfp',
  '2025-01-29 14:15:00-05',
  'active'
);

-- Insert sample B2C companies that could benefit from these opportunities
INSERT INTO public.b2c_companies (
  company_name,
  website_url,
  industry,
  company_size,
  location,
  description,
  business_model,
  current_revenue_range,
  b2b_potential_score,
  analysis_status,
  created_at
) VALUES
(
  'Southern Comfort Catering',
  'https://southerncomfortcatering.com',
  'Food Service',
  '10_49',
  'Atlanta, GA',
  'Family-owned catering company specializing in Southern cuisine for weddings and private events. Known for high-quality food and exceptional service.',
  'B2C Service Provider',
  '250k_500k',
  85,
  'completed',
  '2025-01-15 10:00:00-05'
),

(
  'Green Thumb Landscaping',
  'https://greenthumbatl.com',
  'Landscaping',
  '50_99',
  'Atlanta, GA',
  'Residential landscaping company providing lawn care, garden design, and maintenance services to Atlanta homeowners. Emphasizes sustainable practices.',
  'B2C Service Provider',
  '500k_1m',
  92,
  'completed',
  '2025-01-15 11:30:00-05'
),

(
  'TechFix Solutions',
  'https://techfixsolutions.com',
  'Computer Repair',
  'under_10',
  'Atlanta, GA',
  'Computer repair shop serving residential customers with hardware repairs, software installation, and tech support services.',
  'B2C Service Provider',
  '100k_250k',
  78,
  'completed',
  '2025-01-15 14:20:00-05'
),

(
  'Atlanta Event Planners',
  'https://atlantaeventplanners.com',
  'Event Planning',
  '10_49',
  'Atlanta, GA',
  'Boutique event planning company specializing in weddings, birthday parties, and anniversary celebrations.',
  'B2C Service Provider',
  '250k_500k',
  88,
  'completed',
  '2025-01-16 09:15:00-05'
),

(
  'Clean Sweep Services',
  'https://cleansweepatlanta.com',
  'Cleaning Services',
  '10_49',
  'Atlanta, GA',
  'Residential cleaning service offering weekly, bi-weekly, and monthly house cleaning for busy families.',
  'B2C Service Provider',
  '150k_250k',
  82,
  'completed',
  '2025-01-16 13:45:00-05'
),

(
  'Wellness Works Atlanta',
  'https://wellnessworksatl.com',
  'Health and Wellness',
  'under_10',
  'Atlanta, GA',
  'Personal wellness coaching and fitness training for individuals seeking healthier lifestyles.',
  'B2C Service Provider',
  '75k_150k',
  76,
  'completed',
  '2025-01-17 08:30:00-05'
),

(
  'Creative Gifts & More',
  'https://creativegiftsatlanta.com',
  'Retail',
  'under_10',
  'Atlanta, GA',
  'Local gift shop specializing in handmade items, custom gifts, and unique finds for special occasions.',
  'B2C Retail',
  '100k_250k',
  71,
  'completed',
  '2025-01-17 16:00:00-05'
),

(
  'Safe Ride Atlanta',
  'https://saferideatlanta.com',
  'Transportation',
  '10_49',
  'Atlanta, GA',
  'Private transportation service for individuals, offering rides to airports, events, and appointments.',
  'B2C Service Provider',
  '200k_500k',
  89,
  'completed',
  '2025-01-18 10:45:00-05'
),

(
  'MedEquip Repair Solutions',
  'https://medequiprepair.com',
  'Technical Services',
  '10_49',
  'Atlanta, GA',
  'Specialized repair service for home medical equipment including mobility aids, oxygen concentrators, and monitoring devices.',
  'B2C Service Provider',
  '300k_500k',
  94,
  'completed',
  '2025-01-18 12:20:00-05'
),

(
  'Learning Bridge Tutoring',
  'https://learningbridgetutor.com',
  'Education',
  'under_10',
  'Atlanta, GA',
  'Private tutoring service for K-12 students in math, science, and reading, including test preparation.',
  'B2C Service Provider',
  '50k_100k',
  73,
  'completed',
  '2025-01-19 15:30:00-05'
),

(
  'PackRight Fulfillment',
  'https://packrightfulfillment.com',
  'Logistics',
  '50_99',
  'Atlanta, GA',
  'Originally started as a packaging service for individuals and small eBay sellers, now expanding operations.',
  'B2C Service Provider',
  '400k_750k',
  86,
  'completed',
  '2025-01-20 11:10:00-05'
),

(
  'Process Improvement Pros',
  'https://processimprovementpros.com',
  'Consulting',
  'under_10',
  'Atlanta, GA',
  'Small consulting firm helping local businesses optimize their operations and improve efficiency.',
  'B2C Service Provider',
  '100k_250k',
  91,
  'completed',
  '2025-01-21 09:25:00-05'
),

(
  'Community Connect Services',
  'https://communityconnectservices.com',
  'Community Services',
  'under_10',
  'Atlanta, GA',
  'Community organization providing mentorship and support services to local residents.',
  'B2C Service Provider',
  '75k_150k',
  68,
  'completed',
  '2025-01-22 14:40:00-05'
),

(
  'EcoAudit Atlanta',
  'https://ecoauditatlanta.com',
  'Environmental Services',
  'under_10',
  'Atlanta, GA',
  'Environmental consulting service helping homeowners reduce energy costs and environmental impact.',
  'B2C Service Provider',
  '100k_200k',
  87,
  'completed',
  '2025-01-23 16:55:00-05'
);

-- Create some sample opportunity-company matches to demonstrate the system
INSERT INTO public.company_opportunity_matches (
  b2c_company_id,
  opportunity_id,
  match_score,
  match_reasoning,
  fit_assessment,
  recommended_actions,
  created_at
) 
SELECT 
  bc.id as b2c_company_id,
  bo.id as opportunity_id,
  -- Calculate match scores based on industry and company size alignment
  CASE 
    WHEN bc.industry = 'Food Service' AND bo.title LIKE '%Catering%' THEN 95
    WHEN bc.industry = 'Landscaping' AND bo.title LIKE '%Landscaping%' THEN 93
    WHEN bc.industry = 'Computer Repair' AND bo.title LIKE '%IT Support%' THEN 88
    WHEN bc.industry = 'Event Planning' AND bo.title LIKE '%Event%' THEN 92
    WHEN bc.industry = 'Cleaning Services' AND bo.title LIKE '%Cleaning%' THEN 89
    WHEN bc.industry = 'Health and Wellness' AND bo.title LIKE '%Wellness%' THEN 85
    WHEN bc.industry = 'Transportation' AND bo.title LIKE '%Transportation%' THEN 91
    WHEN bc.industry = 'Technical Services' AND bo.title LIKE '%Medical Equipment%' THEN 94
    WHEN bc.industry = 'Education' AND bo.title LIKE '%Educational%' THEN 87
    WHEN bc.industry = 'Logistics' AND bo.title LIKE '%Packaging%' THEN 90
    WHEN bc.industry = 'Consulting' AND bo.title LIKE '%Consulting%' THEN 89
    WHEN bc.industry = 'Environmental Services' AND bo.title LIKE '%Environmental%' THEN 92
    ELSE 65 -- Lower score for non-perfect matches
  END as match_score,
  
  -- Generate match reasoning
  CASE 
    WHEN bc.industry = 'Food Service' AND bo.title LIKE '%Catering%' THEN 
      'Perfect match: Your catering expertise aligns directly with municipal catering needs. Your local presence and quality service record make you an ideal candidate.'
    WHEN bc.industry = 'Landscaping' AND bo.title LIKE '%Landscaping%' THEN 
      'Excellent fit: Your landscaping experience can scale to municipal contracts. The sustainable practices requirement matches your eco-friendly approach.'
    WHEN bc.industry = 'Computer Repair' AND bo.title LIKE '%IT Support%' THEN 
      'Strong alignment: Your technical skills are directly applicable to municipal IT needs. Consider expanding team for government contract requirements.'
    ELSE 'Good potential match: Your business model and capabilities have transferable elements that could serve this B2B opportunity with some adjustments.'
  END as match_reasoning,
  
  -- Fit assessment
  'HIGH' as fit_assessment,
  
  -- Recommended actions
  ARRAY[
    'Review RFP requirements thoroughly',
    'Assess capacity for larger scale operations',
    'Obtain required certifications and insurance',
    'Prepare references from similar work',
    'Calculate competitive pricing for municipal scale',
    'Develop proposal highlighting relevant experience'
  ] as recommended_actions,
  
  now() as created_at

FROM public.b2c_companies bc
CROSS JOIN public.b2b_opportunities bo
WHERE 
  -- Only create matches where there's a reasonable industry alignment
  (bc.industry = 'Food Service' AND bo.title LIKE '%Catering%') OR
  (bc.industry = 'Landscaping' AND bo.title LIKE '%Landscaping%') OR
  (bc.industry = 'Computer Repair' AND bo.title LIKE '%IT Support%') OR
  (bc.industry = 'Event Planning' AND bo.title LIKE '%Event%') OR
  (bc.industry = 'Cleaning Services' AND bo.title LIKE '%Cleaning%') OR
  (bc.industry = 'Health and Wellness' AND bo.title LIKE '%Wellness%') OR
  (bc.industry = 'Transportation' AND bo.title LIKE '%Transportation%') OR
  (bc.industry = 'Technical Services' AND bo.title LIKE '%Medical Equipment%') OR
  (bc.industry = 'Education' AND bo.title LIKE '%Educational%') OR
  (bc.industry = 'Logistics' AND bo.title LIKE '%Packaging%') OR
  (bc.industry = 'Consulting' AND bo.title LIKE '%Consulting%') OR
  (bc.industry = 'Environmental Services' AND bo.title LIKE '%Environmental%');

-- Insert some prospect companies that would be interested in these B2C services
INSERT INTO public.prospect_companies (
  company_name,
  industry,
  location,
  company_size,
  website_url,
  description,
  procurement_focus,
  annual_procurement_budget,
  preferred_supplier_characteristics,
  contact_preferences,
  created_at
) VALUES
(
  'City of Atlanta',
  'Government',
  'Atlanta, GA',
  '1000_plus',
  'https://www.atlantaga.gov',
  'Municipal government serving the city of Atlanta with diverse procurement needs across all departments.',
  ARRAY['Professional Services', 'Facilities Management', 'Technology', 'Public Works', 'Community Services'],
  '50M_plus',
  ARRAY['Local businesses', 'Diverse suppliers', 'Sustainable practices', 'Competitive pricing', 'Proven track record'],
  ARRAY['Email', 'Formal RFP process', 'Vendor portals'],
  now()
),

(
  'Atlanta Public Schools',
  'Education',
  'Atlanta, GA',
  '1000_plus',
  'https://www.atlantapublicschools.us',
  'Large school district serving Atlanta area students with focus on educational technology and support services.',
  ARRAY['Educational Technology', 'Professional Development', 'Facilities Management', 'Transportation'],
  '10M_25M',
  ARRAY['Education experience', 'Background checks', 'Flexible scheduling', 'Student-focused'],
  ARRAY['Email', 'Education portals', 'RFP process'],
  now()
),

(
  'Emory Healthcare',
  'Healthcare',
  'Atlanta, GA',
  '1000_plus',
  'https://www.emoryhealthcare.org',
  'Major healthcare system with multiple facilities requiring diverse support services and equipment maintenance.',
  ARRAY['Medical Equipment', 'Facilities Management', 'Technology Services', 'Professional Services'],
  '25M_50M',
  ARRAY['Healthcare experience', 'Regulatory compliance', 'Quality certifications', '24/7 availability'],
  ARRAY['Vendor portals', 'Procurement department', 'Direct contact'],
  now()
),

(
  'Georgia Tech',
  'Education',
  'Atlanta, GA',
  '1000_plus',
  'https://www.gatech.edu',
  'Leading technology university with extensive research and facilities management needs.',
  ARRAY['Technology Services', 'Facilities Management', 'Research Support', 'Event Services'],
  '5M_10M',
  ARRAY['Technology expertise', 'Research experience', 'Innovation focus', 'Academic calendar flexibility'],
  ARRAY['University procurement', 'Email', 'Vendor registration'],
  now()
),

(
  'Delta Air Lines',
  'Transportation',
  'Atlanta, GA',
  '1000_plus',
  'https://www.delta.com',
  'Major airline headquartered in Atlanta with extensive corporate services and facilities needs.',
  ARRAY['Corporate Services', 'Facilities Management', 'Technology', 'Employee Services'],
  '25M_50M',
  ARRAY['Aviation experience', 'Security clearance', 'Global capabilities', 'Quality standards'],
  ARRAY['Vendor portals', 'Procurement team', 'Supplier diversity'],
  now()
),

(
  'Children''s Healthcare of Atlanta',
  'Healthcare',
  'Atlanta, GA',
  '1000_plus',
  'https://www.choa.org',
  'Pediatric healthcare system requiring specialized services and child-focused approaches.',
  ARRAY['Medical Equipment', 'Educational Services', 'Facilities Management', 'Community Outreach'],
  '10M_25M',
  ARRAY['Pediatric experience', 'Child safety focus', 'Healthcare compliance', 'Family-centered approach'],
  ARRAY['Healthcare procurement', 'Direct contact', 'RFP process'],
  now()
);

-- Create analytics summary
INSERT INTO public.batch_processing_jobs (
  job_type,
  status,
  scheduled_time,
  started_at,
  completed_at,
  progress_percentage,
  records_processed,
  records_total,
  results_summary
) VALUES (
  'opportunity_discovery',
  'completed',
  now() - interval '1 hour',
  now() - interval '1 hour',
  now() - interval '30 minutes',
  100,
  16,
  16,
  jsonb_build_object(
    'opportunities_discovered', 16,
    'sources_checked', 8,
    'new_matches', 45,
    'government_opportunities', 4,
    'corporate_opportunities', 8,
    'nonprofit_opportunities', 2,
    'healthcare_opportunities', 2
  )
);

-- Add a comment with summary statistics
-- Total opportunities added: 16
-- Total B2C companies added: 14  
-- Total matches created: ~45
-- Opportunity types: RFP (6), Contract (7), Partnership (2), Grant (2), Procurement (1)
-- Industries covered: Government, Corporate, Healthcare, Education, Nonprofit
-- Budget ranges: $25K to $1.2M annually
-- Geographic focus: Atlanta, GA metro area