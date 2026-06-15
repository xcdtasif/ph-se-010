import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, ...extraFields } = req.body;

    if (Object.keys(extraFields).length > 0) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: `Invalid request body. Only 'name', 'email', 'password', and 'role' are allowed.`,
      });
      return;
    }

    if (!name || !email || !password) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Name, email, and password are required fields.",
      });
      return;
    }

    if (role && role !== "contributor" && role !== "maintainer") {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message:
          "Invalid role value provided. Allowed roles are: 'contributor', 'maintainer'.",
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
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error: any) {
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
    const { email, password, ...extraFields } = req.body;

    if (Object.keys(extraFields).length > 0) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message:
          "Invalid request body. Only 'email' and 'password' are allowed.",
      });
      return;
    }

    if (!email || !password) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Email and password are required fields.",
      });
      return;
    }

    const result = await authService.loginUserIntoDB({ email, password });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        user: result.user,
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
