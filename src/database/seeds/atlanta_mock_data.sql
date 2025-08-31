-- Mock Atlanta Metro Data for Relationship Intelligence PoC
-- This provides realistic test data for demonstrating the relationship mapping system

-- Atlanta Organizations (mix of corporations, government, nonprofits, startups)
INSERT INTO atlanta_organizations (name, type, description, website, address_street, address_city, address_county, address_zip, latitude, longitude, employee_count_range, founded_year, annual_revenue_range, industry_sectors, key_business_areas, strategic_priorities, partnership_interests, influence_score, collaboration_score, event_activity_level, data_quality_score) VALUES

-- Major Corporations
('The Coca-Cola Company', 'corporation', 'Global beverage corporation headquartered in Atlanta', 'https://coca-cola.com', '1 Coca-Cola Plaza NW', 'Atlanta', 'Fulton', '30313', 33.7635, -84.3963, '1000+', 1892, '100M+', ARRAY['Manufacturing', 'Consumer Goods', 'Beverages'], ARRAY['Brand Innovation', 'Global Distribution', 'Sustainability'], ARRAY['Digital Transformation', 'Sustainable Packaging', 'Market Expansion'], ARRAY['Technology Partnerships', 'Sustainability Initiatives', 'Startup Collaborations'], 9.5, 8.9, 'high', 9.2),

('Delta Air Lines', 'corporation', 'Major American airline headquartered in Atlanta', 'https://delta.com', '1030 Delta Blvd', 'Atlanta', 'Fulton', '30354', 33.6407, -84.4277, '1000+', 1924, '100M+', ARRAY['Transportation', 'Aviation', 'Hospitality'], ARRAY['Passenger Services', 'Cargo Operations', 'Maintenance'], ARRAY['Fleet Modernization', 'Customer Experience', 'Carbon Neutral Growth'], ARRAY['Technology Integration', 'Airport Partnerships', 'Travel Industry Alliances'], 9.2, 8.7, 'high', 9.0),

('Home Depot', 'corporation', 'Home improvement retailer headquartered in Atlanta', 'https://homedepot.com', '2455 Paces Ferry Rd', 'Atlanta', 'Cobb', '30339', 33.8754, -84.4644, '1000+', 1978, '100M+', ARRAY['Retail', 'Home Improvement', 'Construction'], ARRAY['Retail Operations', 'Supply Chain', 'Professional Services'], ARRAY['Digital Commerce', 'Pro Services Growth', 'Sustainability'], ARRAY['Construction Industry', 'Technology Vendors', 'Supplier Partnerships'], 9.0, 8.5, 'high', 8.8),

-- Tech Companies
('Mailchimp', 'corporation', 'Email marketing and automation platform', 'https://mailchimp.com', '675 Ponce de Leon Ave NE', 'Atlanta', 'Fulton', '30308', 33.7701, -84.3658, '501-1000', 2001, '100M+', ARRAY['Software', 'Marketing Technology', 'SaaS'], ARRAY['Email Marketing', 'Marketing Automation', 'Small Business Tools'], ARRAY['AI Integration', 'Global Expansion', 'Product Innovation'], ARRAY['Technology Integration', 'Small Business Ecosystem', 'Developer Community'], 8.5, 8.2, 'high', 8.7),

('NCR Corporation', 'corporation', 'Software and technology solutions for enterprises', 'https://ncr.com', '864 Spring St NW', 'Atlanta', 'Fulton', '30308', 33.7863, -84.3900, '1000+', 1884, '100M+', ARRAY['Software', 'Financial Technology', 'Retail Technology'], ARRAY['Point of Sale Systems', 'Digital Banking', 'Self-Service Technology'], ARRAY['Cloud Migration', 'Digital Transformation', 'Industry 4.0'], ARRAY['Banking Partners', 'Retail Technology', 'System Integrators'], 8.3, 8.0, 'medium', 8.5),

-- Government and Public Sector
('City of Atlanta', 'government', 'Municipal government serving Atlanta metropolitan area', 'https://atlantaga.gov', '55 Trinity Ave SW', 'Atlanta', 'Fulton', '30303', 33.7490, -84.3902, '1000+', 1837, NULL, ARRAY['Public Administration', 'Municipal Services'], ARRAY['Public Safety', 'Infrastructure', 'Economic Development'], ARRAY['Smart City Initiatives', 'Economic Growth', 'Community Development'], ARRAY['Technology Vendors', 'Public-Private Partnerships', 'Economic Development'], 9.8, 9.2, 'high', 9.0),

('Georgia Department of Economic Development', 'government', 'State agency promoting business development', 'https://georgia.org', '75 5th St NW', 'Atlanta', 'Fulton', '30308', 33.7845, -84.3934, '201-500', 1970, NULL, ARRAY['Economic Development', 'Public Administration'], ARRAY['Business Attraction', 'International Trade', 'Tourism'], ARRAY['Innovation Economy', 'Rural Development', 'International Expansion'], ARRAY['Corporate Relocations', 'Industry Associations', 'International Partners'], 8.9, 9.0, 'high', 8.7),

-- Startups and Innovation
('Calendly', 'corporation', 'Scheduling automation platform startup', 'https://calendly.com', '271 17th St NW', 'Atlanta', 'Fulton', '30363', 33.7919, -84.3963, '201-500', 2013, '10-100M', ARRAY['Software', 'SaaS', 'Productivity Tools'], ARRAY['Scheduling Automation', 'Business Productivity', 'API Integration'], ARRAY['Enterprise Growth', 'International Expansion', 'AI Features'], ARRAY['Technology Integrations', 'Enterprise Partnerships', 'Developer Ecosystem'], 7.8, 7.5, 'high', 8.2),

