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

    const reporter_id = (req as any).user?.id;

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
    const parsedId = parseInt(req.params.id as string, 10);

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

const updateIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = parseInt(req.params.id as string, 10);
    if (isNaN(parsedId)) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid issue ID format.",
      });
      return;
    }

    const user = (req as any).user;
    if (!user || !user.id || !user.role) {
      sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "User context not found.",
      });
      return;
    }

    const issue = await issuesService.getRawIssueByIdFromDB(parsedId);
    if (!issue) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Issue not found.",
      });
      return;
    }

    if (user.role === "contributor") {
      if (issue.reporter_id !== user.id) {
        sendResponse(res, {
          statusCode: StatusCodes.FORBIDDEN,
          success: false,
          message: "You are not authorized to update this issue.",
        });
        return;
      }
      if (issue.status !== "open") {
        sendResponse(res, {
          statusCode: StatusCodes.CONFLICT,
          success: false,
          message: "Contributors can only update issues with an 'open' status.",
        });
        return;
      }
    }

    const { title, description, type, status } = req.body;
    const updatePayload: any = {};

    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (type !== undefined) updatePayload.type = type;

    if (user.role === "maintainer" && status !== undefined) {
      updatePayload.status = status;
    }

    if (Object.keys(updatePayload).length === 0) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "No valid fields provided for update.",
      });
      return;
    }

    if (updatePayload.title !== undefined && updatePayload.title.length > 150) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Title cannot exceed 150 characters.",
      });
      return;
    }

    if (
      updatePayload.description !== undefined &&
      updatePayload.description.length < 20
    ) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Description must be at least 20 characters long.",
      });
      return;
    }

    if (
      updatePayload.type !== undefined &&
      updatePayload.type !== "bug" &&
      updatePayload.type !== "feature_request"
    ) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Type must be either 'bug' or 'feature_request'.",
      });
      return;
    }

    if (
      updatePayload.status !== undefined &&
      !["open", "in_progress", "resolved", "closed"].includes(
        updatePayload.status,
      )
    ) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message:
          "Status must be 'open', 'in_progress', 'resolved', or 'closed'.",
      });
      return;
    }

    const updatedIssue = await issuesService.updateIssueInDB(
      parsedId,
      updatePayload,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue updated successfully!",
      data: updatedIssue,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Something went wrong while updating the issue.",
      error: error.message,
    });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
};
