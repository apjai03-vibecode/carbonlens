import React, { useState } from 'react'
import { EMISSION_FACTORS } from '../data/mockData.js'

export default function LogActivity({ onAdd }) {
  const categories = Object.keys(EMISSION_FACTORS)
  const [category, setCategory] = useState(categories[0])
  const [activity, setActivity] = useState(
    Object.keys(EMISSION_FACTORS[categories[0]].activities)[0]
  )
  const [quantity, setQuantity] = useState(1)

  const activities = EMISSION_FACTORS[category].activities
  const unit = EMISSION_FACTORS[category].unit

  const handleCategoryChange = (value) => {
    setCategory(value)
    setActivity(Object.keys(EMISSION_FACTORS[value].activities)[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const factor = activities[activity].factor
    const co2Kg = +(factor * quantity).toFixed(2)

    onAdd({
      category,
      activity,
      activityLabel: activities[activity].label,
      quantity: Number(quantity),
      unit,
      co2Kg,
      date: new Date().toISOString(),
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="font-semibold text-slate-800 mb-4">Log an activity</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="log-category-select" className="text-xs font-medium text-slate-500 block mb-1">
            Category
          </label>
          <select
            id="log-category-select"
            aria-label="Category"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {EMISSION_FACTORS[c].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="log-activity-select" className="text-xs font-medium text-slate-500 block mb-1">
            Activity
          </label>
          <select
            id="log-activity-select"
            aria-label="Activity"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          >
            {Object.entries(activities).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="log-quantity-input" className="text-xs font-medium text-slate-500 block mb-1">
            Quantity ({unit})
          </label>
          <input
            type="number"
            id="log-quantity-input"
            aria-label={`Quantity in ${unit}`}
            min="0"
            step="0.5"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-400"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-leaf-600 hover:bg-leaf-700 text-white text-sm font-medium rounded-lg py-2 transition-colors"
        >
          Add activity
        </button>
      </form>
    </div>
  )
}
