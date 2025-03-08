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
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => null,
  signOut: async () => {},
});

// Export the hook using named constant function
const useAuth = () => useContext(AuthContext);
export { useAuth };

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
          (user) => {
            console.log("Auth state changed:", user ? "User authenticated" : "No user");
            setUser(user);
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
