import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T>;
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T>;
export async function apiRequest<T = any>(
  methodOrUrl: string,
  urlOrOptions?: string | RequestInit,
  data?: unknown | undefined,
): Promise<T> {
  const DEBUG_LOGGING = import.meta.env.VITE_DEBUG_LOGGING === "true";
  let method: string;
  let url: string;
  let options: RequestInit = {};
  
  // Handle overload cases
  if (typeof urlOrOptions === 'string') {
    // First overload: method, url, data
    method = methodOrUrl;
    url = urlOrOptions;
    options = {
      method,
      headers: data ? { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      } : { "Accept": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors" // Explicitly specify CORS mode
    };
  } else {
    // Second overload: url, options
    url = methodOrUrl;
    options = {
      method: 'GET',
      headers: { 
        "Accept": "application/json",
        ...(urlOrOptions?.headers || {})
      },
      ...urlOrOptions,
      credentials: "include",
      mode: "cors" // Explicitly specify CORS mode
    };
  }

  if (DEBUG_LOGGING) {
    console.log(`[apiRequest] ${options.method || 'GET'} ${url}`, {
      headers: options.headers,
      data: data || 'none',
    });
  }

  try {
    const res = await fetch(url, options);
    
    if (DEBUG_LOGGING) {
      console.log(`[apiRequest] Response for ${url}:`, {
        status: res.status,
        headers: {
          "content-type": res.headers.get("content-type"),
          "set-cookie": res.headers.get("set-cookie"),
        }
      });
    }
    
    await throwIfResNotOk(res);
    return res.json();
  } catch (error) {
    if (DEBUG_LOGGING) {
      console.error(`[apiRequest] Error for ${url}:`, error);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const DEBUG_LOGGING = import.meta.env.VITE_DEBUG_LOGGING === "true";

    // In production, use absolute URL to avoid relative path issues
    let url = queryKey[0] as string;
    
    // If we're in production and the URL is a relative path, make it absolute
    if (DEBUG_LOGGING) {
      console.log(`[QueryClient] Fetching ${url}`);
    }

    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
        // For debugging cross-origin issues in production
        mode: "cors"
      });

      if (DEBUG_LOGGING) {
        console.log(`[QueryClient] Response status: ${res.status}`);
        console.log(`[QueryClient] Response headers:`, {
          "content-type": res.headers.get("content-type"),
          "set-cookie": res.headers.get("set-cookie"),
        });
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        if (DEBUG_LOGGING) {
          console.log(`[QueryClient] Unauthorized (401) - returning null as configured`);
        }
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (DEBUG_LOGGING) {
        console.error(`[QueryClient] Error fetching ${url}:`, error);
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
