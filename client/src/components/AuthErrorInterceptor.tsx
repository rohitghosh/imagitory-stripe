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
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Function to handle auth errors and redirect if needed
    const handleAuthError = (errorMessage: string) => {
      console.log('Intercepted authentication error:', errorMessage);
      
      // Only redirect if we're not already on the login page and user should be logged in
      if (location !== '/login' && !loading && !user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to continue.',
          variant: 'destructive',
        });
        
        // Short delay to allow the toast to be visible
        setTimeout(() => {
          setLocation('/login');
        }, 100);
      }
    };
    
    // Subscribe to query cache errors
    const unsubscribeQuery = queryClient.getQueryCache().subscribe((event: any) => {
      // Check if this is an error event with an error object
      if (event.type === 'error' && event.error) {
        // Check if the error is an authentication error (401)
        if (event.error.message?.includes('401:') || 
            event.error.message?.includes('Unauthorized')) {
          handleAuthError(event.error.message);
        }
      }
    });
    
    // Subscribe to mutation cache errors
    const unsubscribeMutation = queryClient.getMutationCache().subscribe((event: any) => {
      // Check if this is an error event with an error object
      if (event.type === 'error' && event.mutation?.state?.error) {
        const error = event.mutation.state.error;
        // Check if the error is an authentication error (401)
        if (error.message?.includes('401:') || 
            error.message?.includes('Unauthorized')) {
          handleAuthError(error.message);
        }
      }
    });

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
    };
  }, [queryClient, location, setLocation, user, loading, toast]);

  // This component doesn't render anything
  return null;
}