('InvestorKeep', 'startup', 'Fintech startup for investment management', NULL, '1100 Peachtree St', 'Atlanta', 'Fulton', '30309', 33.7916, -84.3834, '11-50', 2019, '1-10M', ARRAY['Financial Technology', 'Investment Management', 'SaaS'], ARRAY['Portfolio Management', 'Investor Relations', 'Financial Reporting'], ARRAY['Product Development', 'Market Expansion', 'Regulatory Compliance'], ARRAY['Financial Services', 'Technology Partners', 'Investment Community'], 6.5, 6.8, 'medium', 7.5),

-- Professional Services
('King & Spalding', 'corporation', 'International law firm with Atlanta headquarters', 'https://kslaw.com', '1180 Peachtree St NE', 'Atlanta', 'Fulton', '30309', 33.7927, -84.3831, '1000+', 1885, '100M+', ARRAY['Legal Services', 'Professional Services'], ARRAY['Corporate Law', 'Litigation', 'International Law'], ARRAY['Global Expansion', 'Technology Integration', 'Client Innovation'], ARRAY['Corporate Clients', 'Government Relations', 'International Business'], 8.7, 8.3, 'medium', 8.6),

('Deloitte Atlanta', 'corporation', 'Professional services and consulting', 'https://deloitte.com', '191 Peachtree St NE', 'Atlanta', 'Fulton', '30303', 33.7580, -84.3879, '1000+', 1845, '100M+', ARRAY['Professional Services', 'Consulting', 'Technology Services'], ARRAY['Management Consulting', 'Technology Implementation', 'Risk Advisory'], ARRAY['Digital Transformation', 'Cyber Security', 'Sustainability Services'], ARRAY['Enterprise Clients', 'Technology Partnerships', 'Government Contracts'], 9.1, 8.8, 'high', 9.0),

-- Nonprofits and Associations
('Technology Association of Georgia', 'association', 'Premier technology industry association in Georgia', 'https://tag.org', '87 Walton St NW', 'Atlanta', 'Fulton', '30303', 33.7557, -84.3924, '51-200', 1999, '1-10M', ARRAY['Technology', 'Professional Association', 'Economic Development'], ARRAY['Technology Advocacy', 'Professional Development', 'Industry Events'], ARRAY['Innovation Ecosystem', 'Talent Development', 'Policy Advocacy'], ARRAY['Technology Companies', 'Educational Institutions', 'Government Relations'], 8.2, 9.5, 'high', 8.5),

('Metro Atlanta Chamber', 'nonprofit', 'Business advocacy and economic development organization', 'https://metroatlantachamber.com', '235 Andrew Young International Blvd NW', 'Atlanta', 'Fulton', '30303', 33.7615, -84.3962, '201-500', 1859, '10-100M', ARRAY['Business Advocacy', 'Economic Development'], ARRAY['Business Development', 'Policy Advocacy', 'Regional Planning'], ARRAY['Economic Growth', 'Transportation', 'Talent Pipeline'], ARRAY['Business Community', 'Government Relations', 'Regional Development'], 9.0, 9.3, 'high', 8.8);

-- Atlanta People (key professionals in these organizations)
INSERT INTO atlanta_people (first_name, last_name, title, organization_id, seniority_level, department, years_experience, linkedin_profile, areas_of_expertise, professional_interests, speaking_topics, network_influence_score, connection_count, activity_level, privacy_consent, data_source, data_quality_score) VALUES

-- Coca-Cola executives and key personnel
('James', 'Quincey', 'Chairman and Chief Executive Officer', 1, 'c-level', 'executive', 25, 'https://linkedin.com/in/jamesquincey', ARRAY['Corporate Strategy', 'Global Operations', 'Brand Management'], ARRAY['Sustainability', 'Innovation', 'Global Markets'], ARRAY['Leadership in Crisis', 'Sustainable Business', 'Global Brand Strategy'], 9.8, 2500, 'high', true, 'public_profile', 9.5),

('Jennifer', 'Mann', 'Chief Financial Officer', 1, 'c-level', 'finance', 20, 'https://linkedin.com/in/jennifermann-cfo', ARRAY['Financial Management', 'Strategic Planning', 'Corporate Development'], ARRAY['Financial Innovation', 'ESG Reporting', 'Digital Finance'], ARRAY['CFO Leadership', 'Financial Strategy', 'ESG Integration'], 8.9, 1800, 'high', true, 'public_profile', 9.2),

('Manuel', 'Arroyo', 'Chief Marketing Officer', 1, 'c-level', 'marketing', 18, 'https://linkedin.com/in/manuelarroyo-cmo', ARRAY['Brand Marketing', 'Digital Transformation', 'Consumer Insights'], ARRAY['Brand Innovation', 'Digital Marketing', 'Consumer Behavior'], ARRAY['Brand Evolution', 'Digital Marketing', 'Consumer Connection'], 8.7, 2200, 'high', true, 'public_profile', 9.0),

-- Delta Air Lines leadership
('Ed', 'Bastian', 'Chief Executive Officer', 2, 'c-level', 'executive', 30, 'https://linkedin.com/in/edbastian', ARRAY['Aviation Industry', 'Strategic Leadership', 'Customer Experience'], ARRAY['Sustainable Aviation', 'Industry Innovation', 'Leadership'], ARRAY['Aviation Future', 'Leadership Excellence', 'Sustainability'], 9.6, 2800, 'high', true, 'public_profile', 9.3),

