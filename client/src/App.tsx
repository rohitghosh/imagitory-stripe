import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import CreateStoryPage from "@/pages/CreateStoryPage";
import LoginPage from "@/pages/LoginPage";
import BookDetailPage from "@/pages/BookDetailPage";
import React, { Suspense, useEffect } from "react";

const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));

const ProfilePageWrapper = () => (
  <Suspense fallback={<div>Loading Profile...</div>}>
    <ProfilePage />
  </Suspense>
);

// Dynamically import ProfilePage to avoid TypeScript errors
// const ProfilePage = () => {
//   const ProfileComp = require("./pages/ProfilePage").default;
//   return <ProfileComp />;
// };

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
  params?: any;
}

function ProtectedRoute({ component: Component, params }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  return user ? <Component {...params} /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/create">
        {(params) => <ProtectedRoute component={CreateStoryPage} {...params} />}
      </Route>
      <Route path="/profile">
        {(params) => (
          <ProtectedRoute component={ProfilePageWrapper} {...params} />
        )}
      </Route>
      <Route path="/book/:id">{() => <BookDetailPage />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
