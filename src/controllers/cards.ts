// src/controllers/cards.ts
import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || process.env.PUBLIC_APP_ORIGIN || "http://localhost:3000";

function sanitize(doc: any) {
  const json = doc.toObject({ getters: true, virtuals: false });
  delete json.__v;
  return {
    _id: String(json._id),
    title: json.title,
    slug: json.slug,
    theme: json.theme,
    isPublic: !!json.isPublic,
    ownerId: String(json.ownerId),
    data: json.data || {},
    keywords: json.keywords || [],
    tags: json.tags || [],
    analytics: json.analytics || { views: 0, clicks: 0, shares: 0, saves: 0 },
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

export const createCard: RequestHandler = async (req, res) => {
  const userId = req.user?._id; // typed from declaration merging
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { title = "Untitled", theme = "luxe", data = {}, keywords = [], tags = [], isPublic = false } =
    (req.body || {}) as any;

  const doc = await Card.create({
    title,
    slug: (title || "card").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    ownerId: new mongoose.Types.ObjectId(userId),
    theme,
    isPublic: !!isPublic,
    data,
    keywords,
    tags,
  });

  return res.status(201).json({ card: sanitize(doc) });
};

export const updateCard: RequestHandler = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const body = req.body || {};
  const update: any = {};
  if (typeof body.title === "string") update.title = body.title;
  if (typeof body.theme === "string") update.theme = body.theme;
  if (typeof body.isPublic === "boolean") update.isPublic = body.isPublic;
  if (body.data && typeof body.data === "object") update.data = body.data;
  if (Array.isArray(body.tags)) update.tags = body.tags;

  const doc = await Card.findOneAndUpdate({ _id: id, ownerId: userId }, { $set: update }, { new: true });
  if (!doc) return res.status(404).json({ message: "Not found" });

  return res.json({ card: sanitize(doc) });
};

export const getCardById: RequestHandler = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const doc = await Card.findOne({ _id: id, ownerId: userId });
  if (!doc) return res.status(404).json({ message: "Not found" });

  return res.json({ card: sanitize(doc) });
};

export const shareCardLink: RequestHandler = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const doc = await Card.findOneAndUpdate(
    { _id: id, ownerId: userId },
    { $set: { isPublic: true } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Not found" });

  const shareUrl = `${FRONTEND_ORIGIN}/share/${id}`;
  return res.json({ shareUrl, card: sanitize(doc) });
};
