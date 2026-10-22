import { Session } from "../models.js";
import { hashToken } from "../services/passwords.js";
export async function requireAdmin(req, res, next) {
  try {
    const match = /^Bearer ([a-f\d]{64})$/i.exec(
      req.headers.authorization || "",
    );
    if (!match)
      return res
        .status(401)
        .json({ error: { message: "Please sign in to continue." } });
    const session = await Session.findOne({
      tokenHash: hashToken(match[1]),
      expiresAt: { $gt: new Date() },
    }).lean();
    if (!session)
      return res
        .status(401)
        .json({
          error: {
            message:
              "Your session expired. Sign in again; your unsaved form will be kept.",
          },
        });
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
}
