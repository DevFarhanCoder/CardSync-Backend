// src/routes/index.ts
import { Router } from "express";
import authRouter from "./auth.js";

const api = Router();

api.use("/auth", authRouter);

export default api;
export { api };