('Dan', 'Janki', 'Chief Financial Officer', 2, 'c-level', 'finance', 25, 'https://linkedin.com/in/danjanki', ARRAY['Aviation Finance', 'Strategic Planning', 'Risk Management'], ARRAY['Financial Strategy', 'Capital Markets', 'Aviation Economics'], ARRAY['Aviation Finance', 'Strategic Planning', 'Risk Management'], 8.5, 1600, 'medium', true, 'public_profile', 8.8),

-- Home Depot executives
('Ted', 'Decker', 'Chairman and CEO', 3, 'c-level', 'executive', 28, 'https://linkedin.com/in/teddecker', ARRAY['Retail Operations', 'Strategic Leadership', 'Supply Chain'], ARRAY['Retail Innovation', 'Customer Experience', 'Digital Transformation'], ARRAY['Retail Leadership', 'Digital Commerce', 'Customer Focus'], 9.2, 2100, 'high', true, 'public_profile', 9.0),

-- Mailchimp leadership
('Ben', 'Chestnut', 'Co-founder and CEO', 4, 'c-level', 'executive', 22, 'https://linkedin.com/in/benchestnut', ARRAY['Email Marketing', 'SaaS Strategy', 'Small Business'], ARRAY['Marketing Technology', 'Entrepreneurship', 'Small Business Growth'], ARRAY['Email Marketing Evolution', 'Entrepreneurship', 'Small Business Technology'], 8.8, 1900, 'high', true, 'public_profile', 8.9),

('Rania', 'Succar', 'Chief Executive Officer', 4, 'c-level', 'executive', 20, 'https://linkedin.com/in/raniasuccar', ARRAY['SaaS Leadership', 'Product Strategy', 'Marketing Technology'], ARRAY['Product Innovation', 'Customer Success', 'Team Leadership'], ARRAY['SaaS Growth', 'Product Leadership', 'Customer Experience'], 8.6, 1700, 'high', true, 'public_profile', 8.7),

-- NCR Corporation
('Michael', 'Hayford', 'Chief Executive Officer', 5, 'c-level', 'executive', 25, 'https://linkedin.com/in/michaelhayford', ARRAY['Enterprise Technology', 'Digital Transformation', 'Software Strategy'], ARRAY['Industry 4.0', 'Digital Banking', 'Retail Technology'], ARRAY['Digital Transformation', 'Enterprise Software', 'Technology Strategy'], 8.4, 1500, 'medium', true, 'public_profile', 8.5),

-- City of Atlanta
('Andre', 'Dickens', 'Mayor', 6, 'c-level', 'executive', 15, 'https://linkedin.com/in/andredickens', ARRAY['Public Administration', 'Urban Planning', 'Economic Development'], ARRAY['Smart Cities', 'Economic Development', 'Community Building'], ARRAY['Urban Innovation', 'Smart City Development', 'Public Service'], 9.7, 3200, 'high', true, 'public_profile', 9.4),

('LaChandra', 'Burks', 'Chief Operating Officer', 6, 'c-level', 'operations', 18, 'https://linkedin.com/in/lachandraburks', ARRAY['Municipal Operations', 'Public Service', 'Organizational Leadership'], ARRAY['Government Efficiency', 'Public Service Innovation', 'Community Engagement'], ARRAY['Government Operations', 'Public Service Excellence', 'Leadership'], 8.8, 1400, 'high', true, 'public_profile', 8.9),

-- Georgia Economic Development
('Pat', 'Wilson', 'Commissioner', 7, 'c-level', 'executive', 22, 'https://linkedin.com/in/patwilson-ga', ARRAY['Economic Development', 'Business Attraction', 'International Trade'], ARRAY['Innovation Economy', 'Rural Development', 'International Business'], ARRAY['Economic Development Strategy', 'Business Attraction', 'Innovation Economy'], 9.3, 2400, 'high', true, 'public_profile', 9.1),

-- Calendly
('Tope', 'Awotona', 'Founder and CEO', 8, 'c-level', 'executive', 12, 'https://linkedin.com/in/topeawotona', ARRAY['SaaS Strategy', 'Product Development', 'Entrepreneurship'], ARRAY['Scheduling Technology', 'Productivity Tools', 'Startup Growth'], ARRAY['SaaS Entrepreneurship', 'Product Strategy', 'Scaling Startups'], 8.2, 1300, 'high', true, 'public_profile', 8.4),

-- Professional Services
('Robert', 'Hays', 'Chairman', 10, 'c-level', 'executive', 30, 'https://linkedin.com/in/roberthays', ARRAY['Corporate Law', 'International Business', 'Legal Strategy'], ARRAY['Global Legal Services', 'Corporate Governance', 'International Law'], ARRAY['Legal Innovation', 'Global Business Law', 'Corporate Strategy'], 9.0, 2000, 'medium', true, 'public_profile', 8.9),

('Kristen', 'Weirich', 'Managing Principal', 11, 'c-level', 'consulting', 22, 'https://linkedin.com/in/kristenweirich', ARRAY['Management Consulting', 'Digital Transformation', 'Technology Strategy'], ARRAY['Digital Innovation', 'Change Management', 'Strategic Planning'], ARRAY['Digital Transformation', 'Consulting Excellence', 'Technology Strategy'], 8.7, 1800, 'high', true, 'public_profile', 8.8),

