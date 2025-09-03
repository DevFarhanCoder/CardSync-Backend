// src/types/express.d.ts
import "express";

declare global {
  namespace Express {
    // The shape your middleware guarantees once it calls next()
    interface User {
      _id: string;
      email?: string;
    }

    interface Request {
      user?: User; // optional before auth; present after requireAuth
    }
  }
}

export {};
