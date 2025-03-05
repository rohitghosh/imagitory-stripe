import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import CreateStoryPage from "@/pages/CreateStoryPage";
import LoginPage from "@/pages/LoginPage";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";

function Router() {
  const { user, loading, error } = useAuth();
  const [location, setLocation] = useLocation();
  const [initialized, setInitialized] = useState(false);
  
  // Log current auth state for debugging
  useEffect(() => {
    console.log("Router auth state:", { user, loading, error, location });
    
    if (!loading) {
      setInitialized(true);
      
      if (!user && location !== "/login") {
        console.log("No user detected, redirecting to login");
        setLocation("/login");
      }
    }
  }, [user, loading, error, location, setLocation]);

  if (loading || !initialized) {
    console.log("Showing loading spinner");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-foreground">Loading StoryPals...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-red-500 mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
        <p className="text-foreground">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          onClick={() => window.location.reload()}
        >
          Reload App
        </button>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={HomePage} />
      <Route path="/create" component={CreateStoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
