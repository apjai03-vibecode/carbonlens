import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Car, Flame, Apple, Bus, Footprints, Sun, Zap, Check } from 'lucide-react';

export default function OnboardingModal() {
  const { needsOnboarding, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [diet, setDiet] = useState('');
  const [commute, setCommute] = useState('');
  const [energy, setEnergy] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!needsOnboarding) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await completeOnboarding({ diet, commute, energy });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const dietOptions = [
    { id: 'vegan', label: 'Vegan', desc: 'Plant-based, minimal ecological footprint', icon: Leaf, color: 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:border-emerald-300' },
    { id: 'vegetarian', label: 'Vegetarian', desc: 'No meat, includes dairy and eggs', icon: Apple, color: 'text-green-500 bg-green-50 border-green-100 hover:border-green-300' },
    { id: 'omnivore', label: 'Meat-heavy / Omnivore', desc: 'Regular meat and dairy consumption', icon: Flame, color: 'text-amber-500 bg-amber-50 border-amber-100 hover:border-amber-300' }
  ];

  const commuteOptions = [
    { id: 'car', label: 'Personal Car', desc: 'Gasoline or diesel vehicle, high impact', icon: Car, color: 'text-rose-500 bg-rose-50 border-rose-100 hover:border-rose-300' },
    { id: 'transit', label: 'Public Transit', desc: 'Trains, buses, or shared transport', icon: Bus, color: 'text-sky-500 bg-sky-50 border-sky-100 hover:border-sky-300' },
    { id: 'walking_cycling', label: 'Walking / Cycling', desc: 'Active travel, virtually zero emissions', icon: Footprints, color: 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:border-emerald-300' }
  ];

  const energyOptions = [
    { id: 'grid', label: 'Standard Grid', desc: 'Mix of coal, gas, and nuclear power', icon: Zap, color: 'text-amber-500 bg-amber-50 border-amber-100 hover:border-amber-300' },
    { id: 'solar', label: 'Solar / Renewables', desc: '100% clean, renewable source panels', icon: Sun, color: 'text-yellow-500 bg-yellow-50 border-yellow-100 hover:border-yellow-300' },
    { id: 'gas', label: 'Natural Gas / Mix', desc: 'Piped gas heating or co-generation grid', icon: Flame, color: 'text-orange-500 bg-orange-50 border-orange-100 hover:border-orange-300' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 flex flex-col relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header / Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            <span>Baseline Profile Setup</span>
            <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">Step {step} of 3</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex gap-1">
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? 'bg-emerald-500 flex-1' : 'bg-slate-100 flex-1'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? 'bg-emerald-500 flex-1' : 'bg-slate-100 flex-1'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${step >= 3 ? 'bg-emerald-500 flex-1' : 'bg-slate-100 flex-1'}`} />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-slate-800">What is your typical diet?</h3>
                <p className="text-sm text-slate-500 mt-1">Food represents a large portion of individual household carbon emissions.</p>
              </div>
              <div className="space-y-3">
                {dietOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = diet === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setDiet(opt.id)}
                      className={`w-full flex items-center gap-4 text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/35'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${opt.color.split(' ')[0]} ${opt.color.split(' ')[1]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-slate-800">How do you primarily commute?</h3>
                <p className="text-sm text-slate-500 mt-1">Daily commutes are the biggest driver of transportation footprints.</p>
              </div>
              <div className="space-y-3">
                {commuteOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = commute === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setCommute(opt.id)}
                      className={`w-full flex items-center gap-4 text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/35'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${opt.color.split(' ')[0]} ${opt.color.split(' ')[1]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-slate-800">What is your home's primary energy source?</h3>
                <p className="text-sm text-slate-500 mt-1">Heating, cooling, and electricity carbon impact varies significantly based on fuel type.</p>
              </div>
              <div className="space-y-3">
                {energyOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = energy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setEnergy(opt.id)}
                      className={`w-full flex items-center gap-4 text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/35'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${opt.color.split(' ')[0]} ${opt.color.split(' ')[1]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1 || submitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={submitting || (step === 1 && !diet) || (step === 2 && !commute) || (step === 3 && !energy)}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-lg active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {submitting ? (
              <span className="border-2 border-white/20 border-t-white h-4 w-4 rounded-full animate-spin" />
            ) : step === 3 ? (
              'Complete'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
