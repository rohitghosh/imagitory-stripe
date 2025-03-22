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
      url: req.url
    });
  }

  // Validate that we have a session and userId
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // User is authenticated
  if (DEBUG_LOGGING) {
    console.log(`[authenticate] User authorized: ${req.session.userId}`);
  }
  
  next();
}
