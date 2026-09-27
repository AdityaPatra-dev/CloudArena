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
 * Listen for persistent Auth State changes across browser refreshes
 */
export function initAuthListener(callback) {
  // First check instant cached profile from localStorage for 0ms visual flash
  const cached = localStorage.getItem("cloudarena_auth_user");
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch (e) {}
  }

  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncUserProfile(firebaseUser);
        if (profile) {
          localStorage.setItem("cloudarena_auth_user", JSON.stringify(profile));
          callback(profile);
        }
      } else {
        localStorage.removeItem("cloudarena_auth_user");
        callback(null);
      }
    });
  } else {
    // Local / Dev Fallback
    const local = localStorage.getItem("cloudarena_local_user");
    if (local) {
      try {
        callback(JSON.parse(local));
      } catch (e) {
        callback(null);
      }
    } else {
      callback(null);
    }
    return () => {};
  }
}

/**
 * Sign in with Google Auth popup.
 */
export async function loginWithGoogle() {
  if (isFirebaseConfigured && auth && googleProvider) {
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(result.user);
    if (profile) {
      localStorage.setItem("cloudarena_auth_user", JSON.stringify(profile));
    }
    return profile;
  } else {
    // Local preview simulation
    const randomHex = Math.random().toString(16).substring(2, 10);
    const mockUser = {
      uid: "usr_" + randomHex,
      displayName: "Aditya Patra",
      email: "aditya.competitor@gmail.com",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      handle: "aditya_sre",
      role: "player",
      arena_token: `ca_live_${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      created_at: new Date().toISOString()
    };
    localStorage.setItem("cloudarena_auth_user", JSON.stringify(mockUser));
    return mockUser;
  }
}

/**
 * Log out user from both Firebase Auth and local cache
 */
export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  localStorage.removeItem("cloudarena_auth_user");
  localStorage.removeItem("cloudarena_local_user");
}

/**
 * Synchronize Google User profile to Firestore & mint Arena Token if new
 */
export async function syncUserProfile(firebaseUser) {
  if (!firebaseUser) return null;

  const rawHandle = (firebaseUser.displayName || "cadet")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .substring(0, 16);

  if (db) {
    const userRef = doc(db, "users", firebaseUser.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        // Check if admin role is stored in firestore or localStorage
        return data;
      } else {
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
          role: "player", // Default role
          arena_token: arenaToken,
          created_at: serverTimestamp(),
        };

        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn("Firestore user sync error:", err);
    }
  }

  // Fallback profile if offline
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || "Cloud Cadet",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || "",
    handle: rawHandle,
    role: "player",
    arena_token: "ca_live_150ef255423a93be2c522417fa8209e4",
  };
}

/**
 * Verify organizer passcode to elevate user role to admin
 */
export async function elevateToAdmin(user, passcode) {
  if (!user) return false;
  const cleanCode = passcode.trim();
  
  if (cleanCode === "admin2026" || cleanCode === "arena_organizer") {
    const updatedUser = { ...user, role: "admin" };
    localStorage.setItem("cloudarena_auth_user", JSON.stringify(updatedUser));
    
    if (db && isFirebaseConfigured) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { role: "admin" });
      } catch (e) {
        console.warn("Could not persist admin role to Firestore:", e);
      }
    }
    return updatedUser;
  }
  return false;
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
      } catch (err) {}
      callback(getSimulatedStandings());
    };

    pollServer();
    const interval = setInterval(pollServer, 3000);
    return () => clearInterval(interval);
  }
}

/**
 * Subscribe to event configuration (custom wave titles, durations, freeze status, timing)
 */
export function subscribeEventConfig(callback, eventId = "HACKATHON_2026") {
  if (isFirebaseConfigured && db) {
    const eventRef = doc(db, "events", eventId);
    return onSnapshot(eventRef, (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data();
        const merged = { ...getDefaultEventConfig(eventId), ...remoteData };
        callback(merged);
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
 * Update event configuration with full organizer authority
 */
export async function updateEventConfigAdmin(eventId, data) {
  if (isFirebaseConfigured && db) {
    const eventRef = doc(db, "events", eventId);
    await setDoc(eventRef, {
      ...data,
      updated_at: serverTimestamp()
    }, { merge: true });
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

export function getDefaultEventConfig(eventId) {
  return {
    event_id: eventId,
    title: "CloudArena Championship",
    description: "AI-Powered Sandboxed Kubernetes Incident Survival Arena",
    status: "IN_PROGRESS",
    mode: "synchronized",
    is_frozen: false,
    freeze_message: "❄️ Leaderboard is frozen for the grand finale! Standings will be unveiled at closing ceremonies.",
    active_wave: 1,
    wave_names: {
      "1": "CPU Starvation Outage",
      "2": "Memory Leak OOMKilled Cascade",
      "3": "Broken Health Probe Deadlock",
      "4": "Ingress Surge Traffic Overload"
    },
    wave_durations: { "1": 300, "2": 420, "3": 480, "4": 600 },
    wave_points: { "1": 100, "2": 150, "3": 200, "4": 250 },
    max_hints: 3,
    allow_resets: true,
  };
}

function getSimulatedStandings() {
  return [
    { rank: 1, handle: "aditya_sre", event_id: "HACKATHON_2026", total_score: 540, waves_cleared: 3, total_time: 215, total_hints_cost: 0 },
    { rank: 2, handle: "k8s_sorcerer", event_id: "HACKATHON_2026", total_score: 495, waves_cleared: 3, total_time: 260, total_hints_cost: 15 },
    { rank: 3, handle: "cyber_valkyrie", event_id: "HACKATHON_2026", total_score: 410, waves_cleared: 2, total_time: 145, total_hints_cost: 0 },
    { rank: 4, handle: "chaos_monkey_01", event_id: "HACKATHON_2026", total_score: 360, waves_cleared: 2, total_time: 180, total_hints_cost: 30 },
    { rank: 5, handle: "pod_healer", event_id: "HACKATHON_2026", total_score: 290, waves_cleared: 2, total_time: 195, total_hints_cost: 15 },
    { rank: 6, handle: "ingress_ninja", event_id: "HACKATHON_2026", total_score: 240, waves_cleared: 1, total_time: 75, total_hints_cost: 0 },
    { rank: 7, handle: "daemon_slayer", event_id: "HACKATHON_2026", total_score: 180, waves_cleared: 1, total_time: 98, total_hints_cost: 15 },
  ];
}
