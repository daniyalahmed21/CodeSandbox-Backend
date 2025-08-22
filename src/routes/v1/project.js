import express from "express";
import createProjectController from "../../controllers/ProjectController.js";
const router = express.Router();

router.use("/", createProjectController);

export default router;
