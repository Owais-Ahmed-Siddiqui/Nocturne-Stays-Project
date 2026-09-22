-- ═══════════════════════════════════════════════════════════════
-- 🌙 Nocturne Stays — FRESH SCHEMA v2
-- Run this ONCE in Supabase SQL Editor.
-- It drops your old tables and creates the new project structure,
-- then locks everything down with Row Level Security (RLS).
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS booking_events CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS room_types CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ───────────────────────────── users ─────────────────────────────
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────────── hotels ────────────────────────────
CREATE TABLE hotels (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  tagline TEXT,
  base_price INTEGER NOT NULL CHECK (base_price > 0),
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  tags JSONB NOT NULL DEFAULT '[]',
  image TEXT NOT NULL,
  about TEXT NOT NULL,
  highlights JSONB NOT NULL DEFAULT '[]',
  nearby JSONB NOT NULL DEFAULT '[]',
  amenity_boost NUMERIC(4,2) NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────── room types (pricing) ───────────────────
CREATE TABLE room_types (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('standard','deluxe','suite')),
  name VARCHAR(120) NOT NULL,
  description TEXT,
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (multiplier > 0),
  capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity BETWEEN 1 AND 8),
  perks JSONB NOT NULL DEFAULT '[]',
  UNIQUE (hotel_id, tier)
);

-- ───────────────────────────── reviews ───────────────────────────
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  hotel_id VARCHAR(50) NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(160) NOT NULL,
  comment TEXT NOT NULL,
  stay_label VARCHAR(120),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────────── bookings ──────────────────────────
CREATE TABLE bookings (
  booking_code VARCHAR(100) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined','cancelled')),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id VARCHAR(50) NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_tier VARCHAR(20) NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50),
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  nights INTEGER NOT NULL CHECK (nights > 0),
  guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 6),
  rate_per_night INTEGER NOT NULL CHECK (rate_per_night > 0),
  total INTEGER NOT NULL CHECK (total > 0),
  requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CHECK (checkout > checkin)
);

