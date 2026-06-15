import type { NextFunction, Request, Response } from "express";
import { type JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";
import { pool } from "../db";
import type { ROLE } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const auth = (...roles: ROLE[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
        return;
      }

      const decoded = verifyAccessToken(token) as JwtPayload;

      const userData = await pool.query(
        `
      SELECT * FROM users
      WHERE id = $1
      `,
        [decoded.id],
      );

      const user = userData.rows[0];

      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!",
        });
        return;
      }

      if (!user?.is_active) {
        res.status(403).json({
          success: false,
          message: "Forbidden!",
        });
        return;
      }

      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!",
        });
        return;
      }

      req.user = decoded;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
