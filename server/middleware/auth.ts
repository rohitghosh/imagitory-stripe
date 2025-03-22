import { Request, Response, NextFunction } from "express";

// Proper authentication check
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Log debug info if debug logging is enabled
  const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";
  
  if (DEBUG_LOGGING) {
    console.log("[Session Debug] Authenticate middleware:", {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      userId: req.session?.userId,
      url: req.url,
      method: req.method,
      cookies: req.headers.cookie ? 'present' : 'none'
    });
  }

  // Validate that we have a session and userId
  if (!req.session) {
    console.error(`[authenticate] Session not initialized for ${req.method} ${req.url}`);
    return res.status(401).json({ 
      message: "Unauthorized - Session not available",
      code: "SESSION_MISSING"
    });
  }
  
  if (!req.session.userId) {
    console.error(`[authenticate] No userId in session for ${req.method} ${req.url} (sessionID: ${req.sessionID})`);
    return res.status(401).json({ 
      message: "Unauthorized - No user associated with session",
      code: "USER_NOT_IN_SESSION" 
    });
  }
  
  // User is authenticated
  if (DEBUG_LOGGING) {
    console.log(`[authenticate] User authorized: ${req.session.userId}`);
  }
  
  next();
}
