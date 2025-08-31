-- Enhanced Supplier Seeding Script
-- Contains 20 real companies for manufacturing demo environment
-- All demo accounts use @test.com email domain

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert test users for all 20 companies
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous)
VALUES
    -- 1. Shyft (MyShyft)
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'demo_shyft@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 2. ClickMaint
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'demo_clickmaint@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 3. Lincoln CNC Service
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'demo_lincolncnc@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 4. Bastian Solutions
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'demo_bastiansolutions@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 5. BDI
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'demo_bdi@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 6. Hull's Environmental Services
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'demo_hullsenvironmental@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 7. JETT (Atlanta IT Support)
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'demo_jett@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 8. ABM Industrial (Atlanta branch)
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'demo_abm@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 9. IMI Industrial Services
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'demo_imiindustrial@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 10. Process Equipment & Controls
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'demo_processequipment@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 11. Sack Company (MEP)
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'demo_sackcompany@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 12. JDI Industrial Services (Gainesville)
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'demo_jdiindustrial@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 13. NABCO Industrial Supply
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'demo_nabcoindustrial@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 14. Kloeckner Metals
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'demo_kloecknermetals@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 15. Maverick Technologies
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000015', 'authenticated', 'authenticated', 'demo_mavericktechnologies@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 16. C.R. Meyer
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000016', 'authenticated', 'authenticated', 'demo_crmeyer@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 17. Craft Electric
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000017', 'authenticated', 'authenticated', 'demo_craftelectric@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 18. Zep Inc.
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000018', 'authenticated', 'authenticated', 'demo_zep@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 19. Goldens' Foundry
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000019', 'authenticated', 'authenticated', 'demo_goldensfoundry@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE),
    
    -- 20. ScienceSoft USA
    ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000020', 'authenticated', 'authenticated', 'demo_sciencesoft@test.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, now(), '{}'::jsonb, '{}'::jsonb, FALSE, now(), now(), NULL, NULL, '', '', NULL, NULL, '', NULL, FALSE, NULL, FALSE)

ON CONFLICT (id) DO NOTHING;

