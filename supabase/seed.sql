insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'recruteur.demo@jobmada.mg',
  crypt('jobmada-demo-password', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"recruiter"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'recruteur.demo@jobmada.mg',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"recruteur.demo@jobmada.mg","email_verified":true,"phone_verified":false}'::jsonb,
  'email',
  now(),
  now(),
  now()
)
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'candidat.demo@jobmada.mg',
    crypt('jobmada-demo-password', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"candidate"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin.demo@jobmada.mg',
    crypt('jobmada-demo-password', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'candidat.demo@jobmada.mg',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"candidat.demo@jobmada.mg","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'admin.demo@jobmada.mg',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"admin.demo@jobmada.mg","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

insert into public.profiles (id, role, display_name, email, onboarding_completion)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'recruiter',
    'Recruteur demo JobMada',
    'recruteur.demo@jobmada.mg',
    100
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'candidate',
    'Candidat demo JobMada',
    'candidat.demo@jobmada.mg',
    75
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'admin',
    'Admin demo JobMada',
    'admin.demo@jobmada.mg',
    100
  )
on conflict (id) do update
set
  role = excluded.role,
  display_name = excluded.display_name,
  email = excluded.email,
  onboarding_completion = excluded.onboarding_completion,
  updated_at = now();

insert into public.candidate_profiles (
  id,
  user_id,
  first_name,
  last_name,
  city,
  sector,
  desired_role,
  salary_expectation,
  cv_path,
  profile_completion
)
values (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000002',
  'Candidat',
  'Demo',
  'Antananarivo',
  'Informatique & Digital',
  'Designer UI/UX',
  'Selon profil',
  '00000000-0000-0000-0000-000000000002/demo-cv.pdf',
  75
)
on conflict (user_id) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  city = excluded.city,
  sector = excluded.sector,
  desired_role = excluded.desired_role,
  salary_expectation = excluded.salary_expectation,
  cv_path = excluded.cv_path,
  profile_completion = excluded.profile_completion,
  updated_at = now();

insert into public.companies (id, owner_id, name, slug, sector, city, description, status)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Media Click',
    'media-click',
    'Informatique & Digital',
    'Antananarivo',
    'Studio digital oriente produit et croissance.',
    'verified'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'ONG MEDAIR',
    'ong-medair',
    'Associatif, ONG & Humanitaire',
    'Fianarantsoa',
    'Organisation humanitaire active a Madagascar.',
    'verified'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'Baobab Labs',
    'baobab-labs',
    'Services & Conseil',
    'Toamasina',
    'Cabinet en croissance qui attend la validation JobMada.',
    'pending_review'
  )
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  name = excluded.name,
  slug = excluded.slug,
  sector = excluded.sector,
  city = excluded.city,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.jobs (
  id,
  company_id,
  title,
  slug,
  contract,
  city,
  sector,
  summary,
  description,
  missions,
  profile,
  is_featured,
  is_urgent,
  status,
  published_at
)
values
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'Designer UI/UX',
    'designer-ui-ux-media-click',
    'CDI',
    'Antananarivo',
    'Informatique & Digital',
    'Concevoir des interfaces utiles et elegantes.',
    'Vous rejoignez une equipe produit locale.',
    'Recherche utilisateur, wireframes, design system.',
    'Portfolio solide et sens du detail.',
    true,
    false,
    'published',
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'Health, nutrition & community engagement manager',
    'health-nutrition-community-engagement-manager-medair',
    'CDD',
    'Fianarantsoa',
    'Associatif, ONG & Humanitaire',
    'Renforcer l engagement communautaire.',
    'Poste terrain avec forte coordination.',
    'Mise en oeuvre, suivi, coordination.',
    'Experience sante publique ou sciences sociales.',
    true,
    true,
    'published',
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000101',
    'Chargé de recrutement',
    'charge-de-recrutement-media-click',
    'Intérim',
    'Antananarivo',
    'Ressources Humaines',
    'Structurer le sourcing et la relation candidat.',
    'Poste transverse entre RH, operations et managers.',
    'Publication, tri, entretiens et coordination.',
    'Aisance relationnelle et rigueur de suivi.',
    false,
    false,
    'pending_review',
    null
  )
