# PH SE 010

**Internal Tech Issue & Feature Tracker**

A REST API platform for software teams to report bugs, suggest features, and coordinate resolutions. Built with Node.js, TypeScript, Express.js, and PostgreSQL.

**Live URL:**

---

## Features

- JWT-based authentication and authorization
- Role-based access control with `contributor` and `maintainer` roles
- Full issue lifecycle management (create, read, update, and delete)
- Filter issues by type and status; sort by newest or oldest
- Secure password hashing with bcrypt
- Centralized error handling with consistent API response structure

---

## Tech Stack

| Layer            | Technology                   |
| ---------------- | ---------------------------- |
| Runtime          | Node.js (LTS 24.x or higher) |
| Language         | TypeScript                   |
| Framework        | Express.js v5                |
| Database         | PostgreSQL (Neon)            |
| DB Driver        | `pg` - raw SQL               |
| Authentication   | `jsonwebtoken`               |
| Password Hashing | `bcryptjs`                   |
| Environment      | `dotenv`                     |

---

## Dependencies

### Production

| Package             | Version | Purpose                                |
| ------------------- | ------- | -------------------------------------- |
| `bcryptjs`          | ^3.0.3  | Password hashing                       |
| `cors`              | ^2.8.6  | Cross-origin resource sharing          |
| `dotenv`            | ^17.4.2 | Environment variable loading           |
| `express`           | ^5.2.1  | HTTP server and routing                |
| `http-status-codes` | ^2.3.0  | Consistent HTTP status code references |
| `jsonwebtoken`      | ^9.0.3  | JWT generation and verification        |
| `pg`                | ^8.21.0 | PostgreSQL client                      |

### Development

| Package               | Version | Purpose                           |
| --------------------- | ------- | --------------------------------- |
| `@types/cors`         | ^2.8.19 | TypeScript types for cors         |
| `@types/express`      | ^5.0.6  | TypeScript types for Express      |
| `@types/jsonwebtoken` | ^9.0.10 | TypeScript types for jsonwebtoken |
| `@types/pg`           | ^8.20.0 | TypeScript types for pg           |
| `tsup`                | ^6.5.0  | TypeScript bundler                |
| `tsx`                 | ^4.22.4 | TypeScript execution for dev      |
| `typescript`          | ^6.0.3  | TypeScript compiler               |

---

## Setup

### Prerequisites

- Node.js v24.x or higher
- A PostgreSQL database (Neon recommended)

### Installation

```bash
# 1. Clone the repository
git clone <...>
cd <...>

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env and fill in the values

# 4. Run database migrations

# 5. Start the development server
npm run dev
```

### Scripts

| Script  | Command         | Description                                  |
| ------- | --------------- | -------------------------------------------- |
| `dev`   | `npm run dev`   | Start server with hot-reload via `tsx watch` |
| `build` | `npm run build` | Compile TypeScript to `dist/` via `tsup`     |
| `start` | `npm start`     | Run compiled output from `dist/server.js`    |

---

## API Endpoints

### Base URL

```
https://your-deployment-url.vercel.app/api
```

### Authorization

Protected endpoints require a valid JWT in the `Authorization` header:

```
Authorization: <JWT_TOKEN>
```

### Endpoint Reference

| Method   | Path               | Access          | Description                           |
| -------- | ------------------ | --------------- | ------------------------------------- |
| `POST`   | `/api/auth/signup` | Public          | Register a new user account           |
| `POST`   | `/api/auth/login`  | Public          | Authenticate and receive a JWT        |
| `POST`   | `/api/issues`      | Authenticated   | Create a new bug or feature request   |
| `GET`    | `/api/issues`      | Public          | Retrieve all issues (filter and sort) |
| `GET`    | `/api/issues/:id`  | Public          | Retrieve a single issue by ID         |
| `PATCH`  | `/api/issues/:id`  | Authenticated   | Update an issue (role-restricted)     |
| `DELETE` | `/api/issues/:id`  | Maintainer only | Permanently delete an issue           |

### Query Parameters — `GET /api/issues`

| Parameter | Accepted Values                   | Default  | Description                 |
| --------- | --------------------------------- | -------- | --------------------------- |
| `sort`    | `newest`, `oldest`                | `newest` | Sort order by creation date |
| `status`  | `open`, `in_progress`, `resolved` | -        | Filter by workflow status   |
| `type`    | `bug`, `feature_request`          | -        | Filter by issue type        |

---

## Database Schema

### `users`

Stores registered user accounts.

| Column       | Type           | Constraints             | Description                                 |
| ------------ | -------------- | ----------------------- | ------------------------------------------- |
| `id`         | `SERIAL`       | `PRIMARY KEY`           | Auto-incrementing unique identifier         |
| `name`       | `VARCHAR(100)` | `NOT NULL`              | Full display name                           |
| `email`      | `VARCHAR(255)` | `NOT NULL, UNIQUE`      | Login address                               |
| `password`   | `TEXT`         | `NOT NULL`              | Bcrypt-hashed password                      |
| `role`       | `VARCHAR(20)`  | `DEFAULT 'contributor'` | Access level: `contributor` or `maintainer` |
| `created_at` | `TIMESTAMPTZ`  | `DEFAULT NOW()`         | Account creation timestamp                  |
| `updated_at` | `TIMESTAMPTZ`  | `DEFAULT NOW()`         | Last update timestamp                       |

### `issues`

Stores all bug reports and feature requests.

| Column        | Type           | Constraints      | Description                                          |
| ------------- | -------------- | ---------------- | ---------------------------------------------------- |
| `id`          | `SERIAL`       | `PRIMARY KEY`    | Auto-incrementing unique identifier                  |
| `title`       | `VARCHAR(150)` | `NOT NULL`       | Short descriptive headline (max 150 characters)      |
| `description` | `TEXT`         | `NOT NULL`       | Detailed explanation (min 20 characters)             |
| `type`        | `VARCHAR(20)`  | `NOT NULL`       | Entry category: `bug` or `feature_request`           |
| `status`      | `VARCHAR(20)`  | `DEFAULT 'open'` | Workflow state: `open`, `in_progress`, or `resolved` |
| `reporter_id` | `INTEGER`      | `NOT NULL`       | ID of the user who submitted the issue               |
| `created_at`  | `TIMESTAMPTZ`  | `DEFAULT NOW()`  | Issue creation timestamp                             |
| `updated_at`  | `TIMESTAMPTZ`  | `DEFAULT NOW()`  | Last update timestamp                                |

---

## Role Permissions

| Permission                            | Contributor | Maintainer |
| ------------------------------------- | ----------- | ---------- |
| Register and log in                   | Yes         | Yes        |
| Create issues                         | Yes         | Yes        |
| View all issues                       | Yes         | Yes        |
| Update own issue (status `open` only) | Yes         | Yes        |
| Update any issue                      | No          | Yes        |
| Delete any issue                      | No          | Yes        |
| Change issue status independently     | No          | Yes        |

---

## Security

- Passwords are hashed using `bcryptjs` with salt rounds and are never returned in any API response.
- JWTs are signed with a secret key and carry an expiry claim.
- Role verification is enforced server-side before all privileged operations.
- Protected endpoints reject requests without a valid, unexpired token.