import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 24 * 60 * 60 * 1000,
};

const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Name, email, and password are required.",
      });
      return;
    }

    const newUser = await authService.registerUserInDB({
      name,
      email,
      password,
      role,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User registered successfully!",
      data: newUser,
    });
  } catch (error: any) {
    if (error.message === "INVALID_ROLE") {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Role must be either 'contributor' or 'maintainer'.",
      });
      return;
    }

    if (error.message === "EMAIL_TAKEN") {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Email is already registered.",
      });
      return;
    }

    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Something went wrong during registration.",
      error: error.message,
    });
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const result = await authService.loginUserIntoDB({ email, password });
    const { token, user } = result;

    res.cookie("token", token, COOKIE_OPTIONS);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Login successful!",
      data: {
        token,
        user,
      },
    });
  } catch (error: any) {
    if (error.message === "Invalid credentials!") {
      sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: "An error occurred during login.",
      error: error.message,
    });
  }
};

export const authController = {
  registerUser,
  loginUser,
};