-- Technology Association of Georgia
('Debbie', 'Turner', 'President and CEO', 12, 'c-level', 'executive', 20, 'https://linkedin.com/in/debbieturner-tag', ARRAY['Technology Industry', 'Association Management', 'Policy Advocacy'], ARRAY['Innovation Ecosystem', 'Technology Policy', 'Industry Development'], ARRAY['Technology Industry Growth', 'Innovation Policy', 'Industry Leadership'], 8.9, 2200, 'high', true, 'public_profile', 9.0),

-- Metro Atlanta Chamber
('Katie', 'Kirkpatrick', 'President and CEO', 13, 'c-level', 'executive', 25, 'https://linkedin.com/in/katiekirkpatrick', ARRAY['Economic Development', 'Business Advocacy', 'Regional Planning'], ARRAY['Regional Growth', 'Transportation', 'Business Development'], ARRAY['Regional Economic Development', 'Business Leadership', 'Transportation Policy'], 9.1, 2600, 'high', true, 'public_profile', 9.2),

-- Mid-level professionals and key connectors
('Sarah', 'Chen', 'Director of Strategic Partnerships', 4, 'senior', 'strategy', 12, 'https://linkedin.com/in/sarahchen-partnerships', ARRAY['Strategic Partnerships', 'Business Development', 'SaaS Growth'], ARRAY['Partnership Strategy', 'Technology Integration', 'Market Expansion'], ARRAY['Strategic Partnerships', 'SaaS Business Development'], 7.5, 850, 'high', true, 'public_profile', 8.2),

('Marcus', 'Johnson', 'Senior Director, Innovation', 7, 'senior', 'strategy', 15, 'https://linkedin.com/in/marcusjohnson-innovation', ARRAY['Innovation Management', 'Economic Development', 'Technology Strategy'], ARRAY['Startup Ecosystem', 'Innovation Policy', 'Technology Transfer'], ARRAY['Innovation Ecosystem Development', 'Technology Policy'], 7.8, 1100, 'high', true, 'public_profile', 8.3),

('Lisa', 'Rodriguez', 'VP Business Development', 12, 'senior', 'business_development', 14, 'https://linkedin.com/in/lisarodriguez-bd', ARRAY['Business Development', 'Technology Sales', 'Partnership Management'], ARRAY['Technology Partnerships', 'Industry Growth', 'Professional Development'], ARRAY['Technology Business Development', 'Industry Partnerships'], 7.6, 950, 'high', true, 'public_profile', 8.1),

('David', 'Kim', 'Chief Technology Officer', 9, 'c-level', 'technology', 18, 'https://linkedin.com/in/davidkim-cto', ARRAY['Financial Technology', 'Software Development', 'Technology Strategy'], ARRAY['Fintech Innovation', 'API Development', 'Startup Technology'], ARRAY['Fintech Technology Strategy', 'API Design', 'Startup CTOs'], 7.9, 1200, 'medium', true, 'public_profile', 8.0),

('Jennifer', 'Walsh', 'Director of Economic Development', 6, 'senior', 'economic_development', 13, 'https://linkedin.com/in/jenniferwalsh-econ', ARRAY['Urban Planning', 'Economic Development', 'Public-Private Partnerships'], ARRAY['Smart Cities', 'Innovation Districts', 'Urban Development'], ARRAY['Economic Development Strategy', 'Smart City Planning'], 7.7, 890, 'medium', true, 'public_profile', 8.2);

-- Professional Relationships (key connections in the Atlanta business ecosystem)
INSERT INTO atlanta_relationships (person_a_id, person_b_id, relationship_type, relationship_strength, connection_context, relationship_start_date, last_interaction_date, interaction_frequency, business_relevance_score, shared_interests, mutual_connections_count, confidence_level, data_sources) VALUES

-- C-level connections - major corporate leaders
(1, 4, 'peer', 'strong', 'Atlanta CEO Council and major corporate events', '2020-01-15', '2024-01-15', 'regular', 9.2, ARRAY['Corporate Leadership', 'Atlanta Business Community'], 45, 8.5, '{"linkedin": true, "events": ["Atlanta CEO Summit 2023", "Metro Atlanta Chamber Annual"]}'),

(1, 11, 'peer', 'medium', 'Regional business leadership forums', '2019-06-20', '2023-10-12', 'occasional', 8.1, ARRAY['Regional Development', 'Corporate Strategy'], 32, 7.8, '{"events": ["Regional Leadership Forum"], "mutual_connections": 32}'),

(4, 8, 'peer', 'strong', 'Aviation industry collaboration and corporate partnerships', '2018-11-03', '2024-02-20', 'regular', 9.5, ARRAY['Transportation', 'Corporate Operations', 'Customer Experience'], 58, 9.0, '{"business_partnerships": true, "industry_events": true}'),

-- Government-Business connections
(11, 17, 'partner', 'strong', 'Economic development initiatives and Atlanta business attraction', '2021-03-10', '2024-03-01', 'frequent', 9.8, ARRAY['Economic Development', 'Business Attraction', 'Regional Growth'], 67, 9.2, '{"government_partnerships": true, "economic_development": true}'),

(11, 19, 'partner', 'strong', 'Regional economic development and transportation planning', '2020-08-15', '2024-02-28', 'frequent', 9.6, ARRAY['Regional Planning', 'Transportation', 'Economic Growth'], 71, 9.1, '{"metro_atlanta_chamber": true, "regional_planning": true}'),

