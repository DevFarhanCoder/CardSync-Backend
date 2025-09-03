import { Router } from "express";
import { login } from "../controllers/auth.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ email, password, name });
    return res.status(201).json({ id: user._id, email: user.email, name: user.name });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    // explicitly include password in case schema had select:false in your original model
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { sub: String(user._id), email: user.email },
      process.env.JWT_SECRET || "dev-secret",   // ← keep this
      { expiresIn: "7d" }
    );


    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/login", login);

export default router;