-- ──────────────────── booking audit trail ────────────────────────
CREATE TABLE booking_events (
  id SERIAL PRIMARY KEY,
  booking_code VARCHAR(100) NOT NULL REFERENCES bookings(booking_code) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  actor_role VARCHAR(20),
  actor_email VARCHAR(255),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────────── indexes ───────────────────────────
CREATE INDEX idx_bookings_user        ON bookings(user_id);
CREATE INDEX idx_bookings_hotel_tier  ON bookings(hotel_id, room_tier, status);
CREATE INDEX idx_bookings_created     ON bookings(created_at DESC);
CREATE INDEX idx_reviews_hotel        ON reviews(hotel_id, is_published);
CREATE INDEX idx_booking_events_code  ON booking_events(booking_code, created_at);
CREATE INDEX idx_room_types_hotel     ON room_types(hotel_id);

-- ═══════════════════ SECURITY: ROW LEVEL SECURITY ═══════════════
-- The anon key (public) can ONLY read the catalog.
-- Users, bookings and audit data are unreachable from the browser.
-- Your server uses the SERVICE_ROLE key (secret) which bypasses RLS.
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read hotels"     ON hotels     FOR SELECT USING (true);
CREATE POLICY "Public read room_types" ON room_types FOR SELECT USING (true);
CREATE POLICY "Public read reviews"    ON reviews    FOR SELECT USING (is_published = true);
-- users / bookings / booking_events: NO policies → denied to anon/authenticated.

-- Belt & braces: strip table privileges from the public roles
-- (service_role keeps its default grants and bypasses RLS)
REVOKE ALL ON users          FROM anon, authenticated;
REVOKE ALL ON bookings       FROM anon, authenticated;
REVOKE ALL ON booking_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON hotels, room_types, reviews FROM anon, authenticated;

-- ═══════════════════════════ SEED DATA ══════════════════════════

-- Admin (password: Admin@2467 — pre-hashed bcrypt, change later)
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@nocturne.stays', '$2a$10$U4K5f3tY5aWJg.o1FjGk/evC.J1OQjLg8Bv1yN3eY8gOq2eW9wG12', 'admin');

-- Hotels
INSERT INTO hotels (id, name, city, location, tagline, base_price, rating, tags, image, about, highlights, nearby, amenity_boost, is_featured) VALUES
('h1','Nebula Inn','Karachi','Karachi • Clifton • 9 min from Seaview','Minimal city comfort with fast Wi‑Fi and quiet nights.',8900,4.3,
 '["Budget","City","Fast Wi-Fi"]'::jsonb,
 'https://images.unsplash.com/photo-1554009975-d74653b879f1?w=500&auto=format&fit=crop&q=60',
 'A clean, minimalist city hotel with quiet floors, fast Wi‑Fi, and a solid restaurant. Perfect for quick business stays and short weekend resets.',
 '[{"title":"Quiet floors","desc":"Acoustic insulation + blackout curtains"},{"title":"Fast Wi‑Fi","desc":"Work-ready bandwidth included"},{"title":"Breakfast","desc":"Continental + local options"},{"title":"Parking","desc":"Secure underground parking"}]'::jsonb,
 '["Seaview","Dolmen Mall","Boat Basin"]'::jsonb, 0.00, FALSE),

('h2','Aurum Residence','Lahore','Lahore • Gulberg • 12 min from MM Alam','Warm modern suites above Gulberg’s busiest streets.',12900,4.5,
 '["Modern","Rooftop","Great value"]'::jsonb,
 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1800&q=60',
 'Modern interiors with warm lighting, a rooftop lounge, and consistently strong service. A balanced pick for comfort without premium pricing.',
 '[{"title":"Rooftop lounge","desc":"Sunset seating + late-night menu"},{"title":"Gym","desc":"Cardio + free weights"},{"title":"Airport pickup","desc":"Available on request"},{"title":"Family-friendly","desc":"Spacious layouts available"}]'::jsonb,
 '["MM Alam Road","Liberty Market","Jilani Park"]'::jsonb, 0.05, FALSE),

('h3','Velvet Quarters','Islamabad','Islamabad • Blue Area • 6 min from Centaurus','Boutique calm, silent corridors, spa-first stays.',17800,4.7,
 '["Boutique","Spa","Quiet"]'::jsonb,
 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1800&q=60',
 'Boutique feel with a high-end spa, silent corridors, and a refined dark aesthetic. Excellent for couples and long-stay guests.',
 '[{"title":"Spa & sauna","desc":"Signature treatments + steam room"},{"title":"Quiet guarantee","desc":"Dedicated silent floors"},{"title":"Restaurant","desc":"Chef-led seasonal menu"},{"title":"Late checkout","desc":"Subject to admin approval"}]'::jsonb,
 '["Centaurus Mall","F-6 Markaz","Faisal Mosque"]'::jsonb, 0.10, TRUE),

('h4','Obsidian Grand','Murree','Murree • Ridge Road • Forest views','Forest panoramas, heated infinity pool, fireplace lounge.',24500,4.8,
 '["Mountain","Infinity pool","Premium"]'::jsonb,
 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1800&q=60',
 'A premium mountain property with a heated infinity pool, panoramic views, and an iconic lounge that leans into the nocturne theme.',
 '[{"title":"Infinity pool","desc":"Heated + view deck"},{"title":"Concierge","desc":"Curated local experiences"},{"title":"Fireplace lounge","desc":"Warm drinks + live music nights"},{"title":"View rooms","desc":"Forest or ridge panoramas"}]'::jsonb,
 '["Mall Road","Patriata","Pindi Point"]'::jsonb, 0.16, TRUE),

('h5','Eclipse Palace','Dubai','Dubai • Downtown • Skyline & fountain views','Skyline suites, curated fragrance, concierge everything.',39900,4.9,
 '["Ultra luxury","Skyline","Suite-first"]'::jsonb,
 'https://images.unsplash.com/photo-1598605272254-16f0c0ecdfa5?w=500&auto=format&fit=crop&q=60',
 'Ultra-luxury skyline stay with suites that feel cinematic: curated fragrance, premium linen, and concierge-level support for every request.',
 '[{"title":"Suite-first","desc":"Largest layouts + lounge areas"},{"title":"Concierge","desc":"24/7 premium assistance"},{"title":"Private transfers","desc":"Luxury pickup available"},{"title":"Dining","desc":"Chef tables + rooftop bar"}]'::jsonb,
 '["Dubai Mall","Burj Khalifa","Fountain Walk"]'::jsonb, 0.24, TRUE);

-- Room types (pricing multipliers per hotel + tier)
INSERT INTO room_types (hotel_id, tier, name, description, multiplier, capacity, perks)
SELECT h.id, t.tier, t.name, t.description, t.multiplier, t.capacity, t.perks::jsonb
FROM hotels h
CROSS JOIN (VALUES
  ('standard','Standard','Queen bed, rainfall shower, work desk',1.00,2,'["Queen bed","Rainfall shower","Work desk"]'),
  ('deluxe',  'Deluxe',  'More space, better view, priority check-in',1.35,3,'["More space","Better view","Priority check-in"]'),
  ('suite',   'Suite',   'Separate lounge, concierge, late checkout request',1.85,4,'["Separate lounge","Concierge","Late checkout request"]')
) AS t(tier, name, description, multiplier, capacity, perks);

-- Reviews
INSERT INTO reviews (hotel_id, guest_name, rating, title, comment, stay_label) VALUES
('h3','Ayesha K.',5,'Immaculate','The lighting, textures, and silence were perfect. Check-in was smooth, and the receipt had every detail. Paid at the hotel with zero friction.','Suite • 3 nights'),
('h3','Hamza R.',5,'Worth it','Loved the lounge and the spa. The staff honored our late checkout request after admin approval. Would book again.','Deluxe • 2 nights'),
('h3','Sana M.',4,'Quiet luxury','Silent floors are real. Breakfast could have more local options, but everything else was spot on.','Standard • 1 night'),
('h4','Bilal A.',5,'Mountain magic','Woke up to fog over the ridge, swam in the heated infinity pool at night. The fireplace lounge is unreal.','Suite • 4 nights'),
('h4','Zain M.',4,'Great value','Dark theme vibes in real life. Fast Wi‑Fi even in the mountains. Booking flow felt like a real system.','Deluxe • 2 nights'),
('h4','Hira S.',5,'Best view guarantee','They upgraded us to a ridge-view room without us asking. Concierge arranged Patriata tickets same day.','Standard • 3 nights'),
('h5','Omar F.',5,'Cinematic stay','Curated fragrance in the suite, skyline views from the bath. Concierge replied to every request in minutes.','Suite • 2 nights'),
('h5','Layla P.',5,'Suite-first is real','The lounge area alone is bigger than most hotel rooms in Karachi. Worth every rupee (paid at check-in, no drama).','Deluxe • 3 nights'),
('h1','Ahmed J.',4,'Budget done right','Clean room, blackout curtains actually work, and Clifton is minutes away. Best value in Karachi.','Standard • 1 night'),
('h1','Farah N.',5,'Fast Wi‑Fi promise kept','Worked full days from the room with zero drops. Quiet floors — could hear a pin drop at night.','Deluxe • 2 nights'),
('h2','Usman T.',4,'Rooftop sunsets','Gulberg location is perfect. Rooftop lounge at sunset with live music on weekends.','Standard • 2 nights'),
('h2','Rida K.',5,'Family approved','Spacious layout for four, staff set up a crib in 10 minutes. Kids loved the breakfast spread.','Deluxe • 3 nights');