(17, 12, 'partner', 'medium', 'State and local government economic development coordination', '2022-01-20', '2023-12-15', 'regular', 8.9, ARRAY['Economic Development', 'Government Relations'], 28, 8.3, '{"government_coordination": true, "economic_development": true}'),

-- Technology industry connections
(15, 16, 'peer', 'strong', 'Atlanta technology industry leadership and TAG events', '2019-05-12', '2024-01-20', 'frequent', 9.4, ARRAY['Technology Industry', 'Innovation Ecosystem', 'Professional Development'], 89, 9.3, '{"tag_events": true, "tech_industry": true, "innovation_forums": true}'),

(9, 16, 'peer', 'medium', 'SaaS industry events and technology networking', '2020-09-08', '2023-11-14', 'occasional', 8.2, ARRAY['SaaS Strategy', 'Technology Leadership'], 34, 7.9, '{"saas_events": true, "technology_networking": true}'),

(13, 16, 'colleague', 'strong', 'Startup ecosystem and technology association collaboration', '2021-02-14', '2024-03-05', 'regular', 8.8, ARRAY['Startup Ecosystem', 'Technology Innovation', 'Entrepreneurship'], 42, 8.6, '{"startup_events": true, "tag_collaboration": true}'),

-- Professional services and corporate connections
(14, 1, 'client', 'medium', 'Legal services for corporate matters', '2020-11-22', '2023-09-18', 'occasional', 8.7, ARRAY['Corporate Law', 'Business Strategy'], 23, 8.1, '{"legal_services": true, "corporate_client": true}'),

(15, 4, 'client', 'strong', 'Management consulting and digital transformation projects', '2021-04-17', '2024-01-30', 'regular', 9.1, ARRAY['Digital Transformation', 'Technology Strategy', 'Business Process'], 36, 8.9, '{"consulting_engagement": true, "digital_transformation": true}'),

(15, 8, 'client', 'medium', 'Aviation industry consulting and operational efficiency', '2022-06-08', '2023-12-20', 'occasional', 8.4, ARRAY['Operations Consulting', 'Industry Expertise'], 19, 8.0, '{"industry_consulting": true, "operations": true}'),

-- Strategic partnership connections
(18, 12, 'partner', 'strong', 'Economic development partnerships and business attraction', '2021-07-11', '2024-02-15', 'frequent', 9.3, ARRAY['Economic Development', 'Partnership Strategy', 'Business Growth'], 52, 8.8, '{"economic_partnerships": true, "business_development": true}'),

(18, 17, 'partner', 'medium', 'State and local economic development alignment', '2022-03-25', '2023-11-28', 'regular', 8.6, ARRAY['Economic Development', 'Government Relations'], 31, 8.2, '{"government_alignment": true, "economic_development": true}'),

-- Tech startup and corporate innovation connections
(21, 9, 'peer', 'medium', 'SaaS industry networking and best practices sharing', '2022-01-30', '2023-10-22', 'occasional', 7.8, ARRAY['SaaS Strategy', 'Product Development', 'Startup Growth'], 28, 7.6, '{"saas_networking": true, "startup_community": true}'),

(21, 13, 'mentor', 'strong', 'Fintech mentorship and startup ecosystem engagement', '2021-09-12', '2024-01-18', 'regular', 8.7, ARRAY['Fintech', 'Entrepreneurship', 'Startup Strategy'], 33, 8.4, '{"mentorship": true, "fintech_community": true}'),

-- Cross-sector collaboration connections
(20, 16, 'colleague', 'medium', 'Technology policy and innovation ecosystem development', '2020-12-05', '2023-08-17', 'occasional', 8.1, ARRAY['Innovation Policy', 'Technology Development', 'Economic Development'], 26, 7.9, '{"innovation_policy": true, "technology_development": true}'),

(22, 17, 'partner', 'strong', 'Atlanta economic development and urban planning coordination', '2021-11-18', '2024-02-22', 'frequent', 9.0, ARRAY['Urban Development', 'Economic Planning', 'City Development'], 41, 8.7, '{"city_planning": true, "economic_development": true}');

-- Atlanta Events (networking events, conferences, and business gatherings)
INSERT INTO atlanta_events (name, event_type, description, start_date, end_date, venue_name, venue_address, venue_latitude, venue_longitude, expected_attendance_range, target_audience, ticket_price_range, industry_focus, networking_potential, business_value_rating, organizer_organization_id, sponsor_organization_ids, registration_url, event_website, social_media_hashtags) VALUES

('Atlanta Tech Summit 2024', 'conference', 'Premier technology conference for the Southeast region', '2024-05-15 09:00:00', '2024-05-16 17:00:00', 'Georgia World Congress Center', '285 Andrew Young International Blvd NW', 33.7615, -84.3962, '501+', ARRAY['Technology Executives', 'Software Developers', 'Startup Founders'], '201-500', ARRAY['Software', 'AI/ML', 'SaaS', 'Fintech'], 'exceptional', 9.2, 12, ARRAY[4, 5, 8], 'https://atlantatechsummit.com/register', 'https://atlantatechsummit.com', ARRAY['#AtlantaTech2024', '#TechSummit', '#AtlantaInnovation']),

