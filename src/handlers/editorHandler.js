import fs from "fs/promises";

export default function handleEditorSocketEvents(socket) {
  socket.on("writeFile", async ({ data, pathOfFileOrFolder }) => {
    try {
      const response = await fs.writeFile(pathOfFileOrFolder, data);
      socket.emit("writeFileSuccess", () => {
        data: "File written success";
      });
    } catch (error) {
      socket.emit("Error", () => {
        data: "Error while writing file";
      });
    }
  });

  socket.on("createFile", async ({ pathOfFileOrFolder }) => {
    const isFileAlreadyPresent = fs.stat(pathOfFileOrFolder);
    if (isFileAlreadyPresent) {
      socket.emit("error", () => {
        data: "File Already present";
      });
      return;
    }
    try {
      await fs.writeFile(pathOfFileOrFolder, "");
      socket.emit("createFileSuccess", () => {
        data: "file creation successful";
      });
    } catch (error) {
      socket.emit("error", () => {
        data: "Error while creating file";
      });
    }
  });

  socket.on("readFile", async ({ pathOfFileOrFolder }) => {
    try {
      const response = await fs.readFile(pathOfFileOrFolder);
      socket.emit("readFileSuccess", () => {
        data: response.toString();
      });
    } catch (error) {
        socket.emit("error", () => {
            data: "Error while reading file";
          });
    }
  });

  socket.on("readFile", async ({ pathOfFileOrFolder }) => {
    try {
      const response = await fs.unlink(pathOfFileOrFolder);
      socket.emit("deleteFileSuccess", () => {
        data: "file deletion successful";
      });
    } catch (error) {
        socket.emit("error", () => {
            data: "Error while deleting file";
          });
    }
  });
  socket.on("createFolder", async ({ pathOfFileOrFolder }) => {
    try {
      const response = await fs.mkdir(pathOfFileOrFolder);
      socket.emit("createFolderSuccess", () => {
        data: "Folder creation successful";
      });
    } catch (error) {
        socket.emit("error", () => {
            data: "Error while creating folder";
          });
    }
  });
}
