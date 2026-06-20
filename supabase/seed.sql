-- ============================================================
-- Nomichi Trip Desk — Seed Data
-- Run this in your Supabase SQL editor to populate example data
-- ============================================================

-- 1. Insert Trips (if not already present)
INSERT INTO public.trips (id, name, destination, start_date, end_date, price_gst, total_seats, seats_available, status, description)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Spiti Valley Winter',
    'Spiti Valley, Himachal Pradesh',
    '2025-01-10',
    '2025-01-18',
    42000,
    10,
    6,
    'open',
    'Eight days in one of India''s highest inhabited valleys. Snow-covered monasteries, frozen rivers, and a slowness that is hard to find anywhere else.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Dzukou Valley Trek',
    'Nagaland',
    '2025-02-14',
    '2025-02-20',
    28000,
    12,
    8,
    'open',
    'A six-day walk through Nagaland''s hidden valley. Seasonal wildflowers, bamboo forests, and nights in the hills with a small group.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Hampi Slow Weekend',
    'Hampi, Karnataka',
    '2025-03-07',
    '2025-03-10',
    18000,
    8,
    3,
    'open',
    'Three days among boulders and ruins. Bicycle rides at dawn, meals by the river, and no schedule beyond what the light suggests.'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Rann of Kutch Salt Season',
    'Kutch, Gujarat',
    '2024-11-20',
    '2024-11-25',
    32000,
    10,
    0,
    'closed',
    'Five nights on the white salt desert under a full moon. Craft villages, migratory birds, and a landscape that feels like another planet.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  destination = EXCLUDED.destination,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  price_gst = EXCLUDED.price_gst,
  total_seats = EXCLUDED.total_seats,
  seats_available = EXCLUDED.seats_available,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

-- 2. Insert Leads (linked to trips above)
INSERT INTO public.leads (id, name, phone, email, trip_id, group_type, preferred_month, vibe_text, status)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Aarav Mehta',
    '9876543210',
    'aarav.mehta@gmail.com',
    '11111111-1111-1111-1111-111111111111',
    'solo',
    'January',
    'I want to disconnect from corporate stress and experience absolute silence in the snow.',
    'NEW'
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Ananya Sharma',
    '9812345678',
    'ananya.sharma@yahoo.com',
    '22222222-2222-2222-2222-222222222222',
    'friends',
    'February',
    'Me and three of my college friends want to trek and sleep under the stars in Nagaland.',
    'CONTACTED'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'Rohan Das',
    '8123456789',
    'rohan.das@outlook.com',
    '33333333-3333-3333-3333-333333333333',
    'couple',
    'March',
    'My partner and I love bouldering and historical places. We want a quiet, unhurried weekend.',
    'QUALIFIED'
  ),
  (
    'd4444444-4444-4444-4444-444444444444',
    'Kabir Malhotra',
    '7012345678',
    'kabir.m@gmail.com',
    '11111111-1111-1111-1111-111111111111',
    'solo',
    'January',
    'Hoping to photograph the white landscapes and learn about monastic life.',
    'VIBE_CHECK_SENT'
  ),
  (
    'e5555555-5555-5555-5555-555555555555',
    'Pooja Hegde',
    '9988776655',
    'pooja.hegde@hotmail.com',
    '33333333-3333-3333-3333-333333333333',
    'family',
    'March',
    'Travelling with my parents. They love ruins and slow walks by the river.',
    'CONFIRMED'
  ),
  (
    'f6666666-6666-6666-6666-666666666666',
    'Vikram Singh',
    '8877665544',
    'vikram.singh@gmail.com',
    '44444444-4444-4444-4444-444444444444',
    'solo',
    'November',
    'I am looking for a fast-paced tour covering all main tourist spots with luxury DJs and party vibes.',
    'NOT_A_FIT'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  trip_id = EXCLUDED.trip_id,
  group_type = EXCLUDED.group_type,
  preferred_month = EXCLUDED.preferred_month,
  vibe_text = EXCLUDED.vibe_text,
  status = EXCLUDED.status;

-- 3. Insert Chat Messages for Rohan
INSERT INTO public.messages (lead_id, sender, content)
VALUES
  ('c3333333-3333-3333-3333-333333333333', 'lead', 'Hi, I saw the Hampi Slow Weekend. Can couples join?'),
  ('c3333333-3333-3333-3333-333333333333', 'admin', 'Hey Rohan! Yes, absolutely. We design these trips to be very welcoming for couples, solos, and friends alike. What kind of vibe are you looking for?')
ON CONFLICT DO NOTHING;

