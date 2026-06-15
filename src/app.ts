import "./config/index";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";
import cors from "cors";
import sendError from "./middleware/error.middleware";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Successfully loaded",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);

app.use(sendError);

export default app;
