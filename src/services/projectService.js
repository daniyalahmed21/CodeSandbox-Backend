import fs from "fs";
import uuid4 from "uuid4";
import { exec } from "../utils/execUtilities.js";
import path from "path";
import directoryTree from "directory-tree";

export async function ProjectService() {
  const projectId = uuid4();

  await fs.promises.mkdir(`./projects/${projectId}`, { recursive: true });

  const { stdout, stderr } = await exec(
    "npm create vite@latest sandbox -- --template react",
    { cwd: `./projects/${projectId}` }
  );
  return projectId;
}

export async function getProjectTreeService(projectId) {
  const projectPath = path.resolve(`./projects/${projectId}`);
  const tree =  directoryTree(projectPath)
  return tree
}