('Metro Atlanta Chamber Annual Meeting', 'conference', 'Annual business community gathering and economic outlook', '2024-04-10 08:00:00', '2024-04-10 15:00:00', 'Omni Hotel at CNN Center', '100 CNN Center', 33.7580, -84.3963, '501+', ARRAY['Business Leaders', 'Corporate Executives', 'Economic Development'], '51-200', ARRAY['Economic Development', 'Business Advocacy', 'Regional Planning'], 'exceptional', 9.5, 13, ARRAY[1, 2, 3], 'https://metroatlantachamber.com/annual', 'https://metroatlantachamber.com', ARRAY['#MAChamber2024', '#AtlantaBusiness', '#EconomicOutlook']),

('Atlanta Fintech Meetup', 'meetup', 'Monthly gathering of fintech professionals and investors', '2024-03-20 18:30:00', '2024-03-20 21:00:00', 'Gather Coworking', '1000 Marietta St NW', 33.7771, -84.4077, '51-100', ARRAY['Fintech Professionals', 'Investors', 'Entrepreneurs'], 'free', ARRAY['Financial Technology', 'Investment', 'Startups'], 'high', 8.1, NULL, ARRAY[9], 'https://meetup.com/atlanta-fintech', NULL, ARRAY['#AtlantaFintech', '#FintechMeetup']),

('Georgia Innovation Summit', 'conference', 'Statewide innovation and entrepreneurship conference', '2024-06-12 09:00:00', '2024-06-13 16:00:00', 'Atlanta Convention Center at AmericasMart', '240 Peachtree St NW', 33.7630, -84.3902, '501+', ARRAY['Entrepreneurs', 'Investors', 'Innovation Leaders'], '101-500', ARRAY['Innovation', 'Startups', 'Technology Transfer'], 'exceptional', 9.0, 7, ARRAY[12, 13, 8], 'https://georgia.org/innovation-summit', 'https://georgiainnnovationsummit.com', ARRAY['#GAInnovation2024', '#InnovationSummit', '#GeorgiaStartups']),

('Atlanta CEO Roundtable', 'networking', 'Quarterly executive leadership forum', '2024-04-25 07:30:00', '2024-04-25 09:30:00', 'Capital City Club', '7 Harris St NW', 33.7557, -84.3915, '26-50', ARRAY['CEOs', 'C-level Executives', 'Board Members'], '201-500', ARRAY['Executive Leadership', 'Corporate Strategy', 'Business Development'], 'exceptional', 9.8, NULL, ARRAY[1, 2, 3, 10], NULL, NULL, ARRAY['#AtlantaCEO', '#ExecutiveLeadership']),

('Digital Marketing Atlanta', 'seminar', 'Professional development for digital marketing professionals', '2024-03-28 14:00:00', '2024-03-28 17:00:00', 'Ponce City Market', '675 Ponce de Leon Ave NE', 33.7701, -84.3658, '101-500', ARRAY['Marketing Professionals', 'Digital Marketers', 'CMOs'], '51-200', ARRAY['Digital Marketing', 'Marketing Technology', 'Brand Strategy'], 'medium', 7.5, 4, ARRAY[4], 'https://digitalmarketingatl.com', NULL, ARRAY['#DigitalMarketingATL', '#MarketingTech']),

('Atlanta Smart Cities Forum', 'panel', 'Urban innovation and smart city technology discussion', '2024-05-08 16:00:00', '2024-05-08 19:00:00', 'Atlanta Tech Village', '3423 Piedmont Rd NE', 33.8470, -84.3698, '101-500', ARRAY['Government Officials', 'Urban Planners', 'Technology Companies'], '1-50', ARRAY['Smart Cities', 'Urban Technology', 'Government Innovation'], 'high', 8.3, 6, ARRAY[6, 7, 12], 'https://atlantasmartcities.org', NULL, ARRAY['#SmartCitiesATL', '#UrbanInnovation']),

('TAG Professional Development Series', 'workshop', 'Monthly professional development workshops for tech professionals', '2024-04-17 18:00:00', '2024-04-17 20:00:00', 'TAG Building', '87 Walton St NW', 33.7557, -84.3924, '51-100', ARRAY['Technology Professionals', 'Software Developers', 'IT Managers'], 'free', ARRAY['Technology', 'Professional Development', 'Career Growth'], 'medium', 7.2, 12, ARRAY[12], 'https://tag.org/events', 'https://tag.org', ARRAY['#TAGProfDev', '#TechCareer']),

('Atlanta Venture Capital Breakfast', 'networking', 'Monthly networking for investors and entrepreneurs', '2024-04-05 08:00:00', '2024-04-05 10:00:00', 'Four Seasons Hotel Atlanta', '75 14th St NE', 33.7863, -84.3831, '26-50', ARRAY['Venture Capitalists', 'Angel Investors', 'Startup Founders'], '26-50', ARRAY['Venture Capital', 'Investment', 'Startups'], 'high', 8.7, NULL, ARRAY[8, 9], NULL, NULL, ARRAY['#AtlantaVC', '#StartupFunding']);

-- Sample Event Attendance (showing networking patterns)
INSERT INTO atlanta_event_attendance (event_id, person_id, organization_id, attendance_type, session_topics, new_connections_made, business_cards_exchanged, follow_up_meetings_scheduled, attendance_verified, verification_source) VALUES

-- Atlanta Tech Summit 2024 attendance
(1, 9, 4, 'speaker', ARRAY['SaaS Growth Strategy', 'Email Marketing Innovation'], 15, 25, 8, true, 'registration_list'),
(1, 13, 8, 'speaker', ARRAY['Scheduling Automation', 'Productivity Technology'], 12, 18, 6, true, 'registration_list'),
(1, 16, 12, 'attendee', NULL, 8, 12, 3, true, 'registration_list'),
(1, 18, 4, 'attendee', NULL, 6, 10, 2, true, 'registration_list'),
(1, 21, 9, 'attendee', NULL, 10, 15, 4, true, 'registration_list'),

