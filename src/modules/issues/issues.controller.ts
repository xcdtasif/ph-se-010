import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { issuesService } from "./issues.service";
import sendResponse from "../../utils/sendResponse";

const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Title, description, and type are required.",
      });
      return;
    }

    const reporter_id = req.user?.id;

    if (!reporter_id) {
      sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "User context not found.",
      });
      return;
    }

    const newIssue = await issuesService.createIssueInDB({
      title,
      description,
      type,
      reporter_id,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Issue created successfully!",
      data: newIssue,
    });
  } catch (error: any) {
    if (error.message === "TITLE_TOO_LONG") {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Title cannot exceed 150 characters.",
      });
      return;
    }

    if (error.message === "DESCRIPTION_TOO_SHORT") {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Description must be at least 20 characters long.",
      });
      return;
    }

    if (error.message === "INVALID_TYPE") {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Type must be either 'bug' or 'feature_request'.",
      });
      return;
    }

    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Something went wrong while creating the issue.",
      error: error.message,
    });
  }
};

export const issuesController = {
  createIssue,
};
