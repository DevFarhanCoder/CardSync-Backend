declare namespace Express {
  interface UserPayload {
    id: string;
    _id?: string;
    email?: string;
  }
  interface Request {
    user?: UserPayload;
  }
}
