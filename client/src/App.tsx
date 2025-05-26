import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import CreateStoryPage from "@/pages/CreateStoryPage";
import LoginPage from "@/pages/LoginPage";
import BookDetailPage from "@/pages/BookDetailPage";
import EditPDFPage from "@/pages/EditPDFPage";
import { AuthErrorInterceptor } from "@/components/AuthErrorInterceptor";
import React, { Suspense, useEffect } from "react";

const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));

const ProfilePageWrapper = () => (
  <Suspense fallback={<div>Loading Profile...</div>}>
    <ProfilePage />
  </Suspense>
);

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
  params?: any;
}

function ProtectedRoute({ component: Component, params }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      // Show a notification that authentication is required
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this content.",
        variant: "destructive",
      });

      // Redirect to login page
      setLocation("/login");
    }
  }, [user, loading, setLocation, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render the component if the user is authenticated
  return user ? <Component {...params} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/create/:id">
        {(params) => <ProtectedRoute component={CreateStoryPage} {...params} />}
      </Route>
      <Route path="/create">
        {(params) => <ProtectedRoute component={CreateStoryPage} {...params} />}
      </Route>
      <Route path="/profile">
        {(params) => (
          <ProtectedRoute component={ProfilePageWrapper} {...params} />
        )}
      </Route>
      <Route path="/book/:id">
        {(params) => <ProtectedRoute component={BookDetailPage} {...params} />}
      </Route>
      <Route path="/edit-pdf/:bookId" component={EditPDFPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthErrorInterceptor />
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
