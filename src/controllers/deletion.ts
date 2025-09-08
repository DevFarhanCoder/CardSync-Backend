// src/controllers/deletion.ts
import { Request, Response } from "express";
import { DeletionRequest } from "../models/DeletionRequest.js";
import { sendDeletionRequestMail } from "../utils/mailer.js";

export async function createDeletionRequest(req: Request, res: Response) {
  try {
    const { fullName, email, reason, source } = req.body || {};
    if (!fullName || !email) return res.status(400).json({ error: "fullName and email are required" });

    const doc = await DeletionRequest.create({ fullName, email, reason, source });
    await sendDeletionRequestMail({ fullName, email, reason });

    return res.status(201).json({ ok: true, id: doc._id });
  } catch (e) {
    console.error("createDeletionRequest error", e);
    return res.status(500).json({ error: "Unable to submit request" });
  }
}