on conflict (id) do update
set
  company_id = excluded.company_id,
  title = excluded.title,
  slug = excluded.slug,
  contract = excluded.contract,
  city = excluded.city,
  sector = excluded.sector,
  summary = excluded.summary,
  description = excluded.description,
  missions = excluded.missions,
  profile = excluded.profile,
  is_featured = excluded.is_featured,
  is_urgent = excluded.is_urgent,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();

insert into public.applications (job_id, candidate_id, cv_path, message, status)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002/demo-cv.pdf',
  'Candidature de demonstration pour valider le parcours JobMada.',
  'submitted'
)
on conflict (job_id, candidate_id) do update
set
  cv_path = excluded.cv_path,
  message = excluded.message,
  status = excluded.status;

insert into public.subscriptions (company_id, plan, status, job_quota, cv_access_enabled)
values
  ('00000000-0000-0000-0000-000000000101', 'pro', 'active', 10, true),
  ('00000000-0000-0000-0000-000000000102', 'starter', 'active', 3, false)
on conflict (company_id) do update
set
  plan = excluded.plan,
  status = excluded.status,
  job_quota = excluded.job_quota,
  cv_access_enabled = excluded.cv_access_enabled,
  updated_at = now();

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'candidat.live@jobmada.mg',
    crypt('jobmada-demo-password', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"candidate"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'recruteur.live@jobmada.mg',
    crypt('jobmada-demo-password', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"recruiter"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin.live@jobmada.mg',
    crypt('jobmada-demo-password', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000011',
    'candidat.live@jobmada.mg',
    '{"sub":"00000000-0000-0000-0000-000000000011","email":"candidat.live@jobmada.mg","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000012',
    'recruteur.live@jobmada.mg',
    '{"sub":"00000000-0000-0000-0000-000000000012","email":"recruteur.live@jobmada.mg","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000013',
    'admin.live@jobmada.mg',
    '{"sub":"00000000-0000-0000-0000-000000000013","email":"admin.live@jobmada.mg","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

insert into public.profiles (id, role, display_name, email, onboarding_completion)
values
  ('00000000-0000-0000-0000-000000000011', 'candidate', 'Candidat live JobMada', 'candidat.live@jobmada.mg', 80),
  ('00000000-0000-0000-0000-000000000012', 'recruiter', 'Recruteur live JobMada', 'recruteur.live@jobmada.mg', 80),
  ('00000000-0000-0000-0000-000000000013', 'admin', 'Admin live JobMada', 'admin.live@jobmada.mg', 100)
on conflict (id) do update
set
  role = excluded.role,
  display_name = excluded.display_name,
  email = excluded.email,
  onboarding_completion = excluded.onboarding_completion,
  updated_at = now();

insert into public.candidate_profiles (user_id, first_name, last_name, city, sector, desired_role, salary_expectation, profile_completion)
values ('00000000-0000-0000-0000-000000000011', 'Candidat', 'Live', 'Antananarivo', 'Informatique & Digital', 'Product designer', 'Selon profil', 80)
on conflict (user_id) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  city = excluded.city,
  sector = excluded.sector,
  desired_role = excluded.desired_role,
  salary_expectation = excluded.salary_expectation,
  profile_completion = excluded.profile_completion,
  updated_at = now();

insert into public.companies (id, owner_id, name, slug, sector, city, description, status)
values (
  '00000000-0000-0000-0000-000000000112',
  '00000000-0000-0000-0000-000000000012',
  'Live Recruiter SARL',
  'live-recruiter',
  'Informatique & Digital',
  'Antananarivo',
  'Entreprise seedee pour les verifications non-demo.',
  'verified'
)
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  name = excluded.name,
  slug = excluded.slug,
  sector = excluded.sector,
  city = excluded.city,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.subscriptions (company_id, plan, status, job_quota, cv_access_enabled)
values ('00000000-0000-0000-0000-000000000112', 'free', 'active', 2, false)
on conflict (company_id) do update
set
  plan = excluded.plan,
  status = excluded.status,
  job_quota = excluded.job_quota,
  cv_access_enabled = excluded.cv_access_enabled,
  updated_at = now();
