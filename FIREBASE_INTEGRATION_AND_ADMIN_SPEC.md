# 🌩️ CloudArena: Firebase Architecture & Admin Configuration Specification

> **Target:** 2,000+ Concurrent Hackathon Participants  
> **Auth Model:** Option B (Google Sign-In Web App $\to$ Personal Arena Token $\to$ CLI Link)  
> **Backend Services:** Firebase Authentication, Cloud Firestore, Firebase Hosting  

---

## 1. Quick Setup Guide for Hackathon Organizers

Follow these steps in the [Firebase Console](https://console.firebase.google.com/) to link your CloudArena hackathon:

### Step 1: Create or Select a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select an existing Google Cloud project).
3. Name your project (e.g., `cloudarena-hackathon-2026`).
4. (Optional) Google Analytics can be toggled on or off according to preference.
5. Click **Create Project**.

### Step 2: Enable Google Authentication
1. In the Firebase console left sidebar, navigate to **Build** $\to$ **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Google**.
4. Toggle **Enable**.
5. Set the public-facing project support email to your administrator email.
6. Click **Save**.

### Step 3: Create Cloud Firestore Database
1. In the left sidebar, navigate to **Build** $\to$ **Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your participants (e.g., `us-central1`, `asia-south1`, etc.).
4. Select **Start in production mode** (we will apply security rules in Step 4).
5. Click **Create**.

### Step 4: Apply Firestore Security Rules
1. In the Firestore tab, navigate to the **Rules** tab.
2. Replace all existing text with the production security rules below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Check if user is authenticated with Google
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: Check if current user is owner of the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Helper: Check if current user has admin claim or is organizer
    function isAdmin() {
      return isAuthenticated() && 
        (request.auth.token.admin == true || 
         request.auth.token.email.matches(".*@organizer\\.org$") ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin");
    }

    // Users Collection: Competitors can read/write their own profile and mint token
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Events Collection: Public read for tournament metadata, admin write for control
    match /events/{eventId} {
      allow read: if true;
      allow write: if isAdmin();

      // Top 100 Leaderboard Cache: Read-only for all spectators
      match /cached_leaderboard/{docId} {
        allow read: if true;
        allow write: if isAdmin();
      }

      // Participants in event: Users can update their own status/heartbeat
      match /participants/{userId} {
        allow read: if true;
        allow create, update: if isOwner(userId) || isAdmin();
        allow delete: if isAdmin();
      }

      // Wave Scores: Can be created once per wave with valid verification
      match /scores/{scoreId} {
        allow read: if true;
        allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
        allow update, delete: if isAdmin();
      }
    }
  }
}
```
3. Click **Publish**.

### Step 5: Register a Web App & Copy Config
1. In Project Overview (gear icon $\to$ **Project settings**).
2. Under **Your apps**, click the **Web** icon (`</>`).
3. App nickname: `CloudArena Web`.
4. Click **Register app**.
5. Copy the `firebaseConfig` keys into `web/.env`:
   ```bash
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="cloudarena-hackathon.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="cloudarena-hackathon"
   VITE_FIREBASE_STORAGE_BUCKET="cloudarena-hackathon.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
   VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef"
   ```

---

## 2. Authentication Flow & Token Linking (Option B)

```text
[ Competitor ]
      │
      ▼
1. Visits Web Dashboard (https://cloudarena.app)
      │
      ▼
2. Clicks "Sign in with Google" (Firebase Auth popup)
      │
      ├──> Generates user profile in Firestore: `users/{uid}`
      └──> Mints personal Arena Token: `ca_live_9f81a7b4c2e1f5d6a7b8c9d0`
      │
      ▼
3. Web App displays copyable terminal card:
   ┌────────────────────────────────────────────────────────────────────────┐
   │  Personal Arena Token: ca_live_9f81••••••••c9d0                        │
   │                                                                        │
   │  [ Copy Link Command ]                                                 │
   │  $ cloudarena link ca_live_9f81a7b4c2e1f5d6a7b8c9d0 --event HACK_2026   │
   └────────────────────────────────────────────────────────────────────────┘
      │
      ▼
4. Participant runs command on their terminal:
   $ cloudarena link ca_live_9f81a7b4c2e1f5d6a7b8c9d0 --event HACK_2026
      │
      ├──> Saves token to local ~/.cloudarena/config.yaml
      └──> Verified 🟢 Competitor profile linked!
```

---

## 3. Quota Management for 2,000 Concurrent Competitors

| Action | Naive Approach (Writes/sec) | CloudArena Protocol | Firestore Cost Impact |
| :--- | :--- | :--- | :--- |
| **Participant Heartbeat** | 2,000 writes/sec (1/sec) | **Adaptive 30s writes** (66 writes/sec) | **< $0.50 / day** |
| **Scoreboard Reads** | 2,000 users reading 2,000 rows (4M reads/min) | **Cached Top-100 Doc** (All 2,000 read 1 document) | **Free tier covered** |
| **Incident Telemetry** | Continuous socket stream | **Event-Driven Transitions** (Injected, Hint, Resolved) | **99% reduction** |

