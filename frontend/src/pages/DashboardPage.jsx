import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityLogs, saveActivityLog, deleteActivityLog } from '../firebase';
import { Leaf, Flame, Sparkles, Car, Bus, Apple, Trash2, ShieldAlert, CheckCircle, Zap } from 'lucide-react';

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickLogLoading, setQuickLogLoading] = useState(null);

  const displayName = useMemo(() => {
    try {
      const stored = localStorage.getItem('carbonlens_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          return parsed.name;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return userProfile?.displayName || user?.displayName || 'Eco Explorer';
  }, [userProfile, user]);

  const dailyTarget = userProfile?.dailyTarget || 15.0;

  const fetchLogs = async () => {
    if (!user) return;
    try {
      const allLogs = await getActivityLogs(user.uid);
      setLogs(allLogs);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Today's activities
  const todayLogs = useMemo(() => {
    const todayStr = new Date().toDateString();
    return logs.filter(log => {
      const logDate = log.date ? new Date(log.date) : new Date(log.createdAt);
      return logDate.toDateString() === todayStr;
    });
  }, [logs]);

  // Sum of today's emissions
  const todayTotal = useMemo(() => {
    return +todayLogs.reduce((sum, log) => sum + (log.co2Kg || 0), 0).toFixed(1);
  }, [todayLogs]);

  // Emissions breakdown by category
  const todayCategoryTotals = useMemo(() => {
    const categories = { food: 0, transport: 0, energy: 0 };
    todayLogs.forEach(log => {
      if (categories[log.category] !== undefined) {
        categories[log.category] += log.co2Kg || 0;
      }
    });
    return categories;
  }, [todayLogs]);

  // Highest emitting category
  const highestCategoryInfo = useMemo(() => {
    if (todayLogs.length === 0) return null;
    const entries = Object.entries(todayCategoryTotals);
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const [category, amount] = sorted[0];
    if (amount === 0) return null;

    const labelMap = {
      food: 'Food & Diet',
      transport: 'Transportation',
      energy: 'Home Energy'
    };

    const suggestionMap = {
      food: 'reducing red meat intake, planning a vegan meal, or reducing dairy waste.',
      transport: 'opting for public transit, combining errands, or walking/cycling short distances.',
      energy: 'unplugging phantom appliances, adjusting AC thermostat by a couple degrees, or switching off unused lights.'
    };

    return {
      category,
      label: labelMap[category] || category,
      amount: +amount.toFixed(1),
      suggestion: suggestionMap[category] || 'making eco-friendly adjustments.'
    };
  }, [todayCategoryTotals, todayLogs]);

  const quickLogs = [
    { id: 'quick_vegan', title: 'Logged a vegan meal', category: 'food', activity: 'vegetables', activityLabel: 'Vegan meal', quantity: 1, unit: 'serving (100g)', co2Kg: 0.04, icon: Leaf, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100' },
    { id: 'quick_veg', title: 'Logged vegetarian meal', category: 'food', activity: 'dairy', activityLabel: 'Vegetarian meal', quantity: 2, unit: 'serving (100g)', co2Kg: 0.64, icon: Apple, color: 'text-green-600 bg-green-50 hover:bg-green-100/80 border-green-100' },
    { id: 'quick_car', title: 'Logged 5mi drive', category: 'transport', activity: 'car_petrol', activityLabel: 'Car (petrol) drive', quantity: 8, unit: 'km', co2Kg: 1.54, icon: Car, color: 'text-rose-600 bg-rose-50 hover:bg-rose-100/80 border-rose-100' },
    { id: 'quick_bus', title: 'Logged 10mi bus trip', category: 'transport', activity: 'bus', activityLabel: 'Bus trip', quantity: 16, unit: 'km', co2Kg: 1.68, icon: Bus, color: 'text-sky-600 bg-sky-50 hover:bg-sky-100/80 border-sky-100' },
    { id: 'quick_ac', title: 'Logged 2hr AC usage', category: 'energy', activity: 'ac_hour', activityLabel: 'Air conditioner', quantity: 2, unit: 'hour', co2Kg: 1.24, icon: Zap, color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100/80 border-yellow-100' },
  ];

  const handleQuickLog = async (item) => {
    if (!user) return;
    setQuickLogLoading(item.id);
    try {
      const payload = {
        category: item.category,
        activity: item.activity,
        activityLabel: item.activityLabel,
        quantity: item.quantity,
        unit: item.unit,
        co2Kg: item.co2Kg,
        date: new Date().toISOString(),
      };
      await saveActivityLog(user.uid, payload);
      await fetchLogs();
    } catch (error) {
      console.error("Error saving quick log:", error);
    } finally {
      setQuickLogLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      await deleteActivityLog(user.uid, id);
      await fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, {displayName}!</h2>
        <p className="text-slate-500 text-sm mt-1">Here is your carbon footprint breakdown and progress for today.</p>
      </div>

      {/* Grid of Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Today's Metric & Banner */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Footprint Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Footprint</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-800 tracking-tight">{todayTotal}</span>
                <span className="text-lg font-semibold text-slate-400">kg CO₂e</span>
              </div>
              <p className="text-xs text-slate-500">
                You've consumed <span className="font-semibold">{Math.round((todayTotal / dailyTarget) * 100)}%</span> of your daily budget.
              </p>
            </div>

            {/* Visual Budget Ring */}
            <div className="relative flex items-center justify-center h-28 w-28 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke={todayTotal > dailyTarget ? '#f43f5e' : '#10b981'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - Math.min(todayTotal / dailyTarget, 1))}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500">Target</span>
                <span className="text-sm font-extrabold text-slate-700">{dailyTarget}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Motivational Banner */}
          {todayTotal <= dailyTarget ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4 transition-all">
              <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Under Daily Budget</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Excellent work! You are currently under your daily carbon target of <strong>{dailyTarget} kg CO₂e</strong>. Keeping your daily footprint low directly helps combat global warming.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4 transition-all">
              <ShieldAlert className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Budget Exceeded</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  You've exceeded your daily target of <strong>{dailyTarget} kg CO₂e</strong> by <strong>{(todayTotal - dailyTarget).toFixed(1)} kg</strong>. Try walking instead of driving for short routes or opting for plant-based meals to offset your footprint.
                </p>
              </div>
            </div>
          )}

          {/* Today's Highest Emitting Category Text Summary */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Today's Category Highlight</h3>
            {loading ? (
              <div className="h-12 flex items-center justify-center">
                <span className="border-2 border-slate-200 border-t-emerald-600 h-5 w-5 rounded-full animate-spin" />
              </div>
            ) : highestCategoryInfo ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Your highest emitting category today is <span className="font-semibold text-slate-800">{highestCategoryInfo.label}</span>, generating <strong className="text-rose-600 font-semibold">{highestCategoryInfo.amount} kg CO₂e</strong>.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  💡 <strong>Action Tip:</strong> Reduce tomorrow's carbon load by {highestCategoryInfo.suggestion}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 leading-relaxed">
                You haven't logged any carbon emissions today. Add common daily items below or plan your commute using the Eco-Trip Planner to start accumulating carbon logs!
              </p>
            )}
          </div>

          {/* Today's Activities Feed */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Today's Logged Activities</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{todayLogs.length} logged</span>
            </div>

            {loading ? (
              <div className="h-24 flex items-center justify-center">
                <span className="border-2 border-slate-200 border-t-emerald-600 h-6 w-6 rounded-full animate-spin" />
              </div>
            ) : todayLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No activities logged today yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Activity</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold text-right">Quantity</th>
                      <th className="pb-3 font-semibold text-right">Emissions</th>
                      <th className="pb-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {todayLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-medium text-slate-800">{log.activityLabel}</td>
                        <td className="py-3">
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            log.category === 'food' ? 'text-emerald-700 bg-emerald-50' :
                            log.category === 'transport' ? 'text-sky-700 bg-sky-50' : 'text-yellow-700 bg-yellow-50'
                          }`}>
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-600 font-medium">{log.quantity} {log.unit}</td>
                        <td className="py-3 text-right font-semibold text-slate-800">{log.co2Kg} kg</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Delete Entry"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Quick Log Widget */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Log Activities</h3>
              <p className="text-xs text-slate-500 mb-4">Click any option to instantly log a common carbon footprint activity.</p>
              
              <div className="space-y-3">
                {quickLogs.map((item) => {
                  const Icon = item.icon;
                  const isQuickLoading = quickLogLoading === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleQuickLog(item)}
                      disabled={isQuickLoading || loading}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${item.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100/55">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.activityLabel}</p>
                          <p className="text-xs text-slate-500 font-medium">+{item.co2Kg} kg CO₂e</p>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-400">
                        {isQuickLoading ? (
                          <span className="inline-block border-2 border-slate-300 border-t-slate-600 h-4 w-4 rounded-full animate-spin" />
                        ) : (
                          <span>+ Add</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
