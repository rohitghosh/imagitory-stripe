
import React from "react";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, logOut } from "../lib/firebase";

// Define the shape of the auth context
type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType | null>(null);

// Create the Auth Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    
    try {
      // Add a small delay to ensure Firebase is fully initialized
      setTimeout(() => {
        const unsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            console.log("Auth state changed:", user ? "User authenticated" : "No user");
            
            // If user exists (logged in), verify server session is in sync
            if (user) {
              try {
                console.log("Syncing Firebase auth with server session...");
                // Get the token and validate server session
                const idToken = await user.getIdToken(true);
                
                // Call the login endpoint to ensure session is synced
                const response = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                  },
                  body: JSON.stringify({ idToken }),
                  credentials: "include",
                });
                
                if (!response.ok) {
                  console.error("Failed to sync Firebase auth with server session:", 
                    await response.text());
                  // Don't update user state if server sync failed
                  setUser(null);
                } else {
                  console.log("Server session synchronized successfully");
                  setUser(user);
                }
              } catch (error) {
                console.error("Error syncing with server:", error);
                setUser(null);
              }
            } else {
              // No user, just update state
              setUser(null);
            }
            
            setLoading(false);
          },
          (error) => {
            console.error("Auth state change error:", error);
            setError("Authentication error");
            setLoading(false);
          }
        );
        
        return () => {
          console.log("Unsubscribing from auth state listener");
          unsubscribe();
        };
      }, 500);
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      setError("Failed to initialize authentication");
      setLoading(false);
    }
    
    return () => {
      // Cleanup function if the setTimeout hasn't completed
      console.log("Auth provider unmounting");
    };
  }, []);

  const signIn = async () => {
    try {
      const user = await signInWithGoogle();
      return user;
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Failed to sign in");
      return null;
    }
  };

  const signOut = async () => {
    try {
      await logOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      setError("Failed to sign out");
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Using a separate export for the hook - placing at the end to avoid HMR issues
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
