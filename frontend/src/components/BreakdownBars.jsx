import React from 'react'
import { EMISSION_FACTORS } from '../data/mockData.js'

export default function BreakdownBars({ totals }) {
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="font-semibold text-slate-800 mb-1">Where it's coming from</h2>
      <p className="text-xs text-slate-500 mb-4">
        Share of total weekly footprint
      </p>

      <div className="space-y-4">
        {Object.entries(EMISSION_FACTORS).map(([key, meta]) => {
          const value = totals[key] || 0
          const pct = Math.round((value / grandTotal) * 100)
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{meta.label}</span>
                <span className="font-medium text-slate-800">
                  {value.toFixed(1)} kg ({pct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
        <span className="text-slate-500">Total this week</span>
        <span className="font-semibold text-slate-800">
          {grandTotal.toFixed(1)} kg CO₂e
        </span>
      </div>
    </div>
  )
}
