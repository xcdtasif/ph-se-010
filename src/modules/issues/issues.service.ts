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

const getAllIssuesFromDB = async (queries: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort = "newest", type, status } = queries;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (type && (type === "bug" || type === "feature_request")) {
    conditions.push(`type = $${paramIndex}`);
    values.push(type);
    paramIndex++;
  }

  if (status && (status === "open" || status === "in_progress" || status === "resolved" || status === "closed")) {
    conditions.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  let baseQuery = `SELECT * FROM issues`;
  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(" AND ")}`;
  }

  if (sort === "oldest") {
    baseQuery += ` ORDER BY created_at ASC`;
  } else {
    baseQuery += ` ORDER BY created_at DESC`;
  }

  const issuesResult = await pool.query(baseQuery, values);
  const issues = issuesResult.rows;

  if (issues.length === 0) {
    return [];
  }

  const reporterIds = Array.from(new Set(issues.map((issue) => issue.reporter_id)));

  const usersResult = await pool.query(
    `
    SELECT id, name, role FROM users 
    WHERE id = ANY($1)
    `,
    [reporterIds],
  );

  const reporterMap = usersResult.rows.reduce((map: any, user: any) => {
    map[user.id] = user;
    return map;
  }, {});

  return issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter: reporterMap[reporter_id] || null,
    };
  });
};

const getSingleIssueFromDB = async (id: number) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues 
    WHERE id = $1
    `,
    [id],
  );

  if (issueResult.rows.length === 0) {
    throw new Error("NOT_FOUND");
  }

  const issue = issueResult.rows[0];

  const userResult = await pool.query(
    `
    SELECT id, name, role FROM users 
    WHERE id = $1
    `,
    [issue.reporter_id],
  );

  const { reporter_id, ...issueData } = issue;

  return {
    ...issueData,
    reporter: userResult.rows[0] || null,
  };
};

export const issuesService = {
  createIssueInDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
};