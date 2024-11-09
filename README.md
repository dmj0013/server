This project is a basic HTTP server built with Node.js. It supports GET and POST requests for serving and creating files in a specified directory.

Features
GET /files/{filename}: Serves the requested file if it exists in the specified directory.
POST /files/{filename}: Accepts text data and creates a new file with the request body content.
Additional Endpoints:
/ - Home route with a simple 200 OK response.
/echo/{message} - Echoes back the specified message.
/user-agent - Returns the client’s User-Agent header.

