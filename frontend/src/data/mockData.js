// src/data/mockData.js
// Mock data + emission factors. Replace with Climatiq API or your own
// dataset (Our World in Data / IPCC tables) when wiring up the backend.

export const EMISSION_FACTORS = {
  transport: {
    label: 'Transport',
    color: '#0ea5e9',
    activities: {
      car_petrol: { label: 'Car (petrol), per km', factor: 0.192 },
      car_diesel: { label: 'Car (diesel), per km', factor: 0.171 },
      bus: { label: 'Bus, per km', factor: 0.105 },
      train: { label: 'Train, per km', factor: 0.041 },
      bike_walk: { label: 'Bike / Walk, per km', factor: 0 },
      flight_short: { label: 'Flight (short-haul), per km', factor: 0.255 },
    },
    unit: 'km',
  },
  food: {
    label: 'Food',
    color: '#22c55e',
    activities: {
      beef: { label: 'Beef, per 100g', factor: 2.7 },
      chicken: { label: 'Chicken, per 100g', factor: 0.69 },
      dairy: { label: 'Dairy (milk/cheese), per 100g', factor: 0.32 },
      vegetables: { label: 'Vegetables, per 100g', factor: 0.04 },
      rice: { label: 'Rice, per 100g', factor: 0.27 },
    },
    unit: 'serving (100g)',
  },
  energy: {
    label: 'Home Energy',
    color: '#eab308',
    activities: {
      electricity: { label: 'Electricity, per kWh', factor: 0.41 },
      lpg: { label: 'LPG cooking gas, per kg', factor: 2.98 },
      ac_hour: { label: 'Air conditioner, per hour', factor: 0.62 },
    },
    unit: 'unit',
  },
}

// A week of sample logs (kg CO2e per day, split by category)
export const WEEKLY_SUMMARY = [
  { day: 'Mon', transport: 3.8, food: 2.1, energy: 1.6 },
  { day: 'Tue', transport: 4.2, food: 1.8, energy: 1.4 },
  { day: 'Wed', transport: 1.0, food: 3.0, energy: 1.7 },
  { day: 'Thu', transport: 3.9, food: 2.3, energy: 1.5 },
  { day: 'Fri', transport: 4.5, food: 2.0, energy: 1.9 },
  { day: 'Sat', transport: 2.0, food: 4.1, energy: 2.2 },
  { day: 'Sun', transport: 0.6, food: 3.6, energy: 2.0 },
]

// Mock "similar households" leaderboard
export const NEIGHBORHOOD_LEADERBOARD = [
  { name: 'You', co2PerWeek: 19.4, isUser: true },
  { name: 'Anika R.', co2PerWeek: 14.2 },
  { name: 'Rohan K.', co2PerWeek: 16.8 },
  { name: 'Priya S.', co2PerWeek: 21.0 },
  { name: 'Dev M.', co2PerWeek: 23.5 },
]

// Suggested high-impact swaps shown when the backend / AI nudge is unavailable
export const FALLBACK_SUGGESTIONS = [
  {
    title: 'Swap one car commute for the bus this week',
    impact: '~1.7 kg CO₂e saved per trip',
    category: 'transport',
  },
  {
    title: 'Try a plant-based dinner twice this week',
    impact: '~2.0 kg CO₂e saved per meal',
    category: 'food',
  },
  {
    title: 'Run the AC 1 hour less per day',
    impact: '~0.6 kg CO₂e saved per day',
    category: 'energy',
  },
]
