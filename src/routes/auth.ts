// src/routes/auth.ts
import { Router } from "express";
<<<<<<< HEAD
import { register, login, me, logout } from "../controllers/auth.js";
=======
import bcrypt from "bcryptjs";
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { User } from "../models/User";
>>>>>>> 78e1eba6d45a91302e773ca91ca6c2c9b59e3aec

const authRouter = Router();

<<<<<<< HEAD
// POST /api/auth/register
authRouter.post("/register", register);
=======
function signToken(id: string) {
  const secret = (process.env.JWT_SECRET ?? "devsecret") as Secret;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  const opts: SignOptions = { expiresIn };
  return jwt.sign({ id }, secret, opts);
}
>>>>>>> 78e1eba6d45a91302e773ca91ca6c2c9b59e3aec

// POST /api/auth/login
authRouter.post("/login", login);

// GET /api/auth/me
authRouter.get("/me", me);

// POST /api/auth/logout
authRouter.post("/logout", logout);

export default authRouter;
export { authRouter };
