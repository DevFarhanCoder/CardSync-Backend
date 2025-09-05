// src/types/express.d.ts
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;                // routes use this
      _id?: string;              // controllers use this
      email?: string;
      role?: string;
      [k: string]: any;
    };
  }
}
