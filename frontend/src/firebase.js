// src/firebase.js
// Centralized Firebase Auth & Firestore Helpers with fallback local storage simulation

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Check if Firebase keys are provided
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY_HERE'
)

let app = null
export let auth = null
export let db = null
const googleProvider = new GoogleAuthProvider()

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    console.error("Firebase failed to initialize:", error)
  }
}

// --- Helper: Local Storage Simulation when Firebase is not configured ---
const MOCK_DB = {
  getUsers: () => JSON.parse(localStorage.getItem('carbonlens_mock_users') || '{}'),
  saveUsers: (users) => localStorage.setItem('carbonlens_mock_users', JSON.stringify(users)),
  getLogs: () => JSON.parse(localStorage.getItem('carbonlens_mock_logs') || '{}'),
  saveLogs: (logs) => localStorage.setItem('carbonlens_mock_logs', JSON.stringify(logs)),
  getCurrentUser: () => JSON.parse(localStorage.getItem('carbonlens_mock_current_user') || 'null'),
  setCurrentUser: (user) => localStorage.setItem('carbonlens_mock_current_user', JSON.stringify(user)),
}

// Mock auth state callbacks list
let mockAuthCallbacks = []
const triggerMockAuthChange = (user) => {
  mockAuthCallbacks.forEach(cb => cb(user))
}

// --- Authentication Functions ---

export const signUpWithEmail = async (email, password, displayName) => {
  if (isFirebaseConfigured && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName })
    return userCredential.user
  } else {
    // Simulation
    const users = MOCK_DB.getUsers()
    if (users[email]) {
      throw new Error("auth/email-already-in-use")
    }
    const uid = 'mock_uid_' + Math.random().toString(36).substr(2, 9)
    const newUser = { uid, email, displayName, onboardingCompleted: false }
    users[email] = { ...newUser, password } // save password just for simple mock signin
    MOCK_DB.saveUsers(users)
    MOCK_DB.setCurrentUser(newUser)
    triggerMockAuthChange(newUser)
    return newUser
  }
}

export const signInWithEmail = async (email, password) => {
  if (isFirebaseConfigured && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } else {
    // Simulation
    const users = MOCK_DB.getUsers()
    const foundUser = users[email]
    if (!foundUser || foundUser.password !== password) {
      throw new Error("auth/invalid-credential")
    }
    const loggedUser = {
      uid: foundUser.uid,
      email: foundUser.email,
      displayName: foundUser.displayName,
      onboardingCompleted: foundUser.onboardingCompleted || false
    }
    MOCK_DB.setCurrentUser(loggedUser)
    triggerMockAuthChange(loggedUser)
    return loggedUser
  }
}

export const loginWithGoogle = async () => {
  if (isFirebaseConfigured && auth) {
    const userCredential = await signInWithPopup(auth, googleProvider)
    return userCredential.user
  } else {
    // Simulation
    const email = 'google_user@example.com'
    const displayName = 'Eco Friend'
    const users = MOCK_DB.getUsers()
    let foundUser = users[email]
    if (!foundUser) {
      const uid = 'mock_uid_google'
      foundUser = { uid, email, displayName, onboardingCompleted: false }
      users[email] = foundUser
      MOCK_DB.saveUsers(users)
    }
    const loggedUser = {
      uid: foundUser.uid,
      email: foundUser.email,
      displayName: foundUser.displayName,
      onboardingCompleted: foundUser.onboardingCompleted || false
    }
    MOCK_DB.setCurrentUser(loggedUser)
    triggerMockAuthChange(loggedUser)
    return loggedUser
  }
}

export const logout = async () => {
  if (isFirebaseConfigured && auth) {
    return signOut(auth)
  } else {
    // Simulation
    MOCK_DB.setCurrentUser(null)
    triggerMockAuthChange(null)
    return true
  }
}

export const subscribeToAuthChanges = (callback) => {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback)
  } else {
    // Simulation
    mockAuthCallbacks.push(callback)
    // Initial call
    const currentUser = MOCK_DB.getCurrentUser()
    callback(currentUser)
    return () => {
      mockAuthCallbacks = mockAuthCallbacks.filter(cb => cb !== callback)
    }
  }
}

