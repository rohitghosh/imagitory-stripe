import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Firebase Config (without sensitive data):", {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

// Initialize Firebase - with proper error handling
let auth: Auth;
let provider: GoogleAuthProvider;

try {
  const app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
  
  auth = getAuth(app);
  console.log("Firebase auth initialized successfully");
  
  provider = new GoogleAuthProvider();
  console.log("Google auth provider created successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  // Create fallback objects for development so the app doesn't crash
  const app = {} as any;
  auth = {} as Auth;
  provider = {} as GoogleAuthProvider;
}

export const signInWithGoogle = async () => {
  try {
    console.log("Attempting to sign in with Google...");
    const result = await signInWithPopup(auth, provider);
    console.log("Sign in successful, getting ID token...");
    const idToken = await result.user.getIdToken();
    
    console.log("Sending ID token to backend...");
    // Send the ID token to the backend for verification and session management
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
      credentials: 'include'
    });
    
    console.log("User authenticated successfully");
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    
    // Clear session on the backend
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export { auth };
