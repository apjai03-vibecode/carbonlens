import React, { useState } from 'react'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const SEARCH_OPTIONS = [
  { label: 'EV charging stations', query: 'EV charging station' },
  { label: 'Bus stops', query: 'bus stop' },
  { label: 'Metro / train stations', query: 'train station' },
  { label: 'Bike rental', query: 'bicycle rental' },
]

export default function EcoMap() {
  const [search, setSearch] = useState(SEARCH_OPTIONS[0].query)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold text-slate-800">
          🗺️ Eco-friendly alternatives near you
        </h2>
        <select
          className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-leaf-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        >
          {SEARCH_OPTIONS.map((opt) => (
            <option key={opt.query} value={opt.query}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {MAPS_KEY ? (
        <iframe
          title="Eco-friendly alternatives map"
          className="w-full h-72 rounded-xl border border-slate-100"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${encodeURIComponent(
            search
          )}`}
        />
      ) : (
        <div className="w-full h-72 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center text-sm text-slate-500 px-6">
          <p className="mb-1 font-medium text-slate-600">
            Google Maps key not set
          </p>
          <p>
            Add <code className="bg-slate-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
            to your <code className="bg-slate-100 px-1 rounded">.env</code> file
            to show nearby {SEARCH_OPTIONS.find((o) => o.query === search)?.label.toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  )
}
