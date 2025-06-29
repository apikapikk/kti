import { SessionOptions } from "iron-session";

export interface UserSession {
  id: string;
  email: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "auth_session",
  password: process.env.SESSION_PASSWORD as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
}

// ✅ Type augmentation agar `session.user` dikenali
declare module "iron-session" {
  interface IronSessionData {
    user?: UserSession;
  }
}
