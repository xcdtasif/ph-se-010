import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import config from "./config";
import { authRoute } from "./modules/auth/auth.route";
import CookieParser from "cookie-parser";
import cors from "cors";
import sendError from "./middleware/error.middleware";
import addLog from "./middleware/log.middleware";

const app: Application = express();
const port = config.port;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use(addLog);

app.use(CookieParser());
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

app.use(sendError);

export default app;
