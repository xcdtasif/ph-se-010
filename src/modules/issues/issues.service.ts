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
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at;
    `,
    [title, description, type, reporter_id],
  );

  const row = result.rows[0];
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    reporter_id: Number(row.reporter_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const getIssuesFromDB = async (queries: {
  sort?: string | undefined;
  type?: string | undefined;
  status?: string | undefined;
}) => {
  const { sort = "newest", type, status } = queries;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`type = $${paramIndex}`);
    values.push(type);
    paramIndex++;
  }

  if (status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  let baseQuery = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues`;
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

  const reporterIds = Array.from(
    new Set(issues.map((issue) => issue.reporter_id).filter(Boolean)),
  );

  if (reporterIds.length === 0) {
    return issues.map((issue) => ({
      id: Number(issue.id),
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: null,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    }));
  }

  const usersResult = await pool.query(
    `
    SELECT id, name, role FROM users 
    WHERE id = ANY($1)
    `,
    [reporterIds],
  );

  const reporterMap = usersResult.rows.reduce((map: any, user: any) => {
    map[user.id] = {
      id: Number(user.id),
      name: user.name,
      role: user.role,
    };
    return map;
  }, {});

  return issues.map((issue) => ({
    id: Number(issue.id),
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap[issue.reporter_id] || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));
};

const getIssueFromDB = async (id: number) => {
  const issueResult = await pool.query(
    `
    SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues 
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

  const user = userResult.rows[0];

  return {
    id: Number(issue.id),
    title: Number(issue.id),
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user
      ? { id: Number(user.id), name: user.name, role: user.role }
      : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

const getRawIssueByIdFromDB = async (id: number) => {
  const result = await pool.query(
    "SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE id = $1",
    [id],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    reporter_id: Number(row.reporter_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const updateIssueInDB = async (
  id: number,
  payload: {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
  },
) => {
  const fields = Object.keys(payload);
  if (fields.length === 0) {
    throw new Error("NO_FIELDS_PROVIDED");
  }

  const setClause: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  fields.forEach((field) => {
    if ((payload as any)[field] !== undefined) {
      setClause.push(`${field} = $${paramIndex}`);
      values.push((payload as any)[field]);
      paramIndex++;
    }
  });

  setClause.push(`updated_at = NOW()`);

  values.push(id);
  const idParamIndex = paramIndex;

  const query = `
    UPDATE issues
    SET ${setClause.join(", ")}
    WHERE id = $${idParamIndex}
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at;
  `;

  const result = await pool.query(query, values);
  const row = result.rows[0];
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    reporter_id: Number(row.reporter_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const deleteIssueFromDB = async (id: number) => {
  await pool.query("DELETE FROM issues WHERE id = $1", [id]);
};

export const issuesService = {
  createIssueInDB,
  getIssuesFromDB,
  getIssueFromDB,
  getRawIssueByIdFromDB,
  updateIssueInDB,
  deleteIssueFromDB,
};
