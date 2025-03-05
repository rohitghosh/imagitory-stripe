import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import CreateStoryPage from "@/pages/CreateStoryPage";

function Router() {
  // Simple router without authentication
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/create" component={CreateStoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </div>
  );
}

export default App;
