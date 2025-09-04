import Dockerode from "dockerode";

const docker = new Dockerode();

export const handleContainerCreate = async (projectId, socket) => {
  console.log("Project id received for container create", projectId);
  try {
    const container = await docker.createContainer({
      Image: "sandbox", // name given by us for the written dockerfile
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ["/bin/bash"],
      name: projectId,
      Tty: true,
      User: "sandbox",
      Volumes: {
        "/home/sandbox/app": {},
      },
      ExposedPorts: {
        "5173/tcp": {},
      },
      Env: ["HOST=0.0.0.0"],
      HostConfig: {
        Binds: [
          // mounting the project directory to the container
          `${process.cwd()}/projects/${projectId}:/home/sandbox/app`,
        ],
        PortBindings: {
          "5173/tcp": [
            {
              HostPort: "0", // random port will be assigned by docker
            },
          ],
        },
      },
    });

    console.log("Container created", container.id);

    await container.start();

    console.log("container started");

    container.exec(
      {
        Cmd: ["/bin/bash"],
        User: "sandbox",
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
      },
      (err, exec) => {
        if (err) {
          console.log("Error while creating exec", err);
          return;
        }
        exec.start(
          {
            hijack: true,
          },
          (err, stream) => {
            if (err) {
              console.log("Error while starting exec", err);
              return;
            }
          }
        );
      }
    );
  } catch (error) {
    console.log("Error while creating container", error);
  }
};
