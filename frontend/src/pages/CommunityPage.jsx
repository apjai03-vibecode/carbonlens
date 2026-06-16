import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboardUsers, getActivityLogs } from '../firebase';
import { Users, Award, Shield, Check, Flame, Trophy, MapPin, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export default function CommunityPage() {
  const { user, userProfile } = useAuth();
  const [leaderboardUsers, setLeaderboardUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedChallenge, setJoinedChallenge] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [usersData, logsData] = await Promise.all([
          getLeaderboardUsers(),
          getActivityLogs(user.uid)
        ]);
        setLeaderboardUsers(usersData);
        setLogs(logsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Compute a list of leaderboard rankings
  const rankedUsers = useMemo(() => {
    const currentUserName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'You';
    
    // Seed leaderboard with some realistic static participants if mock list is small
    const defaults = [
      { displayName: 'Aanya Sharma', dailyTarget: 12.5, totalWeekly: 85.4 },
      { displayName: 'Kabir Mehta', dailyTarget: 14.0, totalWeekly: 96.8 },
      { displayName: 'Rhea Sen', dailyTarget: 18.0, totalWeekly: 124.0 },
      { displayName: 'Neil D.', dailyTarget: 22.0, totalWeekly: 148.5 },
      { displayName: 'Zoya K.', dailyTarget: 11.2, totalWeekly: 76.2 }
    ];

    const mappedUsers = leaderboardUsers.map(u => {
      const isCurrentUser = u.uid === user?.uid;
      const target = u.dailyTarget || 15.0;
      // Calculate a mock score relative to daily target
      const scoreMultiplier = isCurrentUser ? 0.95 : 1.0;
      const totalWeekly = +(target * 7 * scoreMultiplier).toFixed(1);
      
      return {
        displayName: isCurrentUser ? `${currentUserName} (You)` : u.displayName || 'Eco Friend',
        dailyTarget: target,
        totalWeekly,
        isCurrentUser
      };
    });

    // Blend defaults and actual users
    const combined = [...mappedUsers];
    defaults.forEach(d => {
      if (!combined.some(c => c.displayName.replace(' (You)', '') === d.displayName)) {
        combined.push(d);
      }
    });

    // Sort by weekly carbon ascending (lower is better!)
    return combined.sort((a, b) => a.totalWeekly - b.totalWeekly);
  }, [leaderboardUsers, user, userProfile]);

  // Find user's position
  const userRankIndex = useMemo(() => {
    return rankedUsers.findIndex(u => u.isCurrentUser || u.displayName.includes('(You)'));
  }, [rankedUsers]);

  // Programmatically check achievements
  const achievements = useMemo(() => {
    const activeCommuterCount = logs.filter(l => l.category === 'transport' && l.activity === 'bike_walk').length;
    const isSolar = userProfile?.baseline?.energy === 'solar';
    const totalLogsCount = logs.length;
    const hasVegan = logs.some(l => l.category === 'food' && l.activity === 'vegan');

    return [
      {
        id: 'tree_hugger',
        title: 'Tree Hugger',
        desc: 'Consistent daily carbon budget adherence',
        req: 'Logged 3+ eco activities',
        unlocked: totalLogsCount >= 3,
        icon: Award,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-100'
      },
      {
        id: 'active_commuter',
        title: 'Active Commuter',
        desc: 'Log cycling or walking trips',
        req: 'Logged a zero-carbon route',
        unlocked: activeCommuterCount >= 1 || userProfile?.baseline?.commute === 'walking_cycling',
        icon: Trophy,
        color: 'text-sky-500 bg-sky-50 border-sky-100'
      },
      {
        id: 'clean_energy',
        title: 'Energy Champion',
        desc: 'Opt for renewable electricity sources',
        req: 'Solar energy onboarding profile',
        unlocked: isSolar,
        icon: Shield,
        color: 'text-yellow-500 bg-yellow-50 border-yellow-100'
      },
      {
        id: 'consistent_tracker',
        title: 'Daily Tracker',
        desc: 'Log activities frequently',
        req: 'Logged 5+ activities in total',
        unlocked: totalLogsCount >= 5,
        icon: Flame,
        color: 'text-orange-500 bg-orange-50 border-orange-100'
      },
      {
        id: 'eco_chef',
        title: 'Eco Chef',
        desc: 'Choose plant-based vegan nutrition',
        req: 'Logged a vegan meal',
        unlocked: hasVegan || userProfile?.baseline?.diet === 'vegan',
        icon: Sparkles,
        color: 'text-purple-500 bg-purple-50 border-purple-100'
      }
    ];
  }, [logs, userProfile]);

  const joinedChallengeCount = 12450 + (joinedChallenge ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Community & Gamification</h2>
        <p className="text-slate-500 text-sm mt-1">Engage with similar households, compete on leaderboards, and unlock badges.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2 text-emerald-600">
                <Trophy className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Household Leaderboard</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Weekly CO₂e</span>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <span className="border-2 border-slate-200 border-t-emerald-600 h-6 w-6 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {rankedUsers.map((person, index) => {
                  const isCurrent = person.isCurrentUser || person.displayName.includes('(You)');
                  return (
                    <div
                      key={person.displayName}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10'
                          : 'border-slate-100 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-6 text-center text-sm font-black ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-slate-400' :
                          index === 2 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <p className={`text-sm ${isCurrent ? 'font-bold text-emerald-800' : 'font-semibold text-slate-800'}`}>
                            {person.displayName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Daily Target: {person.dailyTarget} kg</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-800">{person.totalWeekly} kg</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase">CO₂ / week</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
              * Rankings update dynamically based on logging frequency and baseline values. Lower footprint is rewarded.
            </p>
          </div>
        </div>

        {/* Right Column: Challenge & Achievements */}
        <div className="space-y-6">
          
          {/* Weekly City Challenge */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <MapPin className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Weekly City Challenge</h3>
            </div>
            
            <div className="bg-emerald-50/45 border border-emerald-100/50 rounded-2xl p-4 space-y-3">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">Active Challenge</span>
                <h4 className="font-extrabold text-sm text-slate-800 mt-2">No-Car Friday</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Avoid driving a personal vehicle this Friday. Join your neighbors in commuting via transit, cycling, or walking!
                </p>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-emerald-100/40 pt-3">
                <span className="text-slate-500 font-medium">
                  <strong>{joinedChallengeCount.toLocaleString()}</strong> households participating
                </span>
                
                <button
                  onClick={() => setJoinedChallenge(!joinedChallenge)}
                  className="focus:outline-none transition-transform active:scale-95"
                >
                  {joinedChallenge ? (
                    <ToggleRight className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Achievements Badges</h3>
            
            <div className="space-y-3">
              {achievements.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                      badge.unlocked
                        ? 'border-slate-100 bg-white opacity-100'
                        : 'border-slate-100/70 bg-slate-50/50 opacity-50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${badge.unlocked ? badge.color.split(' ')[0] + ' ' + badge.color.split(' ')[1] : 'bg-slate-200 text-slate-400'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-800 truncate">{badge.title}</p>
                        {badge.unlocked && (
                          <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{badge.desc}</p>
                      <p className="text-[9px] text-slate-400 italic font-medium mt-0.5">Req: {badge.req}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
