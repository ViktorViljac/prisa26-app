-- Migration 015: Bulk import participants into Auth and Profiles

-- 1. Ensure all 4 teams exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Plavi') THEN INSERT INTO teams (name, color, icon) VALUES ('Plavi', '#3b82f6', '💎'); END IF;
  IF NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Zeleni') THEN INSERT INTO teams (name, color, icon) VALUES ('Zeleni', '#0d9488', '🌿'); END IF;
  IF NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Crveni') THEN INSERT INTO teams (name, color, icon) VALUES ('Crveni', '#ef4444', '❤️'); END IF;
  IF NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Žuti') THEN INSERT INTO teams (name, color, icon) VALUES ('Žuti', '#f59e0b', '☀️'); END IF;
END $$;

-- 2. Bulk insert users
-- User 1: Anastazija Petričić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'anastazija.p24@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'anastazija.p24@gmail.com',
      extensions.crypt('dmt9tx', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Anastazija Petričić', 'phone', '+385915981920', 'dob', '24.4.2007.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 19,
      school_or_college = 'III. gimnazija, Split'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 2: Mia Zelic
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Zelicmia1@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'Zelicmia1@gmail.com',
      extensions.crypt('69d7h7', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Mia Zelic', 'phone', '+385976833341', 'dob', '19.03.2007.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 19,
      school_or_college = 'Breda University of Applied Science'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 3: Jelena Buljan
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jelenabuljan24@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'jelenabuljan24@gmail.com',
      extensions.crypt('wwuq4v', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Jelena Buljan', 'phone', '385 95 877 8901', 'dob', '24.8'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = NULL,
      school_or_college = NULL
    WHERE id = v_uid;
  END IF;
END $$;

-- User 4: Toni Balint
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'toni.balint@neutroni.hr') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'toni.balint@neutroni.hr',
      extensions.crypt('u5233s', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Toni Balint', 'phone', '097 716 0743', 'dob', '19.08.2010.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 16,
      school_or_college = 'MIOC(III. gimnazija)'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 5: Ante Rak
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'anterak8@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'anterak8@gmail.com',
      extensions.crypt('33vrha', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Ante Rak', 'phone', '0957321774', 'dob', '3.11.2007'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 19,
      school_or_college = 'Turističko-ugostiteljska škola Šibenik'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 6: Iva Marić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'iva.maric2022@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'iva.maric2022@gmail.com',
      extensions.crypt('wcdk5d', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Iva Marić', 'phone', '0919392263', 'dob', '9.1.2011.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 15,
      school_or_college = 'Gimnazija A. G. Matoša Đakovo'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 7: Tonka Keran
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tonkaakeran@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'tonkaakeran@gmail.com',
      extensions.crypt('ra57ys', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Tonka Keran', 'phone', '097 709 8605', 'dob', '23.1.2013.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 13,
      school_or_college = 'OŠ Dobri'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 8: Sara Petrović
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sara.petrovic012345@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'sara.petrovic012345@gmail.com',
      extensions.crypt('ymgpjn', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Sara Petrović', 'phone', '095 835 0112', 'dob', '9.8.2007.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 19,
      school_or_college = NULL
    WHERE id = v_uid;
  END IF;
END $$;

-- User 9: Nikola Brekalo Limeta
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'brekalo.nikola12@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'brekalo.nikola12@gmail.com',
      extensions.crypt('8n4p2t', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Nikola Brekalo Limeta', 'phone', '+385995635104', 'dob', '30.7.2012'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 14,
      school_or_college = 'OŠ Jesenice'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 10: Tina Lalić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tinalalic07@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'tinalalic07@gmail.com',
      extensions.crypt('xc2mcu', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Tina Lalić', 'phone', '0981972296', 'dob', '16.05.2007'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 19,
      school_or_college = NULL
    WHERE id = v_uid;
  END IF;
END $$;

-- User 11: Marita Alba Batallar-Šipić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'maritabatallar-sipic@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'maritabatallar-sipic@gmail.com',
      extensions.crypt('ukkre7', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Marita Alba Batallar-Šipić', 'phone', '0983101186', 'dob', '8.9.2014.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 12,
      school_or_college = 'OŠ Skalice'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 12: Asja Kelam
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'akelam@ffst.hr') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'akelam@ffst.hr',
      extensions.crypt('xzzvka', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Asja Kelam', 'phone', '0992863535', 'dob', '23.2.2001'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 25,
      school_or_college = 'Ffst'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 13: Petra Bilela
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'petra.bilela@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'petra.bilela@gmail.com',
      extensions.crypt('6znnrq', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Petra Bilela', 'phone', '0994535722', 'dob', '06.02.2001.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 25,
      school_or_college = 'Pmfst'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 14: Mateo Brajković
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mateobrajkovic14@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'mateobrajkovic14@gmail.com',
      extensions.crypt('cp7vus', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Mateo Brajković', 'phone', '+385976085467', 'dob', '3.8.2014'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 12,
      school_or_college = 'Osnovna škola don Lovre Katić'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 15: Petar Marić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'petar.maric5555@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'petar.maric5555@gmail.com',
      extensions.crypt('6dqt43', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Petar Marić', 'phone', '+385 91 978 6542', 'dob', '28.3.2016.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 10,
      school_or_college = 'P.Š. Tomašanci'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 16: Antonio Milanović-Litre
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'antonio.milanoviclitre7@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'antonio.milanoviclitre7@gmail.com',
      extensions.crypt('6w7sp8', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Antonio Milanović-Litre', 'phone', '0989734969', 'dob', '30.12.2010.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 16,
      school_or_college = '3. Gimnazija Split'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 17: Vjeko Žužul
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vjekozuzul40@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'vjekozuzul40@gmail.com',
      extensions.crypt('tj6qv8', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Vjeko Žužul', 'phone', '0955624236', 'dob', '20.10.2011.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 15,
      school_or_college = 'OŠ Tin Ujević Krivodol'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 18: Vanda
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vanda.plazibat@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'vanda.plazibat@gmail.com',
      extensions.crypt('stt4av', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Vanda', 'phone', '+385 099 754 4939', 'dob', '10.6.2013.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 13,
      school_or_college = 'Da'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 19: Lovre Ercegović
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lovre.ercegov@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'lovre.ercegov@gmail.com',
      extensions.crypt('h3e5b9', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Lovre Ercegović', 'phone', '095 864 3989', 'dob', '26.9.2011.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 15,
      school_or_college = 'OŠ Trstenik'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 20: Vlatka Lujić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vlatkalujic@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'vlatkalujic@gmail.com',
      extensions.crypt('zt7ydz', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Vlatka Lujić', 'phone', '095/535 1081', 'dob', '20.01.2010'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 16,
      school_or_college = 'Prirodoslovna škola Split'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 21: Nika Habulinec
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nikahab5@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'nikahab5@gmail.com',
      extensions.crypt('wqses7', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Nika Habulinec', 'phone', '095 726 2722', 'dob', '24.03.2008.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 18,
      school_or_college = 'Prirodoslovna škola Vladimira Preloga'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 22: Korina Oreški
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'korinaoreski123@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'korinaoreski123@gmail.com',
      extensions.crypt('h67dxz', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Korina Oreški', 'phone', '095 779 9652', 'dob', '28.05.2009.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 17,
      school_or_college = 'Škola za medicinske sestre vinogradtska'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 23: Ivona Lea Ćurin
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ivona.leacurin7@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'ivona.leacurin7@gmail.com',
      extensions.crypt('rysz89', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Ivona Lea Ćurin', 'phone', '0915662642', 'dob', '14.6.2010'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 16,
      school_or_college = 'V. Gimnazija Vladimir Nazor Split'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 24: Noa Nakir
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'noa.nakir@skole.hr') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'noa.nakir@skole.hr',
      extensions.crypt('ujupyk', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Noa Nakir', 'phone', '0924142338', 'dob', '09.02.2014.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 12,
      school_or_college = 'OŠ Mertojak'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 25: Marin vuletin
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Marinvuletin3@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'Marinvuletin3@gmail.com',
      extensions.crypt('u4xtzs', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Marin vuletin', 'phone', '0916188743', 'dob', '11.5.2011'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 15,
      school_or_college = 'OŠ Bijaći'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 26: Vito Agoli
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mcarijaagoli@yahoo.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'mcarijaagoli@yahoo.com',
      extensions.crypt('47pqgk', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Vito Agoli', 'phone', '0976542444', 'dob', '27. 10. 2012.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 14,
      school_or_college = 'OŠ BLATINE ŠKRAPE'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 27: Ivka Žužul
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ivkazuzul@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'ivkazuzul@gmail.com',
      extensions.crypt('5jabex', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Ivka Žužul', 'phone', '0915763111', 'dob', '2.7.2012'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 14,
      school_or_college = 'Osnovna škola Tin Ujević Krivodol'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 28: Lovro Jaman
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lovro.jaman2011@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'lovro.jaman2011@gmail.com',
      extensions.crypt('7w9r4t', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Lovro Jaman', 'phone', '+385957108730', 'dob', '6. travnja 2011.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 15,
      school_or_college = 'OŠ prof. Filipa Lukasa'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 29: Luka Ajdučić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lukaajducic13@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'lukaajducic13@gmail.com',
      extensions.crypt('8sn8gj', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Luka Ajdučić', 'phone', '0924296559', 'dob', '20.02.2013'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 13,
      school_or_college = 'OŠ Ivana Mažuranića'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 30: Marina Jonjić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marina.jonjic@skole.hr') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'marina.jonjic@skole.hr',
      extensions.crypt('zsrt35', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Marina Jonjić', 'phone', '0992116522', 'dob', '27.09.2012'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 14,
      school_or_college = 'Oš Tin Ujević Krivodol'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 31: Jakov Džaja
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jakov.dzaja1@skole.hr') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'jakov.dzaja1@skole.hr',
      extensions.crypt('s4quy8', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Jakov Džaja', 'phone', '+385976025241', 'dob', '10.12.2014.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 12,
      school_or_college = 'OŠ Mejaši'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 32: Karlo kulaš
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'andelaikarlo17@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'andelaikarlo17@gmail.com',
      extensions.crypt('b5kmr8', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Karlo kulaš', 'phone', '0976670452', 'dob', '11.3.2017.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 9,
      school_or_college = 'Osnovna škola Kman-kocunar'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 33: MIRA SUČIĆ
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dijana.sucic007@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'dijana.sucic007@gmail.com',
      extensions.crypt('4drzz4', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'MIRA SUČIĆ', 'phone', '97 711 5773', 'dob', '29.07.2016.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 10,
      school_or_college = 'KMAN-KOCUNAR SPLIT'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 34: Megi Megic
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'slavicakarin1@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Zeleni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'slavicakarin1@gmail.com',
      extensions.crypt('9tjr89', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Megi Megic', 'phone', '0976231971', 'dob', '9.11.2016.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 10,
      school_or_college = NULL
    WHERE id = v_uid;
  END IF;
END $$;

-- User 35: Ena Kekez
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'enakekez95@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'enakekez95@gmail.com',
      extensions.crypt('f9q52s', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Ena Kekez', 'phone', '0995099849', 'dob', '13.07.2009'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 17,
      school_or_college = 'Druga jezicna gimnazija Split'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 36: Ivor Roganović
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'roganovicivor@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'roganovicivor@gmail.com',
      extensions.crypt('9cxj7s', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Ivor Roganović', 'phone', '0953555628', 'dob', '12.5.2013.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 13,
      school_or_college = 'Oš marjan'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 37: Ivan Petar Katić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ippro10101@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'ippro10101@gmail.com',
      extensions.crypt('ndg26q', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Ivan Petar Katić', 'phone', '0917951162', 'dob', '20.1.2012'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 14,
      school_or_college = NULL
    WHERE id = v_uid;
  END IF;
END $$;

-- User 38: Nina Medić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nivea.bulic@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'nivea.bulic@gmail.com',
      extensions.crypt('er8aca', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Nina Medić', 'phone', '+385976419751', 'dob', '16.05.2016.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 10,
      school_or_college = 'Kman Kocunar'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 39: Elena Dabro
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Elena.dabro51@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'Elena.dabro51@gmail.com',
      extensions.crypt('rvu85c', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Elena Dabro', 'phone', '0992033323', 'dob', '05.01.2017.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 9,
      school_or_college = 'OŠ Kman-Kocunar'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 40: Tea Blajić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teablajic@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Žuti';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'teablajic@gmail.com',
      extensions.crypt('w4ghdw', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Tea Blajić', 'phone', '0977496859', 'dob', '14.12.2011'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 15,
      school_or_college = 'Osnovna škola Kman-Kocunar'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 41: Magdalena Zebic
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'MagdalenaZebic1011@gmail.com') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'MagdalenaZebic1011@gmail.com',
      extensions.crypt('b3u9jy', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Magdalena Zebic', 'phone', '99 200 9879', 'dob', '10.11.2016'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 10,
      school_or_college = 'Oš kman kocunar'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 42: Lu Barbarić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lu.barbaric@skole.hr') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Plavi';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'lu.barbaric@skole.hr',
      extensions.crypt('3xneam', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Lu Barbarić', 'phone', '091 6194940', 'dob', '1.11.2013.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 13,
      school_or_college = 'OŠ Kman-Kocunar'
    WHERE id = v_uid;
  END IF;
END $$;

-- User 43: Lovre Buljubašić
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_team_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lovre.buljubasic@skole.hr') THEN
    SELECT id INTO v_team_id FROM teams WHERE name = 'Crveni';

    -- Create Auth User
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'lovre.buljubasic@skole.hr',
      extensions.crypt('yvv389', extensions.gen_salt('bf')),
      now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('name', 'Lovre Buljubašić', 'phone', '0994866699', 'dob', '24.9.2013.'), now(), now(),
      'authenticated', 'authenticated'
    );

    -- Profile is automatically created by handle_new_user trigger.
    -- We update additional profile fields:
    UPDATE public.profiles
    SET
      team_id = v_team_id,
      age = 13,
      school_or_college = 'OŠ Kman-Kocunar'
    WHERE id = v_uid;
  END IF;
END $$;

