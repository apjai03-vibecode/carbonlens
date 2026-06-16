import React, { useMemo, useState } from 'react'
import LogActivity from './LogActivity.jsx'
import WeeklyChart from './WeeklyChart.jsx'
import BreakdownBars from './BreakdownBars.jsx'
import NudgePanel from './NudgePanel.jsx'
import Leaderboard from './Leaderboard.jsx'
import EcoMap from './EcoMap.jsx'
import { WEEKLY_SUMMARY } from '../data/mockData.js'

// Treat the last entry in the mock week as "today" so newly logged
// activities visibly update the chart.
const TODAY_INDEX = WEEKLY_SUMMARY.length - 1

export default function Dashboard() {
  const [weeklyData, setWeeklyData] = useState(WEEKLY_SUMMARY)
  const [recentLogs, setRecentLogs] = useState([])

  const handleAddActivity = (entry) => {
    setWeeklyData((prev) => {
      const updated = [...prev]
      const today = { ...updated[TODAY_INDEX] }
      today[entry.category] = +(today[entry.category] + entry.co2Kg).toFixed(2)
      updated[TODAY_INDEX] = today
      return updated
    })
    setRecentLogs((prev) => [entry, ...prev].slice(0, 5))
  }

  const totals = useMemo(() => {
    return weeklyData.reduce(
      (acc, day) => ({
        transport: acc.transport + day.transport,
        food: acc.food + day.food,
        energy: acc.energy + day.energy,
      }),
      { transport: 0, food: 0, energy: 0 }
    )
  }, [weeklyData])

  const todayTotal = useMemo(() => {
    const t = weeklyData[TODAY_INDEX]
    return +(t.transport + t.food + t.energy).toFixed(1)
  }, [weeklyData])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left column: logging + recent activity */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs text-slate-500">Today's footprint so far</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">
            {todayTotal} <span className="text-base font-normal text-slate-400">kg CO₂e</span>
          </p>
        </div>

        <LogActivity onAdd={handleAddActivity} />

        {recentLogs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">
              Recently logged
            </h2>
            <ul className="space-y-2 text-sm">
              {recentLogs.map((log, i) => (
                <li key={i} className="flex justify-between text-slate-600">
                  <span>{log.activityLabel} × {log.quantity}</span>
                  <span className="font-medium text-slate-800">
                    {log.co2Kg} kg
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Middle column: charts + breakdown */}
      <div className="lg:col-span-1 space-y-5">
        <WeeklyChart data={weeklyData} />
        <BreakdownBars totals={totals} />
        <NudgePanel totals={totals} />
      </div>

      {/* Right column: map + community */}
      <div className="lg:col-span-1 space-y-5">
        <EcoMap />
        <Leaderboard />
      </div>
    </div>
  )
}
