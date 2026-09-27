import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 5 && 
  !firebaseConfig.apiKey.includes("YOUR_")
);

// Initialize Firebase only if config is present
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn("Firebase initialization failed, falling back to local mode:", err);
  }
}

export { auth, db, googleProvider };

/**
 * Sign in with Google Auth popup.
 * In local preview mode (no Firebase config), creates an interactive simulated profile.
 */
export async function loginWithGoogle() {
  if (isFirebaseConfigured && auth && googleProvider) {
    const result = await signInWithPopup(auth, googleProvider);
    return await syncUserProfile(result.user);
  } else {
    // Local / Dev Fallback: Prompt for handle and simulate
    const stored = localStorage.getItem("cloudarena_local_user");
    if (stored) return JSON.parse(stored);

    const randomHex = Math.random().toString(16).substring(2, 10);
    const mockUser = {
      uid: "usr_" + randomHex,
      displayName: "Aditya Patra",
      email: "aditya.competitor@gmail.com",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      handle: "neo_sre",
      role: "admin", // Default to admin in dev mode so organizer command center can be inspected
      arena_token: `ca_live_${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      created_at: new Date().toISOString()
    };
    localStorage.setItem("cloudarena_local_user", JSON.stringify(mockUser));
    return mockUser;
  }
}

/**
 * Log out user
 */
export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  localStorage.removeItem("cloudarena_local_user");
}

/**
 * Synchronize Google User profile to Firestore & mint Arena Token if new
 */
export async function syncUserProfile(firebaseUser) {
  if (!db || !firebaseUser) return null;

  const userRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data();
  } else {
    const rawHandle = (firebaseUser.displayName || "cadet")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .substring(0, 16);
    
    // Mint random 32-character hex arena token
    const tokenBytes = new Uint8Array(16);
    window.crypto.getRandomValues(tokenBytes);
    const tokenHex = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const arenaToken = `ca_live_${tokenHex}`;

    const newProfile = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || "Cloud Cadet",
      email: firebaseUser.email || "",
      photoURL: firebaseUser.photoURL || "",
      handle: rawHandle,
      role: "player",
      arena_token: arenaToken,
      created_at: serverTimestamp(),
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

/**
 * Subscribe to real-time leaderboard rankings (Firestore with FastAPI/Mock fallback)
 */
export function subscribeLeaderboard(callback, eventId = "HACKATHON_2026") {
  if (isFirebaseConfigured && db) {
    // 1. First listen to cached Top 100 document (Quota Optimized)
    const cachedRef = doc(db, "events", eventId, "cached_leaderboard", "top100");
    const unsubscribeCache = onSnapshot(cachedRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.standings || []);
      } else {
        // Fallback to querying participants collection directly
        const partsRef = collection(db, "events", eventId, "participants");
        const q = query(partsRef, orderBy("total_score", "desc"), limit(100));
        return onSnapshot(q, (partsSnap) => {
          const list = partsSnap.docs.map((d, idx) => ({
            rank: idx + 1,
            ...d.data(),
          }));
          callback(list);
        });
      }
    });
    return unsubscribeCache;
  } else {
    // Polling local FastAPI server at http://localhost:8000/api/v1/leaderboard
    const pollServer = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/leaderboard?event_id=${eventId}`);
        if (res.ok) {
          const json = await res.json();
          callback(json.standings || []);
          return;
        }
      } catch (err) {
        // Server not running, provide initial simulated tournament standings
      }
      callback(getSimulatedStandings());
    };

    pollServer();
    const interval = setInterval(pollServer, 3000);
    return () => clearInterval(interval);
  }
}

/**
 * Subscribe to event configuration (freeze status, timing, active wave)
 */
export function subscribeEventConfig(callback, eventId = "HACKATHON_2026") {
  if (isFirebaseConfigured && db) {
    const eventRef = doc(db, "events", eventId);
    return onSnapshot(eventRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback(getDefaultEventConfig(eventId));
      }
    });
  } else {
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/admin/config?event_id=${eventId}`);
        if (res.ok) {
          callback(await res.json());
          return;
        }
      } catch (e) {}
      callback(getDefaultEventConfig(eventId));
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }
}

/**
 * Update event configuration with Admin authority
 */
export async function updateEventConfigAdmin(eventId, data) {
  if (isFirebaseConfigured && db) {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      ...data,
      updated_at: serverTimestamp()
    });
  } else {
    try {
      await fetch("http://localhost:8000/api/v1/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, ...data }),
      });
    } catch (err) {
      console.warn("Failed to update local admin config:", err);
    }
  }
}

function getDefaultEventConfig(eventId) {
  return {
    event_id: eventId,
    title: "Global Cloud Hackathon 2026",
    status: "IN_PROGRESS",
    mode: "synchronized",
    is_frozen: false,
    active_wave: 2,
    wave_durations: { "1": 300, "2": 420, "3": 480, "4": 600 }
  };
}

function getSimulatedStandings() {
  return [
    { rank: 1, handle: "neo_sre", event_id: "HACKATHON_2026", total_score: 540, waves_cleared: 3, total_time: 215, total_hints_cost: 0 },
    { rank: 2, handle: "k8s_sorcerer", event_id: "HACKATHON_2026", total_score: 495, waves_cleared: 3, total_time: 260, total_hints_cost: 15 },
    { rank: 3, handle: "cyber_valkyrie", event_id: "HACKATHON_2026", total_score: 410, waves_cleared: 2, total_time: 145, total_hints_cost: 0 },
    { rank: 4, handle: "chaos_monkey_01", event_id: "HACKATHON_2026", total_score: 360, waves_cleared: 2, total_time: 180, total_hints_cost: 30 },
    { rank: 5, handle: "pod_healer", event_id: "HACKATHON_2026", total_score: 290, waves_cleared: 2, total_time: 195, total_hints_cost: 15 },
    { rank: 6, handle: "ingress_ninja", event_id: "HACKATHON_2026", total_score: 240, waves_cleared: 1, total_time: 75, total_hints_cost: 0 },
    { rank: 7, handle: "daemon_slayer", event_id: "HACKATHON_2026", total_score: 180, waves_cleared: 1, total_time: 98, total_hints_cost: 15 },
  ];
}
