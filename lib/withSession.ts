// lib/withSession.ts
import { getIronSession } from 'iron-session'
import { sessionOptions } from './session'
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'

export function withSession(handler: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    // Buat session-nya ada di req.session
    const session = await getIronSession(req, res, sessionOptions)
    // @ts-expect-error: inject ke req
    req.session = session
    return handler(req, res)
  }
}
