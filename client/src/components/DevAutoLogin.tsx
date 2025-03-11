import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export function DevAutoLogin() {
  const [loading, setLoading] = useState(false);

  const handleAutoLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auto-login');
      
      if (!response.ok) {
        throw new Error('Failed to auto-login');
      }
      
      const data = await response.json();
      console.log('Auto-login successful:', data);
      
      // Invalidate any user-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      
      toast({
        title: 'Development Auto-Login',
        description: `Successfully logged in as test user (${data.userId})`,
      });
      
      // Reload the page to ensure all components pick up the new session
      window.location.reload();
    } catch (error) {
      console.error('Auto-login error:', error);
      toast({
        title: 'Auto-Login Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleAutoLogin} 
      disabled={loading}
      className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
    >
      {loading ? 'Logging in...' : 'DEV: Auto-Login'}
    </Button>
  );
}