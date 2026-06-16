import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  BarChart3,
  Sparkles,
  Users,
  LogOut,
  Menu,
  X,
  Leaf,
  Award
} from 'lucide-react';

import OnboardingModal from './OnboardingModal';

export default function Layout() {
  const { user, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Eco-Trip Planner', path: '/trip-planner', icon: Map },
    { name: 'Activity Logger', path: '/activity-log', icon: ClipboardList },
    { name: 'Analytics & Trends', path: '/analytics', icon: BarChart3 },
    { name: 'AI Coaching', path: '/coaching', icon: Sparkles },
    { name: 'Community', path: '/community', icon: Users },
  ];

  const getStoredName = () => {
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
    return userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Eco Explorer';
  };

  const displayName = getStoredName();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex-shrink-0">
        {/* Brand Logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800">
          <Leaf className="h-6 w-6 text-emerald-400 animate-pulse" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            CarbonLens
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Card Footer */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 text-slate-200 shadow-2xl h-full animate-slide-in">
            {/* Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Brand Logo */}
            <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800">
              <Leaf className="h-6 w-6 text-emerald-400" />
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                CarbonLens
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile Card Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 hidden md:block">CarbonLens</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* User Streak/Badge Indicator */}
            {userProfile?.dailyTarget && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-xs font-semibold">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Target: {userProfile.dailyTarget} kg CO₂e / day</span>
              </div>
            )}
            <div className="md:hidden h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      <OnboardingModal />
    </div>
  );
}
