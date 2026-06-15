import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  auth("contributor", "maintainer"),
  issuesController.createIssue,
);
router.get("/", issuesController.getIssues);
router.get("/:id", issuesController.getIssue);
router.patch(
  "/:id",
  auth("contributor", "maintainer"),
  issuesController.updateIssue,
);
router.delete("/:id", auth("maintainer"), issuesController.deleteIssue);

export const issuesRoute = router;
