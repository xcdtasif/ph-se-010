import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.post("/", auth(), issuesController.createIssue);

export const issuesRoute = router;
