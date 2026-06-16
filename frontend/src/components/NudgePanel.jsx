import React, { useState } from 'react'
import { FALLBACK_SUGGESTIONS } from '../data/mockData.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function NudgePanel({ totals }) {
  const [nudge, setNudge] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNudge = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totals }),
      })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const data = await res.json()
      setNudge(data.message)
    } catch (err) {
      // Backend not running yet — fall back to a static suggestion
      const topCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0]
      const fallback =
        FALLBACK_SUGGESTIONS.find((s) => s.category === topCategory) ||
        FALLBACK_SUGGESTIONS[0]
      setNudge(`${fallback.title} — ${fallback.impact}`)
      setError('Backend unavailable, showing a sample suggestion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-leaf-50 border border-leaf-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-leaf-900">
          💡 This week's nudge
        </h2>
        <button
          onClick={fetchNudge}
          disabled={loading}
          className="text-xs font-medium text-leaf-700 hover:text-leaf-900 underline disabled:opacity-50"
        >
          {loading ? 'Thinking…' : 'Refresh nudge'}
        </button>
      </div>

      {nudge ? (
        <p className="text-sm text-leaf-800 leading-relaxed">{nudge}</p>
      ) : (
        <p className="text-sm text-leaf-700">
          Tap "Refresh nudge" to get a personalized, AI-generated suggestion
          based on your biggest emissions category this week.
        </p>
      )}

      {error && <p className="text-xs text-leaf-600 mt-2 italic">{error}</p>}
    </div>
  )
}
