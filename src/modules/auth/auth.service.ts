import bcrypt from "bcryptjs";
import { pool } from "../../db";
import { generateAccessToken } from "../../utils/jwt";

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

  const token = generateAccessToken(jwtPayload);

  return {
    token,
    user: {
      id: user.id,
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

  let finalRole = role || "contributor";
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUserResult = await pool.query(
    `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at;
    `,
    [name, email, hashedPassword, finalRole],
  );

  return newUserResult.rows[0];
};

export const authService = {
  loginUserIntoDB,
  registerUserInDB,
};
