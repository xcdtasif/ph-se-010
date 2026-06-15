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
      const token = req.cookies?.token;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
        return;
      }

      const decoded = verifyAccessToken(token as string) as JwtPayload;

      const userData = await pool.query(
        `
      SELECT * FROM users
      WHERE id = $1
      `,
        [decoded.id],
      );

      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!",
        });
        return;
      }

      const user = userData.rows[0];

      if (roles.length && !roles.includes(user.role as ROLE)) {
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
