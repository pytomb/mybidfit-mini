CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous)
VALUES
    ('00000000-0000-0000-0000-000000000000', -- Placeholder UUID for local development. Do not change unless you know your specific instance UUID.
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- User 1 UUID
     'authenticated',
     'authenticated',
     'test@example.com',
     crypt('password123', gen_salt('bf')),
     now(),
     NULL, -- invited_at
     '', -- confirmation_token
     NULL, -- confirmation_sent_at
     '', -- recovery_token
     NULL, -- recovery_sent_at
     '', -- email_change_token_new
     '', -- email_change (THIS IS THE KEY FIX)
     NULL, -- email_change_sent_at
     now(),
     '{}'::jsonb, -- raw_app_meta_data
     '{}'::jsonb, -- raw_user_meta_data
     FALSE, -- is_super_admin
     now(),
     now(),
     NULL, -- phone
     NULL, -- phone_confirmed_at
     '', -- phone_change
     '', -- phone_change_token
     NULL, -- phone_change_sent_at
     NULL, -- banned_until
     '', -- reauthentication_token
     NULL, -- reauthentication_sent_at
     FALSE, -- is_sso_user
     NULL, -- deleted_at
     FALSE -- is_anonymous
    ),
    ('00000000-0000-0000-0000-000000000000',
     'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f', -- User 2 UUID
     'authenticated',
     'authenticated',
     'demo2@example.com',
     crypt('password123', gen_salt('bf')),
     now(),
     NULL,
     '',
     NULL,
     '',
     NULL,
     '',
     '',
     NULL,
     now(),
     '{}'::jsonb,
     '{}'::jsonb,
     FALSE,
     now(),
     now(),
     NULL,
     NULL,
     '',
     '',
     NULL,
     NULL,
     '',
     NULL,
     FALSE,
     NULL,
     FALSE
    ),
    ('00000000-0000-0000-0000-000000000000',
     'e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b', -- User 3 UUID
     'authenticated',
     'authenticated',
     'demo3@example.com',
     crypt('password123', gen_salt('bf')),
     now(),
     NULL,
     '',
     NULL,
     '',
     NULL,
     '',
     '',
     NULL,
     now(),
     '{}'::jsonb,
     '{}'::jsonb,
     FALSE,
     now(),
     now(),
     NULL,
     NULL,
     '',
     '',
     NULL,
     NULL,
     '',
     NULL,
     FALSE,
     NULL,
     FALSE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (id, user_id, company_name, city, state, company_size, homepage_url, linkedin_url, industry, description, contact_email, contact_phone, services_offered, years_in_business, geographic_coverage, certifications, status, created_at, updated_at)
VALUES
    ('b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', -- Supplier 1 UUID
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- User 1 UUID
     'Test Supplier Co.',
     'Anytown',
     'CA',
     '10_49',
     'https://www.testsupplier.com',
     'https://www.linkedin.com/company/test-supplier-co',
     'Software',
     'A test supplier company for development purposes.',
     'contact@testsupplier.com',
     '555-123-4567',
     ARRAY['Software Development', 'Consulting'],
     5,
     ARRAY['North America'],
     ARRAY['ISO 9001'],
     'active',
     now(),
     now()
    ),
    ('d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a', -- Supplier 2 UUID
     'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f', -- User 2 UUID
     'Demo Supplier Two',
     'Techville',
     'NY',
     '50_99',
     'https://www.demosupplier2.com',
     'https://www.linkedin.com/company/demo-supplier-two',
     'IT Services',
     'Specializing in cloud solutions and data analytics.',
     'info@demosupplier2.com',
     '555-987-6543',
     ARRAY['Cloud Computing', 'Data Analytics', 'Cybersecurity'],
     8,
     ARRAY['North America', 'Europe'],
     ARRAY['SOC 2 Type II'],
     'active',
     now(),
     now()
    ),
    ('f1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c', -- Supplier 3 UUID
     'e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b', -- User 3 UUID
     'Third Party Solutions',
     'Metropolis',
     'TX',
     '250_499',
     'https://www.thirdpartysolutions.com',
     'https://www.linkedin.com/company/third-party-solutions',
     'Manufacturing',
     'Providing custom manufacturing and prototyping services.',
     'sales@thirdpartysolutions.com',
     '555-222-3333',
     ARRAY['Prototyping', 'Custom Manufacturing', 'Supply Chain Consulting'],
     12,
     ARRAY['Global'],
     ARRAY['ISO 14001'],
     'active',
     now(),
     now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.feature_flags (name, enabled, description)
VALUES
    ('new_dashboard_layout', TRUE, 'Enables the new experimental dashboard layout.'),
    ('ai_content_generation', FALSE, 'Allows users to generate content using AI.'),
    ('advanced_analytics', TRUE, 'Activates advanced analytics features for premium users.'),
    ('dark_mode_toggle', TRUE, 'Enables the dark mode toggle for the UI.'),
    ('email_notifications', TRUE, 'Controls all email notifications.'),
    ('beta_features_access', FALSE, 'Grants access to all beta features.'),
    ('supplier_onboarding_wizard', TRUE, 'Enables the guided supplier onboarding wizard.'),
    ('ecosystem_connect_module', TRUE, 'Activates the Ecosystem Connect networking module.'),
    ('buyer_matching_v2', FALSE, 'Switches to the new version of the buyer matching algorithm.'),
    ('admin_dashboard_access', FALSE, 'Grants access to the administrative dashboard.')
ON CONFLICT (name) DO NOTHING;