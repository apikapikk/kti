import type { NextApiRequest } from "next";
import type { UserSession } from "./session";

export interface NextApiRequestWithSession extends NextApiRequest {
  session: {
    user?: UserSession;
    save: () => Promise<void>;
    destroy: () => Promise<void>;
  };
}
