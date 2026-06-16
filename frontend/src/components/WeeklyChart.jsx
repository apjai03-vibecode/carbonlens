import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { EMISSION_FACTORS } from '../data/mockData.js'

export default function WeeklyChart({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="font-semibold text-slate-800 mb-1">This week</h2>
      <p className="text-xs text-slate-500 mb-4">
        Daily CO₂e by category (kg)
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar
              dataKey="transport"
              stackId="a"
              fill={EMISSION_FACTORS.transport.color}
              name="Transport"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="food"
              stackId="a"
              fill={EMISSION_FACTORS.food.color}
              name="Food"
            />
            <Bar
              dataKey="energy"
              stackId="a"
              fill={EMISSION_FACTORS.energy.color}
              name="Home Energy"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
