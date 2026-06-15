import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

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

export const authController = {
  registerUser,
};
