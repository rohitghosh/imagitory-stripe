import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User } from "firebase/auth";

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

// Initialize Firebase
let app;
let auth: Auth;
let provider: GoogleAuthProvider;

try {
  // Check if Firebase app is already initialized
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
  
  auth = getAuth(app);
  console.log("Firebase auth initialized successfully");
  
  provider = new GoogleAuthProvider();
  // Add scopes for additional Google API access if needed
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({
    prompt: 'select_account' // Forces account selection even when one account is available
  });
  console.log("Google auth provider created successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw new Error("Failed to initialize Firebase authentication");
}

export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log("Attempting to sign in with Google...");
    const result = await signInWithPopup(auth, provider);
    console.log("Sign in successful, getting ID token...");
    const idToken = await result.user.getIdToken();
    
    console.log("Sending ID token to backend...");
    // Send the ID token to the backend for verification and session management
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to authenticate with server');
    }
    
    console.log("User authenticated successfully with backend");
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("Firebase signOut successful");
    
    // Clear session on the backend
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.warn("Backend logout error:", errorData.message);
      // We still want to continue even if backend logout fails
    } else {
      console.log("Backend session cleared successfully");
    }
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export { auth };
