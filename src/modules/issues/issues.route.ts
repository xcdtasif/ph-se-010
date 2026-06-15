import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.post("/", auth(), issuesController.createIssue);
router.get("/", issuesController.getAllIssues);
router.get("/:id", issuesController.getSingleIssue);
router.patch("/:id", auth(), issuesController.updateIssue);

export const issuesRoute = router;
