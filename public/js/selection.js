// Shared selection state between Hotels view and Booking view
let selectedHotelId = null;
let selectedTier = 'standard';

export function getSelectedHotelId() { return selectedHotelId; }
export function setSelectedHotelId(id) { selectedHotelId = id; }
export function getSelectedTier() { return selectedTier; }
export function setSelectedTier(t) { selectedTier = t; }
