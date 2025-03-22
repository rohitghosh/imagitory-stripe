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
    // Create an error handler for query/mutation errors
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'error' && event.error instanceof Error) {
        const error = event.error as Error;
        
        // Check if the error is an authentication error (401)
        if (error.message.includes('401:') || error.message.includes('Unauthorized')) {
          console.log('Intercepted authentication error:', error.message);
          
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
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, location, setLocation, user, loading, toast]);

  // This component doesn't render anything
  return null;
}