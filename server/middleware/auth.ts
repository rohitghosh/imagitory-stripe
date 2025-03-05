import { Request, Response, NextFunction } from "express";

// Temporarily modified authentication for development
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // For development: Skip authentication check
  // In production, we would uncomment this:
  // if (!req.session || !req.session.userId) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  
  // For development only: Set a mock user ID if not set
  if (!req.session.userId) {
    req.session.userId = 1;
  }
  
  next();
}
