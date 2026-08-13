-- =============================================================
-- Long Valley 2nd Ward ministering roster seed (church-scheduler)
-- Ward: long-valley-2nd-ward
--
-- Generated deterministically from extracted JSON so this script
-- is idempotent when re-run (household/member ids are md5-derived).
--
-- NOTE: companionship_households references companionships(id) using
-- the deterministic ids in companionships.json. The companionships
-- table must be seeded with those same ids first (or the FKs below
-- will fail).
-- =============================================================

-- -------------------------------------------------------------
-- Leader email updates (replace @example.com dev placeholders)
-- -------------------------------------------------------------
UPDATE leaders SET email = 'cole.chollet1@gmail.com' WHERE id = 'cole';
UPDATE leaders SET email = 'ktups90@gmail.com' WHERE id = 'kawika';
UPDATE leaders SET email = 'bry13006@gmail.com' WHERE id = 'sean';

-- -------------------------------------------------------------
-- Households
-- -------------------------------------------------------------
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('96645ab5-1a42-5175-dc02-23b9d9522cfd', 'long-valley-2nd-ward', 'Evans', 'Luke', 'Evans', '801-857-9204', 'lukept3221@gmail.com', '1865 S Tower Bridge Dr', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('d0fd944c-488e-184e-8a44-88249d2c51d7', 'long-valley-2nd-ward', 'Mann', 'Ryan', 'Mann', '385-209-3307', 'rymann26@gmail.com', '1529 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('22775cfa-5412-5486-7448-44238101f704', 'long-valley-2nd-ward', 'Walker', 'Kashden', 'Walker', '435-229-0794', 'kashdenswade@gmail.com', '1940 S Wolverine Way', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('73ab2d85-5755-8d29-97aa-acb36b9142b6', 'long-valley-2nd-ward', 'Collins', 'Cashe', 'Collins', '435-229-9647', 'cashecollins@gmail.com', '1885 S Cyclone Dr', 'Washington', 'UT', '84780-3773', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('a006d811-ce8b-3709-724b-25cfec5aeb5c', 'long-valley-2nd-ward', 'Bond', 'Cody', 'Bond', '503-508-5380', 'codytbond@gmail.com', '1447 S. Ripple Rock Drive', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('fa7cbbc2-1407-d763-a2eb-d89d687a7749', 'long-valley-2nd-ward', 'Clark', 'Matt', 'Clark', '763-442-4377', 'mattc2592@gmail.com', '1731 S Cedar Mesa Dr', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('0759fc18-cde9-8319-3159-682d5f89fa8e', 'long-valley-2nd-ward', 'Crichton', 'Donald Brad', 'Crichton', '435-862-3198', 'bubucrichton@gmail.com', '1889 S Tower Bridge Dr', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('beb7c01e-dede-b84f-4359-9b6b07e1bd30', 'long-valley-2nd-ward', 'Sharp', 'Ben', 'Sharp', '435-225-2847', 'bsharpj@gmail.com', '1532 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('ccc4acd2-9612-56b6-e698-9c7a7eebe07d', 'long-valley-2nd-ward', 'Blazzard', 'Izaic', 'Blazzard', '435-619-5454', 'izaicmblazzard@gmail.com', '1621 S Star Springs Dr', 'Washington', 'UT', '84780-3692', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('eef19663-4883-2e3b-fe5a-2ab09698a25c', 'long-valley-2nd-ward', 'Wright', 'Shane Joseph', 'Wright', '435-862-1073', 'shanejwright18@gmail.com', '1547 S Wagon Box Way', 'Washington', 'UT', '84780-3635', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('8f9ec472-114b-9234-d910-2eabab4519ab', 'long-valley-2nd-ward', 'Dunyon', 'Kevin', 'Dunyon', '719-648-0745', 'kadunyon@gmail.com', '1902 S Swamp Mesa Dr', 'Washington', 'UT', '84780-3800', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'long-valley-2nd-ward', 'Everitt', 'Jared', 'Everitt', '435-669-2380', 'jeveritt77@gmail.com', '1474 S Ripple Rock Drive', 'Washington', 'UT', '84780', 'family', 1, true, 'PDF shows ''Washingtion'' (typo). King children may be wards of state (foster/guardianship).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('e9313d29-8897-6b23-df6a-f6ad681881c8', 'long-valley-2nd-ward', 'Thompson', 'Kenneth Taylor', 'Thompson', '435-879-9034', 'kennythompson12@gmail.com', '1649 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3637', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('3528dc69-9aa7-f86b-8e31-ee15dd6785af', 'long-valley-2nd-ward', 'Miles', 'Wyatt', 'Miles', '435-705-0180', NULL, '1632 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3637', 'family', 1, true, 'Seaich (Braden) has a different surname (step/ward).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('16dd67cc-a1df-f41b-5f35-5b0a70a38b5b', 'long-valley-2nd-ward', 'Nielson', 'Matthew', 'Nielson', '385-312-4385', 'matthew.j.nielson@gmail.com', '2953 E Corral Hollow Dr', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('20bc3941-dd22-64b4-91e1-d8d6c4c4210b', 'long-valley-2nd-ward', 'Bell', 'Jordan', 'Bell', '801-388-0153', 'jordanbell@designanywhere.org', '1898 South Tower Bridge Dr.', 'Washington', 'UT', '84780', 'family', 1, true, 'PDF shows ''Washingot'' (typo).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('f2551914-7a7e-e51e-e2d9-adb372efcbaf', 'long-valley-2nd-ward', 'Lynch', 'Patrick', 'Lynch', '385-207-5082', 'patmanutah@gmail.com', '1572 S Star Springs Dr', 'Washington', 'UT', '84780-3636', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('098864cc-a55c-ad94-ce72-8555680b377d', 'long-valley-2nd-ward', 'Bott', 'Kroy Lance', 'Bott', '801-913-6137', 'froybott@gmail.com', '1693 S Devils Garden Ln', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('1cc82462-4f9b-8d6a-b063-64a8fa947efd', 'long-valley-2nd-ward', 'Adams', 'Ethan', 'Adams', '318-780-1657', 'ethan1833adams@gmail.com', '1513 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('925b246b-7534-0602-dd05-b23f2f156ba3', 'long-valley-2nd-ward', 'Aycock', 'Rodney James', 'Aycock', '435-789-6690', NULL, '1836 S Wolverine Way', 'Washington', 'UT', '84780-3718', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('f9cb24b7-7998-9e5d-0724-1d5d244efffd', 'long-valley-2nd-ward', 'Kealer', 'Bryce', 'Kealer', '623-696-1870', 'bkealer81@gmail.com', '1845 S Wolverine Way', 'Washington', 'UT', '84780-3718', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('bd8d05e4-b77a-c4fa-5978-f09cd663ef2a', 'long-valley-2nd-ward', 'Behymer', 'Austin', 'Behymer', '435-429-9843', 'austin.behymer@gmail.com', '1884 S Tower Bridge Dr.', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('b326bcbd-8436-6fa4-cd7c-0539ab8f8c1b', 'long-valley-2nd-ward', 'Davis', 'Carter', 'Davis', '801-560-5107', 'carterman112@gmail.com', '1905 S Swamp Mesa Dr.', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('fade445d-9cac-cf1d-137e-9d36d9c453be', 'long-valley-2nd-ward', 'Brady', 'Cody Dean', 'Brady', '801-691-9579', 'stoptheo15@gmail.com', '1480 S Ripple Rock Dr', 'Washington', 'UT', '84780-3683', 'family', 1, true, 'Anderson (Jaxon Terry) listed under Brady household (different surname).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('3aaa65a4-ec5c-0740-0d0a-fcf4620c7cba', 'long-valley-2nd-ward', 'Gates', 'Zander', 'Gates', '801-915-4205', 'zzandergates@gmail.com', '1587 S WAGON BOX WAY', 'Washington', 'UT', '84780-3691', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('f17c0a87-d6a7-9b1e-0e29-1e01b3986186', 'long-valley-2nd-ward', 'Valadez', 'William John', 'Valadez', '435-619-0588', 'will.valadez4@gmail.com', '1746 S DEVILS GARDEN LN', 'Washington', 'UT', '84780-3716', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('a87985b5-cb47-8f33-66ac-356bc5f90f1e', 'long-valley-2nd-ward', 'Billingsley', 'Kamilie', 'Billingsley', '801-735-1063', 'kamilie.billingsley@gmail.com', '1583 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 1, true, 'Single-parent household (Kamilie is head).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('7d6e4b1e-f6f0-7498-eed0-f6a8090e1ef7', 'long-valley-2nd-ward', 'Goodall', 'Ryan', 'Goodall', '435-668-7078', 'ryan_goodall16@yahoo.com', '1465 S Ripple Rock Dr', 'Washington', 'UT', '84780-3683', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('b94b2c4e-caad-e475-d021-ba1cdd1e2d63', 'long-valley-2nd-ward', 'Parker', 'Kylie Michelle', 'Parker', '435-817-8255', 'kyliempj@gmail.com', '1550 S Wagon Box Way', 'Washington', 'UT', '84780-3635', 'family', 1, true, 'Johnson children listed under Parker household.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('20d5610c-ed05-097f-bad6-abac3577d334', 'long-valley-2nd-ward', 'Bistline', 'Sherry', 'Bistline', '435-868-1420', NULL, '1683 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 1, true, 'Carrington children under Bistline household.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('fd2275b5-65ee-cb22-9b79-b4367edbe104', 'long-valley-2nd-ward', 'Mayfield', 'Amanda', 'Mayfield', '801-707-1032', 'amayfield2906@gmail.com', '1832 S WOLVERINE WAY', 'Washington', 'UT', '84780-3718', 'single', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('2ba5f0cd-11f9-d1f1-a706-a8dcee17bc15', 'long-valley-2nd-ward', 'Baker', 'Tyler', 'Baker', '661-733-5430', 'tgbaker7@yahoo.com', '1634 S Star Springs Dr', 'Washington', 'UT', '84780-3692', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('9e55f014-608f-51ad-3514-4b5ce700aa40', 'long-valley-2nd-ward', 'Klawitter', 'Raymond Eric', 'Klawitter', '435-669-6603', 'ray_klawitter@yahoo.com', '1850 S Tower Bridge Drive', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('c3ba71f2-0a74-c29f-f5e5-b0ed47797b32', 'long-valley-2nd-ward', 'Durst', 'Nick', 'Durst', '719-688-1345', 'nmdurst@gmail.com', '1597 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('81f8bbe4-f78e-e78d-50d1-d84128e64122', 'long-valley-2nd-ward', 'Hicken', 'Reese', 'Hicken', '949-899-4417', 'reesehicken@gmail.com', '1849 S Tower Bridge Dr', 'Washington', 'UT', '84780-3772', 'single', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('db1b4adf-7453-633b-c3fc-c3c62f8bd0f5', 'long-valley-2nd-ward', 'Moore', 'Walker', 'Moore', '801-472-8281', 'walkermoore24@gmail.com', '1978 S Wolverine Way', 'Washington', 'UT', '84780-3774', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('af595157-1d2d-37cb-8e60-56339d1a00a9', 'long-valley-2nd-ward', 'Bracken', 'Kenneth Mar', 'Bracken', '435-619-2532', 'kbrackenm@gmail.com', '1589 S Star Springs Dr', 'Washington', 'UT', '84780-3636', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('2ab130e7-2bee-771a-a254-09bfa275200f', 'long-valley-2nd-ward', 'Montoya', 'Kade', 'Montoya', '801-870-9518', 'montoyakade@gmail.com', '1461 S. Ripple Rock', 'Washington', 'UT', '84780', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('583481a1-3cd6-a5f3-4903-981f13301636', 'long-valley-2nd-ward', 'Abel', 'Jordan', 'Abel', '435-574-7475', 'jabel873@gmail.com', '1627 S STAR SPRINGS DR', 'Washington', 'UT', '84780-3692', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('13dcc3a5-c557-454a-2021-c7451d9c0d13', 'long-valley-2nd-ward', 'Hunt', 'Stefany', 'Hunt', '435-862-1764', 'shunt292@gmail.com', '1649 S Star Springs Dr', 'Washington', 'UT', '84780-3692', 'family', 1, true, 'Single-parent household (Stefany is head).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('63474269-6e6a-689c-2769-fc25458c740a', 'long-valley-2nd-ward', 'Willard', 'Nathan Gordon', 'Willard', '801-369-2976', 'willard.nathang1198@gmail.com', '1594 S WAGON BOX WAY', 'Washington', 'UT', '84780-3691', 'family', 1, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('9c194d07-9184-4c02-8351-73a3eda25318', 'long-valley-2nd-ward', 'Cahoon', 'Matt', 'Cahoon', '702-217-9164', 'mattcahoon.lds@gmail.com', '1659 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3693', 'cross_district', 1, true, 'Cross-district companion; home household in District 3.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'long-valley-2nd-ward', 'Connole', 'Brayden', 'Connole', '760-650-6351', 'brayden.connole@gmail.com', '1682 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'long-valley-2nd-ward', 'Slade', 'Logan Timothy', 'Slade', '435-236-1086', NULL, '1484 S Ripple Rock Dr', 'Washington', 'UT', '84780-3683', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('041cbe74-5fe2-812b-db28-b9bb54997bc7', 'long-valley-2nd-ward', 'Bangerter', 'Torsten', 'Bangerter', '801-851-0854', 'torbangerter@gmail.com', '2786 E Fireweed Ln', 'Washington', 'UT', '84780-3885', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('14fcb729-7b29-0d0f-a7d2-57250359dae6', 'long-valley-2nd-ward', 'Engemann', 'Cole', 'Engemann', '801-361-2369', 'colengemann10@gmail.com', '1502 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('def4dcdf-de94-ba90-8148-782afcb9182e', 'long-valley-2nd-ward', 'Bayles', 'Jared', 'Bayles', NULL, NULL, '1751 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3717', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('e12c28e3-8941-4c65-3826-de76a5682579', 'long-valley-2nd-ward', 'Gallacci', 'Justine', 'Gallacci', '509-431-5352', 'jmgallacci@gmail.com', '2925 E CORRAL HOLLOW DR', 'Washington', 'UT', '84780-3756', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('fba76880-9fe0-b5fc-c699-5264a4e4dce7', 'long-valley-2nd-ward', 'Hadlock', 'Sydni', 'Hadlock', '435-668-3221', 'sydnihall13@gmail.com', '1530 S Wagon Box Way', 'Washington', 'UT', '84780-3635', 'family', 2, true, 'Weichers (Knixon) listed under Hadlock household.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('ee3f891b-e345-6da6-bfbe-b877f3497d59', 'long-valley-2nd-ward', 'Hales', 'Benjamin Sidney', 'Hales', '385-375-9058', 'b3.hales@gmail.com', '1574 S WAGON BOX WAY', 'Washington', 'UT', '84780-3691', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('f04e79be-cf19-dbed-86de-bf5befe48b00', 'long-valley-2nd-ward', 'West', 'Milli', 'West', '435-668-5933', 'milliwest7@gmail.com', '1855 S Cyclone Dr', 'Washington', 'UT', '84780-3773', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('c481e6e2-732d-1eb7-0240-e8e24d2f253e', 'long-valley-2nd-ward', 'Ewell', 'Jacob William', 'Ewell', '909-658-5370', 'jacobewell7@gmail.com', '1638 S Cedar Mesa Dr', 'Washington', 'UT', '84780', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('0cd029e9-b7ad-a67e-1db7-7ea320c746a1', 'long-valley-2nd-ward', 'Sorensen', 'Kyle', 'Sorensen', '435-559-8629', 'hangtimekls@gmail.com', '2802 Fireweed LN', 'Washington', 'UT', '84780', 'family', 2, true, 'PDF shows zip 84790 (likely typo for 84780).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('c7be6ffe-1b5b-ae99-9891-8ea427f3902f', 'long-valley-2nd-ward', 'Harris', 'Devin', 'Harris', '435-421-9158', 'devinrayharris52@gmail.com', '1555 S Wagon Box Way', 'Washington', 'UT', '84780-3635', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('2a768d87-a769-7fd9-65ab-e538feac4acf', 'long-valley-2nd-ward', 'Whitesides', 'Kason', 'Whitesides', '435-922-8141', 'slips1225@gmail.com', '1884 S WOLVERINE WAY', 'Washington', 'UT', '84780-3718', 'family', 2, true, 'PDF spells child ''Whiteside'' (no s) vs family ''Whitesides''.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('142fc850-57d9-bfe3-6770-bf7b662b94cf', 'long-valley-2nd-ward', 'Hyer', 'Mckay', 'Hyer', '435-632-1380', 'mckay.hyer@gmail.com', '2173 S Wolverine Way', 'Washington', 'UT', '84780-3887', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('3e2cbc53-a863-beb5-9096-144760305b0f', 'long-valley-2nd-ward', 'Lewis', 'Andrew', 'Lewis', '435-668-5171', 'bandrewlewis@gmail.com', '1537 S Wagon Box Way', 'Washington', 'UT', '84780-3635', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('89bf4f9b-5603-9188-7a84-d1df092ab665', 'long-valley-2nd-ward', 'Eves', 'Kameron', 'Eves', '702-686-2105', 'kameroneves@gmail.com', '1612 S Star Springs Dr', 'Washington', 'UT', '84780-3692', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('13197542-44f7-1887-f160-1f744a215afc', 'long-valley-2nd-ward', 'Tower', 'Bridger', 'Tower', '801-300-7473', 'bridgertower@gmail.com', '1719 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('34cfd71f-2de3-eec6-a6bc-132739807cf0', 'long-valley-2nd-ward', 'Fisher', 'Landon', 'Fisher', '435-817-1007', 'lannyfish@gmail.com', '1878 S Swamp Mesa Dr', 'Washington', 'UT', '84780-3800', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('03f796ef-ffdd-59ce-0289-4703edd86296', 'long-valley-2nd-ward', 'Twede', 'Devin', 'Twede', '801-916-8896', 'twedesoccer@hotmail.com', '1567 S RIPPLE ROCK DR', 'Washington', 'UT', '84780-3685', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('a830e5da-2d40-9b35-5563-57d4710de655', 'long-valley-2nd-ward', 'Rigby', 'Stetson', 'Rigby', '801-865-2185', 'morgandaysuu@gmail.com', '1951 S Wolverine Way', 'Washington', 'UT', '84780-3774', 'family', 2, true, 'Listed twice in PDF (alt email stetsonrigby@gmail.com) - deduped.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('8c3d73b2-0f68-dd27-1b72-484665f97b8b', 'long-valley-2nd-ward', 'Wegesend', 'Warren Robert', 'Wegesend', '808-864-2462', 'wgsnd1@yahoo.com', '1501 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('1bc3ebdc-7ce9-1de7-509e-710fdcd86f6f', 'long-valley-2nd-ward', 'Fellmeth', 'Joe', 'Fellmeth', '435-459-2386', 'jlfellmeth@gmail.com', '1527 S WAGON BOX WAY', 'Washington', 'UT', '84780-3635', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('b947cdba-9413-0b06-4e0f-9e5403476692', 'long-valley-2nd-ward', 'Tupuola', 'Kawika', 'Tupuola', '801-889-5280', 'ktups90@gmail.com', '1648 S Star Springs Dr', 'Washington', 'UT', '84780-3692', 'family', 2, true, 'Presidency member (District 2 president).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('1fe1f5d3-0beb-b330-7503-e01a61c0df51', 'long-valley-2nd-ward', 'Hamilton', 'Dana', 'Hamilton', '435-668-4681', NULL, '1720 S DEVILS GARDEN LN', 'Washington', 'UT', '84780-3716', 'family', 2, true, 'Two adults; Bresciani relationship unclear.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('03a1e76b-4bfb-fd23-4626-305b8f121ef9', 'long-valley-2nd-ward', 'Michel', 'Joan Mary', 'Michel', '435-619-3734', 'teddybearhugs4@gmail.com', '2813 E Fireweed Ln', 'Washington', 'UT', '84780-3885', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('31b3af33-8507-2c0a-4295-df020ab7205d', 'long-valley-2nd-ward', 'Wintch', 'Phil', 'Wintch', '520-647-1743', 'philwintch@gmail.com', '1839 S WOLVERINE WAY', 'Washington', 'UT', '84780-3718', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('dbec62b0-b4bf-126f-8a8b-93514f794663', 'long-valley-2nd-ward', 'Edelmayer', 'Branden', 'Edelmayer', '208-351-5772', 'brandenedelmayer@gmail.com', '1749 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('d9cc5ead-fb6a-d43a-2e4d-914214d01034', 'long-valley-2nd-ward', 'Sanders', 'Brennan', 'Sanders', '435-531-9179', 'gbsand28@gmail.com', '1831 S Tower Bridge Dr', 'Washington', 'UT', '84780', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('ac4d562f-e880-ef93-e630-47235d35a7e2', 'long-valley-2nd-ward', 'Stratton', 'Lois', 'Stratton', '435-632-3444', 'merrellloisaz@gmail.com', '1484 S Ripple Rock Dr', 'Washington', 'UT', '84780-3683', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('9e7edd63-79a4-c542-9eb1-01e51a4a6d34', 'long-valley-2nd-ward', 'Gearig', 'Kyle', 'Gearig', '385-231-6766', 'kylegearig@gmail.com', '1611 S Wagon Box Way', 'Washington', 'UT', '84780-3691', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('b237802b-8e0c-9ba6-e142-3a0b6b066afd', 'long-valley-2nd-ward', 'Walton', 'Christian', 'Walton', '909-549-4269', 'christian.e.walton@gmail.com', '1567 S Star Springs Dr', 'Washington', 'UT', '84780-3636', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('945b8305-127e-4433-b797-ce066c77f80b', 'long-valley-2nd-ward', 'Gibbons', 'Joe', 'Gibbons', '801-669-1400', 'joe@utahmarine.com', '1664 S CEDAR MESA DR', 'Washington', 'UT', '84780-3693', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('54a9b00a-fd40-ccc9-f544-536b52063bd7', 'long-valley-2nd-ward', 'Wegesend', 'Ekana', 'Wegesend', '808-220-2516', 'wegesend01@gmail.com', '1501 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 2, true, 'Second Wegesend household (same address as Warren Robert). Hawaiian diacritics preserved.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('46afdd72-2e8e-707c-8d5c-2ab1d5843c81', 'long-valley-2nd-ward', 'Evans', 'Janson', 'Evans', '801-309-4875', 'evans.janson@gmail.com', '1619 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3637', 'family', 2, true, 'Second Evans household (distinct from Luke Evans in D1).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'long-valley-2nd-ward', 'Swanson', 'Brody Ray', 'Swanson', '801-427-4555', 'brody_swanson15@hotmail.com', '1624 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3637', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('0fb5467f-ae45-35c2-5291-36212d66507e', 'long-valley-2nd-ward', 'Gubler', 'Dillon Casey', 'Gubler', '435-669-4785', 'dillongubler@gmail.com', '1479 S Ripple Rock Dr (Unit 1479)', 'Washington', 'UT', '84780-3683', 'single', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('8d7556c3-4759-cfd1-b0f5-a0801112c068', 'long-valley-2nd-ward', 'McKeighan', 'Domanic Michael', 'McKeighan', '435-680-8493', 'domckeighan@gmail.com', '1613 S Star Springs Dr', 'Washington', 'UT', '84780-3692', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('c8a94a6f-5757-565c-d2ef-9129e2fd0f6a', 'long-valley-2nd-ward', 'Christensen', 'Jared', 'Christensen', '801-499-9423', 'churchofjesuschrist.5f954@simplelogin.com', '1769 S Cedar Mesa Dr', 'Washington', 'UT', '84780', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('53ab5ac4-c46d-1412-938b-82f6eb38a149', 'long-valley-2nd-ward', 'Jones', 'Jayce', 'Jones', '435-705-9281', 'jonzey32@outlook.com', '1596 S RIPPLE ROCK DR', 'Washington', 'UT', '84780-3685', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('12340542-186a-37de-7f06-aba017333ab5', 'long-valley-2nd-ward', 'Espinoza', 'Jason Robert', 'Espinoza', NULL, NULL, '1709 S DEVILS GARDEN LN', 'Washington', 'UT', '84780-3716', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('f8693525-6cd8-8f0f-3e66-e4c3f1effe5c', 'long-valley-2nd-ward', 'Swaney', 'Wes', 'Swaney', '435-773-8117', 'wesswaney3@gmail.com', '1487 S Ripple Rock Dr', 'Washington', 'UT', '84780-3683', 'family', 2, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('1f248fdc-cfb1-9157-ce8b-01fd3d085b43', 'long-valley-2nd-ward', 'Collins', 'Cashe', 'Collins', '435-229-9647', 'cashecollins@gmail.com', '1885 S Cyclone Dr', 'Washington', 'UT', '84780-3773', 'cross_district', 2, true, 'Cross-district companion; home household in District 1.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('c972d586-f463-443c-1e42-40f078ca0f30', 'long-valley-2nd-ward', 'Benson', 'Nicklas', 'Benson', '801-427-3701', 'nbenson23@outlook.com', '1977 S Wolverine Way', 'Washington', 'UT', '84780-3774', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('5d1938f8-3002-8661-9a98-21f2496984d0', 'long-valley-2nd-ward', 'Brown', 'Jason', 'Brown', '801-420-2461', 'jasonbrown3824@gmail.com', '1915 S Cyclone Dr', 'Washington', 'UT', '84780-3773', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('e3623c5a-9e6e-479f-34a9-9837c404e8d2', 'long-valley-2nd-ward', 'Cahoon', 'Matt', 'Cahoon', '702-217-9164', 'mattcahoon.lds@gmail.com', '1659 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3693', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('6a0b1ef3-8877-689d-332a-21734f0260a7', 'long-valley-2nd-ward', 'Christiansen', 'Treyson Russell', 'Christiansen', '435-231-1212', 'd00336276@dmail.dixie.edu', '1745 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('cd55f23f-cfe5-39f1-6b8f-0062b52b4ee2', 'long-valley-2nd-ward', 'Petersen', 'Ryan', 'Petersen', '435-406-9458', 'petersen.430.93@gmail.com', '1864 Tower Bridge Dr', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('7ff75233-28ff-004b-a3de-7b4000b485e1', 'long-valley-2nd-ward', 'Durrant', 'David Arthur', 'Durrant', '801-854-8630', 'david.durrant16@gmail.com', '1761 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3717', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('9fd43650-ee63-98be-e72f-b55cbacc24ec', 'long-valley-2nd-ward', 'Warner', 'Tyler', 'Warner', '435-705-3942', 'warner.tyler42@gmail.com', '1939 S Wolverine Way', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('78e63355-5a53-4e19-23f9-c232b2cfa677', 'long-valley-2nd-ward', 'Wynne', 'Colton', 'Wynne', '435-709-1257', 'coltonwynne3@gmail.com', '1857 Tower Bridge Dr.', 'Washington', 'UT', '84780-3635', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('8dfb98a0-3f1c-f80d-9526-bb971925b8da', 'long-valley-2nd-ward', 'Adair', 'Zach', 'Adair', '435-414-4175', 'zack.m.adair@gmail.com', '1954 S Swamp Mesa Dr', 'Washington', 'UT', '84780-3800', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('1b24f6af-2187-38f2-ed7b-a9d454b8df54', 'long-valley-2nd-ward', 'Bennett', 'Ethan', 'Bennett', '435-215-3683', '21benneethl@gmail.com', '2794 E Fireweed Ln', 'Washington', 'UT', '84780-3885', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('2917b0f6-12ca-5ef6-85a5-af689b1a8481', 'long-valley-2nd-ward', 'Church', 'Braden', 'Church', '435-705-1455', 'bradenchurch@gmail.com', '1625 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3637', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('3e28ab14-21b4-c4b6-e3a3-6a6c6adc81b8', 'long-valley-2nd-ward', 'Searle', 'Colton Ronald', 'Searle', '435-359-8067', 'coltonrs@icloud.com', '1692 S DEVILS GARDEN LN', 'Washington', 'UT', '84780-3716', 'family', 3, true, 'Bernardo (Morgan) listed under Searle household.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('56f81e61-debc-0b7a-3c43-f50d4f756540', 'long-valley-2nd-ward', 'Rigby', 'Elijah Todd', 'Rigby', '801-875-9226', 'elirigby70@gmail.com', '1891 S. Swamp Mesa Dr.', 'Washington', 'UT', '84780', 'family', 3, true, 'Second Rigby household (distinct from Stetson Rigby in D2).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('cd832435-e9aa-c09a-1e24-3b2e8beddfc4', 'long-valley-2nd-ward', 'Whittaker', 'Oaken', 'Whittaker', '801-580-2266', 'oakwhid@gmail.com', '1520 S RIPPLE ROCK DR', 'Washington', 'UT', '84780-3685', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('8e3ddb75-1764-18e4-e9a5-7a82f0961f95', 'long-valley-2nd-ward', 'Owen', 'Jason', 'Owen', '702-275-9168', 'jmowen1605@gmail.com', '1605 S Star Springs Dr', 'Washington', 'UT', '84780-3636', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('597fbe93-5915-e7a6-d442-8d94017c5335', 'long-valley-2nd-ward', 'Hale', 'Jaxon', 'Hale', '435-841-7538', 'halejaxon@gmail.com', '1881 S Tower Bridge Dr.', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('5221cacf-b1a7-7de9-5667-e976993bdc9c', 'long-valley-2nd-ward', 'Sorenson', 'Cody', 'Sorenson', '909-528-8330', 'cjsorenson88@gmail.com', '1595 S WAGON BOX WAY', 'Washington', 'UT', '84780-3691', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('0ea46ddc-c8c5-41ee-ab65-5df940166fba', 'long-valley-2nd-ward', 'Chevez Solano', 'Blaine', 'Chambers', '801-708-2948', 'blainechambers9@gmail.com', '1856 S WOLVERINE WAY', 'Washington', 'UT', '84780-3718', 'family', 3, true, 'PDF household header ''Chevez Solano''; members listed as Chambers.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('aa873951-0055-9125-2e3e-55eab20ff000', 'long-valley-2nd-ward', 'Robinson', 'Travis', 'Robinson', '435-590-9681', 'robinson.travis20@gmail.com', '1728 Devils Garden Lane', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('95cf38eb-441c-b1f3-4f08-f1f2e898490d', 'long-valley-2nd-ward', 'Barden', 'Kory Andrew', 'Barden', '949-209-7255', 'kory.barden@gmail.com', '1729 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('a3921486-cd74-7041-ba4d-96388e29f409', 'long-valley-2nd-ward', 'Echols', 'Preston', 'Echols', '360-742-2445', 'prestonechols54@gmail.com', '1554 S Wagon Box Way', 'Washington', 'UT', '84780-3635', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('86119c2f-223a-f8e2-1b03-70db2b935cc7', 'long-valley-2nd-ward', 'Stewart', 'Dane', 'Stewart', '435-899-9182', 'dstewy14@gmail.com', '1721 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3717', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('4b48a0b7-b245-eedc-b983-1e859b042f57', 'long-valley-2nd-ward', 'Poulsen', 'Jenna', 'Cary', '435-256-1408', 'wbeagle61@yahoo.com', '1873 S. Tower Bridge Dr.', 'Washington', 'UT', '84780', 'family', 3, true, 'Complex multi-family household; PDF header ''Poulsen'' but no Poulsen-named member listed.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('ccf5b116-bc9a-dff0-c551-5677eaa5df21', 'long-valley-2nd-ward', 'Ricks', 'Austin', 'Ricks', '801-413-9936', 'austinkricks@gmail.com', '1881 S WOLVERINE WAY', 'Washington', 'UT', '84780-3718', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('af8ffd8a-b6a8-9005-f108-0a5784ff559f', 'long-valley-2nd-ward', 'Fernquist', 'Joshua', 'Fernquist', '660-525-7909', 'jrfernquist812@gmail.com', '1890 S. Swamp Mesa', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('66678c68-fb4e-daff-e47b-82b99cfd4b99', 'long-valley-2nd-ward', 'Stoor', 'Dawson John', 'Stoor', '435-704-8210', 'foxrider570@gmail.com', '1698 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 3, true, 'Warren (Macie) listed under Stoor household.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('1efae190-8a4c-6832-5303-c0b27286f467', 'long-valley-2nd-ward', 'Sorensen', 'Hyrum', 'Sorensen', '435-680-7353', 'hyrumgary@gmail.com', '2957 E Corral Hollow Dr', 'Washington', 'UT', '84780-3756', 'family', 3, true, 'PDF spells ''Sorensen'' (vs ''Sorenson'' for Cody).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('7e7cfa06-40af-b0f8-5183-1192656fec18', 'long-valley-2nd-ward', 'Wood', 'Shawn Kirtpatrik', 'Wood', '702-979-0759', 'shawnkwoody@gmail.com', '1566 S Wagon Box Way', 'Washington', 'UT', '84780-3691', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('e2068bea-f1a6-80b3-0f3a-731b6ea65161', 'long-valley-2nd-ward', 'Cranney', 'Dale', 'Cranney', '801-694-0606', 'dalecranney@yahoo.com', '1568 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'single', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('947548b6-ecf0-e510-f567-4e02c385da0a', 'long-valley-2nd-ward', 'Smith', 'Trent', 'Smith', '435-772-5397', 'trentpsmith1993@gmail.com', '1470 S Ripple Rock Dr', 'Washington', 'UT', '84780-3683', 'family', 3, true, 'First Smith household in D3.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('72233b62-36ba-6fc1-c336-6b0fc10a838c', 'long-valley-2nd-ward', 'Child', 'Cody', 'Child', '385-243-0519', 'codychild2@gmail.com', '1535 Ripple Rock Drive', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('338fab7c-c330-64f7-7202-9fbe46011b3a', 'long-valley-2nd-ward', 'Ruben', 'Adam', 'Ruben', '801-709-8359', 'adamjruben@gmail.com', '1586 S WAGON BOX WAY', 'Washington', 'UT', '84780-3691', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('d0d40b44-32a1-6318-502a-c0ef239cf642', 'long-valley-2nd-ward', 'Burrows', 'Helaman', 'Burrows', '801-636-4789', 'burrowshs@gmail.com', '1736 S DEVILS GARDEN LN', 'Washington', 'UT', '84780-3716', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('72783bd6-ce71-7341-0c8d-507d88fce34d', 'long-valley-2nd-ward', 'Petersen', 'Chalise Geneal', 'Petersen', '801-687-2733', 'chpeter12@gmail.com', '2921 E CORRAL HOLLOW DR', 'Washington', 'UT', '84780-3756', 'family', 3, true, 'Second Petersen household in D3; single-parent (Chalise is head).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('5560106d-b6f9-e202-812e-e4dc9a51f2db', 'long-valley-2nd-ward', 'Calkins', 'Sean Patrick', 'Calkins', '435-773-0125', 'spcfamily@gmail.com', '1748 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'single', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('d0f233f4-1389-a201-15b3-9a93f4aab7fb', 'long-valley-2nd-ward', 'Smith', 'Ben', 'Smith', '801-698-8108', 'bensmith.yyc@gmail.com', '1847 Cyclone Dr.', 'Washington', 'UT', '84780', 'family', 3, true, 'Second Smith household in D3.') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('6b0e614b-0aa3-f296-b325-07e2804fa89b', 'long-valley-2nd-ward', 'Brewer', 'Bradley Nelson', 'Brewer', '435-669-3834', 'brewer01@gmail.com', '1721 S Cedar Mesa Dr', 'Washington', 'UT', '84780-3717', 'single', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('571138ad-f632-f261-5a2c-dae1e7adae09', 'long-valley-2nd-ward', 'Cloward', 'Nicholas J', 'Cloward', '801-546-7468', NULL, '1863 South Cyclone Drive', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('02f8ae19-5102-c5f5-e8f4-6f7ee539f675', 'long-valley-2nd-ward', 'Nish', 'Jennifer', 'Nish', '801-244-2141', 'mrsjennynish@gmail.com', '1752 S Devils Garden Ln', 'Washington', 'UT', '84780-3716', 'family', 3, true, 'Single-parent household (Jennifer is head).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('9d433a58-3b7c-c1c5-54a1-e4e14cc0a23d', 'long-valley-2nd-ward', 'Bryan', 'Sean', 'Bryan', '520-445-1256', 'bry13006@gmail.com', '1450 S Ripple Rock Drive', 'Washington', 'UT', '84780', 'family', 3, true, 'Presidency member (District 3 president).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('4d1b606b-ece3-18af-8d7e-a13a77eed5b9', 'long-valley-2nd-ward', 'Patterson', 'Rey', 'Patterson', '435-773-8968', 'rpatter9@gmail.com', '1580 S WAGON BOX WAY', 'Washington', 'UT', '84780-3691', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('19945069-4cf4-54ac-36c3-c110051294a5', 'long-valley-2nd-ward', 'Gulbranson', 'Garyn', 'Gulbranson', '801-995-2173', 'gklarke@gmail.com', '1879 South Swamp Mesa Drive', 'Washington', 'UT', '84780', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('ec60552f-c9fc-0f66-060e-331687371f5e', 'long-valley-2nd-ward', 'Pettus', 'Daniel', 'Pettus', '435-668-1731', 'dannypettus3@gmail.com', '1953 S Swamp Mesa Dr', 'Washington', 'UT', '84780-3800', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('b65106c3-12e8-6491-41be-3008ea0e7a0f', 'long-valley-2nd-ward', 'Chollet', 'Cole', 'Chollet', '435-218-1455', 'cole.chollet1@gmail.com', '1526 S Ripple Rock Dr', 'Washington', 'UT', '84780-3685', 'family', 3, true, 'Presidency member (District 1 president; his household is ministered to in District 3).') ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('2d560cd4-1668-6171-7bfa-d5c4df49fbca', 'long-valley-2nd-ward', 'Russell', 'Chase', 'Russell', '970-901-4424', 'cruss15@gmail.com', '1613 S Ripple Rock Dr', 'Washington', 'UT', '84780-3686', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('db57b5e7-a251-2bc9-84bb-9c955b161ada', 'long-valley-2nd-ward', 'Bringhurst', 'Wade', 'Bringhurst', '435-773-5215', 'skipperwade12@gmail.com', '1508 S RIPPLE ROCK DR', 'Washington', 'UT', '84780-3685', 'family', 3, true, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO households (id, ward_slug, family_name, head_first_name, head_last_name, head_phone, head_email, address, city, state, zip, category, district_number, active, notes) VALUES
  ('bb528df4-adac-0dfd-946f-176fc9a753c3', 'long-valley-2nd-ward', 'Bell', 'Jordan', 'Bell', '801-388-0153', 'jordanbell@designanywhere.org', '1898 South Tower Bridge Dr.', 'Washington', 'UT', '84780', 'cross_district', 3, true, 'Cross-district companion; home household in District 1.') ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- Household members (head included as a member)
-- -------------------------------------------------------------
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f2154752-e28d-9316-9710-2c4f22f6e49c', '96645ab5-1a42-5175-dc02-23b9d9522cfd', 'Luke', 'Evans', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('64a2fd0f-a880-4cbc-b673-195c0762a47e', '96645ab5-1a42-5175-dc02-23b9d9522cfd', 'Bailey', 'Evans', 'F', '2 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d8c20f5b-10c4-5932-d4ba-1da29accbff5', 'd0fd944c-488e-184e-8a44-88249d2c51d7', 'Ryan', 'Mann', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8f39834f-7a63-581a-c96c-c9d944fdf511', 'd0fd944c-488e-184e-8a44-88249d2c51d7', 'Zoe Ann', 'Mann', 'F', '8 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('25eecc6c-75f3-71c3-d06c-1c20c10923cf', 'd0fd944c-488e-184e-8a44-88249d2c51d7', 'Ivy Ann', 'Mann', 'F', '25 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d0446d3f-8cca-c8ae-b954-e963811c5152', '22775cfa-5412-5486-7448-44238101f704', 'Kashden', 'Walker', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('593ef9c4-68d0-d890-2dfc-f852a73e7e10', '22775cfa-5412-5486-7448-44238101f704', 'Abby Marie', 'Walker', 'F', '14 Oct', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('61cb79ca-77e3-5cfe-d042-f85f1249cf19', '22775cfa-5412-5486-7448-44238101f704', 'Wrenlee', 'Walker', 'F', '12 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('12f42a3e-599c-ad77-b837-9a57fc1a9337', '22775cfa-5412-5486-7448-44238101f704', 'Ozzlynn Marie', 'Walker', 'F', '2 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('abea49a8-01dd-8097-40c2-130a9874d761', '22775cfa-5412-5486-7448-44238101f704', 'Wrenlee D', 'Walker', 'F', '12 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f102ecdf-45c3-120b-996b-f6503d99f3f1', '73ab2d85-5755-8d29-97aa-acb36b9142b6', 'Cashe', 'Collins', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9b37880b-f3f3-3e94-9b53-564f7809e826', '73ab2d85-5755-8d29-97aa-acb36b9142b6', 'Dana Emily', 'Collins', 'F', '14 Jan', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0da83dff-c15a-4848-b8d0-b8db92b7a6cd', '73ab2d85-5755-8d29-97aa-acb36b9142b6', 'Jack Edward', 'Collins', 'M', '12 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1344d13f-51c4-3fa2-40a1-cb48663f8193', 'a006d811-ce8b-3709-724b-25cfec5aeb5c', 'Cody', 'Bond', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('71684b2a-f31e-ddba-120b-d58508cc574e', 'a006d811-ce8b-3709-724b-25cfec5aeb5c', 'Coryn Margaret Leutogi Taualii', 'Bond', 'F', '8 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3cdc9c11-d606-99ac-1f16-75ffdf6f7911', 'a006d811-ce8b-3709-724b-25cfec5aeb5c', 'Easton James Taualii', 'Bond', 'M', '18 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f4348596-779a-948d-1517-1306cb7fdbc1', 'a006d811-ce8b-3709-724b-25cfec5aeb5c', 'Dawson Juelen Lalomalava', 'Bond', 'F', '13 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('874fd640-04b1-0271-2b70-a56ce57fb199', 'a006d811-ce8b-3709-724b-25cfec5aeb5c', 'Titan Turner Opapo', 'Bond', 'M', '29 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3a29fcf8-5cc5-d34f-9982-613d1311928b', 'a006d811-ce8b-3709-724b-25cfec5aeb5c', 'Layton Ruth Leutogi', 'Bond', 'F', '6 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f67afa33-930a-91fe-6afc-7e50d3fdd9b7', 'fa7cbbc2-1407-d763-a2eb-d89d687a7749', 'Matt', 'Clark', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('93b96073-caa6-7121-bf7e-b802765a467d', 'fa7cbbc2-1407-d763-a2eb-d89d687a7749', 'McKell', 'Clark', 'F', '14 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7389432d-7e7b-e5c0-dac8-134fa5f876c8', 'fa7cbbc2-1407-d763-a2eb-d89d687a7749', 'Ryker Thomas', 'Clark', 'M', '11 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('38e0de38-d999-7cf0-b03e-b309492fab7e', '0759fc18-cde9-8319-3159-682d5f89fa8e', 'Donald Brad', 'Crichton', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c4c06a3a-0b02-c7ab-8f42-5028f53f3440', '0759fc18-cde9-8319-3159-682d5f89fa8e', 'Casie Dee', 'Crichton', 'F', '21 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4fe497bd-5840-c9f4-3bd8-70a06a6f5fba', '0759fc18-cde9-8319-3159-682d5f89fa8e', 'Anthony Clark Iakopo', 'Crichton', 'M', '2 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c517ffed-42ee-f2ff-ceff-caef5f3d57b6', '0759fc18-cde9-8319-3159-682d5f89fa8e', 'Brian', 'Crichton', 'M', '24 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4e0c0a5d-d3d9-97c4-75ca-0cd75ec46d60', '0759fc18-cde9-8319-3159-682d5f89fa8e', 'Teuila Tiare', 'Crichton', 'F', '6 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4a501e71-3b31-cd1f-5bf9-e36d66b53f88', 'beb7c01e-dede-b84f-4359-9b6b07e1bd30', 'Ben', 'Sharp', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f2cc6375-a3a1-0159-4998-f29670c1579d', 'beb7c01e-dede-b84f-4359-9b6b07e1bd30', 'Jayden Ilean', 'Sharp', 'F', '24 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('36e267fb-72ff-e58b-4e39-e179cb9a4772', 'beb7c01e-dede-b84f-4359-9b6b07e1bd30', 'Bronson Mack', 'Sharp', 'M', '22 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a133ab8f-d641-9a00-76ee-80ee5717243b', 'beb7c01e-dede-b84f-4359-9b6b07e1bd30', 'Wren Hazel', 'Sharp', 'F', '3 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('164d8e0a-e9df-bb70-4606-62a0389da8b5', 'ccc4acd2-9612-56b6-e698-9c7a7eebe07d', 'Izaic', 'Blazzard', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a4703331-310c-ba1e-f31a-3501af0511ae', 'ccc4acd2-9612-56b6-e698-9c7a7eebe07d', 'Hannah', 'Blazzard', 'F', '19 Dec', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('45e8110c-156e-ce60-d447-54edcf0afa57', 'ccc4acd2-9612-56b6-e698-9c7a7eebe07d', 'Sullivan James', 'Blazzard', 'M', '12 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ce26f772-4f4e-4aec-9bb1-aa3040b181f6', 'ccc4acd2-9612-56b6-e698-9c7a7eebe07d', 'Juniper Ann', 'Blazzard', 'F', '3 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3439dff1-172a-117d-5ec2-23f3ef35337a', 'ccc4acd2-9612-56b6-e698-9c7a7eebe07d', 'Iverson Max', 'Blazzard', 'M', '19 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('21cac6bd-9276-be59-c632-e36e6041e76b', 'ccc4acd2-9612-56b6-e698-9c7a7eebe07d', 'Eleanor Rose', 'Blazzard', 'F', '19 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('46fcb4cb-ef04-25aa-1adc-e1b60cff6ff9', 'eef19663-4883-2e3b-fe5a-2ab09698a25c', 'Shane Joseph', 'Wright', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fafc1a97-d523-c823-7e1e-6bc34db5596b', 'eef19663-4883-2e3b-fe5a-2ab09698a25c', 'Mindy', 'Wright', 'F', '9 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('76ff2f91-ea4e-84b5-321f-778770384010', 'eef19663-4883-2e3b-fe5a-2ab09698a25c', 'Titan Shane', 'Wright', 'M', '20 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('773054a0-c55c-117f-88b8-90be73613fea', 'eef19663-4883-2e3b-fe5a-2ab09698a25c', 'Haven Grace', 'Wright', 'F', '12 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7fe3c92e-c1bb-dd6f-a281-0a1cb240d5bc', '8f9ec472-114b-9234-d910-2eabab4519ab', 'Kevin', 'Dunyon', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('30659910-c366-5987-4d57-fbd39ea31593', '8f9ec472-114b-9234-d910-2eabab4519ab', 'Mariah Lee', 'Dunyon', 'F', '3 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b7898062-6ca7-4d64-64e4-fb55cbd26c2e', '8f9ec472-114b-9234-d910-2eabab4519ab', 'Avery Mae', 'Dunyon', 'F', '10 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2d38c87a-4a00-88fc-b2d7-e53825778a3a', '8f9ec472-114b-9234-d910-2eabab4519ab', 'Emmett Thomas', 'Dunyon', 'M', '28 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dcc6a305-e897-a54c-d631-0ab7da63a6b2', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'Jared', 'Everitt', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('61264e7e-727c-bd22-fdfe-6d850e7ca3b0', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'Ashley', 'King', 'F', '2 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('56d949e3-5bc0-cdfb-df37-845214562812', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'Bryton', 'King', 'M', '4 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2211f81d-6977-d000-1206-6bb3ee210d65', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'Brylee', 'King', 'F', '4 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('90185610-d883-fb9a-0426-cad3beb29801', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'Raegan Lucy', 'King', 'F', '8 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e7312fdd-e07d-7d20-55ee-eb449137bc42', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'Rowan Michael', 'King', 'M', '15 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('edcd4215-34cf-3aff-88d5-2faf98424155', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265', 'Cougar Braxton', 'King', 'M', '19 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('cbaf57bd-e17a-f45f-0671-54e45185ec56', 'e9313d29-8897-6b23-df6a-f6ad681881c8', 'Kenneth Taylor', 'Thompson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('906d7623-d9a3-296c-b029-24ee46e55f40', 'e9313d29-8897-6b23-df6a-f6ad681881c8', 'Hannah Katherine', 'Thompson', 'F', '22 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('07ec84aa-bc57-7365-2db4-f2a06e13cdd5', 'e9313d29-8897-6b23-df6a-f6ad681881c8', 'Annie Lynne', 'Thompson', 'F', '10 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c3654479-544a-c429-63ca-66e9be89437c', '3528dc69-9aa7-f86b-8e31-ee15dd6785af', 'Wyatt', 'Miles', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8ad88c71-a00e-4a99-3e39-eb4ee0f79296', '3528dc69-9aa7-f86b-8e31-ee15dd6785af', 'Launi', 'Miles', 'F', '8 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('48d4950e-5510-7039-6265-9711fd741c03', '3528dc69-9aa7-f86b-8e31-ee15dd6785af', 'Bridger', 'Miles', 'M', '25 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6fcd8e8b-9cdc-0d2c-1201-af2e6e577045', '3528dc69-9aa7-f86b-8e31-ee15dd6785af', 'Braden', 'Seaich', 'M', '26 Sep', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7407d8f3-f1f0-2e66-fbb1-6c531419e5f8', '3528dc69-9aa7-f86b-8e31-ee15dd6785af', 'Bowden', 'Miles', 'M', '30 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7d5a22b3-3891-0062-37ed-1b7869815cbc', '3528dc69-9aa7-f86b-8e31-ee15dd6785af', 'Brinley', 'Miles', 'F', '19 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6ffff034-eb58-3e2b-0f00-f90439e7f1de', '16dd67cc-a1df-f41b-5f35-5b0a70a38b5b', 'Matthew', 'Nielson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c10203f5-d6bb-d063-ba06-5cbe583ca088', '16dd67cc-a1df-f41b-5f35-5b0a70a38b5b', 'Madison Marie', 'Nielson', 'F', '8 Mar', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ed40b712-7fd9-94c7-65ee-0e3ef1260b80', '16dd67cc-a1df-f41b-5f35-5b0a70a38b5b', 'Janae Marie', 'Nielson', 'F', '3 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4849ff55-8cb8-afb5-1ba5-07e7cf0e3181', '16dd67cc-a1df-f41b-5f35-5b0a70a38b5b', 'Jonah Brady', 'Nielson', 'M', '3 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d3bf9f42-ae1c-bc88-a249-e0c0effac4b3', '20bc3941-dd22-64b4-91e1-d8d6c4c4210b', 'Jordan', 'Bell', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c1bd6bff-4e03-1312-3e91-8d28ed425f5e', '20bc3941-dd22-64b4-91e1-d8d6c4c4210b', 'Kendall Morgan', 'Bell', 'F', '19 Jan', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('30de5faa-ea56-78cd-b1f5-6ad7cc714b42', '20bc3941-dd22-64b4-91e1-d8d6c4c4210b', 'Gwen Analynn', 'Bell', 'F', '26 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e247fa2b-545a-5d04-b644-d26d45fe162c', '20bc3941-dd22-64b4-91e1-d8d6c4c4210b', 'Jack Anthony', 'Bell', 'M', '28 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c63f8ff0-9808-fc71-0ec1-3b225c76074e', 'f2551914-7a7e-e51e-e2d9-adb372efcbaf', 'Patrick', 'Lynch', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b464b485-d1e2-9471-0d27-11d70c6b9a1f', 'f2551914-7a7e-e51e-e2d9-adb372efcbaf', 'Christina', 'Lynch', 'F', '1 Feb', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e0d9a452-db6d-9760-c9ae-58abcba43399', 'f2551914-7a7e-e51e-e2d9-adb372efcbaf', 'Scout Addison', 'Lynch', 'F', '4 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('23bee822-f46f-89fe-3e55-e675394e5c6e', 'f2551914-7a7e-e51e-e2d9-adb372efcbaf', 'Peyton Royal', 'Lynch', 'M', '15 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('628aa29b-4fe7-7a7c-61b5-5dcd31235d45', 'f2551914-7a7e-e51e-e2d9-adb372efcbaf', 'Caleb', 'Lynch', 'M', '22 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('bcaf860c-5fd6-05ce-de57-61aaac52bca1', '098864cc-a55c-ad94-ce72-8555680b377d', 'Kroy Lance', 'Bott', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2d154d75-3b85-440c-c9ee-cf3d358488cc', '098864cc-a55c-ad94-ce72-8555680b377d', 'Allie Marie', 'Bott', 'F', '18 Oct', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4a6ff908-79db-a708-1ce0-59e18b9dcac6', '098864cc-a55c-ad94-ce72-8555680b377d', 'Luna Marie', 'Bott', 'F', '8 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6fc7f0f5-33cd-27c3-aabb-47a72ecb8dec', '1cc82462-4f9b-8d6a-b063-64a8fa947efd', 'Ethan', 'Adams', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ae10d72d-fec3-3936-b6ab-c580aa8798c6', '1cc82462-4f9b-8d6a-b063-64a8fa947efd', 'Beth', 'Adams', 'F', '14 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('75e313dc-59ce-f5e1-bc61-8e9eb4cc2483', '1cc82462-4f9b-8d6a-b063-64a8fa947efd', 'Everett Sterling', 'Adams', 'M', '31 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e8adfc8e-f44f-5774-fa04-f21f64648d73', '1cc82462-4f9b-8d6a-b063-64a8fa947efd', 'Masie Beth', 'Adams', 'F', '6 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e37a27af-d386-08c3-5c03-7b3ecd4c9607', '925b246b-7534-0602-dd05-b23f2f156ba3', 'Rodney James', 'Aycock', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9ee23352-741d-88fd-c9ea-c0f51cef43fb', '925b246b-7534-0602-dd05-b23f2f156ba3', 'Kristy', 'Aycock', 'F', '8 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('efc840a5-5c44-3367-81ce-e0f4ad21fe14', '925b246b-7534-0602-dd05-b23f2f156ba3', 'Kylen Robert', 'Aycock', 'M', '2 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fd2d33c2-deab-344d-4e34-3906d8f5e55c', 'f9cb24b7-7998-9e5d-0724-1d5d244efffd', 'Bryce', 'Kealer', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('af327e04-efa0-6174-7e26-68987c2a6ab3', 'f9cb24b7-7998-9e5d-0724-1d5d244efffd', 'Abbie Marissa', 'Kealer', 'F', '19 Jan', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('daa6ec48-20b3-1a38-6a1b-ee7779e3a2a7', 'f9cb24b7-7998-9e5d-0724-1d5d244efffd', 'Quin Avery', 'Kealer', 'F', '13 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('134bcc8d-ddce-f6fa-0f2c-4f8ce128881e', 'f9cb24b7-7998-9e5d-0724-1d5d244efffd', 'Remi Drew', 'Kealer', 'F', '26 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2abf8b41-73c6-0667-91f0-c65112e97ffd', 'bd8d05e4-b77a-c4fa-5978-f09cd663ef2a', 'Austin', 'Behymer', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a934bb25-6d45-02c1-414d-7bd16f747ede', 'bd8d05e4-b77a-c4fa-5978-f09cd663ef2a', 'Karla Gabriela', 'Behymer', 'F', '12 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7078b50b-53f7-f7cc-6cfd-554c12673772', 'bd8d05e4-b77a-c4fa-5978-f09cd663ef2a', 'Nathaniel Ace Wesson', 'Behymer', 'M', '8 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c38ea955-0e54-9214-ea9f-31ca0d82f750', 'b326bcbd-8436-6fa4-cd7c-0539ab8f8c1b', 'Carter', 'Davis', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2ab613be-9f48-363e-ce0e-bfb3e809cf97', 'b326bcbd-8436-6fa4-cd7c-0539ab8f8c1b', 'Madison Kathleen', 'Davis', 'F', '10 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e927ce38-7db9-f5d5-29c3-45d1013b8a2d', 'fade445d-9cac-cf1d-137e-9d36d9c453be', 'Cody Dean', 'Brady', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9b71b4bf-29c2-0635-4a12-a715998d2f24', 'fade445d-9cac-cf1d-137e-9d36d9c453be', 'Brittney', 'Brady', 'F', '13 Dec', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fccb2301-2377-d5aa-dc07-1348ab6267e9', 'fade445d-9cac-cf1d-137e-9d36d9c453be', 'Jaxon Terry', 'Anderson', 'M', '18 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7965f56b-f747-d456-60b0-a9a018604424', '3aaa65a4-ec5c-0740-0d0a-fcf4620c7cba', 'Zander', 'Gates', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0ad36fc5-0a06-cd04-6080-1e11feec9de1', '3aaa65a4-ec5c-0740-0d0a-fcf4620c7cba', 'Ciara Camille', 'Gates', 'F', '22 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3f800c0a-4b12-b8a0-8c58-d25c0674a0e3', '3aaa65a4-ec5c-0740-0d0a-fcf4620c7cba', 'Evie James', 'Gates', 'F', '1 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('66d4b4af-806d-eddf-4647-52d531e8d082', 'f17c0a87-d6a7-9b1e-0e29-1e01b3986186', 'William John', 'Valadez', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3a9d4116-72c8-d57a-86f7-c853559742f0', 'f17c0a87-d6a7-9b1e-0e29-1e01b3986186', 'Chloe Nicole', 'Valadez', 'F', '20 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a090a85f-70fa-895f-9c62-34d105a1566c', 'a87985b5-cb47-8f33-66ac-356bc5f90f1e', 'Kamilie', 'Billingsley', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('acdcc816-c887-3ecc-6a36-6536a41d3624', 'a87985b5-cb47-8f33-66ac-356bc5f90f1e', 'Ezra James', 'Billingsley', 'M', '7 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5328fef8-d8c6-df81-41d4-3f032bd93ed9', 'a87985b5-cb47-8f33-66ac-356bc5f90f1e', 'Hattie Ann', 'Billingsley', 'F', '28 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('946e9919-d7c0-15e1-3af0-bf9e304c091c', 'a87985b5-cb47-8f33-66ac-356bc5f90f1e', 'Millie May', 'Billingsley', 'F', '28 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a42ad71d-0d50-d0f0-77c6-6619aa847b03', '7d6e4b1e-f6f0-7498-eed0-f6a8090e1ef7', 'Ryan', 'Goodall', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('99fb3025-8d85-7ac9-f2bf-a9a98a5d88ed', '7d6e4b1e-f6f0-7498-eed0-f6a8090e1ef7', 'Viviana', 'Goodall', 'F', '8 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('301c2bb1-a364-ff6d-4940-bfb7eff7c16c', 'b94b2c4e-caad-e475-d021-ba1cdd1e2d63', 'Kylie Michelle', 'Parker', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('32e46192-3956-7147-d224-bc38d2c4209d', 'b94b2c4e-caad-e475-d021-ba1cdd1e2d63', 'Tate Liam', 'Johnson', 'M', '14 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7644c991-0b31-cd2c-4634-c5c7e0c45d5d', 'b94b2c4e-caad-e475-d021-ba1cdd1e2d63', 'Mia Grace', 'Johnson', 'F', '21 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e6163c15-f39a-0c1f-aa51-9068f458353f', 'b94b2c4e-caad-e475-d021-ba1cdd1e2d63', 'Axton Taylor', 'Johnson', 'M', '20 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d54ef8a6-6e21-0406-28f4-6a6d8dbe4e50', '20d5610c-ed05-097f-bad6-abac3577d334', 'Sherry', 'Bistline', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1a2ec2da-bb00-10fd-c777-b85f45123bb2', '20d5610c-ed05-097f-bad6-abac3577d334', 'Brianna', 'Carrington', 'F', '18 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c9145954-c6e5-e8b6-9b94-08bde4c00862', '20d5610c-ed05-097f-bad6-abac3577d334', 'Makayla', 'Carrington', 'F', '28 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('50e9514c-d7b6-a91d-c46b-6f40857d5a89', '20d5610c-ed05-097f-bad6-abac3577d334', 'Jacob', 'Carrington', 'M', '20 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('794ff513-df14-b259-8f2b-ccc0a64a2eb6', 'fd2275b5-65ee-cb22-9b79-b4367edbe104', 'Amanda', 'Mayfield', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2cb5fd02-01b9-0bcc-51b4-8286987d395a', '2ba5f0cd-11f9-d1f1-a706-a8dcee17bc15', 'Tyler', 'Baker', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('251b40da-c0af-1957-fef4-4672495cb99f', '2ba5f0cd-11f9-d1f1-a706-a8dcee17bc15', 'Ariel', 'Baker', 'F', '22 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('827bb2b8-caf3-c159-f37e-6290233a4e36', '2ba5f0cd-11f9-d1f1-a706-a8dcee17bc15', 'Arthur Chase', 'Baker', 'M', '1 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('866f30f1-fc56-c884-938a-7d21e7df6eb4', '2ba5f0cd-11f9-d1f1-a706-a8dcee17bc15', 'Peter', 'Baker', 'M', '15 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('11b14453-9fbf-68e9-c365-7d4a05ccc7d2', '2ba5f0cd-11f9-d1f1-a706-a8dcee17bc15', 'Ruby', 'Baker', 'F', '29 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3345a3af-98e3-7be1-5ee5-35ef276d88cd', '9e55f014-608f-51ad-3514-4b5ce700aa40', 'Raymond Eric', 'Klawitter', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('79ab4dba-cec4-9bb4-1c69-06e9d61fc551', '9e55f014-608f-51ad-3514-4b5ce700aa40', 'Candace', 'Klawitter', 'F', '15 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e5f3c992-4b16-93fa-5344-544c5cd6a6f0', '9e55f014-608f-51ad-3514-4b5ce700aa40', 'Isela Michelle', 'Klawitter', 'F', '6 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4befda7c-da7f-c4c9-a5cd-c836e3462e31', '9e55f014-608f-51ad-3514-4b5ce700aa40', 'Joshua Bruce', 'Klawitter', 'M', '6 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8d3b0f1f-f88f-fa55-3ccc-989d66e97bb4', 'c3ba71f2-0a74-c29f-f5e5-b0ed47797b32', 'Nick', 'Durst', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a1888f9b-b161-03e1-c0c7-7528c9cb0bae', 'c3ba71f2-0a74-c29f-f5e5-b0ed47797b32', 'Michelle', 'Durst', 'F', '23 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('22cabfed-e668-b46c-80fc-1bd5dc55f6c9', 'c3ba71f2-0a74-c29f-f5e5-b0ed47797b32', 'Eleanor Evelyn', 'Durst', 'F', '14 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9be38216-b821-7d05-5ee5-39454ec9240d', 'c3ba71f2-0a74-c29f-f5e5-b0ed47797b32', 'William Samuel', 'Durst', 'M', '11 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3fb0bc73-a11d-c708-070b-21b971aa1f05', 'c3ba71f2-0a74-c29f-f5e5-b0ed47797b32', 'Avery Sue', 'Durst', 'F', '28 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ce583fab-e12c-30d8-42df-2aee15c4381c', '81f8bbe4-f78e-e78d-50d1-d84128e64122', 'Reese', 'Hicken', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7d1fb9be-f84e-8c5d-296c-aa93c1df6364', 'db1b4adf-7453-633b-c3fc-c3c62f8bd0f5', 'Walker', 'Moore', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('480fc7ab-2cd0-8573-e714-7409a8027e20', 'db1b4adf-7453-633b-c3fc-c3c62f8bd0f5', 'Hanna', 'Moore', 'F', '8 Feb', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f398a4a7-3433-267a-e794-f8165b7c455b', 'db1b4adf-7453-633b-c3fc-c3c62f8bd0f5', 'Jonsie', 'Moore', 'F', '26 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c46bb0a2-f127-ce62-2b44-737e47153baf', 'af595157-1d2d-37cb-8e60-56339d1a00a9', 'Kenneth Mar', 'Bracken', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6c8b1ed9-a2c0-ffe1-ff28-f7e3426527de', 'af595157-1d2d-37cb-8e60-56339d1a00a9', 'Jennifer Lynn', 'Bracken', 'F', '30 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e5564fe9-9842-2194-458a-1e7fe625a109', 'af595157-1d2d-37cb-8e60-56339d1a00a9', 'Kash', 'Bracken', 'M', '27 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5c5c6fb0-951a-8ce4-4a91-cec47fd81788', '2ab130e7-2bee-771a-a254-09bfa275200f', 'Kade', 'Montoya', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e95c3d60-0a47-5f95-eb94-91c150108b6f', '2ab130e7-2bee-771a-a254-09bfa275200f', 'Mary Frances', 'Montoya', 'F', '16 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d9e6906c-17ae-cdbf-b1e2-09a010ac4957', '2ab130e7-2bee-771a-a254-09bfa275200f', 'Charleston Mae', 'Montoya', 'F', '28 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ff4c75b3-1029-36db-bc50-559ea828058a', '2ab130e7-2bee-771a-a254-09bfa275200f', 'Georgiana Kay', 'Montoya', 'F', '17 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8153b205-fcb6-4445-8ba1-9a2d3937e640', '2ab130e7-2bee-771a-a254-09bfa275200f', 'Adelheid Lynn', 'Montoya', 'F', '10 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7557202e-1499-d483-e1b0-6db4b606713c', '583481a1-3cd6-a5f3-4903-981f13301636', 'Jordan', 'Abel', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d8817ceb-e450-bef9-0454-65037afc90ac', '583481a1-3cd6-a5f3-4903-981f13301636', 'Kaylee', 'Abel', 'F', '8 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('966fe472-9da2-7bfc-1496-7203732d2d93', '583481a1-3cd6-a5f3-4903-981f13301636', 'McKenna Jean', 'Abel', 'F', '13 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f941cfb3-3ade-5b65-e630-d27d5093adb2', '583481a1-3cd6-a5f3-4903-981f13301636', 'Addison Kay', 'Abel', 'F', '16 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fc4a6bd7-c9d3-ab40-28e1-a17cd5795cbc', '583481a1-3cd6-a5f3-4903-981f13301636', 'Austin Robert', 'Abel', 'M', '10 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f98c76c0-faf4-98ad-acdd-84757b892ef9', '583481a1-3cd6-a5f3-4903-981f13301636', 'Joslyn', 'Abel', 'F', '14 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dde8591a-ab1a-b0d1-35c1-35190ba8c2bf', '13dcc3a5-c557-454a-2021-c7451d9c0d13', 'Stefany', 'Hunt', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a8b6d717-c5d4-0d4d-476d-bf89cb6720f2', '13dcc3a5-c557-454a-2021-c7451d9c0d13', 'Maverix Kelly', 'Hunt', 'M', '27 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('54982917-901d-4a51-bae0-1f980b4c5436', '13dcc3a5-c557-454a-2021-c7451d9c0d13', 'Roczen Dallas', 'Hunt', 'M', '4 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('20e4aacf-7498-c627-87be-cc88f3d914dd', '13dcc3a5-c557-454a-2021-c7451d9c0d13', 'Zoey Rosalyn', 'Hunt', 'F', '27 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d22df833-3e0f-094f-f191-040b617f8def', '63474269-6e6a-689c-2769-fc25458c740a', 'Nathan Gordon', 'Willard', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e6b80429-7a28-c84d-7124-777a6c3eac9c', '63474269-6e6a-689c-2769-fc25458c740a', 'Sydney Jolie', 'Willard', 'F', '19 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1fe492c7-20ec-3bf5-b681-ad7ae1aed39e', '63474269-6e6a-689c-2769-fc25458c740a', 'Lany LaRose', 'Willard', 'F', '25 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f4ce4109-f086-c582-0b95-dea9da15fbcf', '63474269-6e6a-689c-2769-fc25458c740a', 'Marcus James', 'Willard', 'M', '12 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ec7fd05b-5a16-88d6-26f3-08637db6122a', '9c194d07-9184-4c02-8351-73a3eda25318', 'Matt', 'Cahoon', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9b70571a-5a5f-5f89-f94f-d529efd0e3fa', '3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'Brayden', 'Connole', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('69239827-0983-94bd-efcc-3dc45c7e6c06', '3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'Katelin', 'Connole', 'F', '13 Jan', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2148bbe8-a9d6-a050-76b4-ccc953294b35', '3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'Quinby Everett', 'Connole', 'F', '26 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('76919658-4787-b099-6b24-dfe346bd8e23', '3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'Cordelia Jo', 'Connole', 'F', '4 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('817eea20-0b7b-2ec4-fdcf-ef0c8a76a1b4', '3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'Aila Elizabeth', 'Connole', 'F', '12 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('04d60536-9af0-f54d-ac8e-2d87e3ee1c78', '3dd868f3-5d17-d02b-7e38-e90a3d7994d7', 'Hazel Anne', 'Connole', 'F', '21 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('098debeb-c3c3-f59e-9541-41bd52c2a29a', 'b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'Logan Timothy', 'Slade', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('175c9b2c-8a0b-c600-e3a2-e2304211924b', 'b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'Kacei', 'Slade', 'F', '14 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d06d6d8a-c745-9bbe-5a46-b4ce97c17d4c', 'b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'Ryklynn Mae', 'Slade', 'F', '6 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e44cacdd-f5b9-688b-80e8-8a2e32610dc6', 'b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'Stetsen Jay', 'Slade', 'M', '14 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e215e21f-0801-b144-2157-3cab5baeaaf2', 'b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'Brecken Clay', 'Slade', 'M', '28 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('09f3af6b-c167-04e7-68f9-3a14b415de4f', 'b054d5a9-8be2-1437-3b3f-b17c61da56c0', 'Kaysen Timothy', 'Slade', 'M', '15 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7214e2ce-63af-48fb-f9d0-5f07571c113e', '041cbe74-5fe2-812b-db28-b9bb54997bc7', 'Torsten', 'Bangerter', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('79926883-d535-b3e4-38b2-919f99bb7784', '14fcb729-7b29-0d0f-a7d2-57250359dae6', 'Cole', 'Engemann', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c9afacee-d8eb-5dfb-8206-8cca1320b1ac', '14fcb729-7b29-0d0f-a7d2-57250359dae6', 'Lydia Marguerite', 'Engemann', 'F', '20 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ef9d8c80-27e3-d301-96c7-80549a256dff', '14fcb729-7b29-0d0f-a7d2-57250359dae6', 'Andi Dianna', 'Engemann', 'F', '29 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('384ba05c-ad1f-aefc-f4c3-e083e2890965', '14fcb729-7b29-0d0f-a7d2-57250359dae6', 'Owyn Brittney', 'Engemann', 'F', '27 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a0ae8ba4-698e-5c87-826f-01d28eaccd0e', '14fcb729-7b29-0d0f-a7d2-57250359dae6', 'Ivory Betty', 'Engemann', 'F', '16 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fae4eab5-740c-8564-a9d8-a261fad906bc', '14fcb729-7b29-0d0f-a7d2-57250359dae6', 'Cal Jacoby', 'Engemann', 'M', '17 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('29085733-ed7a-00d4-0756-2e66b4866e44', 'def4dcdf-de94-ba90-8148-782afcb9182e', 'Jared', 'Bayles', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5f8ba757-1583-2982-2405-cb689d8daf8e', 'e12c28e3-8941-4c65-3826-de76a5682579', 'Justine', 'Gallacci', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b66dd343-91ff-b803-d1e8-97ca4ce88014', 'fba76880-9fe0-b5fc-c699-5264a4e4dce7', 'Sydni', 'Hadlock', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('35af1fe3-93b3-4bf4-f131-f5e37d08b20e', 'fba76880-9fe0-b5fc-c699-5264a4e4dce7', 'Knixon', 'Weichers', 'M', '30 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c6d8f387-aa29-7bd2-ba73-0f297a6f0ade', 'ee3f891b-e345-6da6-bfbe-b877f3497d59', 'Benjamin Sidney', 'Hales', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7747cbb7-50c2-1f49-b105-a696654eceb1', 'ee3f891b-e345-6da6-bfbe-b877f3497d59', 'Brooke Lynn', 'Hales', 'F', '27 Feb', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('be2150fe-621c-37dc-37e2-01d3a09b3a11', 'ee3f891b-e345-6da6-bfbe-b877f3497d59', 'Samuel Tucker', 'Hales', 'M', '10 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d2a43e6f-be4a-1c53-2ac9-f509f4024cad', 'ee3f891b-e345-6da6-bfbe-b877f3497d59', 'Ryan Robert', 'Hales', 'M', '26 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5dfc6f7c-c485-56c4-897a-9ab4760582e8', 'f04e79be-cf19-dbed-86de-bf5befe48b00', 'Milli', 'West', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4cb06d2b-3a81-7067-f092-3f90b64f98b9', 'c481e6e2-732d-1eb7-0240-e8e24d2f253e', 'Jacob William', 'Ewell', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4f8845ee-2ba4-f7b3-b250-e91fbaa728b7', 'c481e6e2-732d-1eb7-0240-e8e24d2f253e', 'Lucille Lynne', 'Ewell', 'F', '9 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('89f486bd-4b78-0bee-579a-8f514ae5a676', 'c481e6e2-732d-1eb7-0240-e8e24d2f253e', 'Jay William', 'Ewell', 'M', '18 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('76e53992-1c71-a2e7-1a08-4e1abdc30f2c', 'c481e6e2-732d-1eb7-0240-e8e24d2f253e', 'Clark Allan', 'Ewell', 'M', '21 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f7a39b07-2485-7f6a-be7b-eafb13756230', '0cd029e9-b7ad-a67e-1db7-7ea320c746a1', 'Kyle', 'Sorensen', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c9674418-53f6-4b0b-4ee9-d48daacbc6f5', '0cd029e9-b7ad-a67e-1db7-7ea320c746a1', 'Naomi Eden', 'Sorensen', 'F', '21 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('47a13ccc-ee67-c495-d348-dad7fe4638da', 'c7be6ffe-1b5b-ae99-9891-8ea427f3902f', 'Devin', 'Harris', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('638f7fef-d5fe-564d-c788-6a9029b3c3b2', 'c7be6ffe-1b5b-ae99-9891-8ea427f3902f', 'Alyssa Lynn', 'Harris', 'F', '14 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a12d060f-422b-32f4-4127-90a17a57963b', 'c7be6ffe-1b5b-ae99-9891-8ea427f3902f', 'Chloe Anne', 'Harris', 'F', '23 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7b0b1611-56a0-a5ef-5b2f-bf7d5488874b', 'c7be6ffe-1b5b-ae99-9891-8ea427f3902f', 'Sophie Jane', 'Harris', 'F', '14 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5853e0f4-a86d-35b5-9ce8-74e98559c31d', '2a768d87-a769-7fd9-65ab-e538feac4acf', 'Kason', 'Whitesides', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a761ff1d-226e-19e3-9167-8463bfc66029', '2a768d87-a769-7fd9-65ab-e538feac4acf', 'Emmilyn', 'Whitesides', 'F', '8 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ae785e12-3e29-5396-d366-508cc3129578', '2a768d87-a769-7fd9-65ab-e538feac4acf', 'Hayes Adam', 'Whiteside', 'M', '4 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ea12185a-ed2a-341c-f8f8-914c919231d7', '142fc850-57d9-bfe3-6770-bf7b662b94cf', 'Mckay', 'Hyer', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f91ba9a7-7fdf-310e-2ce9-2a8e7db87eec', '3e2cbc53-a863-beb5-9096-144760305b0f', 'Andrew', 'Lewis', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d9a6ac31-6b47-0720-27a3-7ebadb3d9daa', '3e2cbc53-a863-beb5-9096-144760305b0f', 'Miriam Catrine', 'Lewis', 'F', '9 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ed06539b-4a40-f0ec-610a-4fd3b361007b', '3e2cbc53-a863-beb5-9096-144760305b0f', 'Ingrid', 'Lewis', 'F', '26 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1a2c335e-525d-bd04-a792-fbb93b009efc', '89bf4f9b-5603-9188-7a84-d1df092ab665', 'Kameron', 'Eves', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b3718421-fdb2-dc6c-c6fb-a93ceb208452', '89bf4f9b-5603-9188-7a84-d1df092ab665', 'Alison', 'Eves', 'F', '14 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8c3a55b5-a5df-2e3b-6383-f32f4ee901da', '89bf4f9b-5603-9188-7a84-d1df092ab665', 'Logan Kameron', 'Eves', 'M', '7 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e5ff5c50-7b6e-14b5-5c2d-29c2ddc6b5b4', '89bf4f9b-5603-9188-7a84-d1df092ab665', 'Hannah', 'Eves', 'F', '29 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('18d83008-76b5-74ba-8351-652f06d52fed', '89bf4f9b-5603-9188-7a84-d1df092ab665', 'Abigail Rachelle', 'Eves', 'F', '8 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('cc755910-c291-0a63-e481-416accea10e3', '13197542-44f7-1887-f160-1f744a215afc', 'Bridger', 'Tower', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9aaf2d64-e668-817b-cba0-64f3d224da87', '13197542-44f7-1887-f160-1f744a215afc', 'Rileigh Anne', 'Tower', 'F', '12 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('797fc971-3f16-3bd2-e2ae-d85b7996bc32', '13197542-44f7-1887-f160-1f744a215afc', 'Wave William', 'Tower', 'M', '31 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e71d7d70-ac69-f1f1-e5f0-b7ba471463ae', '34cfd71f-2de3-eec6-a6bc-132739807cf0', 'Landon', 'Fisher', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6f84a9c0-7618-1a47-10ce-69afed4f8e96', '34cfd71f-2de3-eec6-a6bc-132739807cf0', 'Halsey', 'Fisher', 'F', '30 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b68c1ca5-d7af-0263-ccd6-864703f83389', '34cfd71f-2de3-eec6-a6bc-132739807cf0', 'Lola Halsey', 'Fisher', 'F', '21 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ee8b300d-2f67-f440-b89e-6195cd49d5a1', '34cfd71f-2de3-eec6-a6bc-132739807cf0', 'Blaire Collins', 'Fisher', 'F', '10 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('48b13e1f-5838-49d6-14f0-cf679dfbdbd3', '34cfd71f-2de3-eec6-a6bc-132739807cf0', 'Scottie Pacific', 'Fisher', 'F', '14 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('816b4875-8d43-5a3a-96a1-fdb989496337', '03f796ef-ffdd-59ce-0289-4703edd86296', 'Devin', 'Twede', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('73243fee-71df-844c-65d6-adbf6b3fea9c', '03f796ef-ffdd-59ce-0289-4703edd86296', 'Calindy', 'Twede', 'F', '26 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7858018c-5272-da51-3bee-83b31f154cca', '03f796ef-ffdd-59ce-0289-4703edd86296', 'Preston Robert', 'Twede', 'M', '24 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a19fc0a6-2db5-723e-8d89-08a8ef429dcd', 'a830e5da-2d40-9b35-5563-57d4710de655', 'Stetson', 'Rigby', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3f0b44d1-53ad-8654-be71-9d205c61706a', 'a830e5da-2d40-9b35-5563-57d4710de655', 'Morgan Elizabeth', 'Rigby', 'F', '24 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('91a28bb3-c3dc-7ba6-c4b5-4d46597e7e9c', 'a830e5da-2d40-9b35-5563-57d4710de655', 'Kai Stetson', 'Rigby', 'M', '30 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('defeba5c-8528-9b03-aaaa-f7db92aa0fbc', '8c3d73b2-0f68-dd27-1b72-484665f97b8b', 'Warren Robert', 'Wegesend', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('47b4d6ed-1c38-af6a-a3ee-27281fe0bfd1', '8c3d73b2-0f68-dd27-1b72-484665f97b8b', 'Trina', 'Wegesend', 'F', '26 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6099bba3-387a-e744-c746-804b1eed0feb', '1bc3ebdc-7ce9-1de7-509e-710fdcd86f6f', 'Joe', 'Fellmeth', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e184c3a4-cec0-0a9c-47fd-91133caacb7d', '1bc3ebdc-7ce9-1de7-509e-710fdcd86f6f', 'Miranda Danielle', 'Fellmeth', 'F', '10 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('501ec6e4-e557-9848-db69-d2fe9b702033', '1bc3ebdc-7ce9-1de7-509e-710fdcd86f6f', 'Linden Olivia', 'Fellmeth', 'F', '1 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ccb96066-e852-35f2-0dc0-fb4542ed6cc4', 'b947cdba-9413-0b06-4e0f-9e5403476692', 'Kawika', 'Tupuola', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('127b296b-dd92-5566-b647-428c94f5241a', 'b947cdba-9413-0b06-4e0f-9e5403476692', 'Aliza Catherine', 'Tupuola', 'F', '27 Jan', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('84f2518e-e20e-d457-ff1b-81699b335a2b', 'b947cdba-9413-0b06-4e0f-9e5403476692', 'Oriana Sianiu', 'Tupuola', 'F', '30 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c39b92a6-0a4e-feb9-c934-b809238b43fe', 'b947cdba-9413-0b06-4e0f-9e5403476692', 'Ezra Elisapela', 'Tupuola', 'F', '24 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fad066f1-9b0f-f992-ac08-893b7a006b1b', 'b947cdba-9413-0b06-4e0f-9e5403476692', 'Redd Pato Iosefa', 'Tupuola', 'M', '19 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('88e0cba3-96eb-3ccd-74bc-23312e87aa6a', '1fe1f5d3-0beb-b330-7503-e01a61c0df51', 'Dana', 'Hamilton', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('16639e1c-e88c-401f-c27c-93325d5eb713', '1fe1f5d3-0beb-b330-7503-e01a61c0df51', 'Michael', 'Bresciani', 'M', '29 Dec', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('07b487ab-2d2b-0c75-b643-fc3650349950', '03a1e76b-4bfb-fd23-4626-305b8f121ef9', 'Joan Mary', 'Michel', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fdfa9fba-5bfb-f79b-ea33-f2c29acd0ad1', '31b3af33-8507-2c0a-4295-df020ab7205d', 'Phil', 'Wintch', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8ac68a87-ae48-5f0a-e4be-469513d71827', '31b3af33-8507-2c0a-4295-df020ab7205d', 'Elisha', 'Wintch', 'F', '27 Oct', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a098ec08-2993-1115-3dbe-aa895501c2d8', '31b3af33-8507-2c0a-4295-df020ab7205d', 'Evelyn Kanani', 'Wintch', 'F', '12 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('02381304-51d7-f1d5-27aa-7cb7d264867a', '31b3af33-8507-2c0a-4295-df020ab7205d', 'Morgan Henri Kekoa', 'Wintch', 'M', '17 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6c4e24cf-a42d-760d-b6d9-98e3b9eda2f7', '31b3af33-8507-2c0a-4295-df020ab7205d', 'Ethan Kamalu', 'Wintch', 'M', '4 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('64ff946c-f7b9-e10f-36e9-b800da62d599', '31b3af33-8507-2c0a-4295-df020ab7205d', 'Lucas Keahi', 'Wintch', 'M', '13 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e9a39356-10d8-b84b-a3b3-5f3dd68831a1', 'dbec62b0-b4bf-126f-8a8b-93514f794663', 'Branden', 'Edelmayer', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0f66497c-6c9f-986d-aa04-cb54395cc3d9', 'dbec62b0-b4bf-126f-8a8b-93514f794663', 'Lundyn', 'Edelmayer', 'F', '10 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4a262e12-e2d1-c080-af05-c24e8ea487cd', 'dbec62b0-b4bf-126f-8a8b-93514f794663', 'Lucca Paul', 'Edelmayer', 'M', '18 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9dc61ee6-2098-bd96-50e5-a99f83221636', 'd9cc5ead-fb6a-d43a-2e4d-914214d01034', 'Brennan', 'Sanders', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ed21fd39-af86-2d86-90ea-bcec83807561', 'd9cc5ead-fb6a-d43a-2e4d-914214d01034', 'Allison', 'Sanders', 'F', '16 Mar', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9e1f7f06-40c2-f144-3782-b48f42210473', 'd9cc5ead-fb6a-d43a-2e4d-914214d01034', 'Lucy Grace', 'Sanders', 'F', '19 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d39569c4-bf0d-0866-1732-f8dd29d521ec', 'ac4d562f-e880-ef93-e630-47235d35a7e2', 'Lois', 'Stratton', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4af68372-3991-0c47-5817-46ee0f9859be', '9e7edd63-79a4-c542-9eb1-01e51a4a6d34', 'Kyle', 'Gearig', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9ae8bc60-f4ae-b963-38c7-4a241df4d994', '9e7edd63-79a4-c542-9eb1-01e51a4a6d34', 'Meleah', 'Gearig', 'F', '16 Dec', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b8bf5c98-5054-ae68-3537-73618ae4e81f', '9e7edd63-79a4-c542-9eb1-01e51a4a6d34', 'Asher Ray', 'Gearig', 'M', '18 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4fec7309-2f1f-d120-6af6-5df844c8a8b0', 'b237802b-8e0c-9ba6-e142-3a0b6b066afd', 'Christian', 'Walton', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5840b237-0259-7f99-66c6-43ec89b9895d', 'b237802b-8e0c-9ba6-e142-3a0b6b066afd', 'Mary Janelle', 'Walton', 'F', '23 Oct', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1faaadc8-28a1-ab53-aa4c-30ffa4b0f726', 'b237802b-8e0c-9ba6-e142-3a0b6b066afd', 'Amelia Jane', 'Walton', 'F', '3 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9bdbfcbf-aaca-3ca7-d766-f3fedf29d962', 'b237802b-8e0c-9ba6-e142-3a0b6b066afd', 'Adaline Elliot', 'Walton', 'F', '19 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dd1bbc35-7d70-3808-c0e5-cfd130ddfee3', 'b237802b-8e0c-9ba6-e142-3a0b6b066afd', 'Ella Lin', 'Walton', 'F', '14 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8fdcbd60-faa1-cb54-42fa-0dc0fd84755a', 'b237802b-8e0c-9ba6-e142-3a0b6b066afd', 'Hudson William', 'Walton', 'M', '6 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('578f36b4-1b47-f663-a882-ef4969dcdf83', '945b8305-127e-4433-b797-ce066c77f80b', 'Joe', 'Gibbons', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('55248399-fa47-53bd-0565-2c936b09f708', '945b8305-127e-4433-b797-ce066c77f80b', 'Vickie', 'Gibbons', 'F', '30 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('092b1845-65f6-96ad-a618-f64a7a792f9f', '54a9b00a-fd40-ccc9-f544-536b52063bd7', 'Ekana', 'Wegesend', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e6313b6b-a48a-0197-b063-d227281b1a12', '54a9b00a-fd40-ccc9-f544-536b52063bd7', 'Shiloh Kanoelani Kaipūa''a''laa Namakaokaha''i Akira', 'Wegesend', 'F', '17 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('bedd3f27-5f44-1f92-218b-b2577109e92e', '54a9b00a-fd40-ccc9-f544-536b52063bd7', 'Kamanawale''a Ku''uhanolimaikalanimai', 'Wegesend', 'F', '12 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fd82a2dc-2ead-d6b9-e4e8-7075e139c037', '46afdd72-2e8e-707c-8d5c-2ab1d5843c81', 'Janson', 'Evans', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1c9141fa-c87d-6ace-0683-06a0af6e5459', '46afdd72-2e8e-707c-8d5c-2ab1d5843c81', 'Sandra Marie', 'Evans', 'F', '12 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b79db676-a4b7-896f-5bd6-caa5a85719c8', '46afdd72-2e8e-707c-8d5c-2ab1d5843c81', 'Grayson Gaylord', 'Evans', 'M', '29 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c43c15dc-bf06-26af-5782-d3b6336987b0', '46afdd72-2e8e-707c-8d5c-2ab1d5843c81', 'Isla Marie', 'Evans', 'F', '23 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fdce2e85-8579-bdec-e74e-20a1ad70d7a0', '46afdd72-2e8e-707c-8d5c-2ab1d5843c81', 'Barrett Robert', 'Evans', 'M', '23 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f815abe5-cda9-65aa-5ded-8e6d6121af81', '46afdd72-2e8e-707c-8d5c-2ab1d5843c81', 'Hayes Jansen', 'Evans', 'M', '12 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('13d7adce-bd55-ff80-edbc-9da3328d7fc1', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'Brody Ray', 'Swanson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('41f1a90f-a7a4-ec5d-0bcd-e5cb08f68b52', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'Samantha', 'Swanson', 'F', '29 Mar', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('735d24b9-0b3b-4377-c218-c195fc58238d', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'Sloan Brody', 'Swanson', 'F', '23 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dcd82877-a1dc-d501-3e9d-dbce8a0bd32d', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'Brock James', 'Swanson', 'M', '2 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('377066a7-a953-e0d5-9f8a-b453cc286b5a', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'Bond LeRoy', 'Swanson', 'M', '2 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('86558365-c5ea-b62d-d6c3-bb9b12d09eef', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'Suri Jay', 'Swanson', 'F', '12 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fdf4704a-dd8d-ecdb-dd21-5f55f36ea462', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4', 'Scottie Hal', 'Swanson', 'M', '9 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ec487969-f701-a5fb-8c19-651dbb7de313', '0fb5467f-ae45-35c2-5291-36212d66507e', 'Dillon Casey', 'Gubler', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('280dc7f2-21cd-1567-ce97-ad15bb95cb74', '8d7556c3-4759-cfd1-b0f5-a0801112c068', 'Domanic Michael', 'McKeighan', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('865d7374-7b8d-5f8a-4635-4fa566add551', '8d7556c3-4759-cfd1-b0f5-a0801112c068', 'Sydney Kathleen', 'McKeighan', 'F', '31 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1294dcf7-5940-8525-89db-a4b8d6208dc9', '8d7556c3-4759-cfd1-b0f5-a0801112c068', 'Jack Ernest', 'McKeighan', 'M', '16 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('77937ce7-8f78-eaf3-01a8-eb93390521af', '8d7556c3-4759-cfd1-b0f5-a0801112c068', 'Letty Jean', 'McKeighan', 'F', '16 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2d94faae-fcf8-2470-d54b-16c0f574e69d', '8d7556c3-4759-cfd1-b0f5-a0801112c068', 'Zoe Dylan', 'McKeighan', 'F', '25 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5ee05ea3-faf2-5b8d-b26b-67df931624af', 'c8a94a6f-5757-565c-d2ef-9129e2fd0f6a', 'Jared', 'Christensen', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('791711ae-9549-171f-e321-06e359351414', 'c8a94a6f-5757-565c-d2ef-9129e2fd0f6a', 'Ashley', 'Christensen', 'F', '28 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d3d60199-3fa9-0ace-aeda-f863e179f080', '53ab5ac4-c46d-1412-938b-82f6eb38a149', 'Jayce', 'Jones', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('cd4b964c-6885-e149-3bb5-7ca506f8fbe4', '53ab5ac4-c46d-1412-938b-82f6eb38a149', 'Ashlend Gevon', 'Jones', 'F', '7 Oct', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('218921b4-e6a7-c789-b9ee-05a5e24c248b', '53ab5ac4-c46d-1412-938b-82f6eb38a149', 'Rollan Atlas', 'Jones', 'M', '28 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('34fdca74-cdfa-7a72-8d11-48b6765887db', '12340542-186a-37de-7f06-aba017333ab5', 'Jason Robert', 'Espinoza', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3ccd7232-cc79-06b8-66b5-9a0ef21fab4d', '12340542-186a-37de-7f06-aba017333ab5', 'Kelci Jourdan', 'Espinoza', 'F', '13 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f5c3443c-211b-1e38-766d-297d0aadcf38', 'f8693525-6cd8-8f0f-3e66-e4c3f1effe5c', 'Wes', 'Swaney', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1878633d-d0c5-13a2-38fb-1e9264ab134b', 'f8693525-6cd8-8f0f-3e66-e4c3f1effe5c', 'McKenzie', 'Swaney', 'F', '5 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('36457e6c-7747-9736-a159-1ab76b37c3f6', 'f8693525-6cd8-8f0f-3e66-e4c3f1effe5c', 'Kai Luca', 'Swaney', 'M', '3 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7bddd298-02e0-2e61-3bae-0bfaedd75f82', 'f8693525-6cd8-8f0f-3e66-e4c3f1effe5c', 'Davie Abigail', 'Swaney', 'F', '4 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('89602d83-be71-58a8-ab0e-d7dc5afd0c6d', '1f248fdc-cfb1-9157-ce8b-01fd3d085b43', 'Cashe', 'Collins', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('cadf64b1-23be-b7cc-815d-a06857332c29', 'c972d586-f463-443c-1e42-40f078ca0f30', 'Nicklas', 'Benson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b2b08d95-1f7c-4796-197a-b8d9244680ff', 'c972d586-f463-443c-1e42-40f078ca0f30', 'Britney Danielle', 'Benson', 'F', '13 Mar', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8227e137-a471-c2bf-7a4e-a16c6743c7b0', 'c972d586-f463-443c-1e42-40f078ca0f30', 'Nicklas Lee II', 'Benson', 'M', '31 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f46784b6-199e-d56b-8e83-a5af0ea1c892', 'c972d586-f463-443c-1e42-40f078ca0f30', 'Ace Arthur', 'Benson', 'M', '19 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1a78ea47-fa6c-f964-d9f8-d609e89eefb9', 'c972d586-f463-443c-1e42-40f078ca0f30', 'Ivory Mae', 'Benson', 'F', '6 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0f8fb8f3-7784-ff24-dcac-2cce700f654e', '5d1938f8-3002-8661-9a98-21f2496984d0', 'Jason', 'Brown', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('219ded6b-a985-5e66-0cb5-ecb3177ab02b', '5d1938f8-3002-8661-9a98-21f2496984d0', 'Natalia Maluenda', 'Brown', 'F', '26 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ba334691-b6be-e188-41a4-0d618ff1e511', '5d1938f8-3002-8661-9a98-21f2496984d0', 'Jason Fernando', 'Brown', 'M', '12 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f69b67dc-0388-35d4-bb0e-80c6e9e31f11', '5d1938f8-3002-8661-9a98-21f2496984d0', 'Austin Tomas', 'Brown', 'M', '27 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0f8804d1-09de-8589-c3bf-1251b294fee0', 'e3623c5a-9e6e-479f-34a9-9837c404e8d2', 'Matt', 'Cahoon', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('65bf4c78-2218-086d-bb7a-65fa8b161a30', 'e3623c5a-9e6e-479f-34a9-9837c404e8d2', 'Jordie', 'Cahoon', 'F', '25 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0e154e5c-defb-3b82-a961-8b0c741b1226', 'e3623c5a-9e6e-479f-34a9-9837c404e8d2', 'Harlow Leialoha', 'Cahoon', 'F', '8 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1f8acff4-e90d-1406-a29d-a9b46c62dba6', 'e3623c5a-9e6e-479f-34a9-9837c404e8d2', 'Barrett Alpha', 'Cahoon', 'M', '12 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4f9032c8-1e42-acfc-0aa3-dc807b08b579', 'e3623c5a-9e6e-479f-34a9-9837c404e8d2', 'Remington Kahealani', 'Cahoon', 'F', '4 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('508e2659-e2ef-6844-5de5-fa05b4b40cd4', '6a0b1ef3-8877-689d-332a-21734f0260a7', 'Treyson Russell', 'Christiansen', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('782ade67-bbd5-5630-1ebf-ce00941a1bb6', '6a0b1ef3-8877-689d-332a-21734f0260a7', 'Makena', 'Christiansen', 'F', '8 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('37b7a729-af5d-be1b-be5f-37e51017c171', '6a0b1ef3-8877-689d-332a-21734f0260a7', 'Harley Russell', 'Christiansen', 'M', '14 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b3196532-10cc-fbaa-9c0c-fd3d6e7202f7', 'cd55f23f-cfe5-39f1-6b8f-0062b52b4ee2', 'Ryan', 'Petersen', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('9a2698f5-618c-5743-3f01-3b69cea21a16', 'cd55f23f-cfe5-39f1-6b8f-0062b52b4ee2', 'Breanna Mae', 'Petersen', 'F', '8 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e7413b39-6153-b087-f5e1-ca1848a45a9c', 'cd55f23f-cfe5-39f1-6b8f-0062b52b4ee2', 'Dax Ryan', 'Petersen', 'M', '27 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2385abda-b74c-385a-2eeb-db9d2aad4d5f', 'cd55f23f-cfe5-39f1-6b8f-0062b52b4ee2', 'Clara Anne', 'Petersen', 'F', '5 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ebe9a7eb-7774-7220-23fa-8cf54d9e6bf3', 'cd55f23f-cfe5-39f1-6b8f-0062b52b4ee2', 'Preslee Mae', 'Petersen', 'F', '27 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('532803a7-d09f-59f6-94d9-9470ccaa9426', '7ff75233-28ff-004b-a3de-7b4000b485e1', 'David Arthur', 'Durrant', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('57a3369e-218c-3203-73ad-20dc014efd4d', '7ff75233-28ff-004b-a3de-7b4000b485e1', 'Jessica Elise', 'Durrant', 'F', '16 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d12eb9bf-5b01-3288-f993-639bdaaef822', '7ff75233-28ff-004b-a3de-7b4000b485e1', 'Drew Thomas', 'Durrant', 'M', '20 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3fc6e8ce-a488-3a4b-8a1a-4e93d26b1e72', '7ff75233-28ff-004b-a3de-7b4000b485e1', 'Jonah David', 'Durrant', 'M', '5 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c3ce0cfc-d1a8-0fe8-6531-0b008dfbd95e', '7ff75233-28ff-004b-a3de-7b4000b485e1', 'Ivy Elyse', 'Durrant', 'F', '17 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3b866d6c-f5c1-be9a-2876-d00658e385d8', '9fd43650-ee63-98be-e72f-b55cbacc24ec', 'Tyler', 'Warner', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('863bc753-0ff8-3abd-e9c2-5b006640f54a', '9fd43650-ee63-98be-e72f-b55cbacc24ec', 'Annie', 'Warner', 'F', '14 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('974a69b8-f292-be0a-0c32-6b05ea58a39d', '9fd43650-ee63-98be-e72f-b55cbacc24ec', 'Ivoree Kay', 'Warner', 'F', '7 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('577f6c55-d80f-61d9-c353-09cb3fe58ae1', '9fd43650-ee63-98be-e72f-b55cbacc24ec', 'Remi Lynn', 'Warner', 'F', '15 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c89f7c26-f217-8652-4860-2d285c4db292', '9fd43650-ee63-98be-e72f-b55cbacc24ec', 'Tatum Ann', 'Warner', 'F', '29 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fcd0fde4-72ef-6fca-a932-3e014ea8c39c', '78e63355-5a53-4e19-23f9-c232b2cfa677', 'Colton', 'Wynne', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c86c839c-1a8f-d922-017e-efc2f3697f13', '78e63355-5a53-4e19-23f9-c232b2cfa677', 'Sydney Lee', 'Wynne', 'F', '24 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('07aab5b3-636f-5cac-ac29-0439a3a2f033', '78e63355-5a53-4e19-23f9-c232b2cfa677', 'Roman Jace', 'Wynne', 'M', '26 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('13981dd3-f7b1-6a80-525c-a8bd4b6076cc', '8dfb98a0-3f1c-f80d-9526-bb971925b8da', 'Zach', 'Adair', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6b3f7858-68f7-4f65-5627-d9c56b801360', '8dfb98a0-3f1c-f80d-9526-bb971925b8da', 'Ashley Kay', 'Adair', 'F', '22 Oct', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('90963b69-978b-919a-13ad-a86315ca5a1c', '8dfb98a0-3f1c-f80d-9526-bb971925b8da', 'Oaklynn Christine', 'Adair', 'F', '18 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0ed68024-14e1-d740-b978-075c48e51698', '8dfb98a0-3f1c-f80d-9526-bb971925b8da', 'Huntley Bee', 'Adair', 'F', '13 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c875b9e9-f24e-b455-5db8-17e9c3d6d5ca', '1b24f6af-2187-38f2-ed7b-a9d454b8df54', 'Ethan', 'Bennett', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b2b446cc-b9a4-76f3-fa22-2c38003c056e', '1b24f6af-2187-38f2-ed7b-a9d454b8df54', 'Aspin', 'Bennett', 'F', '16 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a2d43002-222a-4d2a-20d4-dbd576f90b17', '2917b0f6-12ca-5ef6-85a5-af689b1a8481', 'Braden', 'Church', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ec15708e-1425-37d5-8788-810ed04f6ec4', '2917b0f6-12ca-5ef6-85a5-af689b1a8481', 'Tierra Nan', 'Church', 'F', '4 Feb', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('78da8dd9-eb49-3223-bb66-5cd973a23166', '2917b0f6-12ca-5ef6-85a5-af689b1a8481', 'Oaklee Nan', 'Church', 'F', '15 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('15ff26bf-a44f-c636-2f7c-c1ac3890690b', '2917b0f6-12ca-5ef6-85a5-af689b1a8481', 'Mason Braden', 'Church', 'M', '26 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0f783387-c041-fd4f-4d85-2b2011cb4094', '2917b0f6-12ca-5ef6-85a5-af689b1a8481', 'Dani Shae', 'Church', 'F', '9 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3b3ec6d3-c8db-332a-4b9c-995fd77193fd', '2917b0f6-12ca-5ef6-85a5-af689b1a8481', 'Tommy Ray', 'Church', 'M', '18 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('702dafa5-f374-4e50-7ccf-09a1eb7e9af6', '3e28ab14-21b4-c4b6-e3a3-6a6c6adc81b8', 'Colton Ronald', 'Searle', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2a4af773-6f04-c5c6-dcd0-3417820c7cf6', '3e28ab14-21b4-c4b6-e3a3-6a6c6adc81b8', 'Morgan', 'Bernardo', 'F', '6 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('05c6c55e-608f-b7ae-7778-1432a32e0f23', '56f81e61-debc-0b7a-3c43-f50d4f756540', 'Elijah Todd', 'Rigby', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('64293676-3825-90bd-e3d2-8b4a45628440', '56f81e61-debc-0b7a-3c43-f50d4f756540', 'Brooke Ann', 'Rigby', 'F', '27 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d1c2a691-7c7d-1c2b-cb0d-19091bf9b925', '56f81e61-debc-0b7a-3c43-f50d4f756540', 'Bodee Laine', 'Rigby', 'M', '13 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('c82f6a16-1fac-5bed-576d-c1ad0b920a60', '56f81e61-debc-0b7a-3c43-f50d4f756540', 'Cadence Sophia', 'Rigby', 'F', '15 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fa65764d-ae6c-b3ca-d06e-13fffa4317b9', '56f81e61-debc-0b7a-3c43-f50d4f756540', 'Annabelle Brooke', 'Rigby', 'F', '8 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('10eeef4e-6496-69ea-f0b4-fbb24e6d95ee', '56f81e61-debc-0b7a-3c43-f50d4f756540', 'Boone Ryder', 'Rigby', 'M', '20 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5ef51589-dd6f-003e-ffd7-a8bc3287002a', 'cd832435-e9aa-c09a-1e24-3b2e8beddfc4', 'Oaken', 'Whittaker', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5a1603dd-ab11-2324-e292-c17a3be50210', 'cd832435-e9aa-c09a-1e24-3b2e8beddfc4', 'Paige Lauren', 'Whittaker', 'F', '6 Mar', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d52d59e2-ba03-dd4c-df7d-7209caf7b686', '8e3ddb75-1764-18e4-e9a5-7a82f0961f95', 'Jason', 'Owen', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('248af5d0-4b61-bd74-34a3-8749593e7b14', '8e3ddb75-1764-18e4-e9a5-7a82f0961f95', 'Diane', 'Owen', 'F', '16 Jan', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dad648db-c303-607e-a0e4-b6babbb97198', '8e3ddb75-1764-18e4-e9a5-7a82f0961f95', 'JoceLyn Jay', 'Owen', 'F', '31 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d6d405eb-9e96-efef-f8a2-4515653ed8c9', '8e3ddb75-1764-18e4-e9a5-7a82f0961f95', 'RoxaBelle Berlin', 'Owen', 'F', '26 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ecea2762-cb1e-d99c-3644-16dd97671f0a', '8e3ddb75-1764-18e4-e9a5-7a82f0961f95', 'Ezra', 'Owen', 'M', '3 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b09b24ca-a80b-9cc1-fb67-8b53dfd3ee46', '8e3ddb75-1764-18e4-e9a5-7a82f0961f95', 'Liam', 'Owen', 'M', '24 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d2ebbe9c-edeb-022b-c726-76debb956db3', '597fbe93-5915-e7a6-d442-8d94017c5335', 'Jaxon', 'Hale', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('aab3ff38-9e53-8646-0d92-42cb2615d908', '597fbe93-5915-e7a6-d442-8d94017c5335', 'Madeline', 'Hale', 'F', '17 Mar', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dc534fca-a5c3-3984-017b-f1eae1899766', '597fbe93-5915-e7a6-d442-8d94017c5335', 'Bode Riley', 'Hale', 'M', '7 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('95c61ba8-5aeb-3687-2d12-ec231217a3bb', '5221cacf-b1a7-7de9-5667-e976993bdc9c', 'Cody', 'Sorenson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b107889c-36f1-e332-3d13-11938a4580d8', '5221cacf-b1a7-7de9-5667-e976993bdc9c', 'Gina', 'Sorenson', 'F', '16 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dc913d11-8740-c22e-ebf9-e28cf9674d2b', '5221cacf-b1a7-7de9-5667-e976993bdc9c', 'Dillan', 'Sorenson', 'M', '5 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ee893c5a-40f6-48c7-b11c-e6f554884113', '5221cacf-b1a7-7de9-5667-e976993bdc9c', 'Emmarie', 'Sorenson', 'F', '18 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('88a7b9e5-db88-6fa2-f59a-bc49b2a5bc70', '5221cacf-b1a7-7de9-5667-e976993bdc9c', 'Ellia Joan', 'Sorenson', 'F', '29 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f56c7c73-b4b3-5634-1bae-3337d787f6ad', '0ea46ddc-c8c5-41ee-ab65-5df940166fba', 'Blaine', 'Chambers', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('092d16bf-3f4e-973b-5a46-a3a9b58a6166', '0ea46ddc-c8c5-41ee-ab65-5df940166fba', 'Shawnee', 'Chambers', 'F', '24 Sep', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fcac5899-2c39-fc4d-f440-b38b131dea60', 'aa873951-0055-9125-2e3e-55eab20ff000', 'Travis', 'Robinson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d8aea24f-89a2-2396-c132-45fce62d820a', 'aa873951-0055-9125-2e3e-55eab20ff000', 'Megan', 'Robinson', 'F', '6 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5f844039-b854-7515-f2fb-5225a11e9d6c', 'aa873951-0055-9125-2e3e-55eab20ff000', 'Brielle Megan', 'Robinson', 'F', '6 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('43ea98ad-3efb-9d2d-f99f-cee3f8b50f41', 'aa873951-0055-9125-2e3e-55eab20ff000', 'Adalynn Tamera', 'Robinson', 'F', '23 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3d175338-a4ec-8f6b-6518-20ff53fb9dd5', '95cf38eb-441c-b1f3-4f08-f1f2e898490d', 'Kory Andrew', 'Barden', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2da76e82-0f32-c4d4-f1dd-49b4fb7a57ec', '95cf38eb-441c-b1f3-4f08-f1f2e898490d', 'Montana Reagan', 'Barden', 'F', '28 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('945ec53a-4444-3ff9-ad3b-b30acae78409', '95cf38eb-441c-b1f3-4f08-f1f2e898490d', 'Zion James', 'Barden', 'M', '2 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('25729f3b-26a7-3735-c0c4-2e30bf605c52', '95cf38eb-441c-b1f3-4f08-f1f2e898490d', 'Georgia Reagan', 'Barden', 'F', '27 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5eaa7226-90eb-9971-2700-68625043622c', 'a3921486-cd74-7041-ba4d-96388e29f409', 'Preston', 'Echols', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0f9c57b5-cd1d-41f7-e263-7c2c6b37e34c', 'a3921486-cd74-7041-ba4d-96388e29f409', 'McKell Rose', 'Echols', 'F', '3 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2f7e5389-ed1a-0c38-2b14-f843c190399a', 'a3921486-cd74-7041-ba4d-96388e29f409', 'Jace Donald', 'Echols', 'M', '5 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8bc4b411-043e-9580-0de2-0cf07350ba82', 'a3921486-cd74-7041-ba4d-96388e29f409', 'Lainey Rose', 'Echols', 'F', '13 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f96e2005-4821-f5d3-181c-3b208ac120d8', 'a3921486-cd74-7041-ba4d-96388e29f409', 'Paxton John', 'Echols', 'M', '26 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('05e0d686-ea61-3bb6-a31f-0b56da735e46', '86119c2f-223a-f8e2-1b03-70db2b935cc7', 'Dane', 'Stewart', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('52881ed2-1ab5-212b-8c1e-2f745a3ff59d', '86119c2f-223a-f8e2-1b03-70db2b935cc7', 'Brianna', 'Stewart', 'F', '7 Dec', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('333bfed2-911e-ce81-4e0b-12173b74af8f', '86119c2f-223a-f8e2-1b03-70db2b935cc7', 'Jett D.', 'Stewart', 'M', '8 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ea642056-02a9-9bc5-b3e9-5ba891376f0f', '86119c2f-223a-f8e2-1b03-70db2b935cc7', 'Beau Levi', 'Stewart', 'M', '12 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('246b1b69-ad91-1fdd-d0b4-061c62e73341', '4b48a0b7-b245-eedc-b983-1e859b042f57', 'Jenna', 'Cary', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a7331571-e261-a4de-d997-976d0d93c496', '4b48a0b7-b245-eedc-b983-1e859b042f57', 'Alexa', 'Edmondson', 'F', '24 Jun', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b0a26f40-3fc9-5018-fe13-970dd1ae1638', '4b48a0b7-b245-eedc-b983-1e859b042f57', 'Addalyn', 'Medina', 'F', '11 Jul', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4aee12e4-e7fa-b7ac-5220-95ceae5d1152', '4b48a0b7-b245-eedc-b983-1e859b042f57', 'Sophia Marie', 'Garita-Cary', 'F', '29 Jan', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('89121f02-c12c-2a11-31f0-d60b62f34868', '4b48a0b7-b245-eedc-b983-1e859b042f57', 'Gage', 'Edmondson', 'M', '15 Jan', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a243ef0f-3e9f-3c46-a838-787b6c608d28', '4b48a0b7-b245-eedc-b983-1e859b042f57', 'Jett Hendrix', 'Garita', 'M', '3 Nov', 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('850aef0a-1f9d-2eb0-a773-18d9a363fdd5', 'ccf5b116-bc9a-dff0-c551-5677eaa5df21', 'Austin', 'Ricks', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('02bac0a4-70f9-b599-12b5-5c0cc2fe51ae', 'ccf5b116-bc9a-dff0-c551-5677eaa5df21', 'Haley Bonnie', 'Ricks', 'F', '2 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('de309b98-41fe-7f3f-1a3e-4dccb5d7d8eb', 'ccf5b116-bc9a-dff0-c551-5677eaa5df21', 'Ryann Hazel', 'Ricks', 'F', '25 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('04d94220-1676-b2cd-ad03-8dacef4f750e', 'ccf5b116-bc9a-dff0-c551-5677eaa5df21', 'Oakley Georgia', 'Ricks', 'F', '14 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('464b9baa-9cbb-cdf0-8b25-2d972f911096', 'af8ffd8a-b6a8-9005-f108-0a5784ff559f', 'Joshua', 'Fernquist', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('ef5acfa9-db53-516d-0cbe-55e54a360762', 'af8ffd8a-b6a8-9005-f108-0a5784ff559f', 'Megan Taylor', 'Fernquist', 'F', '22 Aug', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('076e422b-8664-1f9c-79ec-4634751cd823', 'af8ffd8a-b6a8-9005-f108-0a5784ff559f', 'Sophie Taylor', 'Fernquist', 'F', '20 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('635b1b25-e03b-c332-da5b-f5dbf551573e', 'af8ffd8a-b6a8-9005-f108-0a5784ff559f', 'Alice Renee', 'Fernquist', 'F', '28 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('05f2be8a-35b1-156d-0f04-94691aeccada', '66678c68-fb4e-daff-e47b-82b99cfd4b99', 'Dawson John', 'Stoor', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e291b187-02f8-8add-ccfd-81683bfb55ff', '66678c68-fb4e-daff-e47b-82b99cfd4b99', 'Macie', 'Warren', 'F', '23 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d7a930d2-f560-a5a6-a52d-8fc410af4c4a', '1efae190-8a4c-6832-5303-c0b27286f467', 'Hyrum', 'Sorensen', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e4697b7e-5c1c-0cb1-6684-f81f5e0e5c1a', '1efae190-8a4c-6832-5303-c0b27286f467', 'Jacey Finch', 'Sorensen', 'F', '20 Feb', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('53a33b29-eaa5-1fc1-e58b-b79c756bf8a8', '7e7cfa06-40af-b0f8-5183-1192656fec18', 'Shawn Kirtpatrik', 'Wood', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6af2bc34-062f-d2ee-c8d1-322fa26f67e4', '7e7cfa06-40af-b0f8-5183-1192656fec18', 'Shauna', 'Wood', 'F', '13 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('06647293-61f5-65f7-65e6-211ae620e39e', '7e7cfa06-40af-b0f8-5183-1192656fec18', 'Nicole', 'Wood', 'F', '2 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('59c2d402-36da-11b9-e3bc-e0bb785766d9', '7e7cfa06-40af-b0f8-5183-1192656fec18', 'Hannah Emily', 'Wood', 'F', '23 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('700286c4-af2b-30a7-cb2b-2aa4a91a0629', 'e2068bea-f1a6-80b3-0f3a-731b6ea65161', 'Dale', 'Cranney', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5f675963-678f-6e87-6db2-9367c371254d', '947548b6-ecf0-e510-f567-4e02c385da0a', 'Trent', 'Smith', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b985f9f0-9dd8-f586-1025-79488b5d200d', '947548b6-ecf0-e510-f567-4e02c385da0a', 'Morgan', 'Smith', 'F', '5 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d02d3549-d34f-a915-a71e-15c1a338a9e4', '947548b6-ecf0-e510-f567-4e02c385da0a', 'Henry Boone', 'Smith', 'M', '25 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('64c2457c-4992-9f82-9cb8-c753083ff3eb', '947548b6-ecf0-e510-f567-4e02c385da0a', 'Norah', 'Smith', 'F', '6 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b07ec559-8fc8-b7a9-6240-8770acfb51f5', '947548b6-ecf0-e510-f567-4e02c385da0a', 'Lincoln Palmer', 'Smith', 'M', '20 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('72e83071-889a-fc9a-20a3-fcb280ea6ed8', '947548b6-ecf0-e510-f567-4e02c385da0a', 'Penelope J', 'Smith', 'F', '27 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('22f21afc-f6a3-5898-1259-ab57cdac2fc1', '72233b62-36ba-6fc1-c336-6b0fc10a838c', 'Cody', 'Child', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2d1cbd43-e393-2126-7d05-b9374ea023bb', '72233b62-36ba-6fc1-c336-6b0fc10a838c', 'Kyla Jean', 'Child', 'F', '10 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8676c84e-7628-1054-2797-40d96736fc05', '72233b62-36ba-6fc1-c336-6b0fc10a838c', 'Brooks Robert', 'Child', 'M', '28 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('71ac1d7c-7cb2-7d5b-87ac-f39907c23d69', '338fab7c-c330-64f7-7202-9fbe46011b3a', 'Adam', 'Ruben', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8656420b-a736-9362-52b0-e519f554a44d', '338fab7c-c330-64f7-7202-9fbe46011b3a', 'Charlee', 'Ruben', 'F', '28 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('e17a4430-6173-c3a4-b47c-6bdf39263323', '338fab7c-c330-64f7-7202-9fbe46011b3a', 'Finley Jane', 'Ruben', 'F', '31 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8a0a4f0b-1bd5-a1c1-a2dc-ef58d9b5ff24', '338fab7c-c330-64f7-7202-9fbe46011b3a', 'Cohen John', 'Ruben', 'M', '11 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4086cf44-5f86-ece3-faa3-e7a82a8c1948', '338fab7c-c330-64f7-7202-9fbe46011b3a', 'Rylee Mae', 'Ruben', 'F', '8 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('899930bb-6d6a-1e37-25f5-3f58b3dd7aea', '338fab7c-c330-64f7-7202-9fbe46011b3a', 'Taylor Ann', 'Ruben', 'F', '24 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('54ca47b8-fcfc-c699-2442-3b3db5f8b923', '338fab7c-c330-64f7-7202-9fbe46011b3a', 'Emery Laine', 'Ruben', 'F', '15 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('68a6d509-98a8-5f26-d4bc-53a00ff8b7c7', 'd0d40b44-32a1-6318-502a-c0ef239cf642', 'Helaman', 'Burrows', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7ec1eb91-189a-4b00-c1dd-da9ca83c4145', 'd0d40b44-32a1-6318-502a-c0ef239cf642', 'McKenna Sheree', 'Burrows', 'F', '21 Jul', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('95f7350e-d6c6-4ced-9971-9e96463a7f9e', 'd0d40b44-32a1-6318-502a-c0ef239cf642', 'Amelia Grace', 'Burrows', 'F', '30 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('812f9a71-20fa-2f6e-a419-b3915d35495d', 'd0d40b44-32a1-6318-502a-c0ef239cf642', 'Wrenn Paige', 'Burrows', 'F', '28 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('6205558c-16fe-e7df-124b-a51ef20aef82', '72783bd6-ce71-7341-0c8d-507d88fce34d', 'Chalise Geneal', 'Petersen', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('0807bace-3283-eef7-ea09-4dbd2edf7f25', '72783bd6-ce71-7341-0c8d-507d88fce34d', 'Tayson Shad', 'Petersen', 'M', '4 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7e2211a8-a3c6-cd12-ddb5-d7246c84aeb7', '72783bd6-ce71-7341-0c8d-507d88fce34d', 'Teagan Cecil', 'Petersen', 'M', '7 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3ec99d93-0a1d-c763-c25e-07cd66fe43dc', '72783bd6-ce71-7341-0c8d-507d88fce34d', 'Ty Jake', 'Petersen', 'M', '9 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8798ccdc-65d5-ad0b-5cad-188b3ad5a708', '5560106d-b6f9-e202-812e-e4dc9a51f2db', 'Sean Patrick', 'Calkins', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('13212b4f-89a7-b16d-bcb0-25061cc2919f', 'd0f233f4-1389-a201-15b3-9a93f4aab7fb', 'Ben', 'Smith', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b5861657-6f14-ad51-00a0-ab1e1f255d99', 'd0f233f4-1389-a201-15b3-9a93f4aab7fb', 'Kellie', 'Smith', 'F', '20 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('52e5284a-5707-9416-ab43-aa28a28b1f6e', 'd0f233f4-1389-a201-15b3-9a93f4aab7fb', 'Lydia Jane', 'Smith', 'F', '6 Oct', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7372eb86-be61-b801-c0a4-eabc1c08da2d', 'd0f233f4-1389-a201-15b3-9a93f4aab7fb', 'Bronson Jack', 'Smith', 'M', '14 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4e1f332a-a7b5-d23e-0f80-0349227ef091', '6b0e614b-0aa3-f296-b325-07e2804fa89b', 'Bradley Nelson', 'Brewer', NULL, NULL, 'single_adult') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('647b32b7-8ea4-4c17-f40c-0a800aaef75e', '571138ad-f632-f261-5a2c-dae1e7adae09', 'Nicholas J', 'Cloward', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('78436946-85dd-52fe-96c1-778d8d366831', '571138ad-f632-f261-5a2c-dae1e7adae09', 'Angela', 'Cloward', 'F', '8 May', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('19fe072d-4266-a448-2cdc-602ea403ae0e', '571138ad-f632-f261-5a2c-dae1e7adae09', 'Sophie', 'Cloward', 'F', '29 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('4d6df0b7-1a7f-2b4e-c90c-86158330d1c0', '571138ad-f632-f261-5a2c-dae1e7adae09', 'Julian', 'Cloward', 'M', '21 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('738c758f-cda7-980a-a359-b0740c359147', '571138ad-f632-f261-5a2c-dae1e7adae09', 'Gabriel Thomas', 'Cloward', 'M', '26 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('1cc6b758-8e27-07f3-7ff0-5de60454d980', '02f8ae19-5102-c5f5-e8f4-6f7ee539f675', 'Jennifer', 'Nish', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('30aaad88-d65a-ca24-c043-b5d8240725fe', '02f8ae19-5102-c5f5-e8f4-6f7ee539f675', 'Maxwell', 'Nish', 'M', '14 Dec', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('adf9373c-13f5-7c18-4f8c-e2b121ba8e68', '9d433a58-3b7c-c1c5-54a1-e4e14cc0a23d', 'Sean', 'Bryan', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('2892669c-e25f-3513-e915-3ccb302d7ba2', '9d433a58-3b7c-c1c5-54a1-e4e14cc0a23d', 'Amy', 'Bryan', 'F', '23 Feb', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('dd366388-8b9b-d980-f65c-c4f51bcac80f', '9d433a58-3b7c-c1c5-54a1-e4e14cc0a23d', 'Amelia', 'Bryan', 'F', '31 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('a4a4c396-9bba-3536-b538-7f897b3ead08', '9d433a58-3b7c-c1c5-54a1-e4e14cc0a23d', 'Elliott', 'Bryan', 'M', '4 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('43dc2e40-6152-ea65-47f3-b835f4766b42', '4d1b606b-ece3-18af-8d7e-a13a77eed5b9', 'Rey', 'Patterson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('80ac0192-e125-b7ec-0887-3035f8134f7d', '4d1b606b-ece3-18af-8d7e-a13a77eed5b9', 'Carlee Ann', 'Patterson', 'F', '31 Jan', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b8342913-0810-212d-9772-3ea9cb66953e', '4d1b606b-ece3-18af-8d7e-a13a77eed5b9', 'June Ann', 'Patterson', 'F', '31 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('f93312aa-b30b-47c8-80a3-94b538761b9e', '4d1b606b-ece3-18af-8d7e-a13a77eed5b9', 'Navy Lee', 'Patterson', 'F', '15 Sep', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5765df48-bcab-9e92-12e4-207c806a2851', '19945069-4cf4-54ac-36c3-c110051294a5', 'Garyn', 'Gulbranson', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('188071fd-efd5-5722-3271-376f63412f2e', '19945069-4cf4-54ac-36c3-c110051294a5', 'Jill Ann', 'Gulbranson', 'F', '2 Nov', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('db0c6856-5ad7-4a69-7c7e-a319cd02deae', '19945069-4cf4-54ac-36c3-c110051294a5', 'Marlowe Jean', 'Gulbranson', 'F', '19 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7f39e883-0bfc-1101-d980-f48f7edb7443', '19945069-4cf4-54ac-36c3-c110051294a5', 'Brooks Timothy', 'Gulbranson', 'M', '24 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7bad43c3-3a63-a414-2969-fdc50c9a99b4', '19945069-4cf4-54ac-36c3-c110051294a5', 'Hayes Klark', 'Gulbranson', 'M', '6 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8cdda57e-d7a4-81e4-5579-b98c69184af4', '19945069-4cf4-54ac-36c3-c110051294a5', 'Mercer Ann', 'Gulbranson', 'F', '8 Feb', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('fe7c4a53-60d2-c372-5b64-1acf97a3ca1f', 'ec60552f-c9fc-0f66-060e-331687371f5e', 'Daniel', 'Pettus', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('263febd5-0c30-eb35-599b-82f450598d86', 'ec60552f-c9fc-0f66-060e-331687371f5e', 'Kylie Lyn', 'Pettus', 'F', '24 Oct', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7493be40-4fda-de4e-b1d0-483031a89363', 'ec60552f-c9fc-0f66-060e-331687371f5e', 'Maddyn Victoria', 'Pettus', 'F', '21 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('47ca320c-f9a9-aac9-f2ad-5dd66ec462ec', 'ec60552f-c9fc-0f66-060e-331687371f5e', 'Kinzley Jo', 'Pettus', 'F', '27 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5bcba054-43dc-4bf6-0ff2-b1dfd131f5c8', 'ec60552f-c9fc-0f66-060e-331687371f5e', 'Jaxon Paul', 'Pettus', 'M', '5 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('7894ab15-be94-0bf1-c522-148f20a9b734', 'b65106c3-12e8-6491-41be-3008ea0e7a0f', 'Cole', 'Chollet', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('617afedf-869d-23b3-af78-671cdc4b9b6c', 'b65106c3-12e8-6491-41be-3008ea0e7a0f', 'Alexis Rose', 'Chollet', 'F', '17 Feb', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('316d2a32-dcfd-a2ef-c775-c06bdc6df23d', 'b65106c3-12e8-6491-41be-3008ea0e7a0f', 'Indie May', 'Chollet', 'F', '17 May', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d6fa7be4-b1aa-2877-348b-df5706e41549', 'b65106c3-12e8-6491-41be-3008ea0e7a0f', 'Calvin Kai', 'Chollet', 'M', '8 Jun', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('d1e31c3f-4abc-10d1-480a-a0c15f52a0d3', 'b65106c3-12e8-6491-41be-3008ea0e7a0f', 'Daisy Fin', 'Chollet', 'F', '13 Jul', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('b99684c3-117f-8241-322f-95821311f84c', '2d560cd4-1668-6171-7bfa-d5c4df49fbca', 'Chase', 'Russell', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3e7b12fd-70cf-c263-0233-0bb75f854e81', '2d560cd4-1668-6171-7bfa-d5c4df49fbca', 'Breanna', 'Russell', 'F', '11 Apr', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('5308594f-a303-2ca1-02d9-09d8f8140e8a', '2d560cd4-1668-6171-7bfa-d5c4df49fbca', 'Malia Jane', 'Russell', 'F', '2 Apr', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('57b9b7c0-2c5e-a4f4-aa85-267e64f091e6', '2d560cd4-1668-6171-7bfa-d5c4df49fbca', 'Xander William', 'Russell', 'M', '23 Nov', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('223d19d3-7c0b-d429-46bd-e8bf4f302c80', '2d560cd4-1668-6171-7bfa-d5c4df49fbca', 'Evelyn Mae', 'Russell', 'F', '15 Aug', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('261f034d-e438-febd-6383-d8cabb21ea16', '2d560cd4-1668-6171-7bfa-d5c4df49fbca', 'Crew Michael', 'Russell', 'M', '25 Jan', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('3a304064-78f8-c150-74e3-83a598a19302', 'db57b5e7-a251-2bc9-84bb-9c955b161ada', 'Wade', 'Bringhurst', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('044aa054-ae60-e75a-6532-479528c377a6', 'db57b5e7-a251-2bc9-84bb-9c955b161ada', 'Rachel Camille', 'Bringhurst', 'F', '26 Jun', 'spouse') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('8be9a112-9116-0893-b0e8-28e66d6d9d13', 'db57b5e7-a251-2bc9-84bb-9c955b161ada', 'Slade William', 'Bringhurst', 'M', '3 Mar', 'child') ON CONFLICT (id) DO NOTHING;
INSERT INTO household_members (id, household_id, first_name, last_name, gender, birthday_partial, role) VALUES
  ('76f7f1b4-d526-7623-9877-7d73cca480b0', 'bb528df4-adac-0dfd-946f-176fc9a753c3', 'Jordan', 'Bell', NULL, NULL, 'other') ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- Companionship -> household assignments
-- -------------------------------------------------------------
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ac3fd9d5-dfec-5d20-bcce-2c7061a1567c', '96645ab5-1a42-5175-dc02-23b9d9522cfd') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ac3fd9d5-dfec-5d20-bcce-2c7061a1567c', 'd0fd944c-488e-184e-8a44-88249d2c51d7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ac3fd9d5-dfec-5d20-bcce-2c7061a1567c', '22775cfa-5412-5486-7448-44238101f704') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('44fb2ee4-0422-5c93-8b98-6b6b41f4ba18', '73ab2d85-5755-8d29-97aa-acb36b9142b6') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('1268264b-e301-531e-a26f-238ad68bcc76', 'a006d811-ce8b-3709-724b-25cfec5aeb5c') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('1268264b-e301-531e-a26f-238ad68bcc76', 'fa7cbbc2-1407-d763-a2eb-d89d687a7749') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('1268264b-e301-531e-a26f-238ad68bcc76', '0759fc18-cde9-8319-3159-682d5f89fa8e') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('1268264b-e301-531e-a26f-238ad68bcc76', 'beb7c01e-dede-b84f-4359-9b6b07e1bd30') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ca5e235e-7b26-52ff-b9c7-f4e3b79ae468', 'ccc4acd2-9612-56b6-e698-9c7a7eebe07d') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ca5e235e-7b26-52ff-b9c7-f4e3b79ae468', 'eef19663-4883-2e3b-fe5a-2ab09698a25c') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('89279970-930f-5959-9482-3c7b30c9a7bc', '8f9ec472-114b-9234-d910-2eabab4519ab') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('89279970-930f-5959-9482-3c7b30c9a7bc', 'c2d934e8-304f-f570-d96c-e5ca4fa9a265') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('89279970-930f-5959-9482-3c7b30c9a7bc', 'e9313d29-8897-6b23-df6a-f6ad681881c8') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7e7b4966-73c9-5f3c-8283-86df7e5649ac', '3528dc69-9aa7-f86b-8e31-ee15dd6785af') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7e7b4966-73c9-5f3c-8283-86df7e5649ac', '16dd67cc-a1df-f41b-5f35-5b0a70a38b5b') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8bd33f7f-831d-57b8-865a-e1e44cd5f261', '20bc3941-dd22-64b4-91e1-d8d6c4c4210b') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8bd33f7f-831d-57b8-865a-e1e44cd5f261', 'f2551914-7a7e-e51e-e2d9-adb372efcbaf') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('934145af-5610-5c66-a3aa-b5698bf35c95', '098864cc-a55c-ad94-ce72-8555680b377d') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('071e88cf-de88-5d2c-add4-178d23143375', '1cc82462-4f9b-8d6a-b063-64a8fa947efd') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('698d4c66-fd47-5e32-8169-3640b48c6297', '925b246b-7534-0602-dd05-b23f2f156ba3') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('698d4c66-fd47-5e32-8169-3640b48c6297', 'f9cb24b7-7998-9e5d-0724-1d5d244efffd') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('f28e7df7-7692-5f2e-81f6-62ae60a1cac7', 'bd8d05e4-b77a-c4fa-5978-f09cd663ef2a') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('f28e7df7-7692-5f2e-81f6-62ae60a1cac7', 'b326bcbd-8436-6fa4-cd7c-0539ab8f8c1b') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('59d257e8-4036-57fd-827d-3db08bc0a676', 'fade445d-9cac-cf1d-137e-9d36d9c453be') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('59d257e8-4036-57fd-827d-3db08bc0a676', '3aaa65a4-ec5c-0740-0d0a-fcf4620c7cba') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('59d257e8-4036-57fd-827d-3db08bc0a676', 'f17c0a87-d6a7-9b1e-0e29-1e01b3986186') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ce07091b-bf91-5fe0-9a61-bc413aec7acd', 'a87985b5-cb47-8f33-66ac-356bc5f90f1e') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ce07091b-bf91-5fe0-9a61-bc413aec7acd', '7d6e4b1e-f6f0-7498-eed0-f6a8090e1ef7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('c651a8b2-2bbd-5882-aead-133351ddc32e', 'b94b2c4e-caad-e475-d021-ba1cdd1e2d63') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('44f52bbe-1f6a-50a6-a4ee-45f2d00d93fd', '20d5610c-ed05-097f-bad6-abac3577d334') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('44f52bbe-1f6a-50a6-a4ee-45f2d00d93fd', 'fd2275b5-65ee-cb22-9b79-b4367edbe104') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ac4110cf-90f9-5f03-9500-655146c015d5', '2ba5f0cd-11f9-d1f1-a706-a8dcee17bc15') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ac4110cf-90f9-5f03-9500-655146c015d5', '9e55f014-608f-51ad-3514-4b5ce700aa40') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('4ea527fd-c6ac-5627-8d81-6d663b5b3eee', 'c3ba71f2-0a74-c29f-f5e5-b0ed47797b32') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('4ea527fd-c6ac-5627-8d81-6d663b5b3eee', '81f8bbe4-f78e-e78d-50d1-d84128e64122') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('4ea527fd-c6ac-5627-8d81-6d663b5b3eee', 'db1b4adf-7453-633b-c3fc-c3c62f8bd0f5') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('d1cff840-f8b4-50bc-bbbc-a4983140a4cb', 'af595157-1d2d-37cb-8e60-56339d1a00a9') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('d1cff840-f8b4-50bc-bbbc-a4983140a4cb', '2ab130e7-2bee-771a-a254-09bfa275200f') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('fedcce02-7176-5d6a-9248-cf16d0e8154e', '583481a1-3cd6-a5f3-4903-981f13301636') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('fedcce02-7176-5d6a-9248-cf16d0e8154e', '13dcc3a5-c557-454a-2021-c7451d9c0d13') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('fedcce02-7176-5d6a-9248-cf16d0e8154e', '63474269-6e6a-689c-2769-fc25458c740a') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('5527f5f8-e05f-556e-a85c-0036d0c88cb4', '3dd868f3-5d17-d02b-7e38-e90a3d7994d7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('5527f5f8-e05f-556e-a85c-0036d0c88cb4', 'b054d5a9-8be2-1437-3b3f-b17c61da56c0') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('3d951c73-2586-5a86-b767-24cd143b9da1', '041cbe74-5fe2-812b-db28-b9bb54997bc7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('3d951c73-2586-5a86-b767-24cd143b9da1', '14fcb729-7b29-0d0f-a7d2-57250359dae6') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('f6fe5455-2f90-56ae-9a32-f3bdeda8bb38', 'def4dcdf-de94-ba90-8148-782afcb9182e') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('f6fe5455-2f90-56ae-9a32-f3bdeda8bb38', 'e12c28e3-8941-4c65-3826-de76a5682579') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7fc655a4-d9b9-5bf8-8b63-378b8b2e6e7d', 'fba76880-9fe0-b5fc-c699-5264a4e4dce7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7fc655a4-d9b9-5bf8-8b63-378b8b2e6e7d', 'ee3f891b-e345-6da6-bfbe-b877f3497d59') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7fc655a4-d9b9-5bf8-8b63-378b8b2e6e7d', 'f04e79be-cf19-dbed-86de-bf5befe48b00') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8627bdb2-ca7a-55ba-a8eb-b953b70bd7d8', 'c481e6e2-732d-1eb7-0240-e8e24d2f253e') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8627bdb2-ca7a-55ba-a8eb-b953b70bd7d8', '0cd029e9-b7ad-a67e-1db7-7ea320c746a1') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('534b09a0-c136-573a-b0b1-04d839fb4208', 'c7be6ffe-1b5b-ae99-9891-8ea427f3902f') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('534b09a0-c136-573a-b0b1-04d839fb4208', '2a768d87-a769-7fd9-65ab-e538feac4acf') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('b682ff32-c720-555b-b345-b9afcdea4b0e', '142fc850-57d9-bfe3-6770-bf7b662b94cf') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('b682ff32-c720-555b-b345-b9afcdea4b0e', '3e2cbc53-a863-beb5-9096-144760305b0f') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('73c90131-7964-5ca5-94ff-d90813768585', '89bf4f9b-5603-9188-7a84-d1df092ab665') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('73c90131-7964-5ca5-94ff-d90813768585', '13197542-44f7-1887-f160-1f744a215afc') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('f5fb9923-6f7c-55fc-9904-a4d9b1b026a9', '34cfd71f-2de3-eec6-a6bc-132739807cf0') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('f5fb9923-6f7c-55fc-9904-a4d9b1b026a9', '03f796ef-ffdd-59ce-0289-4703edd86296') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ea44b6ed-1589-515a-8c8c-df8139a0b621', 'a830e5da-2d40-9b35-5563-57d4710de655') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ea44b6ed-1589-515a-8c8c-df8139a0b621', '8c3d73b2-0f68-dd27-1b72-484665f97b8b') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('5e9117ba-636b-5978-b843-2b62ced8ed2e', '1bc3ebdc-7ce9-1de7-509e-710fdcd86f6f') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('5e9117ba-636b-5978-b843-2b62ced8ed2e', 'b947cdba-9413-0b06-4e0f-9e5403476692') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8ac3ef40-30d2-5135-9174-bbc19ae38f72', '1fe1f5d3-0beb-b330-7503-e01a61c0df51') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8ac3ef40-30d2-5135-9174-bbc19ae38f72', '03a1e76b-4bfb-fd23-4626-305b8f121ef9') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8ac3ef40-30d2-5135-9174-bbc19ae38f72', '31b3af33-8507-2c0a-4295-df020ab7205d') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('61695e28-a3a1-54b8-b430-ef3bfc5ebad5', 'dbec62b0-b4bf-126f-8a8b-93514f794663') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('61695e28-a3a1-54b8-b430-ef3bfc5ebad5', 'd9cc5ead-fb6a-d43a-2e4d-914214d01034') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('61695e28-a3a1-54b8-b430-ef3bfc5ebad5', 'ac4d562f-e880-ef93-e630-47235d35a7e2') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('2484d3f7-a183-5df0-9e13-052603f916ef', '9e7edd63-79a4-c542-9eb1-01e51a4a6d34') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('2484d3f7-a183-5df0-9e13-052603f916ef', 'b237802b-8e0c-9ba6-e142-3a0b6b066afd') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8db2954d-0001-5741-8636-0b3173a906a1', '945b8305-127e-4433-b797-ce066c77f80b') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('8db2954d-0001-5741-8636-0b3173a906a1', '54a9b00a-fd40-ccc9-f544-536b52063bd7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7920e712-0d8f-52fc-a7da-b2f00ffff182', '46afdd72-2e8e-707c-8d5c-2ab1d5843c81') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7920e712-0d8f-52fc-a7da-b2f00ffff182', '46d0d7ee-da4f-d6f1-59b4-0e5ee2b63ea4') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('e0fd2310-278d-56e1-8328-3a3d4f877597', '0fb5467f-ae45-35c2-5291-36212d66507e') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('e0fd2310-278d-56e1-8328-3a3d4f877597', '8d7556c3-4759-cfd1-b0f5-a0801112c068') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('c57f764b-dd30-5978-8a6d-37f7970510f5', 'c8a94a6f-5757-565c-d2ef-9129e2fd0f6a') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('c57f764b-dd30-5978-8a6d-37f7970510f5', '53ab5ac4-c46d-1412-938b-82f6eb38a149') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('60b4987b-df99-5187-b1ad-fd6547144a90', '12340542-186a-37de-7f06-aba017333ab5') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('60b4987b-df99-5187-b1ad-fd6547144a90', 'f8693525-6cd8-8f0f-3e66-e4c3f1effe5c') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('a02653e0-f49e-5b8e-ac06-8802cfa7a95c', 'c972d586-f463-443c-1e42-40f078ca0f30') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('a02653e0-f49e-5b8e-ac06-8802cfa7a95c', '5d1938f8-3002-8661-9a98-21f2496984d0') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('2d563312-8786-5f43-a54a-b14e3e4eaa7f', 'e3623c5a-9e6e-479f-34a9-9837c404e8d2') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('2d563312-8786-5f43-a54a-b14e3e4eaa7f', '6a0b1ef3-8877-689d-332a-21734f0260a7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('2d563312-8786-5f43-a54a-b14e3e4eaa7f', 'cd55f23f-cfe5-39f1-6b8f-0062b52b4ee2') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7fb134b4-d08a-56e3-bab4-d604b32a8ba2', '7ff75233-28ff-004b-a3de-7b4000b485e1') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7fb134b4-d08a-56e3-bab4-d604b32a8ba2', '9fd43650-ee63-98be-e72f-b55cbacc24ec') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('7fb134b4-d08a-56e3-bab4-d604b32a8ba2', '78e63355-5a53-4e19-23f9-c232b2cfa677') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('cd481e87-6fb7-5860-94a5-a879d7027c54', '8dfb98a0-3f1c-f80d-9526-bb971925b8da') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('cd481e87-6fb7-5860-94a5-a879d7027c54', '1b24f6af-2187-38f2-ed7b-a9d454b8df54') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('c73a7312-261c-5eed-be85-fd03e8f3cee7', '2917b0f6-12ca-5ef6-85a5-af689b1a8481') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('c73a7312-261c-5eed-be85-fd03e8f3cee7', '3e28ab14-21b4-c4b6-e3a3-6a6c6adc81b8') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('efc50e6a-96b5-5c6e-99f9-44c3b83de024', '56f81e61-debc-0b7a-3c43-f50d4f756540') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('efc50e6a-96b5-5c6e-99f9-44c3b83de024', 'cd832435-e9aa-c09a-1e24-3b2e8beddfc4') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('d10341cc-169b-5fd2-9c0d-4dfea8cbcf3d', '8e3ddb75-1764-18e4-e9a5-7a82f0961f95') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ce36b6c6-8e75-5e7e-8193-e932698952af', '597fbe93-5915-e7a6-d442-8d94017c5335') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('ce36b6c6-8e75-5e7e-8193-e932698952af', '5221cacf-b1a7-7de9-5667-e976993bdc9c') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('2c5e8843-f3db-5314-89f7-74c954fe5f14', '0ea46ddc-c8c5-41ee-ab65-5df940166fba') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('2c5e8843-f3db-5314-89f7-74c954fe5f14', 'aa873951-0055-9125-2e3e-55eab20ff000') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('402284f3-06a3-5241-85c9-b356fd169813', '95cf38eb-441c-b1f3-4f08-f1f2e898490d') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('402284f3-06a3-5241-85c9-b356fd169813', 'a3921486-cd74-7041-ba4d-96388e29f409') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('402284f3-06a3-5241-85c9-b356fd169813', '86119c2f-223a-f8e2-1b03-70db2b935cc7') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('9e922f4c-b0aa-5d78-98ec-da35a2aac97f', '4b48a0b7-b245-eedc-b983-1e859b042f57') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('9e922f4c-b0aa-5d78-98ec-da35a2aac97f', 'ccf5b116-bc9a-dff0-c551-5677eaa5df21') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('274c06ec-d794-5bab-9117-1ecf4294b5a0', 'af8ffd8a-b6a8-9005-f108-0a5784ff559f') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('274c06ec-d794-5bab-9117-1ecf4294b5a0', '66678c68-fb4e-daff-e47b-82b99cfd4b99') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('437b5958-a221-59e3-b948-20c254bf6cac', '1efae190-8a4c-6832-5303-c0b27286f467') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('437b5958-a221-59e3-b948-20c254bf6cac', '7e7cfa06-40af-b0f8-5183-1192656fec18') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('33ac0cf3-0cd8-5261-a0bf-8798bf12f6e3', 'e2068bea-f1a6-80b3-0f3a-731b6ea65161') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('33ac0cf3-0cd8-5261-a0bf-8798bf12f6e3', '947548b6-ecf0-e510-f567-4e02c385da0a') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('13961677-edbe-5bf6-856e-f1c2150bdb69', '72233b62-36ba-6fc1-c336-6b0fc10a838c') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('13961677-edbe-5bf6-856e-f1c2150bdb69', '338fab7c-c330-64f7-7202-9fbe46011b3a') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('d632a927-a230-575e-a0b8-f0ca9bf99383', 'd0d40b44-32a1-6318-502a-c0ef239cf642') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('d632a927-a230-575e-a0b8-f0ca9bf99383', '72783bd6-ce71-7341-0c8d-507d88fce34d') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('c6696425-dc12-5300-ba7c-1def1c225e20', '5560106d-b6f9-e202-812e-e4dc9a51f2db') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('c6696425-dc12-5300-ba7c-1def1c225e20', 'd0f233f4-1389-a201-15b3-9a93f4aab7fb') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('aefab318-0347-56a5-a5b4-da5c95c35c1f', '6b0e614b-0aa3-f296-b325-07e2804fa89b') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('aefab318-0347-56a5-a5b4-da5c95c35c1f', '571138ad-f632-f261-5a2c-dae1e7adae09') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('aefab318-0347-56a5-a5b4-da5c95c35c1f', '02f8ae19-5102-c5f5-e8f4-6f7ee539f675') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('b91b6949-3f37-5861-ac77-99e74d818f0b', '9d433a58-3b7c-c1c5-54a1-e4e14cc0a23d') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('b91b6949-3f37-5861-ac77-99e74d818f0b', '4d1b606b-ece3-18af-8d7e-a13a77eed5b9') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('d2c63266-6932-57ee-b6b2-713df1630c48', '19945069-4cf4-54ac-36c3-c110051294a5') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('d2c63266-6932-57ee-b6b2-713df1630c48', 'ec60552f-c9fc-0f66-060e-331687371f5e') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('fd14aee4-72d6-533e-bcf6-9070f55713b1', 'b65106c3-12e8-6491-41be-3008ea0e7a0f') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('fd14aee4-72d6-533e-bcf6-9070f55713b1', '2d560cd4-1668-6171-7bfa-d5c4df49fbca') ON CONFLICT (companionship_id, household_id) DO NOTHING;
INSERT INTO companionship_households (companionship_id, household_id) VALUES
  ('a5c7cfd9-c3b3-5538-b130-d0e6a2a59ac4', 'db57b5e7-a251-2bc9-84bb-9c955b161ada') ON CONFLICT (companionship_id, household_id) DO NOTHING;
