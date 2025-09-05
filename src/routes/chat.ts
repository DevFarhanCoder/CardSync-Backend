import { Router } from "express";
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import Card from "../models/Card.js";
import User from "../models/User.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import type { IChatRoom } from "../models/ChatRoom.js";

const chatRouter = Router();
chatRouter.use(requireAuth);

// helpers
function genCode(len=6){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<len;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
async function uniqueCode(){let code=genCode(); /* @ts-ignore */ while(await ChatRoom.exists({code})) code=genCode(); return code;}
const isAdmin = (room:any, uid:string)=> String(room.admin)===String(uid);

// presenters
function presentRoom(room:Pick<IChatRoom,"_id"|"name"|"code"|"admin"|"members"|"createdAt">, uid:string){
  return { id:String(room._id), name:room.name, code:room.code, isAdmin:String(room.admin)===String(uid),
           members:(room.members||[]).map((m:any)=>String(m)), createdAt:room.createdAt };
}

// rooms
chatRouter.get("/chat/rooms", async (req,res,next)=>{try{
  const uid=req.user!.id;
  const rooms=await ChatRoom.find({members:uid}).sort({updatedAt:-1});
  res.json({rooms:rooms.map(r=>presentRoom(r as any, uid))});
}catch(e){next(e);}});

chatRouter.post("/chat/rooms", async (req,res,next)=>{try{
  const uid=req.user!.id; const {name}=(req.body||{}) as {name?:string};
  if(!name?.trim()) return res.status(400).json({error:"Name required"});
  const code=await uniqueCode();
  const room=await ChatRoom.create({name:name.trim(), code, admin:uid, members:[uid]});
  res.json({room:presentRoom(room as any, uid)});
}catch(e){next(e);}});

chatRouter.post("/chat/join", async (req,res,next)=>{try{
  const uid=req.user!.id; let {code}=(req.body||{}) as {code?:string};
  code=(code||"").trim().toUpperCase(); if(!code) return res.status(400).json({error:"Code required"});
  const room=await ChatRoom.findOne({code}); if(!room) return res.status(404).json({error:"Invalid code"});
  if(!room.members.some(m=>String(m)===String(uid))){ room.members.push(uid as any); await room.save(); }
  res.json({room:presentRoom(room as any, uid)});
}catch(e){next(e);}});

// room details with members (for drawer)
chatRouter.get("/chat/rooms/:roomId", async (req,res,next)=>{try{
  const {roomId}=req.params; const room=await ChatRoom.findById(roomId);
  if(!room) return res.status(404).json({error:"Room not found"});
  const users=await User.find({_id:{$in:room.members}}).select("_id name email phone");
  const by=new Map(users.map(u=>[String(u._id),u]));
  res.json({room:{
    id:String(room._id), name:room.name, code:room.code,
    members:(room.members||[]).map((id:any)=>{const u:any=by.get(String(id));
      return {id:String(id), name:u?.name||"", email:u?.email||"", phone:u?.phone||""};})
  }});
}catch(e){next(e);}});

// messages list (MUST return kind + payload)
chatRouter.get("/chat/rooms/:roomId/messages", async (req,res,next)=>{try{
  const {roomId}=req.params;
  const list=await ChatMessage.find({roomId}).sort({createdAt:1}).limit(500);
  res.json({messages:list.map(m=>({
    id:String(m._id), roomId:String(m.roomId), userId:String(m.userId),
    text:m.text, kind:m.kind, payload:m.payload, createdAt:m.createdAt
  }))});
}catch(e){next(e);}});

// send plain text
chatRouter.post("/chat/rooms/:roomId/messages", async (req,res,next)=>{try{
  const uid=req.user!.id; const {roomId}=req.params; const {text}=(req.body||{}) as {text?:string};
  if(!text?.trim()) return res.status(400).json({error:"Text required"});
  const msg=await ChatMessage.create({roomId, userId:uid, text:text.trim(), kind:"text"});
  res.json({message:{id:String(msg._id), roomId, userId:uid, text:msg.text, kind:"text", createdAt:msg.createdAt}});
}catch(e){next(e);}});

// SHARE: create a rich "card" message
chatRouter.post("/shares/group", async (req,res,next)=>{try{
  const uid=req.user!.id; const {roomId, cardId}=(req.body||{}) as {roomId?:string; cardId?:string};
  if(!roomId||!cardId) return res.status(400).json({error:"roomId and cardId required"});
  const room=await ChatRoom.findById(roomId); if(!room) return res.status(404).json({error:"Room not found"});
  if(!room.members.some(m=>String(m)===String(uid))) return res.status(403).json({error:"Not a member"});

  const card:any=await Card.findById(cardId); if(!card) return res.status(404).json({error:"Card not found"});
  const payload={ kind:"card", cardId:String(card._id), ownerId:String(card.userId),
                  title:(card.data?.title as string)||"Card", data:card.data||{}, createdAt:card.createdAt };

  const msg=await ChatMessage.create({roomId, userId:uid, kind:"card", payload});
  res.json({message:{ id:String(msg._id), roomId, userId:uid, kind:"card", payload, createdAt:msg.createdAt }});
}catch(e){next(e);}});

export default chatRouter;
