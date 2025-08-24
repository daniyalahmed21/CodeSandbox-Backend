import express from "express";
import {createProjectController, getProjectTree} from "../../controllers/ProjectController.js";
const router = express.Router();

router.use("/:id/tree", getProjectTree);
router.use("/", createProjectController);

export default router;
