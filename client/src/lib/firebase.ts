import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  Auth,
  User,
  AuthError,
} from "firebase/auth";

// Debug logging utility
const DEBUG_LOGGING = import.meta.env.VITE_DEBUG_LOGGING === "true";

const debugLog = (message: string, data?: any) => {
  if (DEBUG_LOGGING) {
    if (data) {
      console.log(`[FIREBASE] ${message}`, data);
    } else {
      console.log(`[FIREBASE] ${message}`);
    }
  }
};

const debugError = (message: string, error: any) => {
  console.error(`[FIREBASE ERROR] ${message}`, error);

  // Additional detailed logging for development
  if (DEBUG_LOGGING) {
    if (error.code) console.error(`Error code: ${error.code}`);
    if (error.message) console.error(`Error message: ${error.message}`);
    if (error.customData) console.error(`Custom data:`, error.customData);
    if (error.stack) console.error(`Stack trace:`, error.stack);
  }
};

// Check if Firebase configuration is properly set
const validateFirebaseConfig = () => {
  const missingVars = [];

  if (!import.meta.env.VITE_FIREBASE_API_KEY)
    missingVars.push("VITE_FIREBASE_API_KEY");
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID)
    missingVars.push("VITE_FIREBASE_PROJECT_ID");
  if (!import.meta.env.VITE_FIREBASE_APP_ID)
    missingVars.push("VITE_FIREBASE_APP_ID");

  if (missingVars.length > 0) {
    const errorMsg = `Missing Firebase configuration: ${missingVars.join(", ")}`;
    debugError(errorMsg, { missingVars });
    throw new Error(errorMsg);
  }

  return true;
};

// Get Firebase configuration from environment variables
// Clean up any whitespace in the project ID
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();

// Build Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

debugLog("Firebase Config (without sensitive data):", {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

// Initialize Firebase
let app;
let auth: Auth;
let provider: GoogleAuthProvider;

try {
  // Validate Firebase configuration
  validateFirebaseConfig();

  // Initialize Firebase (check if it's already initialized)
  if (getApps().length === 0) {
    // Not initialized, so initialize it
    app = initializeApp(firebaseConfig);
    debugLog("Firebase app initialized successfully");
  } else {
    // Already initialized, get the existing app
    app = getApps()[0];
    debugLog("Using existing Firebase app");
  }

  const db = getFirestore(app);

  // Initialize Auth
  auth = getAuth(app);
  debugLog("Firebase auth initialized successfully");

  // Create Google Auth Provider
  provider = new GoogleAuthProvider();

  // Add scopes for additional Google API access if needed
  provider.addScope("profile");
  provider.addScope("email");
  provider.setCustomParameters({
    prompt: "select_account", // Forces account selection even when one account is available
  });
  debugLog("Google auth provider created successfully");

  // Handle redirect results automatically
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        debugLog("Detected redirect result from Google sign-in", {
          user: result.user.email,
        });
      }
    })
    .catch((error) => {
      debugError("Error processing redirect result", error);
    });
} catch (error) {
  debugError("Error initializing Firebase", error);
  throw new Error("Failed to initialize Firebase authentication");
}

export const signInWithGoogle = async (): Promise<User> => {
  try {
    debugLog("Attempting to sign in with Google...");

    // Try using popup first (better UX when it works)
    try {
      const result = await signInWithPopup(auth, provider);
      debugLog("Sign in with popup successful", { email: result.user.email });
      return await processAuthResult(result.user);
    } catch (popupError: any) {
      // If popup fails (common on mobile or when popups are blocked), try redirect
      debugError("Popup sign-in failed, attempting redirect", popupError);

      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/popup-closed-by-user" ||
        popupError.code === "auth/cancelled-popup-request"
      ) {
        debugLog("Using redirect method instead...");
        await signInWithRedirect(auth, provider);
        // Control will transfer to the redirect, then return via getRedirectResult
        throw new Error("Redirecting to Google login...");
      } else {
        // It's another type of error, rethrow
        throw popupError;
      }
    }
  } catch (error) {
    debugError("Error signing in with Google", error);
    throw error;
  }
};

// Helper function to process authenticated user
const processAuthResult = async (user: User): Promise<User> => {
  try {
    debugLog("Getting ID token for authenticated user");
    const idToken = await user.getIdToken();

    debugLog("Sending ID token to backend...");
    // Send the ID token to the backend for verification and session management
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ idToken }),
      credentials: "include",
      mode: "cors" // Explicitly specify CORS mode
    });

    // Debug log for auth response
    debugLog("Authentication response status:", {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": response.headers.get("content-type"),
        "set-cookie": response.headers.get("set-cookie"),
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to authenticate with server";
      let errorDetail = {};
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetail = errorData;
        debugError(`Backend returned error response:`, errorData);
      } catch (e) {
        // If we can't parse the error as JSON, get the raw text
        try {
          const errorText = await response.text();
          debugError(`Backend returned non-JSON error:`, errorText);
          errorDetail = { rawText: errorText };
        } catch (textError) {
          debugError(`Could not read response body:`, textError);
        }
      }

      debugError(`Backend authentication failed: ${errorMessage}`, {
        status: response.status,
        detail: errorDetail
      });
      throw new Error(errorMessage);
    }

    // Log success details
    try {
      const responseData = await response.json();
      debugLog("Authentication success response:", responseData);
    } catch (e) {
      debugLog("Authentication succeeded but could not parse response body");
    }

    debugLog("User authenticated successfully with backend");
    return user;
  } catch (error) {
    debugError("Error processing authentication", error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    debugLog("Firebase signOut successful");

    // Clear session on the backend
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      credentials: "include",
      mode: "cors", // Explicitly specify CORS mode
    });

    // Debug log the logout response
    debugLog("Logout response status:", {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": response.headers.get("content-type"),
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to logout from server";
      let errorDetail = {};
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetail = errorData;
      } catch (e) {
        // If we can't parse the error as JSON, get the raw text
        try {
          const errorText = await response.text();
          debugError(`Backend returned non-JSON error during logout:`, errorText);
          errorDetail = { rawText: errorText };
        } catch (textError) {
          debugError(`Could not read logout response body:`, textError);
        }
      }

      console.warn(`Backend logout error: ${errorMessage}`, errorDetail);
      // We still want to continue even if backend logout fails
    } else {
      try {
        const responseData = await response.json();
        debugLog("Logout success response:", responseData);
      } catch (e) {
        debugLog("Logout succeeded but could not parse response body");
      }
      debugLog("Backend session cleared successfully");
    }
  } catch (error) {
    debugError("Error signing out", error);
    throw error;
  }
};

// Export Firestore db and auth
export const db = getFirestore(app);
export { auth };
