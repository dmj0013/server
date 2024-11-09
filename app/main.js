const net = require("net");
const fs = require("fs");
const path = require("path");

// Log message
console.log("Logs from your program will appear here!");

// Parse the directory from the command line arguments
const args = process.argv.slice(2);
let filesDirectory = "/tmp"; // Default directory
args.forEach((arg, index) => {
    if (arg === "--directory" && args[index + 1]) {
        filesDirectory = args[index + 1];
    }
});

const server = net.createServer((socket) => {
    // Request handling
    socket.on("data", (data) => {
        const request = data.toString();
        console.log("Request: \n" + request);

        const requestLines = request.split("\r\n");
        const [method, url] = requestLines[0].split(" ");
        const headers = {};
        let isBody = false;
        let body = "";

        // Parse headers and request body
        for (const line of requestLines.slice(1)) {
            if (line === "") {
                isBody = true;
                continue;
            }
            if (!isBody) {
                const [header, value] = line.split(": ");
                headers[header.toLowerCase()] = value;
            } else {
                body += line;
            }
        }

        // Home route
        if (url === "/") {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");

        // Echo route
        } else if (url.includes("/echo/")) {
            const content = url.split('/echo/')[1];
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`);

        // User-Agent route
        } else if (url.includes("/user-agent")) {
            const userAgent = headers["user-agent"] || "Unknown";
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);

        // Files route - GET request
        } else if (method === "GET" && url.startsWith("/files/")) {
            const filename = url.split('/files/')[1];
            const filePath = path.join(filesDirectory, filename);

            // Check if the file exists
            fs.stat(filePath, (err, stats) => {
                if (err || !stats.isFile()) {
                    // File does not exist or isn't a regular file
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
                } else {
                    // Read and serve the file
                    fs.readFile(filePath, (err, content) => {
                        if (err) {
                            socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                        } else {
                            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n`);
                            socket.write(content);
                        }
                    });
                }
            });

        // Files route - POST request
        } else if (method === "POST" && url.startsWith("/files/")) {
            const filename = url.split('/files/')[1];
            const filePath = path.join(filesDirectory, filename);

            // Check for Content-Length header
            const contentLength = parseInt(headers["content-length"], 10);
            if (isNaN(contentLength) || contentLength <= 0) {
                socket.write("HTTP/1.1 411 Length Required\r\n\r\n");
                return;
            }

            // Write request body to file
            fs.writeFile(filePath, body, (err) => {
                if (err) {
                    socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                } else {
                    socket.write("HTTP/1.1 201 Created\r\n\r\n");
                }
            });
            
        // Default case - 404 Not Found
        } else {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
    });

    // Error handling
    socket.on("error", (e) => {
        console.error("ERROR: " + e);
        socket.end();
    });

    // Closing connection
    socket.on("close", () => {
        socket.end();
    });
});

// Start listening on the specified port
server.listen(4221, "localhost");
