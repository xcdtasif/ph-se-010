import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = (...roles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access! No token provided.",
        });
        return;
      }

      const secret = config.jwt_secret;
      if (!secret) {
        res.status(500).json({
          success: false,
          message: "Server environment variable configuration error.",
        });
        return;
      }

      const decoded = jwt.verify(token, secret) as JwtPayload;

      const userData = await pool.query(
        `
        SELECT id, name, email, role FROM users
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

      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden! You do not have the required permissions.",
        });
        return;
      }

      req.user = decoded;

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access! Invalid or expired token.",
      });
    }
  };
};

export default auth;
