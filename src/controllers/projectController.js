import {
  getProjectTreeService,
  ProjectService,
} from "../services/projectService.js";

export async function createProjectController(req, res) {
  try {
    const projectId = await ProjectService();
    res.json({
      message: "Project Created",
      projectId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create project" });
  }
}

export async function getProjectTree(req, res) {
  const tree = await getProjectTreeService(req.params.id);
  res.status(200).json({
    data: tree,
    success: true,
    message: "successfully created tree",
  });
}
