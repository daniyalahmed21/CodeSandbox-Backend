import fs from "fs";
import uuid4 from "uuid4";
import { promisify } from "node:util";
import child_process from "node:child_process";

const exec = promisify(child_process.exec);

async function createProjectController(req, res) {
  try {
    const projectId = uuid4();

    await fs.promises.mkdir(`./projects/${projectId}`, { recursive: true });

    const { stdout, stderr } = await exec(
      "npm create vite@latest sandbox -- --template react",
      { cwd: `./projects/${projectId}` }
    );

    res.json({
      message: "Project Created",
      projectId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create project" });
  }
}

export default createProjectController;
