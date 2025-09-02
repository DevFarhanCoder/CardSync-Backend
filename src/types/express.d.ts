import "express";
declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; _id: string; email?: string };
  }
}
