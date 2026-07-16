const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 8766;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

http
  .createServer((request, response) => {
    const requestPath = request.url === "/" ? "index.html" : request.url.split("?")[0].replace(/^\/+/, "");
    const filePath = path.resolve(root, requestPath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Acesso negado");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Arquivo nao encontrado");
        return;
      }

      response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      response.setHeader("Pragma", "no-cache");
      response.setHeader("Expires", "0");
      response.setHeader("Content-Type", contentTypes[path.extname(filePath)] || "application/octet-stream");
      response.end(data);
    });
  })
  .listen(port, "127.0.0.1");