-- Metro Atlanta Chamber Annual Meeting
(2, 1, 1, 'speaker', ARRAY['Corporate Leadership in Crisis', 'Sustainable Business Growth'], 20, 35, 12, true, 'registration_list'),
(2, 4, 2, 'attendee', NULL, 18, 22, 9, true, 'registration_list'),
(2, 5, 3, 'attendee', NULL, 15, 20, 7, true, 'registration_list'),
(2, 11, 6, 'speaker', ARRAY['Atlanta Economic Development', 'Smart City Initiatives'], 25, 40, 15, true, 'registration_list'),
(2, 19, 13, 'organizer', NULL, 30, 50, 20, true, 'registration_list'),
(2, 14, 10, 'attendee', NULL, 12, 16, 5, true, 'registration_list'),

-- Atlanta Fintech Meetup
(3, 21, 9, 'speaker', ARRAY['Fintech Innovation', 'Investment Management Technology'], 8, 12, 4, true, 'manual_confirmation'),
(3, 20, 7, 'attendee', NULL, 6, 8, 2, true, 'social_media'),
(3, 18, 4, 'attendee', NULL, 5, 7, 3, true, 'social_media'),

-- Georgia Innovation Summit
(4, 12, 7, 'speaker', ARRAY['Innovation Economy', 'State Economic Development'], 22, 30, 14, true, 'registration_list'),
(4, 13, 8, 'attendee', NULL, 14, 18, 8, true, 'registration_list'),
(4, 16, 12, 'speaker', ARRAY['Technology Innovation Ecosystem', 'Industry Development'], 28, 35, 16, true, 'registration_list'),
(4, 19, 13, 'attendee', NULL, 20, 25, 12, true, 'registration_list'),

-- Atlanta CEO Roundtable (exclusive executive gathering)
(5, 1, 1, 'attendee', NULL, 8, 8, 6, true, 'registration_list'),
(5, 4, 2, 'attendee', NULL, 7, 7, 5, true, 'registration_list'),
(5, 5, 3, 'attendee', NULL, 6, 6, 4, true, 'registration_list'),
(5, 9, 4, 'attendee', NULL, 9, 9, 7, true, 'registration_list'),
(5, 11, 6, 'attendee', NULL, 10, 10, 8, true, 'registration_list');

-- Sample Atlanta Opportunities (business opportunities in the metro area)
INSERT INTO atlanta_opportunities (title, description, source_organization_id, opportunity_type, estimated_value_min, estimated_value_max, timeline_months, required_capabilities, preferred_qualifications, geographic_requirements, primary_contact_person_id, decision_makers_person_ids, competitive_landscape, success_factors, relationship_advantages, submission_deadline, decision_timeline, current_status) VALUES

('Atlanta Smart City Infrastructure Partnership', 'Public-private partnership for smart city technology implementation across Atlanta metro', 6, 'partnership', 50000000.00, 150000000.00, 36, ARRAY['IoT Implementation', 'Data Analytics', 'Urban Technology', 'System Integration'], ARRAY['Smart City Experience', 'Government Contracting', 'Large-scale Implementation'], ARRAY['Atlanta Metro Area', 'Fulton County', 'DeKalb County'], 11, ARRAY[11, 22], 'Major technology consulting firms, established government contractors', ARRAY['Proven Government Experience', 'Local Partnerships', 'Technical Innovation'], ARRAY['City of Atlanta relationships', 'Mayor office connections', 'Local business community support'], '2024-06-15 17:00:00', '2024-09-30 17:00:00', 'open'),

('Delta Air Lines Digital Transformation Initiative', 'Enterprise-wide digital transformation and customer experience enhancement', 2, 'contract', 25000000.00, 75000000.00, 24, ARRAY['Digital Transformation', 'Customer Experience', 'Aviation Technology', 'Enterprise Software'], ARRAY['Aviation Industry Experience', 'Large Enterprise Projects', 'Customer Experience Design'], ARRAY['Atlanta', 'Global Implementation'], 4, ARRAY[4, 5], 'Accenture, IBM, McKinsey, other major consulting firms', ARRAY['Aviation Industry Knowledge', 'Proven Implementation Track Record', 'Innovation Capability'], ARRAY['Delta executive relationships', 'Aviation industry connections', 'Atlanta business community ties'], '2024-05-01 17:00:00', '2024-08-15 17:00:00', 'open'),

('Home Depot Supply Chain Optimization', 'AI-driven supply chain optimization and predictive analytics implementation', 3, 'contract', 15000000.00, 40000000.00, 18, ARRAY['Supply Chain Management', 'AI/ML', 'Predictive Analytics', 'Retail Technology'], ARRAY['Retail Industry Experience', 'Supply Chain Expertise', 'AI Implementation'], ARRAY['Atlanta Headquarters', 'North American Operations'], 5, ARRAY[5], 'Deloitte, PwC, supply chain specialists', ARRAY['Retail Industry Expertise', 'AI/ML Capabilities', 'Implementation Track Record'], ARRAY['Home Depot executive access', 'Retail industry connections', 'Atlanta corporate community'], '2024-04-20 17:00:00', '2024-07-30 17:00:00', 'open'),