// --- Firestore Helpers ---

/**
 * Save user profile (onboarding options)
 */
export const saveUserProfile = async (uid, profileData) => {
  if (isFirebaseConfigured && db) {
    const userDocRef = doc(db, 'users', uid)
    return setDoc(userDocRef, {
      ...profileData,
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } else {
    // Simulation
    const users = MOCK_DB.getUsers()
    const emailKey = Object.keys(users).find(key => users[key].uid === uid)
    if (emailKey) {
      users[emailKey] = {
        ...users[emailKey],
        ...profileData,
        onboardingCompleted: true,
      }
      MOCK_DB.saveUsers(users)
    }
    // Update current user cache
    const currentUser = MOCK_DB.getCurrentUser()
    if (currentUser && currentUser.uid === uid) {
      currentUser.onboardingCompleted = true
      MOCK_DB.setCurrentUser(currentUser)
      triggerMockAuthChange(currentUser)
    }
    return true
  }
}

/**
 * Fetch user profile
 */
export const getUserProfile = async (uid) => {
  if (isFirebaseConfigured && db) {
    const userDocRef = doc(db, 'users', uid)
    const snap = await getDoc(userDocRef)
    return snap.exists() ? snap.data() : null
  } else {
    // Simulation
    const users = MOCK_DB.getUsers()
    const foundUser = Object.values(users).find(u => u.uid === uid)
    return foundUser || null
  }
}

/**
 * Save a single activity log entry for a user.
 */
export const saveActivityLog = async (uid, entry) => {
  if (isFirebaseConfigured && db) {
    const logsRef = collection(db, 'users', uid, 'logs')
    return addDoc(logsRef, {
      ...entry,
      createdAt: serverTimestamp(),
    })
  } else {
    // Simulation
    const logs = MOCK_DB.getLogs()
    if (!logs[uid]) logs[uid] = []
    const newLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      ...entry,
      createdAt: new Date().toISOString(),
    }
    logs[uid].push(newLog)
    MOCK_DB.saveLogs(logs)
    return newLog
  }
}

/**
 * Fetch all activity logs for a user, newest first.
 */
export const getActivityLogs = async (uid) => {
  if (isFirebaseConfigured && db) {
    const logsRef = collection(db, 'users', uid, 'logs')
    const q = query(logsRef, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } else {
    // Simulation
    const logs = MOCK_DB.getLogs()
    const userLogs = logs[uid] || []
    return [...userLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

/**
 * Delete a logged activity.
 */
export const deleteActivityLog = async (uid, logId) => {
  if (isFirebaseConfigured && db) {
    const logDocRef = doc(db, 'users', uid, 'logs', logId)
    return deleteDoc(logDocRef)
  } else {
    // Simulation
    const logs = MOCK_DB.getLogs()
    if (logs[uid]) {
      logs[uid] = logs[uid].filter(log => log.id !== logId)
      MOCK_DB.saveLogs(logs)
    }
    return true
  }
}

/**
 * Fetch logs for a specific category (useful for suggestions / insights).
 */
export const getLogsByCategory = async (uid, category) => {
  if (isFirebaseConfigured && db) {
    const logsRef = collection(db, 'users', uid, 'logs')
    const q = query(logsRef, where('category', '==', category))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } else {
    // Simulation
    const logs = MOCK_DB.getLogs()
    const userLogs = logs[uid] || []
    return userLogs.filter(log => log.category === category)
  }
}

/**
 * Fetch all users profiles to compute rankings / leaderboard.
 */
export const getLeaderboardUsers = async () => {
  if (isFirebaseConfigured && db) {
    const usersRef = collection(db, 'users')
    const snap = await getDocs(usersRef)
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
  } else {
    // Simulation
    const users = MOCK_DB.getUsers()
    return Object.values(users).map(u => ({
      uid: u.uid,
      displayName: u.displayName || 'Eco Warrior',
      baseline: u.baseline || { diet: 'vegetarian', commute: 'public_transit', energy: 'solar' },
      onboardingCompleted: u.onboardingCompleted || false
    }))
  }
}
