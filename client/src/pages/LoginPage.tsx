import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "There was a problem signing in with Google.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-[Fredoka One]">
            <span className="text-primary">Story</span>
            <span className="text-secondary">Pals</span>
          </h1>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-heading font-bold mb-2">Welcome to StoryPals</h2>
              <p className="text-text-secondary">
                Create personalized stories for your kids in just a few minutes!
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-center">
                <Button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-6"
                >
                  <i className="fab fa-google"></i>
                  <span>Sign in with Google</span>
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} StoryPals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
