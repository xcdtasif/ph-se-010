import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";
import { pool } from "../../db";

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  // Retrieve user using raw SQL
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

  // Compare passwords using bcrypt
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid credentials!");
  }

  // Include only required fields in payload
  const jwtPayload = {
    id: Number(user.id),
    name: user.name,
    role: user.role,
  };

  const secret = config.jwt_secret;
  if (!secret) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }

  // Generate standard JWT token
  const token = jwt.sign(jwtPayload, secret, {
    expiresIn: "1d",
  });

  return {
    token,
    user: {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

const registerUserInDB = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  const { name, email, password, role } = payload;

  const finalRole = role || "contributor";
  if (finalRole !== "contributor" && finalRole !== "maintainer") {
    throw new Error("INVALID_ROLE");
  }

  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new Error("EMAIL_TAKEN");
  }

  // Hash password with standard salt rounds
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUserResult = await pool.query(
    `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at;
    `,
    [name, email, hashedPassword, finalRole],
  );

  // Convert DB id to standard numeric format
  const savedUser = newUserResult.rows[0];
  savedUser.id = Number(savedUser.id);

  return savedUser;
};

export const authService = {
  loginUserIntoDB,
  registerUserInDB,
};
