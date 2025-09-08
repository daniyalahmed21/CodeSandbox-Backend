import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import { PORT } from "./Configs/serverConfig.js";
import chokidar from "chokidar";
import http from "http";
import { Server } from "socket.io";
import handleEditorSocketEvents from "./handlers/editorHandler.js";
import { WebSocketServer } from "ws";
import { handleContainerCreate } from "./containers/handleContainerCreate.js";

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

editorNamespace.on("connection", async (socket) => {
  const queryParams = socket.handshake.query;
  const projectId = queryParams.projectId;
  let watcher;
  
  if (projectId) {
    // Ensure container is ready and dev server is started
    try {
      const { ensureContainerReady } = await import("./containers/handleContainerCreate.js");
      const { container, hostPort } = await ensureContainerReady(projectId);
      
      if (container && hostPort) {
        console.log(`Container ready for project ${projectId} on port ${hostPort}`);
        socket.emit("containerReady", { port: hostPort });
      }
    } catch (error) {
      console.log("Error ensuring container ready:", error);
    }

    watcher = chokidar.watch(`./projects/${projectId}`, {
      ignored: (path) => path.includes("node_modules"),
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000, // Reduced for faster updates
      },
      ignoreInitial: true,
    });

    watcher.on("all", (event, path) => {
      console.log(event, path);
      socket.emit("file-change", { event, path });
      // Also emit to namespace for broader notifications
      editorNamespace.emit("file-change", { event, path, projectId });
    });
  }

  handleEditorSocketEvents(socket, editorNamespace);
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

const webSocketForServer = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const isTerminal = request.url.includes("/Terminal");

  if (isTerminal) {
    const projectId = request.url.split("=")[1];
    console.log("Project ID for Terminal WebSocket:", projectId);
    // pass request, socket, head to handleContainerCreate
    handleContainerCreate(projectId, webSocketForServer, request, socket, head);
  }
});

webSocketForServer.on("connection", (ws, request, container) => {
  console.log("WebSocket connection established for container", container.id);
});
