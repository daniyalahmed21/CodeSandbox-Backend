import fs from "fs/promises";
import path from "path";

export default function handleEditorSocketEvents(socket, editorNamespace) {
  const emitSuccess = (event, message) => {
    socket.emit(event, { data: message });
  };

  const emitError = (event, message) => {
    socket.emit(event || "error", { data: message });
  };

  // Handle port requests
  socket.on("getPort", async ({ containerName }) => {
    try {
      const { getContainerPort } = await import("../containers/handleContainerCreate.js");
      const port = await getContainerPort(containerName);
      socket.emit("portResponse", { port });
    } catch (error) {
      console.log("Error getting port:", error);
      socket.emit("portResponse", { port: null });
    }
  });

  socket.on("writeFile", async ({ data, pathOfFileOrFolder }) => {
    try {
      await fs.writeFile(pathOfFileOrFolder, data);
      editorNamespace.emit("writeFileSuccess", {
        data: "File written successfully",
        path: pathOfFileOrFolder,
      });
    } catch {
      emitError("writeFileError", "Error while writing file");
    }
  });

  socket.on("createFile", async ({ pathOfFileOrFolder }) => {
    try {
      await fs.access(pathOfFileOrFolder); // check existence
      emitError("createFileError", "File already present");
    } catch {
      try {
        await fs.writeFile(pathOfFileOrFolder, "");
        emitSuccess("createFileSuccess", "File created successfully");
      } catch {
        emitError("createFileError", "Error while creating file");
      }
    }
  });

  socket.on("readFile", async ({ pathOfFileOrFolder }) => {
    try {
      const response = await fs.readFile(pathOfFileOrFolder, "utf-8");
      socket.emit("readFileSuccess", {
        data: response.toString(),
        path: pathOfFileOrFolder,
        extension: path.extname(pathOfFileOrFolder).slice(1),
      });
    } catch {
      emitError("readFileError", "Error while reading file");
    }
  });

  socket.on("deleteFile", async ({ pathOfFileOrFolder }) => {
    try {
      await fs.unlink(pathOfFileOrFolder);
      emitSuccess("deleteFileSuccess", "File deleted successfully");
    } catch {
      emitError("deleteFileError", "Error while deleting file");
    }
  });

  socket.on("createFolder", async ({ pathOfFileOrFolder }) => {
    try {
      await fs.mkdir(pathOfFileOrFolder, { recursive: false });
      emitSuccess("createFolderSuccess", "Folder created successfully");
    } catch {
      emitError("createFolderError", "Error while creating folder");
    }
  });

  socket.on("deleteFolder", async ({ pathOfFileOrFolder }) => {
    try {
      await fs.rmdir(pathOfFileOrFolder, { recursive: true });
      emitSuccess("deleteFolderSuccess", "Folder deleted successfully");
    } catch {
      emitError("deleteFolderError", "Error while deleting folder");
    }
  });
}
