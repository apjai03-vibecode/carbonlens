import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveActivityLog, getActivityLogs, deleteActivityLog } from '../firebase';
import { PlusCircle, Trash2, Calendar, ClipboardList, ShoppingBag, Zap, Car, Sparkles } from 'lucide-react';

const DETAILED_FACTORS = {
  food: {
    label: 'Food & Diet',
    icon: ShoppingBag,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    unit: 'servings (100g)',
    options: [
      { key: 'vegan', label: 'Vegan Meal (plant-based)', factor: 0.04 },
      { key: 'vegetarian', label: 'Vegetarian Meal (no meat)', factor: 0.32 },
      { key: 'chicken', label: 'Chicken / Poultry Meal', factor: 0.69 },
      { key: 'beef', label: 'Beef / Red Meat Meal', factor: 2.70 },
      { key: 'dairy', label: 'Dairy (milk, cheese, butter)', factor: 0.32 },
    ]
  },
  energy: {
    label: 'Home Energy',
    icon: Zap,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    unit: 'kWh', // default, changes below
    options: [
      { key: 'electricity', label: 'Electricity Usage', factor: 0.41, unit: 'kWh' },
      { key: 'natural_gas', label: 'Natural Gas Heating/Cooking', factor: 2.05, unit: 'therms' },
      { key: 'lpg', label: 'LPG Cooking Gas', factor: 2.98, unit: 'kg' },
      { key: 'ac_hour', label: 'Air Conditioner Usage', factor: 0.62, unit: 'hours' },
    ]
  },
  transport: {
    label: 'Transportation',
    icon: Car,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
    unit: 'km',
    options: [
      { key: 'car_petrol', label: 'Car (petrol)', factor: 0.192 },
      { key: 'car_diesel', label: 'Car (diesel)', factor: 0.171 },
      { key: 'bus', label: 'Bus Ride', factor: 0.105 },
      { key: 'train', label: 'Train Ride', factor: 0.041 },
      { key: 'flight_short', label: 'Short-haul Flight', factor: 0.255 },
    ]
  },
  waste_shopping: {
    label: 'Waste & Shopping',
    icon: ShoppingBag,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    unit: 'lbs',
    options: [
      { key: 'plastic', label: 'Plastic Waste', factor: 0.82 },
      { key: 'recycling', label: 'Mixed Recycling', factor: 0.12 },
      { key: 'landfill', label: 'Landfill Trash / Refuse', factor: 1.15 },
      { key: 'paper', label: 'Paper & Cardboard Waste', factor: 0.24 },
    ]
  }
};

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState('food');
  const [activity, setActivity] = useState('vegan');
  const [quantity, setQuantity] = useState(1);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    if (!user) return;
    try {
      const data = await getActivityLogs(user.uid);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Set default activity whenever category changes
  useEffect(() => {
    const defaultAct = DETAILED_FACTORS[category].options[0].key;
    setActivity(defaultAct);
  }, [category]);

  const activeCategory = DETAILED_FACTORS[category];
  const activeActivityObj = useMemo(() => {
    return activeCategory.options.find(o => o.key === activity);
  }, [activeCategory, activity]);

  // Determine dynamic unit label
  const unitLabel = useMemo(() => {
    if (activeActivityObj && activeActivityObj.unit) {
      return activeActivityObj.unit;
    }
    return activeCategory.unit;
  }, [activeCategory, activeActivityObj]);

  // Today's activities only
  const todayLogs = useMemo(() => {
    const todayStr = new Date().toDateString();
    return logs.filter(log => {
      const logDate = log.date ? new Date(log.date) : new Date(log.createdAt);
      return logDate.toDateString() === todayStr;
    });
  }, [logs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || quantity <= 0) return;

    setSubmitting(true);
    try {
      const co2Val = +(activeActivityObj.factor * quantity).toFixed(2);
      const payload = {
        category,
        activity,
        activityLabel: activeActivityObj.label,
        quantity: Number(quantity),
        unit: unitLabel,
        co2Kg: co2Val,
        date: new Date().toISOString(),
      };
      await saveActivityLog(user.uid, payload);
      setQuantity(1);
      await fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      await deleteActivityLog(user.uid, id);
      await fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Activity Logger</h2>
        <p className="text-slate-500 text-sm mt-1">Keep a detailed log of your daily actions and monitor their instant carbon footprint impact.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 sticky top-20">
            <div className="flex items-center gap-2 text-emerald-600">
              <ClipboardList className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Log Carbon Activity</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="category-select" className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
                <select
                  id="category-select"
                  aria-label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all capitalize"
                >
                  {Object.entries(DETAILED_FACTORS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="activity-select" className="text-xs font-semibold text-slate-500 block mb-1">Activity Type</label>
                <select
                  id="activity-select"
                  aria-label="Activity Type"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                >
                  {activeCategory.options.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity-input" className="text-xs font-semibold text-slate-500 block mb-1">
                  Quantity ({unitLabel})
                </label>
                <input
                  type="number"
                  id="quantity-input"
                  aria-label={`Quantity in ${unitLabel}`}
                  required
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>

              {activeActivityObj && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Emission Rate:</span>
                  <span className="font-bold text-slate-700">{activeActivityObj.factor} kg CO₂e / {unitLabel.replace('servings ', '')}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl py-3 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="border-2 border-white/20 border-t-white h-4 w-4 rounded-full animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Add to Log</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List of today's activities & recent history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Logged Activities */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <Calendar className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Today's Logged Activities</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{todayLogs.length} logged</span>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <span className="border-2 border-slate-200 border-t-emerald-600 h-6 w-6 rounded-full animate-spin" />
              </div>
            ) : todayLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No activities logged today yet. Use the form on the left to add items.
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
                    {todayLogs.map((log) => {
                      const meta = DETAILED_FACTORS[log.category] || { label: log.category, color: 'bg-slate-50 text-slate-500' };
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-medium text-slate-800">{log.activityLabel}</td>
                          <td className="py-3.5">
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${meta.color}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-right text-slate-600 font-medium">{log.quantity} {log.unit}</td>
                          <td className="py-3.5 text-right font-semibold text-slate-800">{log.co2Kg} kg</td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleDelete(log.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              title="Delete Log"
                              aria-label="Delete log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Older Activities (All History) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Logged Activities History</h3>
              <span className="text-xs text-slate-400 font-medium">{logs.length} total entries</span>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <span className="border-2 border-slate-200 border-t-emerald-600 h-6 w-6 rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No logs found in database.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
                {logs.map((log) => {
                  const logDate = log.date ? new Date(log.date) : new Date(log.createdAt);
                  const formattedDate = logDate.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={log.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-all text-sm">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">{log.activityLabel}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span className="capitalize text-emerald-600 font-semibold">{log.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-slate-800">{log.co2Kg} kg</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">{log.quantity} {log.unit}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Entry"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
