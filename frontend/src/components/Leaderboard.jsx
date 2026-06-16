import React from 'react'
import { NEIGHBORHOOD_LEADERBOARD } from '../data/mockData.js'

export default function Leaderboard() {
  const sorted = [...NEIGHBORHOOD_LEADERBOARD].sort(
    (a, b) => a.co2PerWeek - b.co2PerWeek
  )
  const max = Math.max(...sorted.map((p) => p.co2PerWeek))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="font-semibold text-slate-800 mb-1">
        How you compare
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Similar households nearby (kg CO₂e / week)
      </p>

      <div className="space-y-3">
        {sorted.map((person) => (
          <div key={person.name}>
            <div className="flex justify-between text-sm mb-1">
              <span
                className={
                  person.isUser
                    ? 'font-semibold text-leaf-700'
                    : 'text-slate-600'
                }
              >
                {person.name}
              </span>
              <span className="text-slate-500">
                {person.co2PerWeek.toFixed(1)} kg
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  person.isUser ? 'bg-leaf-500' : 'bg-slate-300'
                }`}
                style={{ width: `${(person.co2PerWeek / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Comparisons use anonymized, aggregated data from households with
        similar size and location — never individual identities.
      </p>
    </div>
  )
}
