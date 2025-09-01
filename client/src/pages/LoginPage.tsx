import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const { user, signIn, loading, error } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSignIn = async () => {
    try {
      console.log("Starting Google sign in process...");
      await signIn();
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error?.message || "There was a problem signing in with Google.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome to StoryPals</h2>
              <p className="text-gray-600">
                Create personalized stories for your kids in just a few minutes!
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-center">
                <Button
                  onClick={handleSignIn}
                  disabled={loading}
                  size="lg"
                  className="w-full flex items-center justify-center gap-3 py-6 text-lg"
                >
                  {loading ? (
                    <span>Connecting...</span>
                  ) : (
                    <>
                      <FaGoogle className="w-5 h-5" />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500 mt-8">
                <p>
                  By signing in, you agree to our{" "}
                  <button
                    onClick={() => setLocation("/terms-privacy")}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Terms of Service and Privacy Policy
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
          
          {/* <div className="mt-8 text-center">
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => setLocation("/")}
            >
              Continue as guest
            </Button>
          </div> */}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
