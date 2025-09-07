import Dockerode from "dockerode";

const docker = new Dockerode();

export const handleContainerCreate = async (projectId, webSocketForServer, request, socket, head) => {
  console.log("Project id received for container create", projectId);

  try {
    // Try to get existing container by name first
    let container;
    try {
      const existing = docker.getContainer(projectId);
      const info = await existing.inspect();
      container = existing;
      if (info.State.Status !== "running") {
        await container.start();
      }
      console.log("Using existing container", container.id);
    } catch (_) {
      // Not found or inspect failed, create a new one
      container = await docker.createContainer({
        Image: "sandbox",
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ["/bin/bash"],
        name: projectId,
        Tty: true,
        User: "sandbox",
        Volumes: { "/home/sandbox/app": {} },
        ExposedPorts: { "5173/tcp": {} },
        Env: ["HOST=0.0.0.0"],
        HostConfig: {
          Binds: [`${process.cwd()}/projects/${projectId}:/home/sandbox/app`],
          PortBindings: {
            "5173/tcp": [{ HostPort: "0" }],
          },
        },
      });
      console.log("Container created", container.id);
      await container.start();
      console.log("container started");
    }

    // properly upgrade and bridge docker exec stream <-> websocket
    webSocketForServer.handleUpgrade(request, socket, head, (ws) => {
      webSocketForServer.emit("connection", ws, request, container);

      container.exec(
        {
          Cmd: ["/bin/bash"],
          User: "sandbox",
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
        },
        (err, exec) => {
          if (err) {
            console.log("Error while creating exec", err);
            ws.close(1011, "Exec create failed");
            return;
          }
          exec.start({ hijack: true }, (err, stream) => {
            if (err) {
              console.log("Error while starting exec", err);
              ws.close(1011, "Exec start failed");
              return;
            }

            // Docker -> Client
            stream.on("data", (chunk) => {
              try {
                ws.readyState === ws.OPEN && ws.send(chunk);
              } catch (_) {}
            });

            stream.on("error", () => {
              try { ws.close(1011, "Stream error"); } catch (_) {}
            });

            stream.on("end", () => {
              try { ws.close(1000, "Stream ended"); } catch (_) {}
            });

            // Client -> Docker
            ws.on("message", (data) => {
              try {
                stream.write(data);
              } catch (_) {}
            });

            ws.on("close", () => {
              try { stream.end(); } catch (_) {}
            });
          });
        }
      );
    });
  } catch (error) {
    console.log("Error while creating container", error);
  }
};

