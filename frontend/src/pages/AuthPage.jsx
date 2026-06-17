import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, User, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const { login, signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      let enteredName = displayName;
      let enteredEmail = email;

      if (isLogin) {
        const loggedUser = await login(email, password);
        enteredName = loggedUser.displayName || loggedUser.email.split('@')[0] || 'Eco Explorer';
      } else {
        if (!displayName.trim()) {
          throw new Error('Name is required.');
        }
        const newUser = await signup(email, password, displayName);
        enteredName = newUser.displayName || displayName;
      }

      localStorage.setItem('carbonlens_user_profile', JSON.stringify({
        name: enteredName || 'Eco Explorer',
        email: enteredEmail
      }));

      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use' || err.message === 'auth/email-already-in-use') {
        setError('This email is already in use.');
      } else if (err.code === 'auth/invalid-credential' || err.message === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setAuthLoading(true);
    try {
      const loggedUser = await googleLogin();
      localStorage.setItem('carbonlens_user_profile', JSON.stringify({
        name: loggedUser.displayName || 'Eco Explorer',
        email: loggedUser.email
      }));
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Brand Left Banner */}
      <div className="md:w-1/2 bg-slate-900 text-white flex flex-col justify-between p-8 md:p-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-2 z-10">
          <Leaf className="h-8 w-8 text-emerald-400" />
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            CarbonLens
          </span>
        </div>

        <div className="my-auto py-12 z-10 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Track. Understand.<br />
            <span className="text-emerald-400">Reduce your footprint.</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-md">
            CarbonLens helps you measure your daily carbon footprint, analyze your emission trends, plan eco-friendly commutes with real Google Maps data, and get tailored AI coaching.
          </p>

          <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 max-w-sm">
            <Sparkles className="h-6 w-6 text-emerald-400 flex-shrink-0 animate-bounce" />
            <p className="text-xs text-slate-400 leading-relaxed">
              "Every gram of carbon reduced is a step towards preserving our planet. Join thousands of users today."
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 z-10">
          &copy; {new Date().getFullYear()} CarbonLens. Crafted for the environment.
        </div>
      </div>

      {/* Auth Form Right Panel */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? 'Sign in to CarbonLens' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {isLogin ? "New to CarbonLens? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-emerald-600 font-semibold hover:underline"
              >
                {isLogin ? 'Create one now' : 'Sign in'}
              </button>
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-700 flex items-start gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name-input" className="text-xs font-semibold text-slate-500 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    id="name-input"
                    aria-label="Full Name"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-input" className="text-xs font-semibold text-slate-500 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  id="email-input"
                  aria-label="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@example.com"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="text-xs font-semibold text-slate-500 block mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  id="password-input"
                  aria-label="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl py-3 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <span className="border-2 border-white/20 border-t-white h-5 w-5 rounded-full animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute border-t border-slate-200 w-full" />
            <span className="bg-white px-4 text-xs font-semibold text-slate-400 z-10">
              OR
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            type="button"
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl py-3 flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google (Simulated)
          </button>
        </div>
      </div>
    </div>
  );
}
