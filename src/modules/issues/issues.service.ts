import { pool } from "../../db";

const createIssueInDB = async (payload: {
  title: string;
  description: string;
  type: string;
  reporter_id: number;
}) => {
  const { title, description, type, reporter_id } = payload;

  if (title.length > 150) {
    throw new Error("TITLE_TOO_LONG");
  }

  if (description.length < 20) {
    throw new Error("DESCRIPTION_TOO_SHORT");
  }

  if (type !== "bug" && type !== "feature_request") {
    throw new Error("INVALID_TYPE");
  }

  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, reporter_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    [title, description, type, reporter_id],
  );

  return result.rows[0];
};

export const issuesService = {
  createIssueInDB,
};
