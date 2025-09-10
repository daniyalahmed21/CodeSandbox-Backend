import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { handleContainerCreate} from './containers/handleContainerCreate.js';
import { handleTerminalCreation } from './containers/handleTerminalCreation.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

server.listen(4000, () => console.log("Terminal WS server running on 4000"));

const wss = new WebSocketServer({ server, path: "/terminal" });

wss.on("connection", async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
        ws.send("Error: projectId missing");
        ws.close();
        return;
    }

    const container = await handleContainerCreate(projectId, wss);
    handleTerminalCreation(container, ws);
});
