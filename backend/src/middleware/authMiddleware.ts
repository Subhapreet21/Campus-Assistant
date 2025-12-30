import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// Middleware to strictly require authentication
export const requireAuth = ClerkExpressRequireAuth();

// Optional: Helper to log or debug auth (not strictly needed by Clerk but good for dev)
export const debugAuth = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    console.log("Auth Status:", req.auth);
    next();
};
