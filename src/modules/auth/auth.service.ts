import bcrypt from "bcryptjs";
import { pool } from "../../db";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials!");
  }

  const user = userData.rows[0];

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Invalid credentials!");
  }

  const jwtPayload = {
    id: Number(user.id),
    name: user.name,
    role: user.role,
  };

  // Using our new utility helpers!
  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  return { accessToken, refreshToken };
};

const generateFreshToken = async (token: string) => {
  if (!token) {
    throw new Error("Unauthorized!");
  }

  const decoded = verifyRefreshToken(token);

  const userData = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [decoded.email],
  );

  if (userData.rows.length === 0) {
    throw new Error("User not found!");
  }

  const user = userData.rows[0];

  if (!user?.is_active) {
    throw new Error("Forbidden!");
  }

  const jwtPayload = {
    id: Number(user.id),
    name: user.name,
    role: user.role,
  };

  const accessToken = generateAccessToken(jwtPayload);

  return { accessToken };
};

export const authService = {
  loginUserIntoDB,
  generateFreshToken,
};
