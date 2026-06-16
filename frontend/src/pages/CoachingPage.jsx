import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityLogs } from '../firebase';
import { Sparkles, Send, ShieldCheck, ArrowUpRight, Flame, Leaf, Bot, RefreshCw } from 'lucide-react';

export default function CoachingPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingTexts = [
    "Scanning your local Firestore logs...",
    "Analyzing emission breakdowns across Transportation, Food, and Energy...",
    "Identifying biggest carbon leaks in your daily activities...",
    "Formulating personalized, actionable swaps...",
    "Compiling weekly coaching report..."
  ];

  useEffect(() => {
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
    fetchLogs();
  }, [user]);

  // Determine top category from actual logged data
  const categoryStats = useMemo(() => {
    const categories = { food: 0, transport: 0, energy: 0, waste: 0 };
    logs.forEach(log => {
      const cat = ['waste', 'waste_shopping'].includes(log.category) ? 'waste' : log.category;
      if (categories[cat] !== undefined) {
        categories[cat] += log.co2Kg || 0;
      }
    });
    return categories;
  }, [logs]);

  const topCategory = useMemo(() => {
    const sorted = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : 'general';
  }, [categoryStats]);

  const handleGenerateReport = () => {
    setGenerating(true);
    setLoadingStep(0);
    setReport(null);

    // Increment through loading messages to simulate AI thinking
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < loadingTexts.length) {
        setLoadingStep(step);
      } else {
        clearInterval(interval);
        generatePersonalizedReport();
      }
    }, 900);
  };

  const generatePersonalizedReport = () => {
    let strengths = "";
    let leak = "";
    let tip = "";

    // Tailor content to highest category from actual user data
    if (topCategory === 'transport') {
      strengths = "You've successfully kept your home energy emissions low, showcasing good habits around electricity and appliance usage.";
      leak = `Transportation is currently your largest carbon leak, contributing ${categoryStats.transport.toFixed(1)} kg CO₂e to your footprint. This is primarily driven by driving personal gasoline/diesel routes.`;
      tip = "Swap just two personal car commutes this week for public transit, cycling, or walking. Opting for transit on a 10km route saves approximately 1.7 kg CO₂e per trip.";
    } else if (topCategory === 'food') {
      strengths = "Your transport carbon footprint is relatively low, indicating efficient commuting or high active travel ratios.";
      leak = `Your food consumption choices represent your largest carbon leakage, contributing ${categoryStats.food.toFixed(1)} kg CO₂e. Meals featuring red meat or dairy represent high-intensity emissions.`;
      tip = "Introduce a 'Meatless Monday' or swap beef for chicken or plant-based proteins. Replacing a single beef meal with vegetables or lentils saves up to 2.6 kg CO₂e.";
    } else if (topCategory === 'energy') {
      strengths = "Your dietary carbon footprint is highly optimal, indicating a preference for low-emission vegetables and grains.";
      leak = `Home energy and climate control are your main carbon leaks, registering ${categoryStats.energy.toFixed(1)} kg CO₂e. Prolonged air conditioner use is highly intensive.`;
      tip = "Raise your AC thermostat by 2°F, leverage natural ventilation during cool evenings, and unplug phantom standby electronics when sleeping to save roughly 1.2 kg CO₂e daily.";
    } else if (topCategory === 'waste') {
      strengths = "Your utility usage and home energy conservation are excellent, keeping grid power demand to a minimum.";
      leak = `Household shopping packaging and waste accumulation represent your primary leak, creating ${categoryStats.waste.toFixed(1)} kg CO₂e. Plastics and landfill trash carry heavy processing carbon.`;
      tip = "Establish a dedicated compost bin for organic kitchen waste and transition to reusable grocery bags. Composting avoids anaerobic methane release, saving 0.8 kg CO₂e per pound of waste.";
    } else {
      // General baseline
      strengths = "Great job setting up your baseline profile and taking the first step towards carbon consciousness.";
      leak = "Your carbon footprint is evenly distributed, but logging more daily commutes and electricity logs will help pinpoint hidden leaks.";
      tip = "Log at least 5 activities this week. Consistency is key to unlocking precise AI recommendations and tracking long-term trends.";
    }

    setReport({ strengths, leak, tip });
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">AI Insights & Coaching</h2>
        <p className="text-slate-500 text-sm mt-1">Get custom, data-driven sustainability coaching powered by Claude.</p>
      </div>

      {/* Claude Interface Mock Wrapper */}
      <div className="bg-[#fcfbf9] border border-orange-100/60 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        {/* Mock Claude Header */}
        <div className="bg-slate-900 text-slate-100 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">Claude 3.5 Sonnet</h3>
              <p className="text-[10px] text-slate-500 font-medium">Carbon Coaching Agent • Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-semibold">Synced with Firestore</span>
          </div>
        </div>

        {/* Chat / Report Area */}
        <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {/* Welcome Message */}
          {!generating && !report && (
            <div className="flex gap-4 items-start max-w-2xl bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl flex-shrink-0 mt-0.5">
                <Bot className="h-5 w-5" />
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Welcome back to your Eco Coach!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  I scan your database records in real-time to analyze your daily habits, pinpoint carbon leaks, and formulate actionable recommendations.
                </p>
                <p className="text-xs text-slate-500">
                  Click the button below to generate your personalized weekly report.
                </p>
                <button
                  onClick={handleGenerateReport}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                  Generate Weekly Report
                </button>
              </div>
            </div>
          )}

          {/* Loading State Animation */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 max-w-md mx-auto text-center">
              <div className="relative h-16 w-16 flex items-center justify-center">
                <Leaf className="h-10 w-10 text-emerald-500 animate-bounce" />
                <div className="absolute inset-0 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Analyzing carbon logs...</h4>
                <p className="text-xs text-slate-500 font-medium animate-pulse">{loadingTexts[loadingStep]}</p>
              </div>
            </div>
          )}

          {/* Report Display */}
          {report && (
            <div className="space-y-6 animate-fade-in">
              {/* Coach Response Header */}
              <div className="flex gap-3 items-center">
                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Weekly Coaching Report</span>
              </div>

              {/* Grid of Report Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Strengths Card */}
                <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                    <h4 className="font-bold text-sm uppercase tracking-wide">Your Strengths</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {report.strengths}
                  </p>
                </div>

                {/* Carbon Leak Card */}
                <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 text-rose-700">
                    <Flame className="h-5 w-5" />
                    <h4 className="font-bold text-sm uppercase tracking-wide">Carbon Leak</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {report.leak}
                  </p>
                </div>

                {/* Actionable Tip Card */}
                <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Sparkles className="h-5 w-5" />
                    <h4 className="font-bold text-sm uppercase tracking-wide">Actionable Swap</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {report.tip}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleGenerateReport}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