('Technology Association of Georgia Innovation Hub', 'Development of innovation hub and startup incubator facilities', 12, 'collaboration', 5000000.00, 12000000.00, 12, ARRAY['Real Estate Development', 'Innovation Hub Design', 'Startup Ecosystem', 'Community Building'], ARRAY['Innovation Hub Experience', 'Startup Ecosystem Knowledge', 'Community Engagement'], ARRAY['Atlanta Metro'], 16, ARRAY[16], 'Real estate developers, innovation consultants', ARRAY['Innovation Ecosystem Understanding', 'Community Connections', 'Proven Track Record'], ARRAY['TAG leadership relationships', 'Atlanta tech community connections', 'Startup ecosystem engagement'], '2024-07-01 17:00:00', '2024-10-15 17:00:00', 'open'),

('Mailchimp Enterprise Partnership Program', 'Strategic partnership program for enterprise marketing technology integration', 4, 'partnership', 2000000.00, 8000000.00, 12, ARRAY['Marketing Technology', 'API Integration', 'Enterprise Sales', 'Partnership Management'], ARRAY['SaaS Partnership Experience', 'Enterprise Market Knowledge', 'Marketing Technology Expertise'], ARRAY['Atlanta', 'Southeast Region'], 9, ARRAY[9, 18], 'HubSpot, Salesforce, other MarTech platforms', ARRAY['SaaS Partnership Experience', 'Enterprise Relationships', 'Technical Integration Capabilities'], ARRAY['Mailchimp leadership connections', 'Atlanta SaaS community', 'Technology partnership ecosystem'], '2024-08-15 17:00:00', '2024-11-30 17:00:00', 'open');

-- Sample Relationship Intelligence Insights
INSERT INTO atlanta_relationship_insights (target_type, target_id, insight_type, insight_title, insight_description, relevance_score, confidence_level, actionability_score, supporting_evidence, recommended_actions, generated_by, expires_at) VALUES

('opportunity', 1, 'connection_path', 'Strong Connection Path to Atlanta Smart City Decision Makers', 'Direct connection path exists to Mayor Andre Dickens through Metro Atlanta Chamber CEO Katie Kirkpatrick, providing high-value introduction opportunity for Smart City partnership.', 9.2, 8.8, 9.0, '{"direct_connections": [{"from": "Katie Kirkpatrick", "to": "Andre Dickens", "relationship_strength": "strong", "context": "Atlanta economic development and urban planning coordination"}], "shared_events": ["Metro Atlanta Chamber Annual Meeting"], "mutual_interests": ["Economic Development", "Urban Innovation"]}', ARRAY['Schedule introduction meeting through Katie Kirkpatrick', 'Attend upcoming Metro Atlanta Chamber events', 'Prepare smart city portfolio highlighting Atlanta-relevant case studies'], 'graph_analysis', '2024-12-31 23:59:59'),

('person', 1, 'influence_analysis', 'James Quincey: Key Atlanta Business Community Influencer', 'James Quincey (Coca-Cola CEO) has exceptional influence in Atlanta business community with strong connections to other major CEOs and government leaders, making him a strategic relationship for major initiatives.', 9.5, 9.2, 8.7, '{"influence_score": 9.8, "connection_count": 2500, "c_level_connections": 12, "government_connections": 4, "event_speaking": 8}', ARRAY['Target for speaking engagement invitations', 'Include in high-level Atlanta business initiatives', 'Leverage for introductions to other Atlanta executives'], 'ml_model', '2024-06-30 23:59:59'),

('organization', 4, 'opportunity_match', 'Mailchimp Partnership Opportunity Alignment', 'Strong alignment exists between your SaaS partnership capabilities and Mailchimp\'s enterprise partnership program, with existing connections to decision makers.', 8.6, 8.3, 8.9, '{"capability_match_score": 8.8, "decision_maker_connections": 2, "industry_alignment": "high", "geographic_advantage": "local"}', ARRAY['Reach out to Rania Succar through mutual connections', 'Prepare SaaS partnership case studies', 'Attend Mailchimp corporate events', 'Connect with Sarah Chen for partnership discussions'], 'opportunity_matching', '2024-05-15 23:59:59'),

('event', 1, 'event_recommendation', 'High-ROI Networking Opportunity: Atlanta Tech Summit 2024', 'Atlanta Tech Summit provides exceptional networking ROI with 15+ target prospects attending, including key decision makers from Mailchimp, Calendly, and other target organizations.', 9.2, 8.9, 9.4, '{"target_prospects_attending": 15, "decision_makers": 6, "estimated_meetings": 12, "networking_potential": "exceptional", "industry_alignment": 95}', ARRAY['Register as attendee immediately', 'Schedule pre-event meetings with key attendees', 'Prepare targeted materials for SaaS prospects', 'Book speaking slot if still available'], 'event_analysis', '2024-04-15 23:59:59'),

('network_cluster', NULL, 'network_cluster', 'Atlanta SaaS Leadership Cluster Identified', 'Identified tight-knit cluster of Atlanta SaaS leaders including Mailchimp, Calendly, and TAG leadership with frequent interaction patterns and shared events.', 8.7, 8.4, 8.1, '{"cluster_members": 8, "interaction_frequency": "high", "shared_events": 12, "business_synergy": "strong"}', ARRAY['Focus networking efforts on this cluster', 'Attend SaaS-focused Atlanta events', 'Build relationships with cluster connectors', 'Position as valuable addition to this community'], 'network_analysis', '2024-08-31 23:59:59');