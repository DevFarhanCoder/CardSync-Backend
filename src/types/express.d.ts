// src/types/express.d.ts
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;      // preferred field many routes use
      _id: string;     // compatibility for routes expecting `_id`
      email?: string;  // optional, if your token includes it
    };
  }
}
