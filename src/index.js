import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import { PORT } from "./Configs/serverConfig.js";
import chokidar from "chokidar";
import http from "http";
import { Server } from "socket.io";
import handleEditorSocketEvents from "./handlers/editorHandler.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

const editorNamespace = io.of("/editor");

editorNamespace.on("connection", (socket) => {
  const queryParams = socket.handshake.query;
  const projectId = queryParams.projectId;
  let watcher;
  if (projectId) {
    watcher = chokidar.watch(`./projects/${projectId}`, {
      ignored: (path) => path.includes("node_modules"),
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
      },
      ignoreInitial: true,
    });

    watcher.on("all", (event, path) => {
      console.log(event, path);
      socket.emit("file-change", { event, path }); 
    });
  }

  handleEditorSocketEvents(socket);

  socket.on("message", () => {
    console.log("editor namespace");
  });

  socket.on("disconnect", async () => {
    if (watcher) {
      await watcher.close();
      console.log(`Watcher closed for project: ${projectId}`);
    }
  });
});

app.use("/api", apiRouter);

app.get("/ping", (req, res) => {
  return res.json({ message: "pong" });
});
io.on("connection", (socket) => {
  console.log("a user connected");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