-- Insert comprehensive supplier profiles
INSERT INTO public.suppliers (id, user_id, company_name, city, state, company_size, homepage_url, linkedin_url, industry, description, contact_email, contact_phone, services_offered, years_in_business, geographic_coverage, certifications, status, created_at, updated_at)
VALUES
    -- 1. Shyft (MyShyft)
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Shyft (MyShyft)', 'Atlanta', 'GA', '50_99', 'https://myshyft.com', 'https://linkedin.com/company/myshyft', 'Software / AI', 'AI-powered automation platform specializing in predictive maintenance and machine learning solutions for industrial operations. Our platform reduces downtime by 40% and maintenance costs by 25% through intelligent data analysis and predictive insights.', 'demo_shyft@test.com', '404-555-0101', ARRAY['Predictive Maintenance', 'AI/ML Solutions', 'Industrial Automation', 'Data Analytics', 'IoT Integration'], 8, ARRAY['North America', 'Europe'], ARRAY['ISO 27001', 'SOC 2 Type II', 'GDPR Compliant'], 'active', now(), now()),
    
    -- 2. ClickMaint
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'ClickMaint', 'Tampa', 'FL', '10_49', 'https://clickmaint.com', 'https://linkedin.com/company/clickmaint', 'Software', 'Cloud-based CMMS (Computerized Maintenance Management System) designed for manufacturing facilities. Streamlines preventive and predictive maintenance workflows with mobile-first design and real-time reporting capabilities.', 'demo_clickmaint@test.com', '813-555-0102', ARRAY['CMMS Software', 'Preventive Maintenance', 'Mobile Apps', 'Reporting & Analytics', 'Work Order Management'], 6, ARRAY['North America'], ARRAY['ISO 9001', 'Cloud Security Alliance'], 'active', now(), now()),
    
    -- 3. Lincoln CNC Service
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Lincoln CNC Service', 'Lincoln', 'NE', '10_49', 'https://thomasnet.com/provider/lincoln-cnc-service', 'https://linkedin.com/company/lincoln-cnc-service', 'Maintenance', 'Specialized CNC machine maintenance and repair services. Expert technicians provide outsourced predictive and preventive maintenance for precision manufacturing equipment, reducing machine downtime and extending equipment life.', 'demo_lincolncnc@test.com', '402-555-0103', ARRAY['CNC Maintenance', 'Machine Repair', 'Predictive Maintenance', 'Emergency Service', 'Equipment Optimization'], 15, ARRAY['Midwest', 'Central US'], ARRAY['NIMS Certified', 'OSHA 30'], 'active', now(), now()),
    
    -- 4. Bastian Solutions
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Bastian Solutions', 'Indianapolis', 'IN', '500_999', 'https://bastiansolutions.com', 'https://linkedin.com/company/bastian-solutions', 'Maintenance/Logistics', 'Leading provider of automated material handling systems maintenance and repair. Specializes in AGVs, conveyor systems, palletizers, and robotics for distribution and manufacturing facilities with 24/7 support capabilities.', 'demo_bastiansolutions@test.com', '317-555-0104', ARRAY['Automation Maintenance', 'AGV Service', 'Conveyor Repair', 'Robotics Support', 'System Integration', '24/7 Emergency Service'], 25, ARRAY['North America'], ARRAY['ISO 9001', 'CSIA Certified', 'UL Listed'], 'active', now(), now()),
    
    -- 5. BDI
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'BDI', 'Houston', 'TX', '100_249', 'https://bdi-bearing.com', 'https://linkedin.com/company/bdi-bearing', 'Maintenance', 'Industrial component repair specialists focusing on bearings, pumps, motors, and rotating equipment. Provides comprehensive rebuild services, field repair, and emergency support for critical manufacturing equipment.', 'demo_bdi@test.com', '713-555-0105', ARRAY['Bearing Repair', 'Pump Rebuilding', 'Motor Service', 'Rotating Equipment', 'Field Service', 'Emergency Repair'], 20, ARRAY['South Central US', 'Gulf Coast'], ARRAY['API Certified', 'ISO 9001', 'EASA Member'], 'active', now(), now()),
    
    -- 6. Hull's Environmental Services
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'Hull''s Environmental Services', 'Atlanta', 'GA', '50_99', 'https://hullsenvironmental.com', 'https://linkedin.com/company/hulls-environmental', 'Maintenance', '24/7 pipeline and environmental maintenance services for food processing and manufacturing facilities. Specializes in emergency response, environmental compliance, and facility maintenance with rapid response capabilities.', 'demo_hullsenvironmental@test.com', '404-555-0106', ARRAY['Pipeline Maintenance', 'Environmental Services', 'Emergency Response', 'Facility Maintenance', '24/7 Service', 'Compliance Support'], 18, ARRAY['Southeast US'], ARRAY['EPA Certified', 'OSHA Compliant', 'ISO 14001'], 'active', now(), now()),
    
    -- 7. JETT (Atlanta IT Support)
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'JETT (Atlanta IT Support)', 'Atlanta', 'GA', '10_49', 'https://jettbt.com', 'https://linkedin.com/company/jett-business-technology', 'IT Services', 'Managed IT services provider specializing in manufacturing environments. Offers comprehensive patch management, 24/7 monitoring, automation solutions, and endpoint detection and response (EDR) for industrial networks.', 'demo_jett@test.com', '404-555-0107', ARRAY['Managed IT Services', 'Network Monitoring', 'Cybersecurity', 'Patch Management', 'Industrial IT', 'EDR Solutions'], 12, ARRAY['Southeast US'], ARRAY['SOC 2 Type II', 'CISSP Certified', 'Microsoft Partner'], 'active', now(), now()),
    
    -- 8. ABM Industrial (Atlanta branch)
    ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'ABM Industrial (Atlanta branch)', 'Atlanta', 'GA', '1000_plus', 'https://abm.com', 'https://linkedin.com/company/abm', 'Maintenance', 'Comprehensive industrial and facility maintenance services including energy management, production support, and facility operations. Large-scale maintenance contractor with expertise in manufacturing environments and energy optimization.', 'demo_abm@test.com', '404-555-0108', ARRAY['Facility Maintenance', 'Energy Management', 'Production Support', 'HVAC Services', 'Electrical Maintenance', 'Janitorial Services'], 110, ARRAY['Global'], ARRAY['ISO 9001', 'ISO 14001', 'OHSAS 18001'], 'active', now(), now()),
    
    -- 9. IMI Industrial Services
    ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 'IMI Industrial Services', 'Birmingham', 'AL', '100_249', 'https://imiindustrialservices.com', 'https://linkedin.com/company/imi-industrial-services', 'Maintenance', 'Full-suite industrial contracting services including precision machining, fabrication, and comprehensive field services. Specializes in custom manufacturing solutions and on-site industrial maintenance for heavy industry.', 'demo_imiindustrial@test.com', '205-555-0109', ARRAY['Industrial Contracting', 'Precision Machining', 'Fabrication Services', 'Field Services', 'Custom Manufacturing', 'Maintenance Support'], 22, ARRAY['Southeast US'], ARRAY['AWS Certified', 'AISC Certified', 'ASME Compliant'], 'active', now(), now()),
    
    -- 10. Process Equipment & Controls
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 'Process Equipment & Controls', 'Nashville', 'TN', '50_99', 'https://processequipmentandcontrols.com', 'https://linkedin.com/company/process-equipment-controls', 'Maintenance', 'Specialized millwright, rigging, and electrical controls services for manufacturing facilities. Expert installation and preventative maintenance of industrial equipment with focus on control systems and automation.', 'demo_processequipment@test.com', '615-555-0110', ARRAY['Millwright Services', 'Rigging & Moving', 'Electrical Controls', 'Equipment Installation', 'Preventive Maintenance', 'PLC Programming'], 16, ARRAY['Southeast US', 'South Central US'], ARRAY['NCCER Certified', 'NECA Member', 'OSHA 30'], 'active', now(), now()),
    
    -- 11. Sack Company (MEP)
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'Sack Company (MEP)', 'Atlanta', 'GA', '100_249', 'https://hasack.com', 'https://linkedin.com/company/sack-company', 'Maintenance/A&E', 'Industrial automation and MEP (Mechanical, Electrical, Plumbing) contractor specializing in millwright services, rigging, HVAC systems, piping, and PLC upgrades for manufacturing facilities.', 'demo_sackcompany@test.com', '404-555-0111', ARRAY['Industrial Automation', 'Millwright Services', 'Rigging Services', 'HVAC Systems', 'Process Piping', 'PLC Upgrades'], 35, ARRAY['Southeast US'], ARRAY['NECA Member', 'MCAA Member', 'SMACNA Certified'], 'active', now(), now()),
    
    -- 12. JDI Industrial Services (Gainesville)
    ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000012', 'JDI Industrial Services (Gainesville)', 'Gainesville', 'FL', '50_99', 'https://jdiindustrial.com', 'https://linkedin.com/company/jdi-industrial-services', 'Maintenance', 'Mechanical contracting services specializing in welding, process piping, and electrical systems for manufacturing environments. Provides comprehensive industrial maintenance and construction services.', 'demo_jdiindustrial@test.com', '352-555-0112', ARRAY['Mechanical Contracting', 'Industrial Welding', 'Process Piping', 'Electrical Systems', 'Equipment Installation', 'Maintenance Services'], 14, ARRAY['Florida', 'Southeast US'], ARRAY['AWS Certified', 'ASME Compliant', 'NCCER Accredited'], 'active', now(), now()),
    
    -- 13. NABCO Industrial Supply
    ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000013', 'NABCO Industrial Supply', 'Birmingham', 'AL', '10_49', 'https://nabcoparts.com', 'https://linkedin.com/company/nabco-industrial-supply', 'Parts supplier', 'Industrial fasteners, tools, and equipment supplier serving manufacturing facilities. Comprehensive inventory management and just-in-time delivery solutions for maintenance and production needs.', 'demo_nabcoindustrial@test.com', '205-555-0113', ARRAY['Industrial Fasteners', 'Tool Supply', 'Equipment Sales', 'Inventory Management', 'Just-in-Time Delivery', 'Technical Support'], 28, ARRAY['Southeast US', 'South Central US'], ARRAY['ISO 9001', 'Certified Fastener Specialist'], 'active', now(), now()),
    
    -- 14. Kloeckner Metals
    ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000014', 'Kloeckner Metals', 'Atlanta', 'GA', '1000_plus', 'https://kloecknermetals.com', 'https://linkedin.com/company/kloeckner-metals', 'Materials Supplier', 'Large-scale metal distributor with advanced digital transformation initiatives. Provides comprehensive steel and aluminum products with innovative supply chain solutions and digital ordering platforms.', 'demo_kloecknermetals@test.com', '404-555-0114', ARRAY['Steel Distribution', 'Aluminum Products', 'Metal Processing', 'Supply Chain Solutions', 'Digital Ordering', 'Inventory Management'], 75, ARRAY['Global'], ARRAY['ISO 9001', 'ISO 14001', 'Steel Service Center Institute'], 'active', now(), now()),
    
    -- 15. Maverick Technologies
    ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000015', 'Maverick Technologies', 'Columbia', 'IL', '250_499', 'https://mavtechglobal.com', 'https://linkedin.com/company/maverick-technologies', 'Software/Integration', 'Industrial automation and system integration specialists focusing on MES (Manufacturing Execution Systems) and predictive maintenance solutions. Expert implementation of advanced manufacturing technologies and data analytics.', 'demo_mavericktechnologies@test.com', '618-555-0115', ARRAY['Industrial Automation', 'MES Implementation', 'System Integration', 'Predictive Maintenance', 'Data Analytics', 'SCADA Systems'], 30, ARRAY['North America'], ARRAY['CSIA Certified', 'Rockwell Automation Partner', 'ISO 9001'], 'active', now(), now()),
    
    -- 16. C.R. Meyer
    ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000016', 'C.R. Meyer', 'Oshkosh', 'WI', '100_249', 'https://crmeyer.com', 'https://linkedin.com/company/cr-meyer', 'Maintenance', 'Industrial contracting services specializing in equipment installation, relocation, laser alignment, and precision maintenance. Expert millwright and rigging services for heavy industrial equipment.', 'demo_crmeyer@test.com', '920-555-0116', ARRAY['Equipment Installation', 'Industrial Relocation', 'Laser Alignment', 'Precision Maintenance', 'Millwright Services', 'Heavy Rigging'], 45, ARRAY['Midwest', 'North Central US'], ARRAY['NCCER Certified', 'Crane Operator Certified', 'OSHA Compliant'], 'active', now(), now()),
    
    -- 17. Craft Electric
    ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000017', 'Craft Electric', 'Nashville', 'TN', '50_99', 'https://craftelectric.com', 'https://linkedin.com/company/craft-electric', 'Maintenance', 'Electrical predictive maintenance specialists for industrial and utility systems. Advanced testing and diagnostic services including thermography, vibration analysis, and power quality assessment.', 'demo_craftelectric@test.com', '615-555-0117', ARRAY['Electrical Maintenance', 'Predictive Testing', 'Thermography', 'Vibration Analysis', 'Power Quality', 'Emergency Service'], 25, ARRAY['Southeast US'], ARRAY['NETA Certified', 'IEEE Member', 'NFPA 70E Trained'], 'active', now(), now()),
    
    -- 18. Zep Inc.
    ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000018', 'Zep Inc.', 'Atlanta', 'GA', '1000_plus', 'https://zep.com', 'https://linkedin.com/company/zep-inc', 'Consumables/Training', 'Industrial cleaning and sanitation products manufacturer with comprehensive training programs. Specializes in food & beverage industry solutions, safety training, and regulatory compliance support.', 'demo_zep@test.com', '404-555-0118', ARRAY['Industrial Cleaning Products', 'Sanitation Solutions', 'Safety Training', 'Food Grade Products', 'Regulatory Compliance', 'Custom Formulations'], 95, ARRAY['Global'], ARRAY['FDA Registered', 'NSF Certified', 'ISO 9001'], 'active', now(), now()),
    
    -- 19. Goldens' Foundry
    ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000019', 'Goldens'' Foundry', 'Columbus', 'GA', '100_249', 'https://gfmco.com', 'https://linkedin.com/company/goldens-foundry', 'Parts Supplier', 'ISO-certified iron foundry and precision machining facility specializing in custom castings and lean manufacturing processes. Provides high-quality replacement parts and custom components for industrial applications.', 'demo_goldensfoundry@test.com', '706-555-0119', ARRAY['Iron Casting', 'Precision Machining', 'Custom Components', 'Replacement Parts', 'Lean Manufacturing', 'Quality Control'], 65, ARRAY['Southeast US'], ARRAY['ISO 9001', 'TS 16949', 'Lean Six Sigma'], 'active', now(), now()),
    
    -- 20. ScienceSoft USA
    ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000020', 'ScienceSoft USA', 'McKinney', 'TX', '250_499', 'https://scnsoft.com', 'https://linkedin.com/company/sciencesoft', 'IT/Software', 'Custom software development and 24/7 IT support services for manufacturing environments. Specializes in application maintenance, system integration, and digital transformation solutions for industrial operations.', 'demo_sciencesoft@test.com', '972-555-0120', ARRAY['Custom Software Development', 'Application Maintenance', '24/7 IT Support', 'System Integration', 'Digital Transformation', 'Manufacturing IT'], 33, ARRAY['North America', 'Europe'], ARRAY['ISO 9001', 'ISO 27001', 'Microsoft Gold Partner'], 'active', now(), now())

