import express from "express";
import ProjectRouter from "./project.js";
const router = express.Router();

router.use("/projects", ProjectRouter);

export default router;
