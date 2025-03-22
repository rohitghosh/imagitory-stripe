import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * This component intercepts 401 Unauthorized errors from API requests
 * and redirects the user to the login page, ensuring a smooth authentication flow.
 */
export function AuthErrorInterceptor() {
  const { user, loading, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Function to handle auth errors and redirect if needed
    const handleAuthError = (errorMessage: string) => {
      console.log('Intercepted authentication error:', errorMessage);
      console.log('Auth state when error occurred:', { 
        isLoggedIn: !!user, 
        userData: user ? { email: user.email, uid: user.uid } : null,
        currentLocation: location
      });
      
      // Only redirect if we're not already on the login page
      if (location !== '/login') {
        // Clear any user data that might be in the auth context
        // but is no longer valid according to the server
        if (user) {
          console.log('Client thinks user is logged in but server says no - syncing auth state');
          // Try to re-synchronize with the server in case it's a temporary issue
          user.getIdToken(true)
            .then(idToken => {
              return fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ idToken }),
                credentials: 'include'
              });
            })
            .then(response => {
              if (!response.ok) {
                console.log('Re-sync attempt failed - signing out');
                // If re-sync failed, sign out
                signOut().catch(console.error);
                
                // Show toast notification
                toast({
                  title: 'Session Expired',
                  description: 'Please sign in again to continue.',
                  variant: 'destructive',
                });
                
                // Redirect to login page after a short delay (to let toast appear)
                setTimeout(() => {
                  setLocation('/login');
                }, 300);
              } else {
                console.log('Re-sync successful - session is now valid');
                // If re-sync succeeded, invalidate and refetch queries
                queryClient.invalidateQueries();
              }
            })
            .catch(error => {
              console.error('Error during auth re-sync:', error);
              // On error, sign out
              signOut().catch(console.error);
              
              // Show toast notification
              toast({
                title: 'Authentication Error',
                description: 'Please sign in again to continue.',
                variant: 'destructive',
              });
              
              setTimeout(() => {
                setLocation('/login');
              }, 300);
            });
        } else {
          // User is already signed out, just redirect
          // Show toast notification
          toast({
            title: 'Authentication Required',
            description: 'Please sign in to continue.',
            variant: 'destructive',
          });
          
          // Redirect to login page after a short delay
          setTimeout(() => {
            setLocation('/login');
          }, 300);
        }
        
        // Clear any cached data that required authentication
        queryClient.invalidateQueries();
      }
    };
    
    // Helper to check if an error is authentication related
    const isAuthError = (error: any): boolean => {
      if (!error) return false;
      
      // Check error object and message for authentication failure indicators
      return (
        error.status === 401 ||
        error.statusCode === 401 ||
        (typeof error.message === 'string' && (
          error.message.includes('401') || 
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('unauthenticated') ||
          error.message.toLowerCase().includes('authentication failed') ||
          error.message.toLowerCase().includes('not logged in')
        ))
      );
    };
    
    // Subscribe to query cache errors
    const unsubscribeQuery = queryClient.getQueryCache().subscribe((event: any) => {
      // Check if this is an error event with an error object
      if (event.type === 'error' && event.error) {
        if (isAuthError(event.error)) {
          handleAuthError(event.error.message || 'Authentication error');
        }
      }
    });
    
    // Subscribe to mutation cache errors
    const unsubscribeMutation = queryClient.getMutationCache().subscribe((event: any) => {
      // Check if this is an error event with an error object
      if (event.type === 'error' && event.mutation?.state?.error) {
        const error = event.mutation.state.error;
        if (isAuthError(error)) {
          handleAuthError(error.message || 'Authentication error');
        }
      }
    });

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
    };
  }, [queryClient, location, setLocation, user, loading, toast, signOut]);

  // This component doesn't render anything
  return null;
}