ON CONFLICT (id) DO NOTHING;

-- Add sample company documents for select suppliers to test document functionality
INSERT INTO public.company_documents (id, supplier_id, document_type, title, description, file_path, file_size, file_type, uploaded_by, is_public, created_at)
VALUES
    -- Documents for Shyft
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'capability_statement', 'Shyft AI Predictive Maintenance Capabilities', 'Comprehensive overview of AI-powered predictive maintenance solutions and success metrics', '/demo/documents/shyft_capabilities.pdf', 2048000, 'application/pdf', '10000000-0000-0000-0000-000000000001', true, now()),
    
    -- Documents for Bastian Solutions  
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 'case_study', 'AGV Implementation - Manufacturing Plant Case Study', 'Detailed case study of automated guided vehicle system implementation reducing material handling costs by 35%', '/demo/documents/bastian_agv_case_study.pdf', 3072000, 'application/pdf', '10000000-0000-0000-0000-000000000004', true, now()),
    
    -- Documents for Kloeckner Metals
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000014', 'certification', 'ISO 9001:2015 Quality Management Certificate', 'Current ISO 9001:2015 quality management system certification', '/demo/documents/kloeckner_iso9001.pdf', 1024000, 'application/pdf', '10000000-0000-0000-0000-000000000014', true, now()),
    
    -- Documents for Maverick Technologies
    ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000015', 'capability_statement', 'MES Integration and Automation Capabilities', 'Manufacturing Execution System integration expertise and automation solutions portfolio', '/demo/documents/maverick_mes_capabilities.pdf', 2560000, 'application/pdf', '10000000-0000-0000-0000-000000000015', true, now()),
    
    -- Documents for Zep Inc.
    ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000018', 'annual_report', 'Zep Inc. 2023 Annual Report', 'Annual report highlighting food safety innovations and global expansion', '/demo/documents/zep_annual_report_2023.pdf', 4096000, 'application/pdf', '10000000-0000-0000-0000-000000000018', true, now())

ON CONFLICT (id) DO NOTHING;

-- Create some affiliate relationships for testing (companies that work together)
-- Note: This assumes there will be an affiliations/relationships table in the future
-- For now, we'll add this as a comment for future implementation

/*
FUTURE AFFILIATE RELATIONSHIPS TO IMPLEMENT:
- Industrial Maintenance Alliance: Lincoln CNC + BDI + Process Equipment & Controls + C.R. Meyer
- Atlanta Industrial Network: Shyft + JETT + ABM + Hull's Environmental + Sack Company
- Technology Integration Partners: Maverick Technologies + ScienceSoft + ClickMaint
- Southeast Manufacturing Suppliers: IMI Industrial + JDI Industrial + NABCO Industrial + Goldens' Foundry
*/

-- Display summary of seeded data
SELECT 
    'Seeding Complete!' as status,
    (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@test.com') as test_users_created,
    (SELECT COUNT(*) FROM public.suppliers WHERE contact_email LIKE '%@test.com') as test_suppliers_created,
    (SELECT COUNT(*) FROM public.company_documents WHERE file_path LIKE '/demo/%') as demo_documents_created;