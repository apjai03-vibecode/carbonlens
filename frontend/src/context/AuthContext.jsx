import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmail,
  signUpWithEmail,
  loginWithGoogle,
  logout,
  subscribeToAuthChanges,
  getUserProfile,
  saveUserProfile as fbSaveUserProfile
} from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          // If profile exists and onboarding is complete, don't show onboarding
          if (profile && profile.onboardingCompleted) {
            setNeedsOnboarding(false);
          } else {
            setNeedsOnboarding(true);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setNeedsOnboarding(true); // Default to onboarding on error/empty
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, displayName) => {
    setLoading(true);
    try {
      const newUser = await signUpWithEmail(email, password, displayName);
      setUser(newUser);
      setNeedsOnboarding(true);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const loggedUser = await signInWithEmail(email, password);
      setUser(loggedUser);
      // Profile fetching is handled in onAuthStateChanged
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setUserProfile(null);
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (baselineData) => {
    if (!user) throw new Error("No authenticated user.");
    setLoading(true);
    try {
      // Calculate carbon daily baseline/target based on their onboarding responses
      // Diet: vegan (2.0), vegetarian (3.5), omnivore (6.0)
      // Commute: car (8.0), transit (4.0), walking/cycling (0.2)
      // Energy: solar (1.0), gas (4.0), grid (3.0)
      let dailyTarget = 15.0; // Default budget in kg CO2e
      
      const dietCoeffs = { vegan: 2.0, vegetarian: 3.5, omnivore: 6.0 };
      const commuteCoeffs = { car: 8.0, transit: 4.0, walking_cycling: 0.2 };
      const energyCoeffs = { solar: 1.0, gas: 4.0, grid: 3.0 };

      const dietVal = dietCoeffs[baselineData.diet] || 3.5;
      const commuteVal = commuteCoeffs[baselineData.commute] || 4.0;
      const energyVal = energyCoeffs[baselineData.energy] || 3.0;

      // Base target = diet + commute + energy + 3.0 (miscellaneous / baseline shopping)
      dailyTarget = +(dietVal + commuteVal + energyVal + 3.0).toFixed(1);

      const profilePayload = {
        baseline: baselineData,
        dailyTarget,
        onboardingCompleted: true,
        displayName: user.displayName || user.email.split('@')[0],
        email: user.email,
      };

      await fbSaveUserProfile(user.uid, profilePayload);
      
      // Update local context profiles
      setUserProfile(profilePayload);
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    needsOnboarding,
    signup,
    login,
    googleLogin,
    logout: logoutUser,
    completeOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
