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

const getAllIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const sort =
      typeof req.query.sort === "string"
        ? (req.query.sort as string)
        : undefined;
    const type =
      typeof req.query.type === "string"
        ? (req.query.type as string)
        : undefined;
    const status =
      typeof req.query.status === "string"
        ? (req.query.status as string)
        : undefined;

    const issues = await issuesService.getAllIssuesFromDB({
      sort,
      type,
      status,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issues retrived successfully",
      data: issues,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Something went wrong while retrieving issues.",
      error: error.message,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = parseInt(req.params.id, 10);

    if (isNaN(parsedId)) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid issue ID format.",
      });
      return;
    }

    const issue = await issuesService.getSingleIssueFromDB(parsedId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue retrived successfully",
      data: issue,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Issue not found.",
      });
      return;
    }

    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Something went wrong while retrieving the issue.",
      error: error.message,
    });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
};
