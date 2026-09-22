// Hotel catalog (offline fallback) + room tiers + API hydration
import { apiFetch } from './api.js';
import { setSelectedHotelId } from './selection.js';

export let HOTELS = [
  {
    id: 'h1',
    name: 'Nebula Inn',
    city: 'Karachi',
    location: 'Karachi • Clifton • 9 min from Seaview',
    from: 8900,
    rating: 4.3,
    tags: ['Budget', 'City', 'Fast Wi‑Fi'],
    image: 'https://images.unsplash.com/photo-1554009975-d74653b879f1?auto=format&fit=crop&w=1800&q=60',
    about: 'A clean, minimalist city hotel with quiet floors, fast Wi‑Fi, and a solid restaurant. Perfect for quick business stays and short weekend resets.',
    highlights: [
      { title: 'Quiet floors', desc: 'Acoustic insulation + blackout curtains' },
      { title: 'Fast Wi‑Fi', desc: 'Work-ready bandwidth included' },
      { title: 'Breakfast', desc: 'Continental + local options' },
      { title: 'Parking', desc: 'Secure underground parking' }
    ],
    nearby: ['Seaview', 'Dolmen Mall', 'Boat Basin'],
    amenityBoost: 0
  },
  {
    id: 'h2',
    name: 'Aurum Residence',
    city: 'Lahore',
    location: 'Lahore • Gulberg • 12 min from MM Alam',
    from: 12900,
    rating: 4.5,
    tags: ['Modern', 'Rooftop', 'Great value'],
    image: 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1800&q=60',
    about: 'Modern interiors with warm lighting, a rooftop lounge, and consistently strong service. A balanced pick for comfort without premium pricing.',
    highlights: [
      { title: 'Rooftop lounge', desc: 'Sunset seating + late-night menu' },
      { title: 'Gym', desc: 'Cardio + free weights' },
      { title: 'Airport pickup', desc: 'Available on request' },
      { title: 'Family-friendly', desc: 'Spacious layouts available' }
    ],
    nearby: ['MM Alam Road', 'Liberty Market', 'Jilani Park'],
    amenityBoost: 0.05
  },
  {
    id: 'h3',
    name: 'Velvet Quarters',
    city: 'Islamabad',
    location: 'Islamabad • Blue Area • 6 min from Centaurus',
    from: 17800,
    rating: 4.7,
    tags: ['Boutique', 'Spa', 'Quiet'],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1800&q=60',
    about: 'Boutique feel with a high-end spa, silent corridors, and a refined dark aesthetic. Excellent for couples and long-stay guests.',
    highlights: [
      { title: 'Spa & sauna', desc: 'Signature treatments + steam room' },
      { title: 'Quiet guarantee', desc: 'Dedicated silent floors' },
      { title: 'Restaurant', desc: 'Chef-led seasonal menu' },
      { title: 'Late checkout', desc: 'Subject to admin approval' }
    ],
    nearby: ['Centaurus Mall', 'F-6 Markaz', 'Faisal Mosque'],
    amenityBoost: 0.10
  },
  {
    id: 'h4',
    name: 'Obsidian Grand',
    city: 'Murree',
    location: 'Murree • Ridge Road • Forest views',
    from: 24500,
    rating: 4.8,
    tags: ['Mountain', 'Infinity pool', 'Premium'],
    image: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1800&q=60',
    about: 'A premium mountain property with a heated infinity pool, panoramic views, and an iconic lounge that leans into the nocturne theme.',
    highlights: [
      { title: 'Infinity pool', desc: 'Heated + view deck' },
      { title: 'Concierge', desc: 'Curated local experiences' },
      { title: 'Fireplace lounge', desc: 'Warm drinks + live music nights' },
      { title: 'View rooms', desc: 'Forest or ridge panoramas' }
    ],
    nearby: ['Mall Road', 'Patriata', 'Pindi Point'],
    amenityBoost: 0.16
  },
  {
    id: 'h5',
    name: 'Eclipse Palace',
    city: 'Dubai',
    location: 'Dubai • Downtown • Skyline & fountain views',
    from: 39900,
    rating: 4.9,
    tags: ['Ultra luxury', 'Skyline', 'Suite-first'],
    image: 'https://images.unsplash.com/photo-1598605272254-16f0c0ecdfa5?auto=format&fit=crop&w=1800&q=60',
    about: 'Ultra-luxury skyline stay with suites that feel cinematic: curated fragrance, premium linen, and concierge-level support for every request.',
    highlights: [
      { title: 'Suite-first', desc: 'Largest layouts + lounge areas' },
      { title: 'Concierge', desc: '24/7 premium assistance' },
      { title: 'Private transfers', desc: 'Luxury pickup available' },
      { title: 'Dining', desc: 'Chef tables + rooftop bar' }
    ],
    nearby: ['Dubai Mall', 'Burj Khalifa', 'Fountain Walk'],
    amenityBoost: 0.24
  }
].sort((a, b) => a.from - b.from);

export const ROOM_TIERS = {
  standard: { label: 'Standard', multiplier: 1.0, perks: ['Queen bed', 'Rainfall shower', 'Work desk'] },
  deluxe:   { label: 'Deluxe', multiplier: 1.35, perks: ['More space', 'Better view', 'Priority check-in'] },
  suite:    { label: 'Suite', multiplier: 1.85, perks: ['Separate lounge', 'Concierge', 'Late checkout request'] }
};

export async function hydrateHotelsFromAPI() {
  try {
    const data = await apiFetch('/api/hotels');
    if (Array.isArray(data?.hotels) && data.hotels.length) {
      HOTELS = data.hotels.sort((a, b) => a.from - b.from);
      setSelectedHotelId(HOTELS[0]?.id);
    }
  } catch (err) {
    // If API not available, keep built-in HOTELS (offline fallback)
    console.warn('Hotel API not available. Using built-in hotel list.', err);
  }
}

export function ratePerNight(hotel, tier) {
  const base = hotel.from;
  // Prefer server-provided room_types multiplier; fall back to built-in tiers
  const mult = hotel.tiers?.[tier]?.multiplier ?? ROOM_TIERS[tier]?.multiplier ?? 1;
  const amenity = (1 + (hotel.amenityBoost || 0));
  return Math.round(base * mult * amenity);
}
