

export const handleTerminalCreation = (container, ws) => {
    console.log("Starting terminal creation for container:", container.id);
    
    container.exec({
        Cmd: ["/bin/bash"],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        User: "sandbox",
    }, (err, exec) => {
        if(err) {
            console.log("Error while creating exec", err);
            ws.close(1011, 'Failed to create exec');
            return;
        }

        exec.start({
            hijack: true,
        }, (err, stream) => {
            if(err) {
                console.log("Error while starting exec", err);
                ws.close(1011, 'Failed to start exec');
                return;
            }

            console.log("Docker exec stream started successfully");

            // Step 1: Stream processing
            processStreamOutput(stream, ws);
            
            // Step 2: Stream writing
            ws.on("message", (data) => {
                try {
                    if(data === "getPort") {
                        container.inspect((err, data) => {
                            if (err) {
                                console.log("Error inspecting container:", err);
                                return;
                            }
                            const port = data.NetworkSettings;
                            console.log("Container port info:", port);
                        })
                        return;
                    }
                    stream.write(data);
                } catch (error) {
                    console.log("Error handling WebSocket message:", error);
                }
            });

            // Handle WebSocket close
            ws.on("close", () => {
                console.log("WebSocket connection closed");
                stream.end();
            });

            // Handle WebSocket errors
            ws.on("error", (error) => {
                console.log("WebSocket error:", error);
                stream.end();
            });
        })
    })
}

function processStreamOutput(stream, ws) {
    let nextDataType = null; // Stores the type of the next message
    let nextDataLength = null; // Stores the length of the next message
    let buffer = Buffer.from("");

    function processStreamData(data) {
        try {
            // This is a helper function to process incoming data chunks
            if(data) {
                buffer = Buffer.concat([buffer, data]); // Concatenating the incoming data to the buffer
            }

            if(!nextDataType) {
                // If the next data type is not known, then we need to read the next 8 bytes to determine the type and length of the message
                if(buffer.length >= 8) {
                    const header = bufferSlicer(8);
                    nextDataType = header.readUInt32BE(0); // The first 4 bytes represent the type of the message
                    nextDataLength = header.readUInt32BE(4); // The next 4 bytes represent the length of the message

                    processStreamData(); // Recursively call the function to process the message
                }
            } else {
                if(buffer.length >= nextDataLength) {
                    const content = bufferSlicer(nextDataLength); // Slice the buffer to get the message content
                    
                    // Check if WebSocket is still open before sending
                    if (ws.readyState === ws.OPEN) {
                        ws.send(content); // Send the message to the client
                    }
                    
                    nextDataType = null; // Reset the type and length of the next message
                    nextDataLength = null;
                    processStreamData(); // Recursively call the function to process the next message
                }
            }
        } catch (error) {
            console.log("Error processing stream data:", error);
        }
    }

    function bufferSlicer(end) {
        // this function slices the buffer and returns the sliced buffer and the remaining buffer
        const output = buffer.slice(0, end); // header of the chunk
        buffer = Buffer.from(buffer.slice(end, buffer.length)); // remaining part of the chunk

        return output;
    }

    stream.on("data", processStreamData);
    
    stream.on("error", (error) => {
        console.log("Docker stream error:", error);
    });
    
    stream.on("end", () => {
        console.log("Docker stream ended");
    });
}